import mongoose from "mongoose";

const clientSchema = mongoose.Schema(
  {
    ip: String,
    //count: Number,
    //expiresAt: Date,
    trackers: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

const Client = mongoose.model("Client", clientSchema);
export default Client;
