const express = require("express");
const router = express.Router();

const {
  saveCampsite,
  getSavedCampsitesByUser,
  removeSavedCampsite
} = require("../controllers/savedCampsiteController");

router.post("/", saveCampsite);
router.get("/user/:userId", getSavedCampsitesByUser);
router.delete("/", removeSavedCampsite);

module.exports = router;