const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConfigSchema = new Schema({
  shopName: {
    type: String
  },
  shopColors: {
    type: Map,
    of: String
  },
  phone: {
    type: String
  },
  customization: {
    logo: {
      type: String
    }
  }
});

const ConfigModel = mongoose.model("ConfigSchema", ConfigSchema);

module.exports = { ConfigModel };
