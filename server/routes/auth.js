const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { auth } = require("../middleware/auth");
const { createAndSendOTP, verifyOTP } = require("../utils/otpService");

const router = express.Router();

// Send OTP for registration
router.post("/send-registration-otp", async (req, res) => {
  try {
    const { email, fullName } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "Email is required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        ok: false,
        error: "An account with this email already exists",
      });
    }

    // Create and send OTP
    const result = await createAndSendOTP(
      email,
      fullName || "User",
      "REGISTRATION"
    );

    res.json({
      ok: true,
      message: "Verification code sent to your email",
      expiresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to send verification code. Please try again.",
    });
  }
});

// Verify OTP and register user
router.post("/verify-and-register", async (req, res) => {
  try {
    const { fullName, email, password, walletAddress, otp } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !otp) {
      return res.status(400).json({
        ok: false,
        error: "Full name, email, password, and OTP are required",
      });
    }

    // Verify OTP
    const otpResult = await verifyOTP(email, otp);
    if (!otpResult.success) {
      return res.status(400).json({
        ok: false,
        error: otpResult.error,
      });
    }

    // Check if user already exists (double-check)
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        ok: false,
        error: "User already exists with this email address",
      });
    }

    // Check wallet address if provided
    if (walletAddress) {
      const existingWallet = await User.findOne({ walletAddress: walletAddress.trim().toLowerCase() });
      if (existingWallet) {
        return res.status(400).json({
          ok: false,
          error: "User already exists with this wallet address",
        });
      }
    }

    // Determine user role
    const adminEmails = [
      "admin@landregistry.gov",
      "officer@landregistry.gov",
      "superadmin@landregistry.gov",
      "auditor@landregistry.gov",
    ];

    let userRole = "USER";
    if (email.toLowerCase() === "auditor@landregistry.gov") {
      userRole = "AUDITOR";
    } else if (adminEmails.includes(email.toLowerCase())) {
      userRole = "ADMIN";
    }

    // Create new user
    const userData = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: userRole,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    };

    // Add wallet address if provided
    if (walletAddress) {
      userData.walletAddress = walletAddress.trim().toLowerCase();
    }

    const user = new User(userData);
    await user.save();

    // Log registration
    await AuditLog.logAction(
      "USER_REGISTER",
      user._id,
      "USER",
      user._id.toString(),
      { email: user.email, role: user.role, emailVerified: true },
      req
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET || "fallback-secret-key-for-development",
      { expiresIn: "24h" }
    );

    console.log(`New user registered with verified email: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      ok: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isVerified: user.verificationStatus === "VERIFIED",
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === "walletAddress" ? "wallet address" : field;
      return res.status(400).json({
        ok: false,
        error: `User already exists with this ${fieldName}`,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        ok: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      ok: false,
      error: "Server error during registration. Please try again.",
    });
  }
});


// Send OTP for password reset
router.post("/send-password-reset-otp", async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "Email is required",
      });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        ok: false,
        error: "No account found with this email address",
      });
    }

    // Create and send OTP
    await createAndSendOTP(email, user.fullName, "PASSWORD_RESET");

    res.json({
      ok: true,
      message: "Password reset code sent to your email",
      expiresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    console.error("Send password reset OTP error:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to send password reset code. Please try again.",
    });
  }
});

// Verify password reset OTP
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        ok: false,
        error: "Email and OTP are required",
      });
    }

    // Verify OTP
    const otpResult = await verifyOTP(email, otp);
    if (!otpResult.success) {
      return res.status(400).json({
        ok: false,
        error: otpResult.error,
      });
    }

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        ok: false,
        error: "User not found",
      });
    }

    res.json({
      ok: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);
    res.status(500).json({
      ok: false,
      error: "Server error during OTP verification",
    });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Validate required fields
    if (!email || !newPassword) {
      return res.status(400).json({
        ok: false,
        error: "Email and new password are required",
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "Password must be at least 6 characters long",
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        ok: false,
        error: "User not found",
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Log password reset
    await AuditLog.logAction(
      "PASSWORD_RESET",
      user._id,
      "USER",
      user._id.toString(),
      { email: user.email },
      req
    );

    console.log(`Password reset successful for ${user.email}`);

    res.json({
      ok: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      ok: false,
      error: "Server error during password reset. Please try again.",
    });
  }
});


// Register user
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, walletAddress, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email address",
      });
    }

    // Check wallet address if provided
    if (walletAddress) {
      const existingWallet = await User.findOne({ walletAddress: walletAddress.trim().toLowerCase() });
      if (existingWallet) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this wallet address",
        });
      }
    }

    // Determine user role (only allow ADMIN for specific emails)
    const adminEmails = [
      "admin@landregistry.gov",
      "officer@landregistry.gov",
      "superadmin@landregistry.gov",
      "auditor@landregistry.gov",
    ];

    let userRole = "USER";
    if (email.toLowerCase() === "auditor@landregistry.gov") {
      userRole = "AUDITOR";
    } else if (adminEmails.includes(email.toLowerCase())) {
      userRole = "ADMIN";
    }

    // Create new user
    const userData = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: userRole,
    };

    // Add wallet address if provided
    if (walletAddress) {
      userData.walletAddress = walletAddress.trim().toLowerCase();
    }

    const user = new User(userData);
    await user.save();

    // Log registration
    await AuditLog.logAction(
      "USER_REGISTER",
      user._id,
      "USER",
      user._id.toString(),
      { email: user.email, role: user.role },
      req
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET || "fallback-secret-key-for-development",
      { expiresIn: "24h" }
    );

    // Log successful registration
    console.log(`New user registered: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isVerified: user.verificationStatus === "VERIFIED",
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === "walletAddress" ? "wallet address" : field;
      return res.status(400).json({
        success: false,
        message: `User already exists with this ${fieldName}`,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration. Please try again.",
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;

    // Validate input
    if (!email && !walletAddress) {
      return res.status(400).json({
        message: "Email or wallet address is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    // Find user by email or wallet address
    let user;
    if (email) {
      user = await User.findByEmail(email);
    } else if (walletAddress) {
      user = await User.findOne({ walletAddress: walletAddress.trim().toLowerCase() });
    }

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        message:
          "Account is temporarily locked due to too many failed login attempts. Please try again later.",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET || "fallback-secret-key-for-development",
      { expiresIn: "24h" }
    );

    // Log successful login
    console.log(`User logged in: ${user.email} (${user.role})`);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isVerified: user.verificationStatus === "VERIFIED",
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login. Please try again.",
    });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -loginAttempts -lockUntil")
      .populate(
        "ownedLands",
        "landId landDetails.village landDetails.district digitalDocument.isDigitalized"
      );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user: {
        id: user._id,
        ...user.toJSON(),
        isVerified: user.verificationStatus === "VERIFIED",
        canClaimLand: user.canClaimLand(),
        hasRequiredDocuments: user.hasRequiredDocuments(),
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      message: "Server error while fetching user data",
    });
  }
});

