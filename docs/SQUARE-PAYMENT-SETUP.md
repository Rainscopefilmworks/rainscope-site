# Square Payment Configuration Guide

This guide will help you configure Square Web Payments SDK for the shop page.

## Step 1: Get Your Square Application ID

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Sign in with your Square account
3. Click on your application (or create a new one if needed)
4. In the **Credentials** section, you'll find your **Application ID** (starts with `sandbox-` for sandbox or `sq0idp-` for production)
5. Copy this Application ID

## Step 2: Configure Allowed Origins (Domain Whitelist)

Square requires you to whitelist the domains where your payment form will be used:

1. In the Square Developer Dashboard, go to your application
2. Navigate to **Settings** → **Point of Sale API** (or **Web Payments SDK** if available)
3. Under **Allowed Origins** (or **Web Payment Origins**), add:
   - `https://rainscopefilmworks.com` (production)
   - `https://www.rainscopefilmworks.com` (if you use www)
   - `http://localhost:8000` (for local testing - optional)
   - `http://localhost:3000` (if you use a different local port)

**Note:** The exact location may vary depending on your Square Dashboard version. Look for settings related to "Web Payments", "Point of Sale API", or "Allowed Origins".

**Important:** Make sure to add both HTTP and HTTPS versions if needed, and include the port number for localhost.

## Step 3: Update shop.html

✅ **Already configured!** Your Application ID has been set in `shop.html`:
```javascript
const APPLICATION_ID = "sq0idp-Q4C4Lb_w5aFXTJuE_2ebgg";
```

If you need to change it in the future:
1. Open `shop.html`
2. Find the line with `APPLICATION_ID`
3. Update with your new Application ID

## Step 4: Test the Configuration

### Testing in Sandbox Mode

1. Use a **Sandbox Application ID** (starts with `sandbox-`)
2. Use Square's test card numbers:
   - **Card Number:** `4111 1111 1111 1111`
   - **CVV:** Any 3 digits (e.g., `123`)
   - **Expiration:** Any future date (e.g., `12/25`)
   - **Postal Code:** Any valid postal code (e.g., `V6A 4K4`)

### Testing in Production Mode

1. Use a **Production Application ID** (starts with `sq0idp-`)
2. Use real credit cards (charges will be processed)
3. Make sure your Square account is activated for payments

## Step 5: Verify Your Worker.js Configuration

Make sure your Cloudflare Worker (`worker.js`) has:
- `SQUARE_TOKEN` environment variable set (your Square Access Token)
- `SQUARE_API_BASE` set to `https://connect.squareup.com` (or sandbox URL for testing)
- `CORS_ORIGIN` includes your domain: `https://rainscopefilmworks.com`

## Troubleshooting

### Payment form doesn't appear
- Check browser console for errors
- Verify Application ID is correct
- Ensure domain is whitelisted in Square Dashboard
- Make sure Square Web Payments SDK script loads: `https://js.squareup.com/v2/paymentform`

### "Invalid Application ID" error
- Double-check the Application ID is correct
- Ensure you're using the right environment (sandbox vs production)
- Verify the Application ID matches the environment in your Square Dashboard

### CORS errors
- Add your domain to allowed origins in Square Dashboard
- Check that your Worker.js CORS_ORIGIN includes your domain
- For local testing, add `http://localhost:PORT` to allowed origins

### Payment processing fails
- Check that your Worker.js `/api/purchase` endpoint is working
- Verify `SQUARE_TOKEN` is set correctly in Cloudflare Workers
- Check Square Dashboard for any API errors or logs

## Additional Resources

- [Square Web Payments SDK Documentation](https://developer.squareup.com/docs/web-payments/overview)
- [Square Developer Dashboard](https://developer.squareup.com/apps)
- [Square API Reference](https://developer.squareup.com/reference/square)

## Security Notes

⚠️ **Never commit your Application ID or Access Token to version control!**

- Consider using environment variables or a configuration file that's in `.gitignore`
- For production, use Square's production credentials
- Keep your Access Token secure and rotate it regularly

