const app = require("./app/app");

const PORT = 3000;

app.listen(PORT, function () {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});