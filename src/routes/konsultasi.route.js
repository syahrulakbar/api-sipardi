const { authJWT } = require("../middlewares");
const { konsultasiController } = require("../controllers");

module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });
  app.get("/api/konsultasi", [authJWT.verifyToken], konsultasiController.getAllKonsultasi);
  app.get("/api/konsultasi/:id", konsultasiController.getKonsultasiById);
  app.post("/api/konsultasi", konsultasiController.createKonsultasi);
  app.patch("/api/konsultasi/:id", konsultasiController.updateKonsultasi);
  app.delete("/api/konsultasi/:id", konsultasiController.deleteKonsultasi);
};
