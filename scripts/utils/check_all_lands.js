const mongoose = require('mongoose');
const { ethers } = require('ethers');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/propchain');

const Land = require('./server/models/Land');
const User = require('./server/models/User');

async function checkAllLands() {
  try {
    console.log('\n=== CHECKING ALL DIGITALIZED LANDS ===\n');
    
    // Find all lands that are digitalized and on blockchain
    const lands = await Land.find({
      'digitalDocument.isDigitalized': true,
      blockchainId: { $exists: true, $ne: null }
    })
    .populate('currentOwner', 'fullName walletAddress email')
    .limit(20);
    
    console.log(`Found ${lands.length} digitalized lands on blockchain\n`);
    
    if (lands.length === 0) {
      console.log('No digitalized lands found.');
      process.exit(0);
    }
    
    // Setup blockchain connection
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
    
    let matchCount = 0;
    let mismatchCount = 0;
    const mismatches = [];
    
    for (const land of lands) {
      try {
        const propertyData = await contract.getProperty(land.blockchainId);
        const dbWallet = (land.currentOwner?.walletAddress || '').toLowerCase();
        const bcWallet = propertyData.owner.toLowerCase();
        
        const isMatch = dbWallet === bcWallet;
        
        if (isMatch) {
          matchCount++;
          console.log(`✅ ${land.assetId} - VERIFIED`);
        } else {
          mismatchCount++;
          console.log(`❌ ${land.assetId} - TAMPERED`);
          console.log(`   DB: ${dbWallet}`);
          console.log(`   BC: ${bcWallet}`);
          mismatches.push({
            assetId: land.assetId,
            owner: land.currentOwner?.fullName,
            dbWallet,
            bcWallet
          });
        }
      } catch (error) {
        console.log(`⚠️  ${land.assetId} - Error: ${error.message}`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total lands checked: ${lands.length}`);
    console.log(`✅ Verified (matching): ${matchCount}`);
    console.log(`❌ Tampered (mismatched): ${mismatchCount}`);
    
    if (mismatches.length > 0) {
      console.log('\n⚠️  MISMATCHED LANDS:');
      mismatches.forEach(m => {
        console.log(`\n  Asset ID: ${m.assetId}`);
        console.log(`  Owner: ${m.owner}`);
        console.log(`  DB Wallet: ${m.dbWallet}`);
        console.log(`  BC Wallet: ${m.bcWallet}`);
      });
      
      console.log('\n💡 RECOMMENDATION:');
      console.log('These lands were digitalized with the old code that used admin wallet.');
      console.log('Options to fix:');
      console.log('1. Un-digitalize and re-digitalize each land (recommended)');
      console.log('2. Update user wallet addresses to match blockchain');
      console.log('3. Transfer ownership on blockchain (complex)');
    } else {
      console.log('\n🎉 All lands are properly verified!');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkAllLands();
