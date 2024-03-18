const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().getTime();
    const originalName = file.originalname;

    cb(null, `${timestamp}-${originalName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/gif"
  ) {
    cb(null, true);
  } else {
    const responseRejected = "Only image files are allowed";
    req.fileValidationError = responseRejected;
    cb(null, false, new Error(responseRejected));
  }
};

const upload = multer({
  fileFilter,
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024, //3mb
  },
});

module.exports = upload;
