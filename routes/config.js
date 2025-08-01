var express = require('express');
var router = express.Router();
const { ConfigModel } = require("../models/config/configModel")
const clearExpiredCarts = require("./modules/cleanExpiredCarts")
const auth = require('../middlewares/auth');

/* GET of configuration */
router.get('/', async function (req, res, next) {
  try {
    await clearExpiredCarts()
    let existingConfig = await ConfigModel.findOne({})

    if (!existingConfig) {
      const newDoc = new ConfigModel({});
      await newDoc.save();
      existingConfig = newDoc
    }

    res.send(existingConfig)

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error: GET of configuration");
  }
});

/* PUT of configuration */
router.put('/',auth, async function (req, res, next) {
  try {
    let existingConfig = await ConfigModel.findOne({})

    if (!existingConfig) {
      res.send("No configuration")
    } else {
      await ConfigModel.updateOne({}, { $set: req.body });
      res.send(existingConfig);
    }

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error: PUT of configuration");
  }
});

module.exports = router;
