const { authJWT } = require("../middlewares");
const { ruleController } = require("../controllers");

module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });
  app.get("/api/rule", ruleController.getAllRule);
  app.get("/api/rule/:id", ruleController.getRuleById);
  app.post("/api/rule", ruleController.createRule);
  app.post("/api/expert-system", [authJWT.verifyToken], ruleController.matchSymptoms);
  app.patch("/api/rule/:id", ruleController.updateRule);
  app.delete("/api/rule/:id", ruleController.deleteRule);
};
