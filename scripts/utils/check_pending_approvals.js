require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
require('./server/models/BuyRequest');
require('./server/models/Land');
require('./server/models/User');

const BuyRequest = mongoose.model('BuyRequest');

async function testAdminApproval() {
    try {
        await mongoose.connect('mongodb://localhost/landregistry');
        console.log('✅ Connected to DB');
        
        // Find a pending buy request
        const pendingRequests = await BuyRequest.find({ 
            status: 'PENDING_ADMIN_APPROVAL' 
        }).populate('landId seller buyer');
        
        console.log(`\nFound ${pendingRequests.length} pending admin approval requests:`);
        
        if (pendingRequests.length === 0) {
            console.log('No pending requests to approve. Create one first by:');
            console.log('1. Buyer makes offer');
            console.log('2. Seller confirms with 2FA');
            process.exit(0);
        }
        
        for (const req of pendingRequests) {
            console.log(`\nBuyRequest ID: ${req._id}`);
            console.log(`  Land: ${req.landId?.assetId || 'N/A'}`);
            console.log(`  Seller: ${req.seller?.email || 'N/A'}`);
            console.log(`  Buyer: ${req.buyer?.email || 'N/A'}`);
            console.log(`  Price: ₹${req.agreedPrice}`);
            console.log(`  Status: ${req.status}`);
        }
        
        console.log('\n📝 To approve via API, call:');
        console.log(`POST http://localhost:5000/api/buy-requests/${pendingRequests[0]._id}/admin-review`);
        console.log('Headers: { Authorization: "Bearer <ADMIN_TOKEN>" }');
        console.log('Body: { "action": "approve", "comments": "Approved by admin" }');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

testAdminApproval();
