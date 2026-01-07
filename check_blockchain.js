const { ethers } = require('ethers');
require('dotenv').config({ path: 'server/.env' });

const abi = [
  "function propertyCounter() view returns (uint256)",
  "function transactionCounter() view returns (uint256)",
  "function owner() view returns (address)"
];

async function checkBlockchain() {
  try {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:7545";
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);

    const [propCount, txCount, owner] = await Promise.all([
      contract.propertyCounter(),
      contract.transactionCounter(),
      contract.owner()
    ]);

    const blockNumber = await provider.getBlockNumber();

    console.log(`Current Block: ${blockNumber}`);
    console.log(`Contract Address: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`Property Counter: ${propCount.toString()}`);
    console.log(`Transaction Counter: ${txCount.toString()}`);
    console.log(`Contract Owner: ${owner}`);

  } catch (err) {
    console.error(err);
  }
}

checkBlockchain();
