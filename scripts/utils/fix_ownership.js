const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain');

const Land = require('../../server/models/Land');
const User = require('../../server/models/User');

async function fixOwnership() {
  try {
    const assetId = 'D1BD8D9F-F91F-45D2-831D-A3FE86BD8958';
    const blockchainWallet = '0x49a4c90832dFF5d86e4B8a6f98aEF0397e215a6';
    
    console.log('\n=== FIXING LAND OWNERSHIP ===\n');
    
    // Find the land
    const land = await Land.findOne({ assetId })
      .populate('currentOwner', 'fullName walletAddress');
    
    if (!land) {
      console.log('❌ Land not found');
      process.exit(1);
    }
    
    console.log('Found land:', land.assetId);
    console.log('Current owner:', land.currentOwner?.fullName);
    console.log('Current owner wallet:', land.currentOwner?.walletAddress);
    
    // Find user with the blockchain wallet
    const correctOwner = await User.findOne({ 
      walletAddress: new RegExp(`^${blockchainWallet}$`, 'i') 
    });
    
    if (!correctOwner) {
      console.log('\n❌ No user found with blockchain wallet:', blockchainWallet);
      console.log('\n📋 MANUAL STEPS REQUIRED:');
      console.log('1. Check which user should own this land');
      console.log('2. Either:');
      console.log('   a) Update that user\'s wallet address to:', blockchainWallet);
      console.log('   b) Create a new user with this wallet address');
      console.log('   c) Un-digitalize and re-digitalize the land with correct owner');
      process.exit(1);
    }
    
    console.log('\n✅ Found user with blockchain wallet:');
    console.log('  Name:', correctOwner.fullName);
    console.log('  Email:', correctOwner.email);
    console.log('  User ID:', correctOwner._id);
    
    // Check if this is already the current owner
    if (land.currentOwner && land.currentOwner._id.toString() === correctOwner._id.toString()) {
      console.log('\n✅ Land already has correct owner! No changes needed.');
      console.log('The verification should work now.');
      process.exit(0);
    }
    
    // Ask for confirmation
    console.log('\n⚠️  PROPOSED CHANGE:');
    console.log('Update land currentOwner from:');
    console.log('  OLD:', land.currentOwner?.fullName, '(', land.currentOwner?._id, ')');
    console.log('  NEW:', correctOwner.fullName, '(', correctOwner._id, ')');
    console.log('\nThis will make the database match the blockchain.');
    console.log('\n💡 To apply this fix, uncomment the code below and run again.');
    
    // UNCOMMENT THE FOLLOWING LINES TO APPLY THE FIX:
    /*
    land.currentOwner = correctOwner._id;
    await land.save();
    
    // Add to user's owned lands if not already there
    if (!correctOwner.ownedLands.includes(land._id)) {
      correctOwner.ownedLands.push(land._id);
      await correctOwner.save();
    }
    
    // Remove from old owner's lands if exists
    if (land.currentOwner) {
      await User.updateOne(
        { _id: land.currentOwner },
        { $pull: { ownedLands: land._id } }
      );
    }
    
    console.log('\n✅ FIXED! Land ownership updated successfully.');
    console.log('The verification should now pass.');
    */
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixOwnership();
