require("dotenv").config();
const express = require("express");
const cors = require("cors");
// const multer = require("multer");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();

// const corsPORT = process.env.CORS_PORT || 3000;
const corsOPTIONS = {
  origin: ["https://sipardi.vercel.app", "http://localhost:3000"],
  credentials: true,
};

app.use(cors(corsOPTIONS));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/assets", express.static("images"));

require("./src/routes/index.js")(app);
app.get("/", (req, res) => {
  res.send("SiPardi API");
});

// app.use((error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     return res.status(413).json({
//       message: "Image too large",
//     });
//   }

//   return res.status(500).json({
//     message: error?.message || "Internal Server Error",
//   });
// });

// const startServer = async () => {
//   try {
//     if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development") {
//       await db.sequelize.sync();
//     } else {
//       await dbSync();
//     }
//     console.info("Database Connected");
//     const PORT = process.env.SERVER_PORT || 5000;

//     app.listen(5000, () => {
//       console.log(`Server running on port 5000`);
//     });
//   } catch (error) {
//     console.info(`Error Syncing Database:${error.message}`);
//   }
// };

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});
// startServer();
