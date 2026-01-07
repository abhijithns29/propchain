const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain');

const Land = require('./server/models/Land');

async function finalVerification() {
  try {
    const assetId = 'D1FF9DB8-F2F4-4FF6-94D4-9A94F78F4938';
    
    console.log('\n=== FINAL VERIFICATION ===\n');
    
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName walletAddress email');
    
    if (!land) {
      console.log('❌ Land not found');
      process.exit(1);
    }
    
    const expectedWallet = '0x49a4c90032df53da6e488a6f903aee9397e215a6';
    const actualWallet = (land.currentOwner?.walletAddress || '').toLowerCase();
    
    console.log('📄 Asset ID:', land.assetId);
    console.log('👤 Owner:', land.currentOwner?.fullName);
    console.log('💼 Wallet:', land.currentOwner?.walletAddress);
    console.log('\n🔍 Verification:');
    console.log('   Expected:', expectedWallet);
    console.log('   Actual:', actualWallet);
    console.log('   Match:', actualWallet === expectedWallet ? '✅ YES' : '❌ NO');
    
    if (actualWallet === expectedWallet) {
      console.log('\n🎉 SUCCESS! The fix is complete!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Refresh the Blockchain Dashboard page');
      console.log('   2. Search for Asset ID:', assetId);
      console.log('   3. Click "Verify on Blockchain"');
      console.log('   4. You should now see ✅ VERIFIED');
    } else {
      console.log('\n❌ Wallets still don\'t match!');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

finalVerification();
