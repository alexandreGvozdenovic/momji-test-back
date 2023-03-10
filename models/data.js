const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  productTitle: String,
  price: Number,
  vat: Number,
  lastModifiedAt: Date,
  createdAt: Date,
});

const Data = mongoose.model("excels", dataSchema);
module.exports = Data;
