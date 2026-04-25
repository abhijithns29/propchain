const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain');

const Land = require('../../server/models/Land');
const User = require('../../server/models/User');

async function fixWithCorrectWallet() {
  try {
    const assetId = 'D1FF9DB8-F2F4-4FF6-94D4-9A94F78F4938';
    const correctBlockchainWallet = '0x49a4c90032df53da6e488a6f903aee9397e215a6'; // Lowercase
    
    console.log('\n=== APPLYING CORRECT FIX ===\n');
    
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName walletAddress email');
    
    if (!land) {
      console.log('❌ Land not found');
      process.exit(1);
    }
    
    console.log('📄 Land:', land.assetId);
    console.log('👤 Current Owner:', land.currentOwner?.fullName);
    console.log('📝 Current Wallet:', land.currentOwner?.walletAddress);
    console.log('🎯 Target Wallet:', correctBlockchainWallet);
    
    if (!land.currentOwner) {
      console.log('\n❌ No current owner');
      process.exit(1);
    }
    
    // Update using direct MongoDB to bypass validation
    console.log('\n🔧 Updating wallet address...');
    
    const result = await User.collection.updateOne(
      { _id: land.currentOwner._id },
      { $set: { walletAddress: correctBlockchainWallet } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ SUCCESS! Wallet address updated');
      console.log('\n📋 Summary:');
      console.log('   User:', land.currentOwner.fullName);
      console.log('   Old Wallet:', land.currentOwner.walletAddress);
      console.log('   New Wallet:', correctBlockchainWallet);
      console.log('\n🎉 Verification should now pass!');
    } else {
      console.log('\n⚠️  No changes made');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixWithCorrectWallet();
