require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const mongoose = require("mongoose");

const songsRoute = require("./routes/songsRoute");
const authRoute = require("./routes/authRoute");
const reportsRoute = require("./routes/reportsRoute");

const app = express();

// https://awstip.com/deploying-an-express-js-mongodb-application-on-aws-lambda-with-serverless-framework-289c39891a3f
// forever thankfull mr Afeef Razick
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 0) {
    await mongoose
      .connect(process.env.MONGO_URI)
      .then(() => {
        console.log("Connected to MongoDB server successfully");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log(
      "Connection already established, reusing the existing connection"
    );
  }
  next();
});

app.use(express.json());
// catch bad json syntax
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err)
    return res.status(400).json({ status: 400, message: err.message });
  next();
});
app.use(cors());

app.use("/songs", songsRoute);
app.use("/login", authRoute);
app.use("/reports", reportsRoute);

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; // caches mongoose connections inbetween requests
  return await handler(event, context);
};
