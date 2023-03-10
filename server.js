const mongoose = require("mongoose");
const express = require("express");
const app = express();
const dataModel = require("./models/data");
const bodyparser = require("body-parser");
const multer = require("multer");
const csv = require("fast-csv");
const { Parser } = require("@json2csv/plainjs");
const fs = require("fs");
const path = require("path");
app.use(bodyparser.json());
app.use(
  bodyparser.urlencoded({
    extended: true,
  })
);

mongoose.connect(
  "mongodb+srv://admin:admin@cluster1.1z8d8ha.mongodb.net/momji?retryWrites=true&w=majority"
);
app.set("view engine", "ejs");
app.get("/", (req, res) => {
  console.log("here");
  res.render("index");
});

var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, "./uploads/");
  },
  filename: (req, file, callBack) => {
    callBack(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({
  storage: storage,
});

async function UploadCsvDataToMySQL(filePath) {
  let stream = fs.createReadStream(filePath);
  let csvData = [];
  let csvStream = csv
    .parse()
    .on("data", function (data) {
      csvData.push(data);
    })
    .on("end", async function () {
      // Remove Header ROW
      csvData.shift();
      const formattedData = csvData.map((row) => {
        const splittedData = row[0].split("\t");
        return {
          _id: splittedData[0],
          productTitle: splittedData[1],
          price: Number(splittedData[2]),
          vat: Number(splittedData[3]),
          lastModifiedAt: Date(splittedData[4]),
          createdAt: Date(splittedData[5]),
        };
      });

      for (let row of formattedData) {
        const update = await dataModel.findByIdAndUpdate(row._id, {
          productTitle: row.productTitle,
          price: row.price,
          vat: row.vat,
          lastModifiedAt: Date(),
          createdAt: row.createdAt,
        });
      }
      fs.unlinkSync(filePath);
    });

  stream.pipe(csvStream);
}

app.post("/", async (req, res) => {
  const data = new dataModel({
    productTitle: "Slip",
    price: 20,
    vat: 20,
    lastModifiedAt: Date(),
    createdAt: Date(),
  });
  await data.save();
  res.redirect("/");
});

app.post("/exportdata", async (req, res) => {
  const data = await dataModel.find({});
  const parser = new Parser({
    fields: [
      "id",
      "productTitle",
      "price",
      "vat",
      "lastModifiedAt",
      "createdAt",
    ],
  });

  const file = parser.parse(data);
  fs.writeFile("test.csv", file, function (error) {
    if (error) throw error;
    console.log("Ok");
  });
  res.sendFile(__dirname + "/test.csv");
});

app.post("/uploadfile", upload.single("uploadfile"), async (req, res) => {
  await UploadCsvDataToMySQL(__dirname + "/uploads/" + req.file.filename);
  res.redirect("/");
});

app.listen(3000);
