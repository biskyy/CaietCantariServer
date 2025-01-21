import dotenv from "dotenv";
dotenv.config();
import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import mongoose from "mongoose";
import compression from "compression";

import songsRoute from "./routes/songsRoute.js";
import authRoute from "./routes/authRoute.js";
import reportsRoute from "./routes/reportsRoute.js";

const app = express();

// https://awstip.com/deploying-an-express-js-mongodb-application-on-aws-lambda-with-serverless-framework-289c39891a3f
// forever thankfull mr Afeef Razick

app.use(async (req, res, next) => {
  //const client
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
      "Connection already established, reusing the existing connection",
    );
  }
  return next();
});

app.use(express.json());
// catch bad json syntax
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err)
    return res.status(400).json({ status: 400, message: err.message });
  next();
});
app.use(cors());
app.use(compression()); // doesnt work

app.use("/songs", songsRoute);
app.use("/login", authRoute);
app.use("/reports", reportsRoute);

const _handler = serverless(app);

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; // caches mongoose connections inbetween requests
  return await _handler(event, context);
};
