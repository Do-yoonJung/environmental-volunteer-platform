// config/db.js
const mongoose = require("mongoose");
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Set strictQuery explicitly to suppress the warning
//mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });  // Remove deprecated options
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