// Verify wallet address
router.post("/verify-wallet", async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        message: "Wallet address, signature, and message are required",
      });
    }

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: walletAddress.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        message: "No user found with this wallet address",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // In a real implementation, you would verify the signature here
    // using ethers.js verifyMessage function
    // For now, we'll accept any signature for demo purposes

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET || "fallback-secret-key-for-development",
      { expiresIn: "24h" }
    );

    // Log successful wallet verification
    console.log(`Wallet verified for user: ${user.email} (${user.role})`);

    res.json({
      message: "Wallet verified successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isVerified: user.verificationStatus === "VERIFIED",
      },
    });
  } catch (error) {
    console.error("Wallet verification error:", error);
    res.status(500).json({
      message: "Server error during wallet verification",
    });
  }
});

// Refresh token
router.post("/refresh-token", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user || !user.isActive) {
      return res.status(403).json({
        message: "User not found or account deactivated",
      });
    }

    // Generate new JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET || "fallback-secret-key-for-development",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Token refreshed successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isVerified: user.verificationStatus === "VERIFIED",
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      message: "Server error during token refresh",
    });
  }
});

// Logout (optional - mainly for logging purposes)
router.post("/logout", auth, async (req, res) => {
  try {
    // In a stateless JWT system, logout is mainly handled on the client side
    // But we can log the logout event for audit purposes
    console.log(`User logged out: ${req.user.email} (${req.user.role})`);

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Server error during logout",
    });
  }
});

module.exports = router;
