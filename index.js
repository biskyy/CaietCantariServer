require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();

const Song = require("./models/songModel");

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

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log(error);
  });

app.get("/songs", async (req, res) => {
  try {
    const songs = await Song.find({});
    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/song/:bookID/:id", async (req, res) => {
  try {
    const { bookID, id } = req.params;
    const song = await Song.findOne({ book_id: bookID, id: id }).exec();
    res.status(200).json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/song", async (req, res) => {
  try {
    await Song.create(req.body);
    try {
      await sortDatabase();
      res.status(200).send("The song got uploaded successfully");
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/song/:bookID/:id", async (req, res) => {
  try {
    const { bookID, id } = req.params;
    const song = await Song.findOneAndReplace(
      { book_id: bookID, id: id },
      req.body
    );

    if (!song)
      return res
        .status(404)
        .send(`Can't find the song with book_id: "${bookID}" and id: ${id}`);

    try {
      await sortDatabase();
      res.status(200).send("The song got uploaded successfully");
    } catch (error) {
      res.status(500).json({ message: error.message });
    }

    const updatedSong = Song.findOne({ book_id: bookID, id: id }).exec();

    res.status(200).json(updatedSong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}`);
});

const sortDatabase = async () => {
  await Song.aggregate(sortPipeline);
};
