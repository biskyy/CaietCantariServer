const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const Song = require("../models/songModel");
const songValidationSchema = require("../validation/songValidation");

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

router.get("/", async (req, res) => {
  try {
    const { book_id, id } = req.body;
    if (book_id && id) {
      const song = await Song.findOne({ book_id, id }).exec();
      console.log("hi");
      return res.status(200).json(song);
    }
    const songs = await Song.find({});
    return res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authenticate, async (req, res) => {
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
      req.body
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

module.exports = router;
