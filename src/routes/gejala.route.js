const { authJWT } = require("../middlewares");
const { gejalaController } = require("../controllers");

module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });
  app.get("/api/dispepsia", gejalaController.dispepsia);
  app.get("/api/gejala", gejalaController.getAllGejala);
  app.get("/api/gejala/:id", gejalaController.getGejalaById);
  app.post("/api/gejala", gejalaController.createGejala);
  app.patch("/api/gejala/:id", gejalaController.updateGejala);
  app.delete("/api/gejala/:id", gejalaController.deleteGejala);
};
