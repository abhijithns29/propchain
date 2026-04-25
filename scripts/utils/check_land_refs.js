const mongoose = require('mongoose');
require('../../server/models/Land');
require('../../server/models/User');
require('../../server/models/LandTransaction');

const Land = mongoose.model('Land');
const LandTransaction = mongoose.model('LandTransaction');

const check = async () => {
    try {
        await mongoose.connect('mongodb://localhost/landregistry');
        console.log('✅ Connected to DB');
        
        const txs = await LandTransaction.find();
        console.log(`Found ${txs.length} transactions`);
        
        for (const t of txs) {
            console.log(`Checking TX: ${t.transactionId}`);
            
            // Populate land
            const populated = await LandTransaction.findById(t._id).populate('landId');
            
            if (!populated.landId) {
                console.log(`❌ ORPHANED: Land ID ${t.landId} not found in Lands collection`);
                continue;
            }
            
            console.log(`   - Land found: ${populated.landId.assetId} (${populated.landId._id})`);
            console.log(`   - Blockchain ID: ${populated.landId.blockchainId}`);
            
            if (!populated.landId.blockchainId) {
                console.log(`   ⚠️ NO BLOCKCHAIN ID: Land exists but is not digitalized/registered on chain.`);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

check();
