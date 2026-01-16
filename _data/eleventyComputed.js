module.exports = {
  permalink: (data) => {
    if (data.permalink) {
      return data.permalink;
    }
    if (data.page && data.page.inputPath && data.page.inputPath.endsWith(".html")) {
      return data.page.inputPath.replace(/^\.\//, "");
    }
    return undefined;
  }
};
