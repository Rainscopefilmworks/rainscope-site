module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("_headers");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("video-sitemap.xml");
  eleventyConfig.addPassthroughCopy("worker.js");
  eleventyConfig.addPassthroughCopy("signature.jpg");

  return {
    dir: {
      input: ".",
      output: "_site"
    },
    htmlTemplateEngine: "njk"
  };
};
