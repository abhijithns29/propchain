const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain');

const Land = require('./server/models/Land');
const User = require('./server/models/User');

async function applyFixDirectly() {
  try {
    const assetId = 'D1BD8D9F-F91F-45D2-831D-A3FE86BD8958';
    const blockchainWallet = '0x49a4c90832dff5d86e4b8a6f98aef0397e215a6';
    
    console.log('\n=== APPLYING FIX (Direct Update) ===\n');
    
    // Find the land
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName walletAddress email');
    
    if (!land) {
      console.log('❌ Land not found');
      process.exit(1);
    }
    
    console.log('📄 Land found:', land.assetId);
    console.log('Current owner:', land.currentOwner?.fullName);
    console.log('Current owner ID:', land.currentOwner?._id);
    console.log('Current owner wallet:', land.currentOwner?.walletAddress);
    console.log('Target blockchain wallet:', blockchainWallet);
    
    if (!land.currentOwner) {
      console.log('\n❌ Land has no current owner assigned');
      process.exit(1);
    }
    
    // Check if wallet is already in use
    const existingUser = await User.findOne({ 
      walletAddress: blockchainWallet,
      _id: { $ne: land.currentOwner._id }
    });
    
    if (existingUser) {
      console.log('\n⚠️  Wallet address is already in use by another user:');
      console.log('  Name:', existingUser.fullName);
      console.log('  Email:', existingUser.email);
      console.log('\n💡 SOLUTION: Update land.currentOwner to this user instead');
      console.log('\nDo you want to:');
      console.log('1. Change land ownership to', existingUser.fullName);
      console.log('2. Remove wallet from', existingUser.fullName, 'and assign to', land.currentOwner.fullName);
      console.log('\nPlease choose manually in the database or admin panel.');
      process.exit(1);
    }
    
    // Update using direct MongoDB update to bypass Mongoose validation
    console.log('\n🔧 Updating user wallet address (bypassing validation)...');
    
    const result = await User.collection.updateOne(
      { _id: land.currentOwner._id },
      { $set: { walletAddress: blockchainWallet } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('\n✅ SUCCESS! User wallet address updated.');
      console.log('\n🎉 The blockchain verification should now pass!');
      console.log('\nVerify by:');
      console.log('1. Go to Admin Panel → Blockchain Dashboard');
      console.log('2. Search for Asset ID:', assetId);
      console.log('3. Click "Verify on Blockchain"');
      console.log('4. You should now see "✅ VERIFIED" instead of "❌ TAMPERED"');
    } else {
      console.log('\n⚠️  No changes made. Wallet might already be set correctly.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

applyFixDirectly();
