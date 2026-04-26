const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
if (fs.existsSync(path.resolve(__dirname, '../../.env.local'))) {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local'), override: true });
}

const seedAdminUsers = require('../seed-admin');

async function resetDB() {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/landregistry";
        console.log('🔄 Connecting to MongoDB to reset...');
        await mongoose.connect(mongoURI);
        
        console.log('🗑️  Dropping database: ' + mongoose.connection.db.databaseName);
        await mongoose.connection.db.dropDatabase();
        console.log('✅ Database dropped successfully');
        
        console.log('🌱 Reseeding admin users...');
        await seedAdminUsers();
        
        console.log('\n✨ Database reset and reseeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
}

resetDB();
