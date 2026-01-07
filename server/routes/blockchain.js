const express = require("express");
const { adminAuth } = require("../middleware/auth");
const blockchainService = require("../config/blockchain");
const Land = require("../models/Land");

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
      blockchainTxHash: { $exists: true, $ne: null },
    });
    const pendingLands = totalLands - landsOnBlockchain;

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
          transactionCounter: contractInfo.transactionCounter,
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

// Get recent blockchain transactions
router.get("/transactions", adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // Get lands with blockchain transactions
    const lands = await Land.find({
      blockchainTxHash: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("currentOwner", "fullName email")
      .select("assetId surveyNumber blockchainTxHash blockchainId blockchainBlock createdAt");

    const transactions = lands.map((land) => ({
      hash: land.blockchainTxHash,
      blockNumber: land.blockchainBlock,
      timestamp: land.createdAt,
      type: "LAND_REGISTRATION",
      landId: land._id,
      assetId: land.assetId,
      surveyNumber: land.surveyNumber,
      owner: land.currentOwner?.fullName || "Unknown",
      propertyId: land.blockchainId,
    }));

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
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

module.exports = router;
