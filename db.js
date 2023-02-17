require("dotenv").config();
const connect = require("mongoose");

const mongoUri = process.env.MONGO_DB_URL;

connect(mongoUri)
  .then(() => {
    console.log("Connect to Mongo Successfully!");
  })
  .catch((error) => {
    console.error(`Do not connect to Mongo Successfully because ===> ${error}`);
  });
