module.exports = {
  permalink: (data) => {
    if (data.permalink) {
      return data.permalink;
    }
    if (data.page && data.page.inputPath && data.page.inputPath.endsWith(".html")) {
      const stem = data.page.filePathStem;
      if (stem === "/index") {
        return "index.html";
      }
      return `${stem}/index.html`;
    }
    return undefined;
  }
};
