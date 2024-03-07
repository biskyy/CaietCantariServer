require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
const Song = require("./models/songModel");
const songSchema = require("./schemas/songSchema");
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const privateKey = process.env.PRIVATE_KEY;

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

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "Unathorized" });

  jwt.verify(token, privateKey, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    req.user = decoded;
    next();
  });
};

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.log(error);
  });

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

app.get("/songs", async (req, res) => {
  try {
    const songs = await Song.find({});
    res.status(200).json(songs);
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
});

app.get("/song/:book_id/:id", async (req, res) => {
  try {
    const { book_id, id } = req.params;
    const song = await Song.findOne({ book_id: book_id, id: id }).exec();
    res.status(200).json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/song", authenticate, async (req, res) => {
  try {
    await Song.create(req.body);
    await sortDatabase();
    res.status(200).send("The song got uploaded successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/song", authenticate, async (req, res) => {
  try {
    await songSchema.validateAsync(req.body);
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

app.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (username !== adminUsername)
      res.status(404).json({ message: "Incorrect username" });
    else if (!bcrypt.compareSync(password, adminPassword))
      res.status(404).json({ message: "Incorrect password" });
    else {
      const token = jwt.sign(
        { username: adminUsername, password: adminPassword },
        privateKey
      );

      res.status(200).json({ message: "Logged in", token });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}`);
});

const sortDatabase = async () => {
  await Song.aggregate(sortPipeline);
};
