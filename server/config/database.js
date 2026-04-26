const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/landregistry";

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    console.log("");
    console.log("💡 Troubleshooting:");
    console.log("   - Is your MongoDB service running?");
    console.log("   - Check if MONGODB_URI is correct in your root .env file.");
    console.log("   - Run: 'services.msc' (Windows) or 'brew services list' (Mac) to check status.");
    console.log("");
    process.exit(1);
  }
};

module.exports = connectDB;
