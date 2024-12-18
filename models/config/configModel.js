const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ImgSchema = require("./configSchemas/imgSchema");
const ContactSchema = require("./configSchemas/contactSchema");
const { defaultStringValue } = require("../../config");
const defaultBackground = "https://png.pngtree.com/background/20210715/original/pngtree-background-white-business-lines-picture-image_1326851.jpg"

const ConfigSchema = new Schema({
  texts: {
    presentationTitle: {
      type: String,
      default: "Título de presentación",
    },
    presentationText: {
      type: String,
      default: "Descripción de la empresa",
    },
    footer: {
      type: String,
      default: "Descripción de la empresa",
    }
  },
  imagePresentation: {
    type: String,
    default: "https://www.estudiostreaming.com.ar/wp-content/uploads/2020/10/tulogo.png",
  },
  banners: {
    imageAppointment: {
      type: String,
      default: defaultStringValue,
    },
    imageAboutUs: {
      type: String,
      default: defaultStringValue,
    },
    imageNews: {
      type: String,
      default: defaultStringValue,
    },
    imageReservations: {
      type: String,
      default: defaultStringValue,
    },
  },
  contact: {
    type: ContactSchema,
    default: {
      name: "Nombre de la empresa",
      phone: "0000",
      address: "Dirección",
      email: "email@email.com",
      city: "Ciudad",
      state: "Provincia",
      mapPoint: "",
      facebook: "facebook.com",
      instagram: "instagram.com",
    },
  },
  appointment: {
    mercadoPago: {
      type: Boolean,
      default: false
    },
    bannedDays: [{
      title: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        required: true
      }
    }],
    nextMonths: {
      type: Number,
      default: 2
    },
    cancellationWindow: {
      type: Schema.Types.Mixed,
      default: 24
    },
    allowApposToday: {
      type: Boolean,
      default: true
    }
  },
  customization: {
    background: {
      backgroundImage: { type: String, default: defaultBackground },
      backgroundTurno: { type: String, default: defaultBackground },
    },
    primary: {
      color: { type: String, default: "#FFFFFF" },
      text: { type: String, default: "#000000" },
    },
    secondary: {
      color: { type: String, default: "#FFFFFF" },
      text: { type: String, default: "#000000" },
    },
    logo: {
      primary: { type: String, default: "https://www.estudiostreaming.com.ar/wp-content/uploads/2020/10/tulogo.png" },
      secondary: { type: String, default: "https://www.estudiostreaming.com.ar/wp-content/uploads/2020/10/tulogo.png" },
    },
    shopName: { type: String, default: "Nombre de la empresa" },
    twoColors: { type: Boolean, default: true },
    floatButtons: { type: String, default: "Todos" }
  },
});

const ConfigModel = mongoose.model("ConfigSchema", ConfigSchema);

module.exports = { ConfigModel };
