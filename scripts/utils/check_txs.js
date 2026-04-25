const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });
const LandTransaction = require('../../server/models/LandTransaction');
const User = require('../../server/models/User');
const Land = require('../../server/models/Land');

async function checkTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const txs = await LandTransaction.find({});
    
    console.log(`Found ${txs.length} total transactions:`);
    txs.forEach(tx => {
        console.log(`- ID: ${tx._id}`);
        console.log(`  Type: ${tx.transactionType}`);
        console.log(`  Status: ${tx.status}`);
        console.log(`  Blockchain Hash: ${tx.blockchainTxHash || "None"}`);
        console.log(`  Blockchain Block: ${tx.blockchainBlock || "None"}`);
    });
    console.log('---');

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkTransactions();
