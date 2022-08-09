const express = require("express");
var os = require('os');

const PORT = process.env.PORT || 3001;

const app = express();

app.get("/api", (req, res) => {
  const cpus = os.cpus().length;
  const loadAverage = os.loadavg()[0] / cpus;
  res.json({ loadAverage: loadAverage });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});