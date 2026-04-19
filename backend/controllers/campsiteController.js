// const { ObjectId } = require("mongodb");
// const { getDB } = require("../config/db");

// async function getAllCampsites(req, res) {
//   try {
//     const db = getDB();

//     const {
//       emirate,
//       category,
//       pricingModel,
//       landType,
//       seasonal,
//       permitBased,
//       communityKnown,
//       officiallyRegistered,
//       weatherEnabled,
//       q
//     } = req.query;

//     const query = {
//       isActive: true
//     };

//     if (emirate) {
//       query.emirate = emirate;
//     }

//     if (category) {
//       query.category = category;
//     }

//     if (pricingModel) {
//       query.pricingModel = pricingModel;
//     }

//     if (landType) {
//       query.landType = landType;
//     }

//     if (seasonal !== undefined) {
//       query.seasonal = seasonal === "true";
//     }

//     if (permitBased !== undefined) {
//       query.permitBased = permitBased === "true";
//     }

//     if (communityKnown !== undefined) {
//       query.communityKnown = communityKnown === "true";
//     }

//     if (officiallyRegistered !== undefined) {
//       query.officiallyRegistered = officiallyRegistered === "true";
//     }

//     if (weatherEnabled !== undefined) {
//       query.weatherEnabled = weatherEnabled === "true";
//     }

//     if (q) {
//       query.$or = [
//         { name: { $regex: q, $options: "i" } },
//         { description: { $regex: q, $options: "i" } },
//         { emirate: { $regex: q, $options: "i" } }
//       ];
//     }

//     const campsites = await db
//       .collection("campsites")
//       .find(query)
//       .toArray();

//     res.status(200).json(campsites);
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch campsites",
//       error: error.message
//     });
//   }
// }

// async function getCampsiteById(req, res) {
//   try {
//     const db = getDB();
//     const id = req.params.id;

//     if (!ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid campsite ID" });
//     }

//     const campsite = await db.collection("campsites").findOne({
//       _id: new ObjectId(id)
//     });

//     if (!campsite) {
//       return res.status(404).json({ message: "Campsite not found" });
//     }

//     res.status(200).json(campsite);
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch campsite",
//       error: error.message
//     });
//   }
// }

// async function getCampsiteLocation(req, res) {
//   try {
//     const db = getDB();
//     const id = req.params.id;

//     if (!ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid campsite ID" });
//     }

//     const campsite = await db.collection("campsites").findOne(
//       { _id: new ObjectId(id) },
//       {
//         projection: {
//           name: 1,
//           latitude: 1,
//           longitude: 1,
//           emirate: 1
//         }
//       }
//     );

//     if (!campsite) {
//       return res.status(404).json({ message: "Campsite not found" });
//     }

//     if (
//       campsite.latitude === undefined ||
//       campsite.longitude === undefined
//     ) {
//       return res.status(404).json({
//         message: "Location coordinates not available for this campsite"
//       });
//     }

//     const googleMapsUrl = `https://www.google.com/maps?q=${campsite.latitude},${campsite.longitude}`;
//     const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${campsite.latitude}&mlon=${campsite.longitude}#map=14/${campsite.latitude}/${campsite.longitude}`;

//     res.status(200).json({
//       message: "Campsite location fetched successfully",
//       campsite: {
//         _id: campsite._id,
//         name: campsite.name,
//         emirate: campsite.emirate,
//         latitude: campsite.latitude,
//         longitude: campsite.longitude,
//         googleMapsUrl,
//         openStreetMapUrl
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch campsite location",
//       error: error.message
//     });
//   }
// }

// module.exports = {
//   getAllCampsites,
//   getCampsiteById,
//   getCampsiteLocation
// };

const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

async function getAllCampsites(req, res) {
  try {
    const db = getDB();

    const {
      emirate,
      category,
      pricingModel,
      landType,
      seasonal,
      permitBased,
      communityKnown,
      officiallyRegistered,
      weatherEnabled,
      parkingAvailable,
      q
    } = req.query;

    const query = {
      isActive: true
    };

    if (emirate) {
      query.emirate = emirate;
    }

    if (category) {
      query.category = category;
    }

    if (pricingModel) {
      if (pricingModel === "free") {
        query.pricingModel = "free";
      } else if (pricingModel === "paid") {
        query.pricingModel = { $ne: "free" };
      } else {
        query.pricingModel = pricingModel;
      }
    }

    if (landType) {
      query.landType = landType;
    }

    if (seasonal !== undefined) {
      query.seasonal = seasonal === "true";
    }

    if (permitBased !== undefined) {
      query.permitBased = permitBased === "true";
    }

    if (communityKnown !== undefined) {
      query.communityKnown = communityKnown === "true";
    }

    if (officiallyRegistered !== undefined) {
      query.officiallyRegistered = officiallyRegistered === "true";
    }

    if (weatherEnabled !== undefined) {
      query.weatherEnabled = weatherEnabled === "true";
    }

    if (parkingAvailable !== undefined) {
      query.parkingAvailable = parkingAvailable === "true";
    }

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { emirate: { $regex: q, $options: "i" } }
      ];
    }

    const campsites = await db.collection("campsites").find(query).toArray();

    res.status(200).json(campsites);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch campsites",
      error: error.message
    });
  }
}

async function getCampsiteById(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid campsite ID" });
    }

    const campsite = await db.collection("campsites").findOne({
      _id: new ObjectId(id)
    });

    if (!campsite) {
      return res.status(404).json({ message: "Campsite not found" });
    }

    res.status(200).json(campsite);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch campsite",
      error: error.message
    });
  }
}

async function getCampsiteLocation(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid campsite ID" });
    }

    const campsite = await db.collection("campsites").findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          name: 1,
          latitude: 1,
          longitude: 1,
          emirate: 1
        }
      }
    );

    if (!campsite) {
      return res.status(404).json({ message: "Campsite not found" });
    }

    if (campsite.latitude === undefined || campsite.longitude === undefined) {
      return res.status(404).json({
        message: "Location coordinates not available for this campsite"
      });
    }

    const googleMapsUrl = `https://www.google.com/maps?q=${campsite.latitude},${campsite.longitude}`;
    const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${campsite.latitude}&mlon=${campsite.longitude}#map=14/${campsite.latitude}/${campsite.longitude}`;

    res.status(200).json({
      message: "Campsite location fetched successfully",
      campsite: {
        _id: campsite._id,
        name: campsite.name,
        emirate: campsite.emirate,
        latitude: campsite.latitude,
        longitude: campsite.longitude,
        googleMapsUrl,
        openStreetMapUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch campsite location",
      error: error.message
    });
  }
}

module.exports = {
  getAllCampsites,
  getCampsiteById,
  getCampsiteLocation
};