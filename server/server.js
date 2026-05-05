const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/database");
const blockchainService = require("./config/blockchain");
const ipfsService = require("./config/ipfs");
const { initGridFS } = require("./config/gridfs");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Load .env.local if it exists (for machine-specific overrides)
if (fs.existsSync(path.resolve(__dirname, "../.env.local"))) {
  dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });
}
// Environment Health Check
const requiredEnv = [
  { key: "CONTRACT_ADDRESS", tip: "Run: npm run blockchain:deploy:ganache" },
  { key: "MONGODB_URI", tip: "Ensure MongoDB is running and URI is in .env" },
  { key: "ADMIN_PRIVATE_KEY", tip: "Add your Ganache/Hardhat account private key to .env" }
];

const missingEnv = requiredEnv.filter(env => !process.env[env.key] || process.env[env.key].trim() === "");

if (missingEnv.length > 0) {
  console.error("❌ Critical Error: Missing required environment variables.");
  console.log("");
  console.log("🔍 Missing Fields:");
  missingEnv.forEach(env => console.log(`   - ${env.key}`));
  console.log("");
  console.log("🔍 Troubleshooting Info:");
  console.log(`   - Root Directory: ${path.resolve(__dirname, "..")}`);
  console.log(`   - Loading .env from: ${path.resolve(__dirname, "../.env")}`);
  console.log("");
  console.log("💡 Possible Solutions:");
  missingEnv.forEach((env, index) => console.log(`   ${index + 1}. ${env.tip}`));
  console.log("");
  process.exit(1);
}

