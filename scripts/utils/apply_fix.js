const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain');

const Land = require('../../server/models/Land');
const User = require('../../server/models/User');

async function applyFix() {
  try {
    const assetId = 'D1BD8D9F-F91F-45D2-831D-A3FE86BD8958';
    const blockchainWallet = '0x49a4c90832dff5d86e4b8a6f98aef0397e215a6'; // Lowercase for validation
    
    console.log('\n=== APPLYING FIX ===\n');
    
    // Find the land
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName walletAddress email');
    
    if (!land) {
      console.log('❌ Land not found');
      process.exit(1);
    }
    
    console.log('📄 Land found:', land.assetId);
    console.log('Current owner:', land.currentOwner?.fullName);
    console.log('Current owner wallet:', land.currentOwner?.walletAddress);
    console.log('Blockchain wallet:', blockchainWallet);
    
    if (!land.currentOwner) {
      console.log('\n❌ Land has no current owner assigned');
      process.exit(1);
    }
    
    // Update the user's wallet address
    const user = await User.findById(land.currentOwner._id);
    
    if (!user) {
      console.log('\n❌ User not found');
      process.exit(1);
    }
    
    console.log('\n🔧 Updating user wallet address...');
    console.log('User:', user.fullName);
    console.log('Old wallet:', user.walletAddress);
    console.log('New wallet:', blockchainWallet);
    
    user.walletAddress = blockchainWallet;
    await user.save();
    
    console.log('\n✅ SUCCESS! User wallet address updated.');
    console.log('\n🎉 The blockchain verification should now pass!');
    console.log('\nVerify by:');
    console.log('1. Go to Admin Panel → Blockchain Dashboard');
    console.log('2. Search for Asset ID:', assetId);
    console.log('3. Click "Verify on Blockchain"');
    console.log('4. You should now see "✅ VERIFIED" instead of "❌ TAMPERED"');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

applyFix();
