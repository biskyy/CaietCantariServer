import mongoose from "mongoose";

const routeSchema = mongoose.Schema(
  {
    route: String,
    count: Number,
    expiresAt: Date,
  },
  { timestamps: true },
);

const Route = mongoose.model("Route", routeSchema);
export default Route;