// Initialize services
const initializeServices = async () => {
  console.log("🚀 Initializing Land Registry System...");

  try {
    await connectDB();
    await blockchainService.initialize();
    await ipfsService.initialize();

    // Initialize GridFS
    initGridFS();
    console.log("✅ GridFS service initialized");

    // Verify email service configuration
    const { verifyEmailConfig } = require("./utils/emailService");
    await verifyEmailConfig();

    // Initialize Gemini AI service for document verification
    const geminiService = require("./utils/geminiService");
    geminiService.initialize();

    console.log("✅ All services initialized successfully");
  } catch (error) {
    console.error("❌ Service initialization failed:", error);
    throw error;
  }
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Make io available to routes
app.set("io", io);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Custom route to serve documents with proper headers for inline viewing
app.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // If not found, try adding .pdf extension as a fallback
    const pdfPath = filePath + ".pdf";
    if (fs.existsSync(pdfPath)) {
      return res.redirect(`/uploads/${filename}.pdf`);
    }
    return res.status(404).json({ error: "File not found" });
  }
  
  // Get file extension to determine content type
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'application/octet-stream'; // default
  
  // Detection logic for extensionless files (like IPFS hashes) using magic numbers
  if (ext === '') {
    const buffer = fs.readFileSync(filePath, { encoding: null, flag: 'r' });
    const header = buffer.slice(0, 4);
    // PDF: %PDF
    if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
      contentType = 'application/pdf';
    } 
    // PNG: \x89PNG
    else if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      contentType = 'image/png';
    } 
    // JPEG: FF D8 FF
    else if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
      contentType = 'image/jpeg';
    }
  } else {
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }
  }
  
  // Set headers
  res.setHeader('Content-Type', contentType);
  
  // If it's a PDF without extension, suggest a .pdf filename for download/display
  const suggestedFilename = (ext === '' && contentType === 'application/pdf') 
    ? `${filename}.pdf` 
    : filename;
    
  res.setHeader('Content-Disposition', 'inline; filename="' + suggestedFilename + '"');
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// Serve uploaded files (for development)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve GridFS images
app.get("/api/images/:filename", (req, res) => {
  const { getFileStream } = require("./config/gridfs");
  const filename = req.params.filename;

  try {
    const readstream = getFileStream(filename);
    if (!readstream) {
      return res.status(404).json({ error: "Image not found" });
    }

    readstream.on("error", (error) => {
      console.error("GridFS stream error:", error);
      res.status(404).json({ error: "Image not found" });
    });

    readstream.pipe(res);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/lands", require("./routes/lands"));
app.use("/api/land-transactions", require("./routes/landTransactions"));
app.use("/api/chats", require("./routes/chat"));
app.use("/api/audit", require("./routes/audit"));
app.use("/api/2fa", require("./routes/twoFactorRoutes"));
app.use("/api/buy-requests", require("./routes/buyRequests"));
app.use("/api/admin/transactions", require("./routes/adminTransactions"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));
app.use("/api/blockchain", require("./routes/blockchain"));

// Serve PDF documents
app.get("/api/documents/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Document not found" });
  }
  
  // Get file extension
  const ext = path.extname(filename).toLowerCase();
  
  // Set headers for PDF download/viewing
  res.setHeader('Content-Type', 'application/pdf');
  
  // Suggest .pdf extension if missing
  const suggestedFilename = ext === '' ? `${filename}.pdf` : filename;
  res.setHeader('Content-Disposition', `inline; filename="${suggestedFilename}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error) => {
    console.error('Error streaming document:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error serving document' });
    }
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    message: "Blockchain Land Registry API is running",
    timestamp: new Date(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Blockchain Land Registry API",
    version: "1.0.0",
    description:
      "Complete blockchain-based land registration and transfer system",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      landTransactions: "/api/land-transactions",
      chats: "/api/chats",
      health: "/api/health",
    },
    documentation: "See README.md for complete API documentation",
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server Error:", error);

  // Handle errors with explicit status codes
  if (error.status) {
    return res.status(error.status).json({
      message: error.message,
    });
  }

  // Handle specific error types
  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      message: "Duplicate entry found",
    });
  }

  if (error.name === "MulterError" || (error.message && error.message.includes("Invalid file type"))) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.status(500).json({
    message: error.message && error.message.includes("Invalid file type") ? error.message : "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    availableRoutes: [
      "/api/auth",
      "/api/users",
      "/api/lands",
      "/api/land-transactions",
      "/api/chats",
      "/api/buy-requests",
      "/api/admin/transactions",
      "/api/2fa",
      "/api/audit",
      "/api/chatbot",
      "/api/health",
    ],
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join chat room
  socket.on('join-chat', async (data) => {
    try {
      const { chatId, userId } = data;
      
      // Verify user authentication (you might want to add JWT verification here)
      if (!userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Join the chat room
      socket.join(`chat-${chatId}`);
      console.log(`User ${userId} joined chat ${chatId}`);
      
      // Notify others in the room
      socket.to(`chat-${chatId}`).emit('user-joined', { userId });
    } catch (error) {
      console.error('Join chat error:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  // Handle new messages
  socket.on('send-message', async (data) => {
    try {
      const { chatId, userId, message, messageType = 'TEXT' } = data;
      
      console.log('Received send-message:', { chatId, userId, message, messageType });
      
      if (!chatId || !userId || !message) {
        console.log('Missing required fields:', { chatId, userId, message });
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      // Save message to database
      const Chat = require('./models/Chat');
      console.log('Looking for chat with ID:', chatId);
      const chat = await Chat.findById(chatId);
      
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Verify user is participant
      if (!chat.isParticipant(userId)) {
        socket.emit('error', { message: 'Not authorized to send messages' });
        return;
      }

      // Add message
      const newMessage = chat.addMessage(userId, message, messageType);
      await chat.save();

      // Emit to all users in the chat room
      io.to(`chat-${chatId}`).emit('new-message', {
        chatId,
        message: newMessage,
        timestamp: new Date()
      });

      console.log(`Message sent in chat ${chatId} by user ${userId}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { chatId, userId } = data;
    socket.to(`chat-${chatId}`).emit('user-typing', { chatId, userId, isTyping: true });
  });

  socket.on('typing-stop', (data) => {
    const { chatId, userId } = data;
    socket.to(`chat-${chatId}`).emit('user-typing', { chatId, userId, isTyping: false });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await initializeServices();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Land Registry Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`📋 Health Check: http://localhost:${PORT}/api/health`);
      console.log("");
      console.log("🏗️  System Components:");
      console.log("   ✅ Express Server");
      console.log("   ✅ MongoDB Database");
      console.log(`   ✅ Blockchain Service (${blockchainService.networkName})`);
      console.log("   ✅ IPFS Storage");
      console.log("   ✅ JWT Authentication");
      console.log("");
      console.log("📚 Available Collections:");
      console.log("   - Users (Authentication & Verification)");
      console.log("   - DigitizedLand (Digitized Land Database)");
      console.log("   - LandTransaction (Transaction Records)");
      console.log("   - Chat (Buyer-Seller Communication)");
      console.log("");
      console.log("🔐 Admin Accounts:");
      console.log("   - admin@landregistry.gov / admin123");
      console.log("   - officer@landregistry.gov / admin123");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

startServer();
