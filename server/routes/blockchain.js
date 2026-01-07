const express = require("express");
const { adminAuth } = require("../middleware/auth");
const blockchainService = require("../config/blockchain");
const Land = require("../models/Land");
const { ethers } = require("ethers");

const router = express.Router();

// Get blockchain statistics
router.get("/stats", adminAuth, async (req, res) => {
  try {
    if (!blockchainService.contract) {
      return res.status(503).json({
        success: false,
        message: "Blockchain not connected",
      });
    }

    // Get network info
    const network = await blockchainService.provider.getNetwork();
    const blockNumber = await blockchainService.provider.getBlockNumber();

    // Get contract info
    const contractInfo = await blockchainService.getContractInfo();

    // Get wallet balance
    const balance = await blockchainService.provider.getBalance(
      blockchainService.wallet.address
    );

    // Get lands statistics
    const totalLands = await Land.countDocuments();
    const landsOnBlockchain = await Land.countDocuments({
      blockchainTxHash: { $exists: true, $ne: null, $ne: "" },
    });
    const pendingLands = totalLands - landsOnBlockchain;

    // Get total transactions (Registrations + Completed Transfers + BuyRequests)
    const transfersOnBlockchain = await LandTransaction.countDocuments({
      blockchainTxHash: { $exists: true, $ne: null, $ne: "" },
    });
    
    const BuyRequest = require('../models/BuyRequest');
    const buyRequestsOnBlockchain = await BuyRequest.countDocuments({
      blockchainTxHash: { $exists: true, $ne: null, $ne: "" },
    });
    
    const totalBlockchainTransactions = landsOnBlockchain + transfersOnBlockchain + buyRequestsOnBlockchain;

    res.json({
      success: true,
      data: {
        network: {
          chainId: network.chainId,
          name: network.name || `Chain ${network.chainId}`,
          blockNumber: blockNumber,
        },
        contract: {
          address: contractInfo.contractAddress,
          propertyCounter: contractInfo.propertyCounter,
          transactionCounter: totalBlockchainTransactions, // Use DB count for more accuracy
          owner: contractInfo.owner,
        },
        wallet: {
          address: blockchainService.wallet.address,
          balance: balance.toString(),
          balanceEth: (parseFloat(balance.toString()) / 1e18).toFixed(4),
        },
        lands: {
          total: totalLands,
          onBlockchain: landsOnBlockchain,
          pending: pendingLands,
        },
      },
    });
  } catch (error) {
    console.error("Error getting blockchain stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get blockchain statistics",
      error: error.message,
    });
  }
});

const LandTransaction = require("../models/LandTransaction");

