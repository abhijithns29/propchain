const mongoose = require('mongoose');
const { ethers } = require('ethers');
require('dotenv').config({ path: 'server/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Land = require('../../server/models/Land');
const User = require('../../server/models/User');

async function debugOwnership() {
  try {
    const assetId = 'D1BD8D9F-F91F-45D2-831D-A3FE86BD8958'; // From your screenshot
    
    console.log('\n=== DEBUGGING LAND OWNERSHIP ===\n');
    console.log(`Asset ID: ${assetId}\n`);
    
    // 1. Find land in database
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName email walletAddress')
      .populate('owner', 'fullName email walletAddress');
    
    if (!land) {
      console.error('❌ Land not found in database!');
      process.exit(1);
    }
    
    console.log('📄 DATABASE INFORMATION:');
    console.log('------------------------');
    console.log(`Survey Number: ${land.surveyNumber}`);
    console.log(`Location: ${land.village}, ${land.district}`);
    console.log(`Blockchain ID: ${land.blockchainId || 'Not registered'}`);
    console.log(`Blockchain TX Hash: ${land.blockchainTxHash || 'Not registered'}`);
    console.log(`\nCurrent Owner (DB):`);
    console.log(`  Name: ${land.currentOwner?.fullName || 'None'}`);
    console.log(`  Email: ${land.currentOwner?.email || 'None'}`);
    console.log(`  Wallet: ${land.currentOwner?.walletAddress || 'None'}`);
    
    if (land.owner && land.owner._id.toString() !== land.currentOwner?._id.toString()) {
      console.log(`\nOriginal Owner (DB):`);
      console.log(`  Name: ${land.owner?.fullName || 'None'}`);
      console.log(`  Email: ${land.owner?.email || 'None'}`);
      console.log(`  Wallet: ${land.owner?.walletAddress || 'None'}`);
    }
    
    // 2. Check blockchain if registered
    if (land.blockchainId) {
      console.log('\n⛓️  BLOCKCHAIN INFORMATION:');
      console.log('------------------------');
      
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.RPC_URL || 'http://127.0.0.1:7545'
      );
      
      const abi = [
        "function getProperty(uint256 _propertyId) view returns (tuple(uint256 id, string ipfsHash, address owner, string location, uint256 size, uint256 valuation, uint8 status, uint256 registrationDate, bool isVerified))"
      ];
      
      const contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        abi,
        provider
      );
      
      const propertyData = await contract.getProperty(land.blockchainId);
      
      
      console.log(`Property ID: ${propertyData.id.toString()}`);
      console.log(`IPFS Hash: ${propertyData.ipfsHash}`);
      console.log(`Owner Address: ${propertyData.owner}`);
      console.log(`Location: ${propertyData.location}`);
      console.log(`Size: ${propertyData.size.toString()}`);
      console.log(`Is Verified: ${propertyData.isVerified}`);
      console.log(`Registration Date: ${new Date(propertyData.registrationDate.toNumber() * 1000).toLocaleString()}`);
      
      // 3. Compare
      console.log('\n🔍 COMPARISON:');
      console.log('------------------------');
      const dbWallet = land.currentOwner?.walletAddress?.toLowerCase() || '';
      const blockchainWallet = propertyData.owner.toLowerCase();
      
      console.log(`Database Wallet:    ${dbWallet}`);
      console.log(`Blockchain Wallet:  ${blockchainWallet}`);
      console.log(`Match: ${dbWallet === blockchainWallet ? '✅ YES' : '❌ NO'}`);
      
      if (dbWallet !== blockchainWallet) {
        console.log('\n⚠️  MISMATCH DETECTED!');
        console.log('------------------------');
        
        // Try to find who owns the blockchain wallet
        const blockchainOwner = await User.findOne({ 
          walletAddress: new RegExp(`^${blockchainWallet}$`, 'i') 
        });
        
        if (blockchainOwner) {
          console.log(`\n🔎 Blockchain wallet belongs to:`);
          console.log(`  Name: ${blockchainOwner.fullName}`);
          console.log(`  Email: ${blockchainOwner.email}`);
          console.log(`  User ID: ${blockchainOwner._id}`);
        } else {
          console.log(`\n❓ Blockchain wallet ${blockchainWallet} not found in database`);
        }
        
        console.log('\n💡 POSSIBLE CAUSES:');
        console.log('1. Land was added with wrong user ID (currentOwner)');
        console.log('2. User changed their wallet address after land was digitalized');
        console.log('3. Land was manually registered on blockchain with different wallet');
        
        console.log('\n🔧 RECOMMENDED FIX:');
        console.log('Option 1: Update database currentOwner to match blockchain owner');
        console.log('Option 2: Re-digitalize the land with correct owner');
        console.log('Option 3: Transfer ownership on blockchain to match database');
      } else {
        console.log('\n✅ Everything matches! No issues found.');
      }
    } else {
      console.log('\n⚠️  Land is not registered on blockchain yet');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

debugOwnership();
