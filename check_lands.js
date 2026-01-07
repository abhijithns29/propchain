const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });
const Land = require('./server/models/Land');

async function checkLands() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const lands = await Land.find({});
    console.log(`Found ${lands.length} lands:`);
    lands.forEach(l => {
        console.log(`- Asset ID: ${l.assetId}`);
        console.log(`  Blockchain ID: ${l.blockchainId}`);
        console.log(`  Blockchain Hash: ${l.blockchainTxHash}`);
        console.log(`  Blockchain Block: ${l.blockchainBlock}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkLands();