// Get recent blockchain transactions
router.get("/transactions", adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // 1. Get lands (for registrations)
    const lands = await Land.find({
      blockchainTxHash: { $exists: true, $ne: null, $ne: "" },
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate("currentOwner", "fullName email");

    const registrationTxs = lands.map((land) => ({
      hash: land.blockchainTxHash,
      blockNumber: land.blockchainBlock,
      timestamp: land.updatedAt,
      type: "LAND_REGISTRATION",
      landId: land._id,
      assetId: land.assetId,
      surveyNumber: land.surveyNumber,
      owner: land.currentOwner?.fullName || "Unknown",
      propertyId: land.blockchainId,
      status: "Success"
    }));

    // 2. Get land transactions (for transfers/sales)
    const landTxs = await LandTransaction.find({
      blockchainTxHash: { $exists: true, $ne: null, $ne: "" },
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate("buyer seller landId");

    const transferTxs = landTxs.map((tx) => ({
      hash: tx.blockchainTxHash,
      blockNumber: tx.blockchainBlock,
      timestamp: tx.updatedAt,
      type: tx.transactionType || "Transfer",
      landId: tx.landId?._id,
      assetId: tx.landId?.assetId || "Unknown",
      surveyNumber: tx.landId?.surveyNumber || "N/A",
      owner: tx.buyer?.fullName || "Unknown",
      propertyId: tx.landId?.blockchainId || "N/A",
      status: tx.status === "COMPLETED" || tx.status === "APPROVED" ? "Success" : "Pending"
    }));

    // 3. Get buy requests (for peer-to-peer transfers)
    const BuyRequest = require('../models/BuyRequest');
    const buyRequests = await BuyRequest.find({
      blockchainTxHash: { $exists: true, $ne: null, $ne: "" },
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate("buyer seller landId");

    const buyRequestTxs = buyRequests.map((req) => ({
      hash: req.blockchainTxHash,
      blockNumber: req.timeline.find(t => t.event === 'BLOCKCHAIN_PROCESSED')?.metadata?.blockNumber || "N/A",
      timestamp: req.updatedAt,
      type: "LAND_TRANSFER",
      landId: req.landId?._id,
      assetId: req.landId?.assetId || "Unknown",
      surveyNumber: req.landId?.surveyNumber || "N/A",
      owner: req.buyer?.fullName || "Unknown",
      propertyId: req.landId?.blockchainId || "N/A",
      status: req.status === "COMPLETED" ? "Success" : "Pending"
    }));

    // Merge and sort by timestamp
    const allTransactions = [...registrationTxs, ...transferTxs, ...buyRequestTxs]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      data: allTransactions,
      count: allTransactions.length,
    });
  } catch (error) {
    console.error("Error getting blockchain transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get blockchain transactions",
      error: error.message,
    });
  }
});

// Get blockchain health status
router.get("/health", adminAuth, async (req, res) => {
  try {
    const connected = blockchainService.contract !== null;
    const contractAvailable = connected && blockchainService.contractAddress !== null;

    // Get last transaction time
    const lastLand = await Land.findOne({
      blockchainTxHash: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .select("createdAt");

    res.json({
      success: true,
      data: {
        connected: connected,
        contractAvailable: contractAvailable,
        lastTransaction: lastLand?.createdAt || null,
        contractAddress: blockchainService.contractAddress,
        networkType: connected ? "Hardhat/Ganache" : "Disconnected",
      },
    });
  } catch (error) {
    console.error("Error checking blockchain health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check blockchain health",
      error: error.message,
    });
    }
});

// Get specific block details
router.get("/block/:number", adminAuth, async (req, res) => {
    try {
        const blockNumber = parseInt(req.params.number);
        const block = await blockchainService.provider.getBlock(blockNumber, true);
        
        if (!block) {
            return res.status(404).json({
                success: false,
                message: "Block not found"
            });
        }

        res.json({
            success: true,
            data: block
        });
    } catch (error) {
        console.error("Error fetching block:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch block details",
            error: error.message
        });
    }
});

// Get specific transaction details
router.get("/transaction/:hash", adminAuth, async (req, res) => {
    try {
        const hash = req.params.hash;
        const tx = await blockchainService.provider.getTransaction(hash);
        const receipt = await blockchainService.provider.getTransactionReceipt(hash);
        
        if (!tx) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        res.json({
            success: true,
            data: {
                ...tx,
                receipt
            }
        });
    } catch (error) {
        console.error("Error fetching transaction:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transaction details",
            error: error.message
        });
    }
});

// Verify land ownership by Asset ID (compare blockchain vs database)
router.get("/verify/:assetId", adminAuth, async (req, res) => {
  try {
    const { assetId } = req.params;
    
    // Find land in database by Asset ID
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName email walletAddress');
    
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found with this Asset ID'
      });
    }
    
    // Check if land is on blockchain
    if (!land.blockchainId) {
      return res.json({
        success: true,
        onBlockchain: false,
        message: 'Land is not registered on blockchain yet',
        databaseOwner: {
          name: land.currentOwner?.fullName || 'Unknown',
          email: land.currentOwner?.email || 'N/A',
          walletAddress: land.currentOwner?.walletAddress || 'N/A'
        }
      });
    }
    
    // Get property data from blockchain
    const blockchainService = require('../config/blockchain');
    const propertyData = await blockchainService.contract.getProperty(land.blockchainId);
    
    console.log('[Verification] Property data from blockchain:', propertyData);
    console.log('[Verification] Property data keys:', Object.keys(propertyData));
    
    // The smart contract returns both array indices and named properties
    // Use the named property 'owner' which is at index [2]
    const blockchainOwner = propertyData.owner; // This is the wallet address
    const databaseOwner = land.currentOwner?.walletAddress || '';
    
    if (!blockchainOwner) {
      return res.status(500).json({
        success: false,
        message: 'Could not retrieve owner from blockchain. Property data structure may have changed.',
        debug: {
          propertyData: JSON.stringify(propertyData),
          blockchainId: land.blockchainId
        }
      });
    }
    
    // Compare blockchain vs database
    const isMatch = blockchainOwner.toLowerCase() === databaseOwner.toLowerCase();
    
    res.json({
      success: true,
      onBlockchain: true,
      isMatch,
      verification: isMatch ? 'VERIFIED' : 'TAMPERED',
      land: {
        assetId: land.assetId,
        surveyNumber: land.surveyNumber,
        village: land.village,
        district: land.district,
        blockchainId: land.blockchainId
      },
      blockchainOwner: {
        address: blockchainOwner,
        isVerified: propertyData.isVerified || false
      },
      databaseOwner: {
        name: land.currentOwner?.fullName || 'Unknown',
        email: land.currentOwner?.email || 'N/A',
        walletAddress: databaseOwner
      }
    });
    
  } catch (error) {
    console.error("Error verifying land ownership:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify land ownership",
      error: error.message,
    });
  }
});

module.exports = router;
