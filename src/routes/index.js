const blogRoutes = require("./blog.route");
const userRoutes = require("./user.route");
const gejalaRoutes = require("./gejala.route");
const penyakitRoutes = require("./penyakit.route");
const ruleRoutes = require("./rule.route");
const konsultasiRoutes = require("./konsultasi.route");
module.exports = (app) => {
  blogRoutes(app);
  userRoutes(app);
  gejalaRoutes(app);
  penyakitRoutes(app);
  ruleRoutes(app);
  konsultasiRoutes(app);
};
