const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

async function saveCampsite(req, res) {
  try {
    const db = getDB();
    const { userId, campsiteId } = req.body;

    if (!userId || !campsiteId) {
      return res.status(400).json({
        message: "userId and campsiteId are required"
      });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (!ObjectId.isValid(campsiteId)) {
      return res.status(400).json({ message: "Invalid campsiteId" });
    }

    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId)
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const campsite = await db.collection("campsites").findOne({
      _id: new ObjectId(campsiteId)
    });

    if (!campsite) {
      return res.status(404).json({ message: "Campsite not found" });
    }

    const existingSaved = await db.collection("savedCampsites").findOne({
      userId: new ObjectId(userId),
      campsiteId: new ObjectId(campsiteId)
    });

    if (existingSaved) {
      return res.status(400).json({
        message: "Campsite already saved"
      });
    }

    const newSavedCampsite = {
      userId: new ObjectId(userId),
      campsiteId: new ObjectId(campsiteId),
      createdAt: new Date()
    };

    const result = await db.collection("savedCampsites").insertOne(newSavedCampsite);

    res.status(201).json({
      message: "Campsite saved successfully",
      savedId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save campsite",
      error: error.message
    });
  }
}

async function getSavedCampsitesByUser(req, res) {
  try {
    const db = getDB();
    const userId = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const savedCampsites = await db.collection("savedCampsites").aggregate([
      {
        $match: {
          userId: new ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: "campsites",
          localField: "campsiteId",
          foreignField: "_id",
          as: "campsiteDetails"
        }
      },
      {
        $unwind: {
          path: "$campsiteDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          campsiteId: 1,
          createdAt: 1,
          campsiteName: "$campsiteDetails.name",
          emirate: "$campsiteDetails.emirate",
          category: "$campsiteDetails.category",
          description: "$campsiteDetails.description",
          priceAED: "$campsiteDetails.priceAED",
          pricingModel: "$campsiteDetails.pricingModel",
          weatherEnabled: "$campsiteDetails.weatherEnabled",
          landType: "$campsiteDetails.landType"
        }
      }
    ]).toArray();

    res.status(200).json(savedCampsites);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch saved campsites",
      error: error.message
    });
  }
}

async function removeSavedCampsite(req, res) {
  try {
    const db = getDB();
    const { userId, campsiteId } = req.body;

    if (!userId || !campsiteId) {
      return res.status(400).json({
        message: "userId and campsiteId are required"
      });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (!ObjectId.isValid(campsiteId)) {
      return res.status(400).json({ message: "Invalid campsiteId" });
    }

    const result = await db.collection("savedCampsites").deleteOne({
      userId: new ObjectId(userId),
      campsiteId: new ObjectId(campsiteId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Saved campsite not found"
      });
    }

    res.status(200).json({
      message: "Saved campsite removed successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove saved campsite",
      error: error.message
    });
  }
}

module.exports = {
  saveCampsite,
  getSavedCampsitesByUser,
  removeSavedCampsite
};