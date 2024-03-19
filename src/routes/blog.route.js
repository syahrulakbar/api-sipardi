const { blogController } = require("../controllers");
const { authJWT, upload } = require("../middlewares");

module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });
  app.get("/api/blog", blogController.getAllBlog);
  app.get("/api/blog/:id", blogController.getBlogById);
  app.post("/api/blog", [authJWT.verifyToken, authJWT.isAdmin], blogController.createBlog);
  app.patch("/api/blog/:id", [authJWT.verifyToken, authJWT.isAdmin], blogController.updateBlog);
  app.delete("/api/blog/:id", [authJWT.verifyToken, authJWT.isAdmin], blogController.deleteBlog);
};
