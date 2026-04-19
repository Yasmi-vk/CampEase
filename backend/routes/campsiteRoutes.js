// const express = require("express");
// const router = express.Router();

// const {
//   getAllCampsites,
//   getCampsiteById
// } = require("../controllers/campsiteController");

// router.get("/", getAllCampsites);
// router.get("/:id", getCampsiteById);

// module.exports = router;
const express = require("express");
const router = express.Router();

const {
  getAllCampsites,
  getCampsiteById,
  getCampsiteLocation
} = require("../controllers/campsiteController");

router.get("/", getAllCampsites);
router.get("/:id/location", getCampsiteLocation);
router.get("/:id", getCampsiteById);

module.exports = router;