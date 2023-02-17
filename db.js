require("dotenv").config();
const mongoose = require("mongoose");

const mongoUri = process.env.MONGO_DB_URL;

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connect to Mongo Successfully!");
  })
  .catch((error) => {
    console.error(`Do not connect to Mongo Successfully because ===> ${error}`);
  });
