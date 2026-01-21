const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: "Account is temporarily locked",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    // Call auth middleware and wait for it to complete
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // If auth failed, response was already sent, so return
    if (res.headersSent) {
      return;
    }

    if (!["ADMIN"].includes(req.user.role)) {
      // Log unauthorized access attempt
      await AuditLog.logAction(
        "ADMIN_ACTION",
        req.user._id,
        "SYSTEM",
        "UNAUTHORIZED_ACCESS",
        {
          attemptedRoute: req.originalUrl,
          userRole: req.user.role,
        },
        req
      );

      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    // Only send response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(401).json({
        success: false,
        message: "Authorization failed",
      });
    }
  }
};

const auditorAuth = async (req, res, next) => {
  try {
    // Call auth middleware and wait for it to complete
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // If auth failed, response was already sent, so return
    if (res.headersSent) {
      return;
    }

    if (!["ADMIN", "AUDITOR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Auditor access required",
      });
    }

    next();
  } catch (error) {
    // Only send response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(401).json({
        success: false,
        message: "Authorization failed",
      });
    }
  }
};

const requireTwoFactor = async (req, res, next) => {
  try {
    const { twoFactorToken } = req.body;

    if (!req.user.twoFactorEnabled) {
      // If 2FA is not enabled, proceed (but log the action)
      await AuditLog.logAction(
        "ADMIN_ACTION",
        req.user._id,
        "SYSTEM",
        "NO_2FA_WARNING",
        {
          action: req.originalUrl,
          warning: "Sensitive action performed without 2FA",
        },
        req
      );
      return next();
    }

    if (!twoFactorToken) {
      return res.status(400).json({
        success: false,
        message: "Two-factor authentication token required",
        requiresTwoFactor: true,
      });
    }

    const user = await User.findById(req.user._id).select("+twoFactorSecret");
    const isValidToken = user.verifyTwoFactorToken(twoFactorToken);

    if (!isValidToken) {
      await AuditLog.logAction(
        "ADMIN_ACTION",
        req.user._id,
        "SYSTEM",
        "INVALID_2FA",
        {
          action: req.originalUrl,
          invalidToken: true,
        },
        req
      );

      return res.status(400).json({
        success: false,
        message: "Invalid two-factor authentication token",
      });
    }

    next();
  } catch (error) {
    console.error("Two-factor auth error:", error);
    res.status(500).json({
      success: false,
      message: "Two-factor authentication failed",
    });
  }
};

// Add simple authMiddleware if missing
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

module.exports = {
  auth,
  adminAuth,
  auditorAuth,
  requireTwoFactor,
  authMiddleware, // <-- Export added
};
