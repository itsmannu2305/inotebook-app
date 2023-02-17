require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./db.js");
const path = require("path");

// MongoDB connection
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Available Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));
app.use("/", require("./routes/password"));

//  Static Files for depoly
app.use(express.static(path.join(--__dirname, "client/build")));

app.get("*", function (req, res) {
  res.sendFile(path.join((__dirname, "./client/build/index.js")));
});

app.listen(port, () => {
  console.log(`iNotebook backend connected`);
});
