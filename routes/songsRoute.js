import express from "express";
const router = express.Router();

import authenticate from "../middleware/authenticate.js";
import { rateLimitByJWT } from "../middleware/limiter.js";

import songValidationSchema from "../validation/songValidation.js";
import Song from "../models/songModel.js";

const sortPipeline = [
  {
    $addFields: {
      customSortOrder: {
        $indexOfArray: [["CC", "BER", "J", "CT", "Cor"], "$book_id"],
      },
    },
  },
  {
    $sort: {
      customSortOrder: 1,
      id: 1,
    },
  },
  {
    $project: {
      customSortOrder: 0,
    },
  },
  {
    $out: "songs",
  },
];

const sortDatabase = async () => {
  await Song.aggregate(sortPipeline);
};

const formatSongTitle = (songTitle) => {
  return songTitle
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s.-]+/g, " ");
};

const formatSongContent = (songContent) => {
  return songContent
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\w\s-]|[\d]/gm, "")
    .replace(/[\s.-]+/g, " ")
    .replace(/ refren | r /g, " ")
    .trim();
};

router.get("/", rateLimitByJWT(2, 30000), async (req, res) => {
  try {
    // req.body doesnt work with get requests in express.js
    const { book_id, id } = req.query;
    if (book_id && id) {
      const song = await Song.findOne({ book_id, id }).exec();
      return res.status(200).json(song);
    }
    const songs = await Song.find({});
    return res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

router.post("/", authenticate, async (req, res) => {
  // i think i should validate the req.body before
  try {
    await Song.create(req.body);
    await sortDatabase();
    res.status(200).send("The song got uploaded successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/", authenticate, async (req, res) => {
  try {
    await songValidationSchema.validateAsync(req.body);
  } catch (validationError) {
    return res.status(400).json({ message: validationError.message });
  }

  try {
    const { book_id, id } = req.body;

    req.body.searchable_title = formatSongTitle(req.body.title);
    req.body.searchable_content = formatSongContent(req.body.content);

    const replacedSong = await Song.findOneAndReplace(
      { book_id, id },
      req.body,
    );

    if (!replacedSong)
      return res.status(404).json({
        message: `Can't find the song with book_id: "${book_id}" and id: ${id}`,
      });

    await sortDatabase();

    res.status(200).json({ message: "The song was updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/sort", authenticate, async (req, res) => {
  try {
    await sortDatabase();
    return res
      .json({ message: "The songs got sorted successfully" })
      .status(200);
  } catch (err) {
    console.error(err);
    return res
      .json({ message: "Internal server error while sorting songs" })
      .status(500);
  }
});

export default router;
