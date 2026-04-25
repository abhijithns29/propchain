const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
if (require('fs').existsSync(require('path').resolve(__dirname, '../.env.local'))) {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local'), override: true });
}

// User schema (simplified for seeding)
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  walletAddress: String,
  role: { type: String, enum: ['USER', 'ADMIN', 'AUDITOR'], default: 'USER' },
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  isActive: { type: Boolean, default: true },
  ownedLands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DigitizedLand' }]
}, { timestamps: true });

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  if (['ADMIN', 'AUDITOR'].includes(this.role)) {
    this.verificationStatus = 'VERIFIED';
    if (!this.verificationDate) {
      this.verificationDate = new Date();
    }
  }
  
  next();
});

const User = mongoose.model('User', userSchema);

async function seedAdminUsers() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/landregistry";
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check if admin users already exist
    const existingAdmin1 = await User.findOne({ email: 'admin@landregistry.gov' });
    const existingAdmin2 = await User.findOne({ email: 'officer@landregistry.gov' });

    if (existingAdmin1 && existingAdmin2) {
      console.log('ℹ️  Admin users already exist');
      console.log('');
      console.log('🔐 Admin Credentials:');
      console.log('   Email: admin@landregistry.gov');
      console.log('   Password: admin123');
      console.log('   Role: System Administrator');
      console.log('');
      console.log('   Email: officer@landregistry.gov');
      console.log('   Password: admin123');
      console.log('   Role: Land Registry Officer');
      return;
    }

    // Create admin users
    const adminUsers = [
      {
        fullName: "System Administrator",
        email: "admin@landregistry.gov",
        password: "admin123", // Will be hashed by pre-save middleware
        walletAddress: "0x742d35Cc6634C0532925a3b8D4C2C4e4C4e4C4e4",
        role: "ADMIN",
        verificationStatus: "VERIFIED",
        isActive: true,
        ownedLands: [],
        twoFactorEnabled: false
      },
      {
        fullName: "Land Registry Officer",
        email: "officer@landregistry.gov",
        password: "admin123", // Will be hashed by pre-save middleware
        walletAddress: "0x8ba1f109551bD432803012645Hac136c22c177ec",
        role: "ADMIN",
        verificationStatus: "VERIFIED",
        isActive: true,
        ownedLands: [],
        twoFactorEnabled: false
      },
      {
        fullName: "System Auditor",
        email: "auditor@landregistry.gov",
        password: "auditor123",
        walletAddress: "0x9cb2f109551bD432803012645Hac136c22c188fd",
        role: "AUDITOR",
        verificationStatus: "VERIFIED",
        isActive: true,
        ownedLands: [],
        twoFactorEnabled: false
      }
    ];

    // Insert admin users
    if (!existingAdmin1) {
      const admin1 = new User(adminUsers[0]);
      await admin1.save();
      console.log('✅ Created admin user: admin@landregistry.gov');
    }

    if (!existingAdmin2) {
      const admin2 = new User(adminUsers[1]);
      await admin2.save();
      console.log('✅ Created admin user: officer@landregistry.gov');
    }

    // Check and create auditor
    const existingAuditor = await User.findOne({ email: 'auditor@landregistry.gov' });
    if (!existingAuditor) {
      const auditor = new User(adminUsers[2]);
      await auditor.save();
      console.log('✅ Created auditor user: auditor@landregistry.gov');
    }
    console.log('');
    console.log('🎉 System Users Created Successfully!');
    console.log('');
    console.log('🔐 System Credentials:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ Admin Account 1:                                        │');
    console.log('│   Email: admin@landregistry.gov                        │');
    console.log('│   Password: admin123                                    │');
    console.log('│   Role: System Administrator                            │');
    console.log('│   Status: Auto-verified (no verification required)     │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ Admin Account 2:                                        │');
    console.log('│   Email: officer@landregistry.gov                      │');
    console.log('│   Password: admin123                                    │');
    console.log('│   Role: Land Registry Officer                           │');
    console.log('│   Status: Auto-verified (no verification required)     │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ Auditor Account:                                        │');
    console.log('│   Email: auditor@landregistry.gov                      │');
    console.log('│   Password: auditor123                                  │');
    console.log('│   Role: System Auditor                                  │');
    console.log('│   Status: Auto-verified (read-only access)             │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('📋 Admin Capabilities:');
    console.log('   ✅ Add lands to Digitized Land Database');
    console.log('   ✅ Digitalize land documents (generate certificates)');
    console.log('   ✅ Verify user identity documents');
    console.log('   ✅ Approve/reject land transactions');
    console.log('   ✅ View all system statistics and reports');
    console.log('   ✅ Manage user accounts and permissions');
    console.log('');
    console.log('⚠️  Important Notes:');
    console.log('   - Admin accounts do NOT require document verification');
    console.log('   - Regular users MUST complete verification to claim lands');
    console.log('   - Only digitalized lands can be listed for sale');
    console.log('   - All land transactions require admin approval');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Start Ganache on port 7545');
    console.log('   2. Deploy smart contract: npm run blockchain:deploy:ganache');
    console.log('   3. Update .env files with contract address');
    console.log('   4. Start the application: npm run dev');
    console.log('   5. Login with admin credentials to start managing lands');

  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
    if (error.code === 11000) {
      console.log('ℹ️  Some admin users may already exist');
    }
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedAdminUsers();
}

module.exports = seedAdminUsers;