const fs = require("fs");
const path = require("path");

const removeImage = (filePath) => {
  filePath = path.join(__dirname, "../../images", filePath);
  return fs.unlink(filePath, (err) => console.log(err || "Image removed"));
};

module.exports = {
  removeImage,
};
