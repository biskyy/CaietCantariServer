const mongoose = require("mongoose");

const songSchema = mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    book_id: {
      type: String,
      required: true,
    },
    author: String,
    composer: String,
    original_title: String,
    references: String,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

const Song = mongoose.model("Song", songSchema);

module.exports = Song;
