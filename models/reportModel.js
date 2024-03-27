const mongoose = require("mongoose");

const reportSchema = mongoose.Schema(
  {
    songIndex: Number,
    additionalDetails: String,
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
