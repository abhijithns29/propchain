const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load environment
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
if (fs.existsSync(path.resolve(__dirname, '../../.env.local'))) {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local'), override: true });
}

// Import models
const User = require('../../server/models/User');
const DigitizedLand = require('../../server/models/DigitizedLand');
const blockchainService = require('../../server/config/blockchain');

const testUsers = [
    {
        fullName: "Giga Byte",
        email: "gigabytgg@gmail.com",
        password: "12345678",
        walletAddress: "0x1eb21e6d5e02e52ed933ad42480c63b7c05f795c", // Real Ganache account 1
        role: "USER",
        verificationStatus: "VERIFIED",
        emailVerified: true
    },
    {
        fullName: "VPN User",
        email: "vpn8461@gmail.com",
        password: "12345678",
        walletAddress: "0x659e77ff4e0a57974095d12c02ed198e12171646", // Real Ganache account 2
        role: "USER",
        verificationStatus: "VERIFIED",
        emailVerified: true
    }
];

const locations = [
    { village: "Hosur", taluka: "Hosur", district: "Krishnagiri", state: "Tamil Nadu", pincode: "635109" },
    { village: "Whitefield", taluka: "Bangalore East", district: "Bangalore", state: "Karnataka", pincode: "560066" },
    { village: "Arakere", taluka: "Bangalore South", district: "Bangalore", state: "Karnataka", pincode: "560076" },
    { village: "Devanahalli", taluka: "Devanahalli", district: "Bangalore Rural", state: "Karnataka", pincode: "562110" },
    { village: "Marathahalli", taluka: "Bangalore East", district: "Bangalore", state: "Karnataka", pincode: "560037" },
    { village: "Electronics City", taluka: "Anekal", district: "Bangalore South", state: "Karnataka", pincode: "560100" },
    { village: "Hebbal", taluka: "Bangalore North", district: "Bangalore", state: "Karnataka", pincode: "560024" },
    { village: "Koramangala", taluka: "Bangalore South", district: "Bangalore", state: "Karnataka", pincode: "560034" },
    { village: "Indiranagar", taluka: "Bangalore East", district: "Bangalore", state: "Karnataka", pincode: "560038" },
    { village: "Jayanagar", taluka: "Bangalore South", district: "Bangalore", state: "Karnataka", pincode: "560041" }
];

async function createDummyFile(name) {
    const uploadsDir = path.join(__dirname, '../../server/uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filePath = path.join(uploadsDir, name);
    fs.writeFileSync(filePath, Buffer.from("Placeholder for Land Registry Document: " + name));
    return name;
}

async function seedTestData() {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/landregistry";
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        await blockchainService.initialize();
        console.log('✅ Blockchain service initialized');

        // 1. Create Users
        console.log('👤 Creating users...');
        const userObjects = [];
        for (const u of testUsers) {
            let user = await User.findOne({ email: u.email });
            if (!user) {
                user = new User(u);
                await user.save();
                console.log(`   - Created user: ${u.email}`);
            } else {
                console.log(`   - User already exists: ${u.email}`);
            }
            userObjects.push(user);
        }

        const admin = await User.findOne({ role: 'ADMIN' });
        if (!admin) throw new Error("Admin account not found. Run npm run db:seed first.");

        // 2. Create Lands
        console.log('🏞️  Creating lands...');
        for (let i = 0; i < 10; i++) {
            const loc = locations[i];
            const owner = userObjects[i % 2];
            const surveyNum = `${100 + i}/${Math.floor(Math.random() * 10) + 1}`;
            const acres = Math.floor(Math.random() * 5) + 1;
            const guntas = Math.floor(Math.random() * 40);
            
            // Create dummy document
            const docName = `DOC_${crypto.randomBytes(4).toString('hex')}.pdf`;
            await createDummyFile(docName);

            const landData = {
                landDetails: {
                    surveyNumber: surveyNum,
                    village: loc.village,
                    taluka: loc.taluka,
                    district: loc.district,
                    state: loc.state,
                    pincode: loc.pincode,
                    area: { acres, guntas, sqft: (acres * 43560) + (guntas * 1089) },
                    landType: 'RESIDENTIAL',
                    classification: 'SARKAR',
                    roadAccess: true
                },
                currentOwner: owner._id,
                status: (i % 3 === 0) ? 'FOR_SALE' : 'AVAILABLE',
                verificationStatus: 'VERIFIED',
                verifiedBy: admin._id,
                verificationDate: new Date(),
                addedBy: admin._id,
                digitalDocument: {
                    isDigitalized: true,
                    digitalizedBy: admin._id,
                    generatedDate: new Date(),
                    certificateUrl: `/uploads/${docName}`,
                    ipfsHash: crypto.randomBytes(32).toString('hex')
                },
                marketInfo: {
                    isForSale: (i % 3 === 0),
                    askingPrice: (i % 3 === 0) ? (500000 + (i * 100000)) : undefined,
                    description: `Beautiful land in ${loc.village} with great accessibility.`,
                    features: ["Gated Community", "Water Connection"],
                    nearbyAmenities: ["Hospital", "School", "Main Road"],
                    images: ["https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&q=80&w=800"]
                },
                valuation: {
                    marketValue: 1000000 + (i * 50000),
                    governmentValue: 600000 + (i * 30000),
                    lastValuationDate: new Date()
                }
            };

            // Register on Blockchain
            console.log(`   - Registering land ${i+1}/10 on blockchain...`);
            const blockchainResult = await blockchainService.registerLand(
                `LAND${i}`, 
                owner.walletAddress, 
                surveyNum, 
                landData.landDetails.area
            );

            if (blockchainResult) {
                landData.blockchainTxHash = blockchainResult.transactionHash;
                landData.blockchainId = blockchainResult.propertyId;
            }

            const land = new DigitizedLand(landData);
            await land.save();

            // Link land to user
            owner.ownedLands.push(land._id);
            await owner.save();

            console.log(`   ✅ Land ${i+1} saved: ${land.landId} owned by ${owner.email}`);
        }

        console.log('\n✨ Test data seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding test data:', error);
        process.exit(1);
    }
}

seedTestData();
