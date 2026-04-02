const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const generatedRoot = path.join(projectRoot, "_generated", "assets");

const assetEntries = [
  {
    key: "styles",
    source: path.join(projectRoot, "assets", "css", "styles.css"),
    outputDir: path.join(generatedRoot, "css"),
    baseName: "styles",
    ext: ".css",
    publicDir: "/assets/css"
  },
  {
    key: "script",
    source: path.join(projectRoot, "assets", "js", "script.js"),
    outputDir: path.join(generatedRoot, "js"),
    baseName: "script",
    ext: ".js",
    publicDir: "/assets/js"
  },
  {
    key: "bookingScript",
    source: path.join(projectRoot, "assets", "js", "booking.js"),
    outputDir: path.join(generatedRoot, "js"),
    baseName: "booking",
    ext: ".js",
    publicDir: "/assets/js"
  },
  {
    key: "ourWorkScript",
    source: path.join(projectRoot, "assets", "js", "our-work.js"),
    outputDir: path.join(generatedRoot, "js"),
    baseName: "our-work",
    ext: ".js",
    publicDir: "/assets/js"
  }
];

let cachedManifest = null;

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function clearGeneratedAssets() {
  await fs.rm(generatedRoot, { recursive: true, force: true });
  await ensureDir(path.join(generatedRoot, "css"));
  await ensureDir(path.join(generatedRoot, "js"));
}

function getDigest(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex").slice(0, 10);
}

async function buildAssetManifest() {
  if (cachedManifest) {
    return cachedManifest;
  }

  await clearGeneratedAssets();

  const manifest = {};

  for (const asset of assetEntries) {
    const contents = await fs.readFile(asset.source);
    const digest = getDigest(contents);
    const fileName = `${asset.baseName}.${digest}${asset.ext}`;
    const outputPath = path.join(asset.outputDir, fileName);

    await ensureDir(asset.outputDir);
    await fs.writeFile(outputPath, contents);

    manifest[asset.key] = `${asset.publicDir}/${fileName}`;
  }

  await fs.writeFile(
    path.join(generatedRoot, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  cachedManifest = manifest;
  return manifest;
}

function resetAssetManifestCache() {
  cachedManifest = null;
}

module.exports = {
  buildAssetManifest,
  resetAssetManifestCache
};
