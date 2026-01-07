const { ethers } = require('ethers');
require('dotenv').config({ path: 'server/.env' });

async function inspectBlocks() {
  try {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:7545";
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    const latest = await provider.getBlockNumber();
    console.log(`Latest Block: ${latest}`);
    
    for (let i = Math.max(0, latest - 5); i <= latest; i++) {
        const block = await provider.getBlockWithTransactions(i);
        console.log(`Block #${i}: ${block.transactions.length} transactions`);
        block.transactions.forEach(tx => {
            console.log(`  - Hash: ${tx.hash}`);
            console.log(`    From: ${tx.from}`);
            console.log(`    To: ${tx.to}`);
            // console.log(`    Input: ${tx.data.slice(0, 50)}...`);
        });
    }

  } catch (err) {
    console.error(err);
  }
}

inspectBlocks();
