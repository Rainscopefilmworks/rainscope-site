const {
  buildAssetManifest,
  resetAssetManifestCache
} = require("./scripts/build-asset-manifest");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({ "_generated/assets": "assets" });
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("_headers");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("video-sitemap.xml");
  eleventyConfig.addPassthroughCopy("worker.js");
  eleventyConfig.addPassthroughCopy("signature.jpg");
  eleventyConfig.on("eleventy.before", async () => {
    resetAssetManifestCache();
    await buildAssetManifest();
  });
  eleventyConfig.addGlobalData("assets", async () => {
    return buildAssetManifest();
  });

  return {
    dir: {
      input: ".",
      output: "_site"
    },
    htmlTemplateEngine: "njk"
  };
};
