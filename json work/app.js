const fs = require("fs/promises");

const path = "./Cantari.json";
const path2 = "./Cantari2.json";

fs.readFile(path).then((_data) => {
  let data = JSON.parse(_data);
  let j = 1;

  for (let i = 0; i < data.length; i++) {
    if (data[i]["book_id"] == "Cor") {
      data[i]["id"] = j;
      j++;
    }
  }
  for (let i = 0; i < data.length; i++) {
    if (typeof data[i]["id"] === "string")
      data[i]["id"] = Number(data[i]["id"]);
  }
  fs.writeFile(path2, JSON.stringify(data));
});
