var express = require('express');
var code = require("./code");
var mine = require("./mine");
var stream_settings = require("./stream_settings");

var router = express.Router();
router.use("/code", code);
router.use("/mine", mine);
router.use("/stream_settings", stream_settings);

module.exports = router;