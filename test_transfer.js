require('dotenv').config({ path: './server/.env' });
const blockchainService = require('./server/config/blockchain');

async function testTransfer() {
    try {
        await blockchainService.initialize();
        
        console.log('\n=== Testing Blockchain Transfer ===\n');
        
        // Test with a known property ID (you mentioned ID 3 and 4 exist)
        const propertyId = 4;
        const fromAddress = "0x1eb21e6d5e02e52ed933ad42480c63b7c05f795c"; // Your wallet
        const toAddress = "0x659e77ff4e0a57974095d12c02ed198e12171646"; // Other wallet
        const amount = 1000;
        
        console.log('Transfer Parameters:');
        console.log(`  Property ID: ${propertyId}`);
        console.log(`  From: ${fromAddress}`);
        console.log(`  To: ${toAddress}`);
        console.log(`  Amount: ${amount}`);
        console.log('');
        
        const result = await blockchainService.transferLandOwnership(
            propertyId,
            fromAddress,
            toAddress,
            amount
        );
        
        console.log('\n✅ Transfer Result:', result);
        
    } catch (error) {
        console.error('\n❌ Transfer Failed:', error);
        console.error('Error details:', error.message);
        if (error.reason) console.error('Reason:', error.reason);
        if (error.code) console.error('Code:', error.code);
    }
}

testTransfer();
