var express = require('express');
var router = express.Router();
const { ConfigModel } = require("../models/config/configModel")
const clearExpiredCarts = require("./modules/cleanExpiredCarts")

router.get('/storehead', async function (req, res) {
  try {
    const config = await ConfigModel.findOne({});

    if (!config) return

    const indexPath = path.resolve(__dirname, '../build/index.html');
    const html = await fs.promises.readFile(indexPath, 'utf8');

    const finalHtml = html
      .replace('{{TITLE}}', config?.shopName || 'Tienda')
      .replace('{{FAVICON}}', config?.customization?.logo || '/favicon.ico')
      .replace('{{THEME_COLOR}}', config?.shopColors?.primaryColor || '#000000')
      .replace('{{DESCRIPTION}}', config?.description || 'Tienda Online')
      .replace('{{APPLE_ICON}}', config?.customization?.logo || '/logo192.png')
      .replace('{{MANIFEST}}', config?.manifest || '/manifest.json');

    res.send(finalHtml);
  } catch (err) {
    console.error('Error al renderizar HTML:', err);
    res.status(500).send('Internal Server Error');
  }
});


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
router.put('/', async function (req, res, next) {
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
