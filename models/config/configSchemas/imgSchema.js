const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ImgSchema = new Schema({
    name:String,
    url: String
});

module.exports = ImgSchema