const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

async function createBooking(req, res) {
  try {
    const db = getDB();

    const {
      userId,
      campsiteId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      guests,
      specialRequest
    } = req.body;

    if (!userId || !campsiteId || !checkInDate || !checkOutDate || !guests) {
      return res.status(400).json({
        message: "userId, campsiteId, checkInDate, checkOutDate, and guests are required"
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

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        message: "checkOutDate must be after checkInDate"
      });
    }

    const newBooking = {
    userId: new ObjectId(userId),
    campsiteId: new ObjectId(campsiteId),
    checkInDate,
    checkOutDate,
    adults: adults ?? 1,
    children: children ?? 0,
    guests: guests ?? ((adults ?? 1) + (children ?? 0)),
    specialRequest: specialRequest || "",
    status: "confirmed",
    createdAt: new Date()
  };

    const result = await db.collection("bookings").insertOne(newBooking);

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create booking",
      error: error.message
    });
  }
}

async function getAllBookings(req, res) {
  try {
    const db = getDB();

    const bookings = await db.collection("bookings").find({}).toArray();

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message
    });
  }
}

async function getBookingById(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(id)
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch booking",
      error: error.message
    });
  }
}

// async function getBookingsByUser(req, res) {
//   try {
//     const db = getDB();
//     const userId = req.params.userId;

//     if (!ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const bookings = await db.collection("bookings").find({
//       userId: new ObjectId(userId)
//     }).toArray();

//     res.status(200).json(bookings);
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch user bookings",
//       error: error.message
//     });
//   }
// }

// async function getBookingsByUser(req, res) {
//   try {
//     const db = getDB();
//     const userId = req.params.userId;

//     if (!ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid user ID" });
//     }

//     const bookings = await db.collection("bookings").aggregate([
//       {
//         $match: {
//           userId: new ObjectId(userId)
//         }
//       },
//       {
//         $lookup: {
//           from: "campsites",
//           localField: "campsiteId",
//           foreignField: "_id",
//           as: "campsiteDetails"
//         }
//       },
//       {
//         $unwind: {
//           path: "$campsiteDetails",
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $project: {
//           _id: 1,
//           userId: 1,
//           campsiteId: 1,
//           checkInDate: 1,
//           checkOutDate: 1,
//           guests: 1,
//           specialRequest: 1,
//           status: 1,
//           createdAt: 1,
//           campsiteName: "$campsiteDetails.name",
//           emirate: "$campsiteDetails.emirate",
//           category: "$campsiteDetails.category",
//           priceAED: "$campsiteDetails.priceAED",
//           description: "$campsiteDetails.description"
//         }
//       }
//     ]).toArray();

//     res.status(200).json(bookings);
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch user bookings",
//       error: error.message
//     });
//   }
// }

async function getBookingsByUser(req, res) {
  try {
    const db = getDB();
    const userId = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const bookings = await db.collection("bookings").aggregate([
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
        $addFields: {
          nights: {
            $dateDiff: {
              startDate: { $toDate: "$checkInDate" },
              endDate: { $toDate: "$checkOutDate" },
              unit: "day"
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          campsiteId: 1,
          checkInDate: 1,
          checkOutDate: 1,
          adults: 1,
          children: 1,
          guests: 1,
          specialRequest: 1,
          status: 1,
          createdAt: 1,
          nights: 1,
          campsiteName: "$campsiteDetails.name",
          emirate: "$campsiteDetails.emirate",
          category: "$campsiteDetails.category",
          priceAED: "$campsiteDetails.priceAED",
          pricingModel: "$campsiteDetails.pricingModel",
          description: "$campsiteDetails.description",
          imageUrls: "$campsiteDetails.imageUrls"
        }
      }
    ]).toArray();

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user bookings",
      error: error.message
    });
  }
}

async function cancelBooking(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(id)
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "cancelled" } }
    );

    res.status(200).json({
      message: "Booking cancelled successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel booking",
      error: error.message
    });
  }
}

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByUser,
  cancelBooking
};