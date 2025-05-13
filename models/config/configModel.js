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
      primaryColor: "#cbcbcb",
      primaryTextColor: "#000000",
      secondaryTextColor: "#cbcbcb",
      secondaryColor: "#000000"
    }
  },
  phone: {
    type: String
  },
  customization: {
    logo: {
      type: String,
      default: "https://www.risingground.org/wp-content/uploads/2016/08/logo_placeholder.png"
    },
    menuTira: {
      items: [{
        linkTo: String,
        title: String
      }],
      backgroundColor: {
        type: String,
        default: "#000000"
      },
      textColor: {
        type: String,
        default: "#ffffff"
      }
    },
    footer: {
      firstColumn: [{
        title: String,
        content: String
      }],
      secondColumn: [{
        title: String,
        content: String
      }],
      thirdColumn: [{
        title: String,
        content: String
      }]
    }
  }
});

const ConfigModel = mongoose.model("ConfigSchema", ConfigSchema);

module.exports = { ConfigModel };
