const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");

async function registerUser(req, res) {
  try {
    const db = getDB();

    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "fullName, email, and password are required"
      });
    }

    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists"
      });
    }

    const newUser = {
      fullName,
      email,
      password,
      phone: phone || "",
      createdAt: new Date()
    };

    const result = await db.collection("users").insertOne(newUser);

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to register user",
      error: error.message
    });
  }
}

async function loginUser(req, res) {
  try {
    const db = getDB();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await db.collection("users").findOne({ email, password });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to login",
      error: error.message
    });
  }
}

async function getUserById(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await db.collection("users").findOne({
      _id: new ObjectId(id)
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user",
      error: error.message
    });
  }
}

async function updateUser(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;
    const { fullName, email, password } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const existingUser = await db.collection("users").findOne({
      _id: new ObjectId(id)
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!fullName || !email) {
      return res.status(400).json({
        message: "fullName and email are required"
      });
    }

    const emailOwner = await db.collection("users").findOne({
      email,
      _id: { $ne: new ObjectId(id) }
    });

    if (emailOwner) {
      return res.status(400).json({
        message: "Another user is already using this email"
      });
    }

    const updateData = {
      fullName,
      email
    };

    if (password && password.trim()) {
      updateData.password = password.trim();
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updatedUser = await db.collection("users").findOne({
      _id: new ObjectId(id)
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update user",
      error: error.message
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUser
};