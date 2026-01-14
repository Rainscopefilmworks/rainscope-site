// src/worker.js — Rainscope Square proxy (card-only payments, due-date via payment_requests)
//
// Required Environment Variables:
//   - SQUARE_TOKEN: Your Square Access Token (from Square Developer Dashboard)
//   - CORS_ORIGIN: Comma-separated list of allowed origins (e.g., "https://rainscopefilmworks.com,https://www.rainscopefilmworks.com")
//   - SQUARE_API_BASE: Square API base URL (optional, defaults to "https://connect.squareup.com")
//     - Use "https://connect.squareup.com" for production
//     - Use "https://connect.squareupsandbox.com" for sandbox/testing
//   - SQUARE_VERSION: Square API version (optional, defaults to "2025-01-22")

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();

    // CORS preflight
    if (method === "OPTIONS") {
      return cors(env, new Response(null, { status: 204 }), req);
    }

    try {
      // --- Health ---
      if (url.pathname === "/api/health") {
        return cors(env, json({ ok: true }), req);
      }

      // --- Catalog (fetch all pages, cached) ---
      if (url.pathname === "/api/catalog" && method === "GET") {
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), req);
        const cached = await cache.match(cacheKey);
        if (cached) return cached;

        const types =
          "ITEM,ITEM_VARIATION,CATEGORY,IMAGE,MODIFIER,MODIFIER_LIST,TAX,MEASUREMENT_UNIT";
        const initialPath = `/v2/catalog/list?types=${encodeURIComponent(types)}`;
        const data = await squareAll(env, initialPath);

        const res = cors(env, json(data), req);
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
        return res;
      }

      // --- Single catalog object passthrough ---
      if (url.pathname === "/api/object" && method === "GET") {
        const id = url.searchParams.get("id");
        if (!id) return cors(env, json({ error: "Missing id" }, 400), req);
        const includeRelated =
          url.searchParams.get("include_related_objects") ?? "true";
        const obj = await square(
          env,
          "GET",
          `/v2/catalog/object?id=${encodeURIComponent(
            id
          )}&include_related_objects=${includeRelated}`
        );
        return cors(env, json(obj), req);
      }

      // --- Find-or-create customer by email ---
      if (url.pathname === "/api/customer" && method === "POST") {
        const { given_name, family_name, email_address, phone_number } =
          await req.json();

        let customer = null;
        if (email_address) {
          try {
            const found = await square(env, "POST", "/v2/customers/search", {
              query: { filter: { email_address: { exact: email_address } } },
            });
            if (found?.customers?.length) customer = found.customers[0];
          } catch {
            /* ignore */
          }
        }

        if (!customer) {
          const created = await square(env, "POST", "/v2/customers", {
            given_name,
            family_name,
            email_address,
            phone_number,
          });
          customer = created.customer;
        }

        return cors(env, json({ customer_id: customer.id, customer }), req);
      }

      // --- Order price calculation passthrough ---
      if (url.pathname === "/api/price" && method === "POST") {
        const body = await req.json();
        const priced = await square(env, "POST", "/v2/orders/calculate", {
          order: body.order,
        });
        return cors(env, json(priced), req);
      }

      // --- Estimate: create Order -> create Invoice -> (optional) publish ---
      // Body: { customer_id, location_id, line_items[], taxes?, service_charges?, note?, publish?, start_date?, service_date? }
      if (url.pathname === "/api/estimate" && method === "POST") {
        const {
          customer_id,
          location_id,
          line_items = [],
          taxes = [],
          service_charges = [],
          note = "",
          publish = false,
          start_date, // ISO yyyy-mm-dd; sets invoice BALANCE due date
          service_date, // ISO yyyy-mm-dd; sets invoice sale_or_service_date
        } = await req.json();

        if (!customer_id || !location_id || !Array.isArray(line_items) || !line_items.length) {
          return cors(
            env,
            json(
              {
                error:
                  "Missing customer_id, location_id, or line_items (non-empty).",
              },
              400
            ),
            req
          );
        }

        // 1) Create the Order
        const orderRes = await square(env, "POST", "/v2/orders", {
          order: { location_id, customer_id, line_items, taxes, service_charges },
        });

        const orderId = orderRes?.order?.id;
        if (!orderId) {
          throw new Error("Square did not return an order id.");
        }

        // 2) Create the Invoice
        // - accepted_payment_methods -> card only
        // - payment_requests -> BALANCE with due_date (if provided)
        // - sale_or_service_date -> service date (if provided)
        const invoiceBody = {
          invoice: {
            location_id,
            order_id: orderId,
            primary_recipient: { customer_id },
            delivery_method: "EMAIL",
            accepted_payment_methods: { card: true }, // ONLY card
            description: note || undefined,
            // Use payment_requests to set due date (Square disallows invoice.due_date directly)
            ...(start_date
              ? {
                  payment_requests: [
                    {
                      request_type: "BALANCE",
                      due_date: start_date, // yyyy-mm-dd
                    },
                  ],
                }
              : {}),
            // Set service date (first billable day)
            ...(service_date ? { sale_or_service_date: service_date } : {}),
          },
        };

        const invRes = await square(env, "POST", "/v2/invoices", invoiceBody);
        const invoice = invRes?.invoice;
        if (!invoice?.id) {
          throw new Error("Square did not return an invoice id.");
        }

        // 3) Optionally publish (requires version)
        let published = false;
        if (publish) {
          const id = invoice.id;
          const version = invoice.version;
          const pub = await square(
            env,
            "POST",
            `/v2/invoices/${encodeURIComponent(id)}/publish`,
            {
              version,
              idempotency_key: cryptoRandomId(),
            }
          );
          published = !!pub?.invoice?.status && pub.invoice.status !== "DRAFT";
        }

        return cors(
          env,
          json({
            ok: true,
            order_id: orderId,
            invoice_id: invoice.id,
            status: invoice.status,
            delivery_method: invoice.delivery_method,
            published,
          }),
          req
        );
      }

      // --- Inventory: get stock levels for catalog objects ---
      // Query params: ?catalog_object_id=xxx or ?catalog_object_ids=id1,id2,id3
      // Returns: { counts: { [catalog_object_id]: { quantity: number, state: string } } }
      if (url.pathname === "/api/inventory" && method === "GET") {
        const catalogObjectId = url.searchParams.get("catalog_object_id");
        const catalogObjectIds = url.searchParams.get("catalog_object_ids");
        
        if (!catalogObjectId && !catalogObjectIds) {
          return cors(env, json({ error: "Missing catalog_object_id or catalog_object_ids" }, 400), req);
        }

        const ids = catalogObjectIds 
          ? catalogObjectIds.split(",").map(id => id.trim()).filter(Boolean)
          : [catalogObjectId];

        if (ids.length === 0) {
          return cors(env, json({ error: "No valid catalog object IDs provided" }, 400), req);
        }

        // Batch retrieve inventory counts
        const inventoryData = await square(env, "POST", "/v2/inventory/batch-retrieve-counts", {
          catalog_object_ids: ids,
          location_ids: [], // Empty array means all locations
        });

        // Format response: { counts: { [id]: { quantity, state } } }
        const counts = {};
        if (inventoryData?.counts) {
          for (const count of inventoryData.counts) {
            const objId = count.catalog_object_id;
            counts[objId] = {
              quantity: parseInt(count.quantity || "0", 10),
              state: count.state || "CUSTOM",
            };
          }
        }

        // Include zero counts for IDs not found
        for (const id of ids) {
          if (!counts[id]) {
            counts[id] = { quantity: 0, state: "CUSTOM" };
          }
        }

        return cors(env, json({ counts }), req);
      }

      // --- Purchase: create Order -> process Payment (for shop items) ---
      // Body: { customer_id, location_id, line_items[], taxes?, note?, source_id, idempotency_key, customer_email?, customer_name? }
      // source_id: payment token from Square payment form
      // customer_email: explicitly passed email (ensures receipt is sent to correct address)
      // customer_name: explicitly passed name (for reference)
      // Returns: { ok: true, order_id, payment_id, status }
      // Note: Square automatically sends payment receipts when payment is processed
      if (url.pathname === "/api/purchase" && method === "POST") {
        const {
          customer_id,
          location_id,
          line_items = [],
          taxes = [],
          note = "",
          source_id, // Payment token from Square payment form
          idempotency_key, // Optional, will generate if not provided
          customer_email, // Explicitly passed email (for reference, customer should already have email)
          customer_name, // Explicitly passed name (for reference)
        } = await req.json();

        if (!customer_id || !location_id || !Array.isArray(line_items) || !line_items.length) {
          return cors(
            env,
            json(
              {
                error:
                  "Missing customer_id, location_id, or line_items (non-empty).",
              },
              400
            ),
            req
          );
        }

        if (!source_id) {
          return cors(
            env,
            json({ error: "Missing source_id (payment token)." }, 400),
            req
          );
        }

        // 1) Check inventory availability before creating order
        const catalogObjectIds = line_items.map(li => li.catalog_object_id).filter(Boolean);
        if (catalogObjectIds.length > 0) {
          const inventoryData = await square(env, "POST", "/v2/inventory/batch-retrieve-counts", {
            catalog_object_ids: catalogObjectIds,
            location_ids: [location_id],
          });

          // Check if all items have sufficient inventory
          const inventoryMap = {};
          if (inventoryData?.counts) {
            for (const count of inventoryData.counts) {
              inventoryMap[count.catalog_object_id] = parseInt(count.quantity || "0", 10);
            }
          }

          for (const lineItem of line_items) {
            const requestedQty = parseInt(lineItem.quantity || "1", 10);
            const availableQty = inventoryMap[lineItem.catalog_object_id] || 0;
            if (availableQty < requestedQty) {
              return cors(
                env,
                json({
                  error: `Insufficient inventory for item ${lineItem.catalog_object_id}. Available: ${availableQty}, Requested: ${requestedQty}`,
                  insufficient_inventory: true,
                }, 400),
                req
              );
            }
          }
        }

        // 2) Calculate order total
        let pricedOrder;
        try {
          pricedOrder = await square(env, "POST", "/v2/orders/calculate", {
            order: { location_id, line_items, taxes },
          });
        } catch (calcError) {
          throw new Error(`Failed to calculate order total: ${calcError.message}. Line items: ${JSON.stringify(line_items)}`);
        }

        const totalMoney = pricedOrder?.order?.total_money;
        if (!totalMoney || totalMoney.amount === undefined || totalMoney.amount === null) {
          // Log the full response for debugging
          const debugInfo = JSON.stringify({
            hasOrder: !!pricedOrder?.order,
            hasTotalMoney: !!pricedOrder?.order?.total_money,
            totalMoney,
            pricedOrderResponse: pricedOrder,
            lineItems: line_items,
          });
          throw new Error(`Could not calculate order total. Debug info: ${debugInfo}`);
        }

        // 3) Create the Order
        const orderRes = await square(env, "POST", "/v2/orders", {
          order: { location_id, customer_id, line_items, taxes },
        });

        const orderId = orderRes?.order?.id;
        if (!orderId) {
          throw new Error("Square did not return an order id.");
        }

        // 4) Process payment
        const paymentIdempotencyKey = idempotency_key || cryptoRandomId();
        const paymentRes = await square(env, "POST", "/v2/payments", {
          source_id,
          idempotency_key: paymentIdempotencyKey,
          amount_money: totalMoney,
          order_id: orderId,
        });

        const payment = paymentRes?.payment;
        if (!payment?.id) {
          throw new Error("Square did not return a payment id.");
        }

        // Check payment status
        // Square automatically sends payment receipts via email when payment is processed
        // The receipt is sent to the email address associated with the customer record
        if (payment.status === "APPROVED" || payment.status === "COMPLETED") {
          return cors(
            env,
            json({
              ok: true,
              order_id: orderId,
              payment_id: payment.id,
              status: payment.status,
              receipt_url: payment.receipt_url,
            }),
            req
          );
        } else {
          return cors(
            env,
            json({
              ok: false,
              order_id: orderId,
              payment_id: payment.id,
              status: payment.status,
              error: payment.status_detail || "Payment not approved",
            }, 400),
            req
          );
        }
      }

      return cors(env, new Response("Not found", { status: 404 }), req);
    } catch (err) {
      return cors(
        env,
        json({ error: err?.message || "Internal error" }, 500),
        req
      );
    }
  },
};

