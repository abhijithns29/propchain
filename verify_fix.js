const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain');

const Land = require('./server/models/Land');
const User = require('./server/models/User');

async function verifyFix() {
  try {
    const assetId = 'D1BD8D9F-F91F-45D2-831D-A3FE86BD8958';
    
    console.log('\n=== VERIFYING FIX ===\n');
    
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName walletAddress email');
    
    if (!land) {
      console.log('❌ Land not found');
      process.exit(1);
    }
    
    console.log('📄 Land:', land.assetId);
    console.log('📍 Location:', land.village + ', ' + land.district);
    console.log('🔗 Blockchain ID:', land.blockchainId);
    console.log('\n👤 Current Owner:');
    console.log('   Name:', land.currentOwner?.fullName);
    console.log('   Wallet:', land.currentOwner?.walletAddress);
    
    const expectedWallet = '0x49a4c90832dff5d86e4b8a6f98aef0397e215a6';
    
    if (land.currentOwner?.walletAddress?.toLowerCase() === expectedWallet.toLowerCase()) {
      console.log('\n✅ FIX VERIFIED!');
      console.log('   Database wallet now matches blockchain wallet');
      console.log('\n🎉 The verification should now show "VERIFIED" instead of "TAMPERED"');
      console.log('\n📝 Next Steps:');
      console.log('   1. Go to Admin Panel → Blockchain Dashboard');
      console.log('   2. Enter Asset ID:', assetId);
      console.log('   3. Click "Verify on Blockchain"');
      console.log('   4. You should see ✅ VERIFIED');
    } else {
      console.log('\n❌ FIX NOT APPLIED');
      console.log('   Expected wallet:', expectedWallet);
      console.log('   Current wallet:', land.currentOwner?.walletAddress);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

verifyFix();
