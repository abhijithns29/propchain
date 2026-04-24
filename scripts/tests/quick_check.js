const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain');

const Land = require('./server/models/Land');
const User = require('./server/models/User');

async function quickCheck() {
  try {
    const assetId = 'D1BD8D9F-F91F-45D2-831D-A3FE86BD8958';
    
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName walletAddress');
    
    if (!land) {
      console.log('Land not found');
      process.exit(1);
    }
    
    console.log('\n=== QUICK CHECK ===\n');
    console.log('Asset ID:', land.assetId);
    console.log('Survey Number:', land.surveyNumber);
    console.log('Blockchain ID:', land.blockchainId);
    console.log('\nCurrent Owner in Database:');
    console.log('  Name:', land.currentOwner?.fullName || 'None');
    console.log('  Wallet:', land.currentOwner?.walletAddress || 'None');
    console.log('  User ID:', land.currentOwner?._id || 'None');
    
    // Find the user with wallet 0x49a4c90832dFF5d86e4B8a6f98aEF0397e215a6
    const blockchainWallet = '0x49a4c90832dFF5d86e4B8a6f98aEF0397e215a6';
    const userWithBlockchainWallet = await User.findOne({ 
      walletAddress: new RegExp(`^${blockchainWallet}$`, 'i') 
    });
    
    console.log('\n\nUser with blockchain wallet:', blockchainWallet);
    if (userWithBlockchainWallet) {
      console.log('  Name:', userWithBlockchainWallet.fullName);
      console.log('  Email:', userWithBlockchainWallet.email);
      console.log('  User ID:', userWithBlockchainWallet._id);
      console.log('\n❌ PROBLEM: Land was digitalized with this user\'s wallet, but currentOwner points to a different user!');
      console.log('\n💡 SOLUTION: Update land.currentOwner to:', userWithBlockchainWallet._id);
    } else {
      console.log('  Not found in database');
      console.log('\n❌ PROBLEM: The wallet address on blockchain doesn\'t belong to any user in the database!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

quickCheck();
