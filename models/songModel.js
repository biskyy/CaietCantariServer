import mongoose from "mongoose";

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
    searchable_title: String,
    searchable_content: String,
    index: Number,
    author: String,
    composer: String,
    original_title: String,
    references: String,
    tags: [String],
  },
  {
    timestamps: true,
  },
);

const Song = mongoose.model("Song", songSchema);
export default Song;
