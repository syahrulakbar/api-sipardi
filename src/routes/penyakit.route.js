const { authJWT } = require("../middlewares");
const { penyakitController } = require("../controllers");

module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });
  app.get("/api/penyakit", penyakitController.getAllPenyakit);
  app.get("/api/penyakit/:id", penyakitController.getPenyakitById);
  app.post("/api/penyakit", penyakitController.createPenyakit);
  app.patch("/api/penyakit/:id", penyakitController.updatePenyakit);
  app.delete("/api/penyakit/:id", penyakitController.deletePenyakit);
};