/* ----------------------- helpers ----------------------- */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function cors(env, res, req) {
  const origin = req.headers.get("Origin") || "";
  // CORS_ORIGIN can be a comma-separated list of allowed origins
  // Example: "https://rainscopefilmworks.com,https://www.rainscopefilmworks.com"
  const allow = (env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // If CORS_ORIGIN is not set, allow all origins (not recommended for production)
  const chosen = allow.includes(origin) ? origin : allow[0] || "*";
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", chosen);
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "600");
  return new Response(res.body, { status: res.status, headers });
}

function cryptoRandomId() {
  // 24-char url-safe id
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function square(env, method, path, body) {
  // Validate required environment variables
  if (!env.SQUARE_TOKEN) {
    throw new Error("SQUARE_TOKEN environment variable is not set. Please configure it in Cloudflare Workers.");
  }

  const apiBase = env.SQUARE_API_BASE || "https://connect.squareup.com";
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.SQUARE_TOKEN}`,
      "Square-Version": env.SQUARE_VERSION || "2025-01-22",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Square ${method} ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Fetch ALL pages from /v2/catalog/list while preserving query params.
 */
async function squareAll(env, initialPath) {
  const all = { objects: [] };

  // Use URL API by adding dummy origin just for parsing
  const u = new URL(`https://dummy${initialPath}`);
  const basePath = u.pathname;
  const baseParams = new URLSearchParams(u.search);

  let cursor = null;
  do {
    const params = new URLSearchParams(baseParams.toString());
    if (cursor) params.set("cursor", cursor);

    const path = `${basePath}?${params.toString()}`;
    const page = await square(env, "GET", path);
    if (page?.objects?.length) all.objects.push(...page.objects);
    cursor = page?.cursor || null;
  } while (cursor);

  return all;
}
