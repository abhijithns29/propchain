const ethers = require('ethers');
require('dotenv').config({ path: './server/.env' });
const fs = require('fs');
const path = require('path');

async function checkAdmin() {
    try {
        const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:7545";
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        console.log(`Checking connection to ${rpcUrl}...`);
        const network = await provider.getNetwork();
        console.log(`Network Name: ${network.name}, ChainId: ${network.chainId}`);

        const privateKey = process.env.ADMIN_PRIVATE_KEY;
        const contractAddress = process.env.CONTRACT_ADDRESS;

        if (!privateKey || !contractAddress) {
            console.error("Missing ADMIN_PRIVATE_KEY or CONTRACT_ADDRESS in .env");
            process.exit(1);
        }

        const wallet = new ethers.Wallet(privateKey, provider);
        console.log(`Server Admin Wallet: ${wallet.address}`);

        // Read ABI
        const artifactPath = path.join(__dirname, 'server', 'config', 'LandRegistry.json');
        let abi;
        
        if (fs.existsSync(artifactPath)) {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            abi = artifact.abi;
        } else {
             // hardcoded minimal ABI
             console.log("Artifact not found, using minimal ABI");
             abi = [
                "function owner() view returns (address)",
                "function admins(address) view returns (bool)"
             ];
        }

        const contract = new ethers.Contract(contractAddress, abi, provider);

        const contractOwner = await contract.owner();
        console.log(`Contract Owner:    ${contractOwner}`);

        const isAdmin = await contract.admins(wallet.address);
        console.log(`Is Server Wallet Admin? ${isAdmin}`);

        if (contractOwner.toLowerCase() !== wallet.address.toLowerCase() && !isAdmin) {
            console.error("❌ CRITICAL: Server wallet is NOT an admin. Transactions will revert.");
        } else {
            console.log("✅ Server wallet has admin permissions.");
        }

    } catch (error) {
        console.error("Error checking permissions:", error);
    }
}

checkAdmin();
