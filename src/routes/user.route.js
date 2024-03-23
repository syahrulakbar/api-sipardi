const { userController } = require("../controllers");
const { authJWT } = require("../middlewares");
module.exports = (app) => {
  app.use((req, res, next) => {
    next();
  });

  app.post("/api/login", userController.signIn);
  app.post("/api/admin/login", userController.adminSignIn);
  app.delete("/api/logout", userController.signOut);
  app.post("/api/register", userController.signUp);
  app.get("/api/users/token", userController.refreshToken);
  app.get("/api/users/profile", [authJWT.verifyToken], userController.currentUser);
  app.get("/api/users/admin", [authJWT.verifyToken, authJWT.isAdmin], userController.currentUser);
  app.get("/api/users", [authJWT.verifyToken, authJWT.isAdmin], userController.getAllUsers);
  app.get("/api/users/:id", [authJWT.verifyToken], userController.getUserById);
  app.patch("/api/users/:id", [authJWT.verifyToken], userController.updateUserById);
  app.delete(
    "/api/users/:id",
    [authJWT.verifyToken, authJWT.isAdmin],
    userController.deleteUserById,
  );
};
