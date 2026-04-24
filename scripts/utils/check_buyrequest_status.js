const mongoose = require('mongoose');
require('./server/models/BuyRequest');

const BuyRequest = mongoose.model('BuyRequest');

async function checkStatuses() {
    try {
        await mongoose.connect('mongodb://localhost/landregistry');
        console.log('✅ Connected to DB\n');
        
        const reqs = await BuyRequest.find().sort({createdAt: -1}).limit(5);
        
        console.log(`Recent BuyRequests (${reqs.length} total):\n`);
        
        reqs.forEach((r, i) => {
            console.log(`${i + 1}. ID: ${r._id}`);
            console.log(`   Status: ${r.status}`);
            console.log(`   Created: ${r.createdAt}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkStatuses();
