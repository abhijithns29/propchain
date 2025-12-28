const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const { auth, adminAuth } = require("../middleware/auth");
const ipfsService = require("../config/ipfs");
const mongoose = require("mongoose");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Submit verification documents
router.post(
  "/verification/submit",
  auth,
  upload.fields([
    { name: "aadhaarCard", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "passport", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { aadhaarNumber, panNumber, dlNumber, passportNumber } = req.body;

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is admin (admins don't need verification)
      if (user.role === "ADMIN") {
        return res.status(400).json({
          message: "Admin accounts do not require verification",
        });
      }

      // Check if user is already verified
      if (user.verificationStatus === "VERIFIED") {
        return res.status(400).json({
          message: "User is already verified",
        });
      }

      // Check if user already has a pending verification
      if (user.verificationStatus === "PENDING") {
        return res.status(400).json({
          message:
            "Verification is already pending. Please wait for admin review.",
        });
      }

      const verificationDocuments = {};
      let documentsUploaded = 0;

      // Upload Aadhaar card
      if (req.files.aadhaarCard && aadhaarNumber) {
        try {
          const aadhaarFile = req.files.aadhaarCard[0];
          const aadhaarHash = await ipfsService.uploadFile(
            aadhaarFile.buffer,
            aadhaarFile.originalname
          );
          verificationDocuments.aadhaarCard = {
            number: aadhaarNumber.trim(),
            documentUrl: ipfsService.getFileUrl(aadhaarHash),
            ipfsHash: aadhaarHash,
            verified: false,
          };
          documentsUploaded++;
        } catch (uploadError) {
          console.error("Aadhaar card upload error:", uploadError);
          return res
            .status(500)
            .json({ message: "Failed to upload Aadhaar card" });
        }
      }

      // Upload PAN card
      if (req.files.panCard && panNumber) {
        try {
          const panFile = req.files.panCard[0];
          const panHash = await ipfsService.uploadFile(
            panFile.buffer,
            panFile.originalname
          );
          verificationDocuments.panCard = {
            number: panNumber.trim().toUpperCase(),
            documentUrl: ipfsService.getFileUrl(panHash),
            ipfsHash: panHash,
            verified: false,
          };
          documentsUploaded++;
        } catch (uploadError) {
          console.error("PAN card upload error:", uploadError);
          return res.status(500).json({ message: "Failed to upload PAN card" });
        }
      }

      // Upload Driving License
      if (req.files.drivingLicense && dlNumber) {
        try {
          const dlFile = req.files.drivingLicense[0];
          const dlHash = await ipfsService.uploadFile(
            dlFile.buffer,
            dlFile.originalname
          );
          verificationDocuments.drivingLicense = {
            number: dlNumber.trim().toUpperCase(),
            documentUrl: ipfsService.getFileUrl(dlHash),
            ipfsHash: dlHash,
            verified: false,
          };
          documentsUploaded++;
        } catch (uploadError) {
          console.error("Driving license upload error:", uploadError);
          return res
            .status(500)
            .json({ message: "Failed to upload driving license" });
        }
      }

      // Upload Passport
      if (req.files.passport && passportNumber) {
        try {
          const passportFile = req.files.passport[0];
          const passportHash = await ipfsService.uploadFile(
            passportFile.buffer,
            passportFile.originalname
          );
          verificationDocuments.passport = {
            number: passportNumber.trim().toUpperCase(),
            documentUrl: ipfsService.getFileUrl(passportHash),
            ipfsHash: passportHash,
            verified: false,
          };
          documentsUploaded++;
        } catch (uploadError) {
          console.error("Passport upload error:", uploadError);
          return res.status(500).json({ message: "Failed to upload passport" });
        }
      }

      // Check if at least one document was uploaded
      if (documentsUploaded === 0) {
        return res.status(400).json({
          message:
            "At least one verification document with its number is required",
        });
      }

      // Update user verification documents - only set fields that have actual values
      const currentDocs = user.verificationDocuments?.toObject() || {};

      // Create a clean verification documents object
      const updatedDocs = {};

      // Copy existing documents that are not undefined
      if (
        currentDocs.aadhaarCard &&
        typeof currentDocs.aadhaarCard === "object"
      ) {
        updatedDocs.aadhaarCard = currentDocs.aadhaarCard;
      }
      if (currentDocs.panCard && typeof currentDocs.panCard === "object") {
        updatedDocs.panCard = currentDocs.panCard;
      }
      if (
        currentDocs.drivingLicense &&
        typeof currentDocs.drivingLicense === "object"
      ) {
        updatedDocs.drivingLicense = currentDocs.drivingLicense;
      }
      if (currentDocs.passport && typeof currentDocs.passport === "object") {
        updatedDocs.passport = currentDocs.passport;
      }

      // Only add newly uploaded documents that are not undefined
      if (verificationDocuments.aadhaarCard) {
        updatedDocs.aadhaarCard = verificationDocuments.aadhaarCard;
      }
      if (verificationDocuments.panCard) {
        updatedDocs.panCard = verificationDocuments.panCard;
      }
      if (verificationDocuments.drivingLicense) {
        updatedDocs.drivingLicense = verificationDocuments.drivingLicense;
      }
      if (verificationDocuments.passport) {
        updatedDocs.passport = verificationDocuments.passport;
      }

      user.verificationDocuments = updatedDocs;
      user.verificationStatus = "PENDING";

      await user.save();

      console.log(
        `Verification documents submitted by user: ${user.email} (${documentsUploaded} documents)`
      );

      // Return success response immediately
      res.json({
        message: "Verification documents submitted successfully. Verification in progress.",
        documentsUploaded,
        verificationStatus: user.verificationStatus,
        aiVerification: null
      });

      // AI Verification using Gemini (Running in background)
      // (async () => {
      //   const geminiService = require('../utils/geminiService');
      //   const autoVerifyEnabled = process.env.AUTO_VERIFY_ENABLED === 'true';
        
      //   if (autoVerifyEnabled && geminiService.initialized) {
      //     console.log('🤖 Starting background AI verification for user:', user.email);
          
      //     // Prepare documents for AI analysis
      //     const documentsToAnalyze = [];
      //     const path = require('path');
      //     const fs = require('fs');
      //     const os = require('os');
          
      //     // Create temp directory for document analysis
      //     const tempDir = path.join(os.tmpdir(), 'verification-' + user._id);
      //     if (!fs.existsSync(tempDir)) {
      //       fs.mkdirSync(tempDir, { recursive: true });
      //     }

      //     try {
      //       // Download and prepare PAN card
      //       if (req.files.panCard && panNumber) {
      //         const panPath = path.join(tempDir, 'pan' + path.extname(req.files.panCard[0].originalname));
      //         fs.writeFileSync(panPath, req.files.panCard[0].buffer);
      //         documentsToAnalyze.push({
      //           type: 'PAN',
      //           filePath: panPath,
      //           userProvided: panNumber.trim().toUpperCase()
      //         });
      //       }

      //       // Download and prepare Aadhaar card
      //       if (req.files.aadhaarCard && aadhaarNumber) {
      //         const aadhaarPath = path.join(tempDir, 'aadhaar' + path.extname(req.files.aadhaarCard[0].originalname));
      //         fs.writeFileSync(aadhaarPath, req.files.aadhaarCard[0].buffer);
      //         documentsToAnalyze.push({
      //           type: 'AADHAAR',
      //           filePath: aadhaarPath,
      //           userProvided: aadhaarNumber.trim()
      //         });
      //       }

      //       // Download and prepare Driving License
      //       if (req.files.drivingLicense && dlNumber) {
      //         const dlPath = path.join(tempDir, 'dl' + path.extname(req.files.drivingLicense[0].originalname));
      //         fs.writeFileSync(dlPath, req.files.drivingLicense[0].buffer);
      //         documentsToAnalyze.push({
      //           type: 'DL',
      //           filePath: dlPath,
      //           userProvided: dlNumber.trim().toUpperCase()
      //         });
      //       }

      //       // Download and prepare Passport
      //       if (req.files.passport && passportNumber) {
      //         const passportPath = path.join(tempDir, 'passport' + path.extname(req.files.passport[0].originalname));
      //         fs.writeFileSync(passportPath, req.files.passport[0].buffer);
      //         documentsToAnalyze.push({
      //           type: 'PASSPORT',
      //           filePath: passportPath,
      //           userProvided: passportNumber.trim().toUpperCase()
      //         });
      //       }

      //       // Run AI verification
      //       const aiResult = await geminiService.verifyDocuments(documentsToAnalyze);
            
      //       // Re-fetch user to get latest state as it might have changed
      //       const updatedUser = await User.findById(user._id);
      //       if (!updatedUser) return;

      //       // Store AI verification results
      //       updatedUser.aiVerification = {
      //         analyzed: true,
      //         analyzedAt: new Date(),
      //         decision: aiResult.decision,
      //         confidence: aiResult.confidence,
      //         reasoning: aiResult.reasoning,
      //         extractedData: aiResult.details?.documents || [],
      //         documentAnalysis: aiResult.details?.documents?.map(doc => ({
      //           documentType: doc.type,
      //           extracted: doc.analysis,
      //           matched: doc.analysis.matches,
      //           confidence: doc.analysis.confidence,
      //           issues: doc.analysis.issues || []
      //         })) || []
      //       };

      //       // Auto-approve or auto-reject based on AI decision
      //       if (aiResult.decision === 'APPROVED') {
      //         updatedUser.verificationStatus = 'VERIFIED';
      //         updatedUser.verificationDate = new Date();
      //         console.log('✅ AI auto-approved verification for:', updatedUser.email);
      //       } else if (aiResult.decision === 'REJECTED') {
      //         updatedUser.verificationStatus = 'REJECTED';
      //         updatedUser.rejectionReason = aiResult.reasoning;
      //         console.log('❌ AI auto-rejected verification for:', updatedUser.email);
      //       } else {
      //         // MANUAL_REVIEW - keep as PENDING
      //         console.log('⚠️  AI recommends manual review for:', updatedUser.email);
      //       }

      //       await updatedUser.save();

      //       // Cleanup temp files
      //       fs.rmSync(tempDir, { recursive: true, force: true });
      //     } catch (aiError) {
      //       console.error('AI verification error:', aiError);
      //       // Cleanup temp files on error
      //       if (fs.existsSync(tempDir)) {
      //         fs.rmSync(tempDir, { recursive: true, force: true });
      //       }
      //     }
      //   }
      // })().catch(err => console.error('Background verification error:', err));
    } catch (error) {
      console.error("Document submission error:", error);
      res.status(500).json({
        message: "Failed to submit verification documents",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
);

// Get pending verifications (Admin only)
router.get("/verification/pending", adminAuth, async (req, res) => {
  try {
    const pendingUsers = await User.findPendingVerifications()
      .select(
        "-password -loginAttempts -lockUntil -twoFactorSecret -twoFactorBackupCodes"
      )
      .sort({ createdAt: -1 });

    res.json({ users: pendingUsers });
  } catch (error) {
    console.error("Get pending verifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify user (Admin only)
router.put("/verification/:userId/verify", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, rejectionReason, verifiedDocuments } = req.body;

    // Validate userId
    if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing user ID" });
    }

    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be VERIFIED or REJECTED",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({
        message: "Cannot modify admin user verification status",
      });
    }

    // Update verification status
    user.verificationStatus = status;
    user.verifiedBy = req.user._id;
    user.verificationDate = new Date();

    if (status === "REJECTED") {
      user.rejectionReason =
        rejectionReason || "Documents did not meet verification requirements";
    } else if (status === "VERIFIED") {
      user.rejectionReason = undefined;

      // Mark specific documents as verified
      if (verifiedDocuments) {
        Object.keys(verifiedDocuments).forEach((docType) => {
          if (
            user.verificationDocuments[docType] &&
            verifiedDocuments[docType]
          ) {
            user.verificationDocuments[docType].verified = true;
          }
        });
      }
    }

    await user.save();

    console.log(
      `User ${user.email} ${status.toLowerCase()} by admin ${req.user.email}`
    );

    res.json({
      message: `User ${status.toLowerCase()} successfully`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        verificationStatus: user.verificationStatus,
        verificationDate: user.verificationDate,
      },
    });
  } catch (error) {
    console.error("User verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all verified users (Admin only)
router.get("/verified", adminAuth, async (req, res) => {
  try {
    const verifiedUsers = await User.findVerifiedUsers()
      .select("-password -verificationDocuments -loginAttempts -lockUntil")
      .sort({ verificationDate: -1 });

    res.json({ users: verifiedUsers });
  } catch (error) {
    console.error("Get verified users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -loginAttempts -lockUntil")
      .populate(
        "ownedLands",
        "landId landDetails.village landDetails.district digitalDocument.isDigitalized marketInfo.isForSale"
      );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { fullName, phoneNumber, address } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize profile object if it doesn't exist
    if (!user.profile) {
      user.profile = {
        phoneNumber: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "India"
        }
      };
    }

    // Update allowed fields
    if (fullName) user.fullName = fullName.trim();
    if (phoneNumber !== undefined) {
      user.profile.phoneNumber = phoneNumber.trim();
    }
    if (address) {
      // Initialize address object if it doesn't exist
      if (!user.profile.address) {
        user.profile.address = {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "India"
        };
      }
      user.profile.address = {
        ...user.profile.address,
        ...address,
      };
    }

    await user.save();

    console.log(`Profile updated for user: ${user.email}`);

    res.json({
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Get user statistics (Admin only)
router.get("/statistics", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "USER" });
    const verifiedUsers = await User.countDocuments({
      role: "USER",
      verificationStatus: "VERIFIED",
    });
    const pendingUsers = await User.countDocuments({
      role: "USER",
      verificationStatus: "PENDING",
    });
    const rejectedUsers = await User.countDocuments({
      role: "USER",
      verificationStatus: "REJECTED",
    });

    const recentUsers = await User.find({ role: "USER" })
      .select("fullName email verificationStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      statistics: {
        totalUsers,
        verifiedUsers,
        pendingUsers,
        rejectedUsers,
        verificationRate:
          totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0,
      },
      recentUsers,
    });
  } catch (error) {
    console.error("Get user statistics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify user by ID (Admin only)
router.post("/verify-user", adminAuth, async (req, res) => {
  // Robust ID validation and debug logging
  const userId = req.body._id || req.body.userId;
  console.log("User ID received:", userId); // Debug log
  if (
    !userId ||
    userId === "undefined" ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing user ID" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // ...existing verification logic...
    res.json({ success: true, user });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Example: Add validation to any user verification route
router.get("/verify/:id", async (req, res) => {
  try {
    // Debug: log incoming params and body
    console.log("Incoming params:", req.params);
    console.log("Incoming body:", req.body);

    const userId = req.params.id || req.body.userId || req.body._id;
    if (
      !userId ||
      userId === "undefined" ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ error: "Invalid or missing user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("User verification error:", err);
    res.status(500).json({ error: "User verification failed" });
  }
});

// Like/Unlike a land
router.post("/liked-lands/:landId", auth, async (req, res) => {
  try {
    const { landId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(landId)) {
      return res.status(400).json({ error: "Invalid land ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const landIndex = user.likedLands.indexOf(landId);
    const isLiked = landIndex !== -1;

    if (isLiked) {
      // Unlike the land
      user.likedLands.splice(landIndex, 1);
      await user.save();
      // compute updated likes count for this land
      const likesCount = await User.countDocuments({ likedLands: landId });
      res.json({
        success: true,
        landId,
        liked: false,
        likesCount,
        message: "Land removed from favorites",
      });
    } else {
      // Like the land
      user.likedLands.push(landId);
      await user.save();
      const likesCount = await User.countDocuments({ likedLands: landId });
      res.json({
        success: true,
        landId,
        liked: true,
        likesCount,
        message: "Land added to favorites",
      });
    }
  } catch (error) {
    console.error("Like/unlike land error:", error);
    res.status(500).json({ error: "Failed to update land like status" });
  }
});

// Get user's liked lands
router.get("/liked-lands", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).populate({
      path: "likedLands",
      populate: {
        path: "currentOwner",
        select: "fullName email",
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Filter only lands that are for sale
    const likedLandsForSale = user.likedLands.filter(
      (land) => land && land.marketInfo && land.marketInfo.isForSale
    );

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLands = likedLandsForSale.slice(startIndex, endIndex);

    res.json({
      success: true,
      lands: paginatedLands,
      pagination: {
        total: likedLandsForSale.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(likedLandsForSale.length / limit),
      },
    });
  } catch (error) {
    console.error("Get liked lands error:", error);
    res.status(500).json({ error: "Failed to fetch liked lands" });
  }
});

// Get user's own listings (lands for sale)
router.get("/my-listings", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const Land = require("../models/Land");

    const query = {
      currentOwner: userId,
      "marketInfo.isForSale": true,
      status: "FOR_SALE",
    };

    const lands = await Land.find(query)
      .populate("currentOwner", "fullName email")
      .sort({ "marketInfo.listedDate": -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Land.countDocuments(query);

    res.json({
      success: true,
      lands,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my listings error:", error);
    res.status(500).json({ error: "Failed to fetch your listings" });
  }
});

module.exports = router;
