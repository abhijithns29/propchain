const mongoose = require('mongoose');
const { ethers } = require('ethers');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain');

const Land = require('./server/models/Land');
const User = require('./server/models/User');

async function checkActualBlockchainOwner() {
  try {
    const assetId = 'D1FF9DB8-F2F4-4FF6-94D4-9A94F78F4938'; // From new screenshot
    
    console.log('\n=== CHECKING ACTUAL BLOCKCHAIN OWNER ===\n');
    
    // Find land in database
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName walletAddress email');
    
    if (!land) {
      console.log('❌ Land not found');
      process.exit(1);
    }
    
    console.log('📄 Land:', land.assetId);
    console.log('🔗 Blockchain ID:', land.blockchainId);
    console.log('\n👤 Database Owner:');
    console.log('   Name:', land.currentOwner?.fullName);
    console.log('   Wallet:', land.currentOwner?.walletAddress);
    
    // Get actual blockchain owner
    if (land.blockchainId) {
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
      
      console.log('\n⛓️  Blockchain Owner:');
      console.log('   Wallet:', propertyData.owner);
      
      console.log('\n🔍 COMPARISON:');
      const dbWallet = (land.currentOwner?.walletAddress || '').toLowerCase();
      const bcWallet = propertyData.owner.toLowerCase();
      
      console.log('   Database:', dbWallet);
      console.log('   Blockchain:', bcWallet);
      console.log('   Match:', dbWallet === bcWallet ? '✅ YES' : '❌ NO');
      
      if (dbWallet !== bcWallet) {
        console.log('\n🔧 CORRECT WALLET TO USE:', propertyData.owner);
        
        // Check if this wallet exists in database
        const userWithWallet = await User.findOne({ 
          walletAddress: new RegExp(`^${propertyData.owner}$`, 'i') 
        });
        
        if (userWithWallet) {
          console.log('\n✅ User found with this wallet:');
          console.log('   Name:', userWithWallet.fullName);
          console.log('   Email:', userWithWallet.email);
        } else {
          console.log('\n⚠️  No user found with this wallet');
          console.log('   Need to update user:', land.currentOwner?.fullName);
          console.log('   New wallet:', propertyData.owner);
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkActualBlockchainOwner();
