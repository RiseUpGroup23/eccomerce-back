const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConfigSchema = new Schema({
  shopName: {
    type: String
  },
  shopColors: {
    type: Map,
    of: String,
    default: {
      secondaryTextColor: "#cbcbcb",
      primaryColor: "#000000",
      primaryTextColor: "#000000",
      secondaryColor: "#cbcbcb"
    }
  },
  phone: {
    type: String
  },
  customization: {
    logo: {
      type: String,
      default: "https://www.risingground.org/wp-content/uploads/2016/08/logo_placeholder.png"
    }
  }
});

const ConfigModel = mongoose.model("ConfigSchema", ConfigSchema);

module.exports = { ConfigModel };
