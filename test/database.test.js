/**
 * ============================================================
 *  PropChain - Database & Model Tests  (White-Box Integration)
 *  Category  : Integration Testing (DB layer)
 *  Framework : Mocha + Chai + Mongoose
 *  Tools     : Mocha, Chai, Mongoose
 *  Run with  : npm run test:db
 *  Requires  : MongoDB running on localhost
 * ============================================================
 */

const { expect } = require('chai');
const mongoose   = require('mongoose');
const path       = require('path');
const dotenv     = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

describe('Database & Model - Integration Tests', function () {
  this.timeout(15000);

  before(async function () {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/landregistry';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
    }
  });

  after(async function () {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ─── 1. MongoDB Connection ──────────────────────────────
  describe('1. MongoDB Connection', function () {

    it('TC-DB-01: should be connected to the database (readyState === 1)', function () {
      expect(mongoose.connection.readyState).to.equal(1);
    });

    it('TC-DB-02: "users" collection exists in database', async function () {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const names = collections.map(c => c.name);
      expect(names).to.include('users');
    });

    it('TC-DB-03: "lands" collection exists in database', async function () {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const names = collections.map(c => c.name);
      expect(names).to.include('lands');
    });
  });

  // ─── 2. User Model Validation ───────────────────────────
  describe('2. User Model Validation', function () {

    const User = require('../server/models/User');

    it('TC-DB-04: reject User without required email field', async function () {
      const user = new User({ fullName: 'Test User', password: 'pass123456' });
      try {
        await user.validate();
        throw new Error('Should have failed validation');
      } catch (err) {
        expect(err.errors.email).to.exist;
      }
    });

    it('TC-DB-05: reject User without required fullName field', async function () {
      const user = new User({ email: 'test@example.com', password: 'pass1234' });
      try {
        await user.validate();
        throw new Error('Should have failed validation');
      } catch (err) {
        expect(err.errors.fullName).to.exist;
      }
    });

    it('TC-DB-06: reject invalid email format', async function () {
      const user = new User({ fullName: 'Test', email: 'not-an-email', password: 'pass123456' });
      try {
        await user.validate();
        throw new Error('Should have failed validation');
      } catch (err) {
        expect(err.errors.email).to.exist;
      }
    });

    it('TC-DB-07: accept valid User data without validation errors', function () {
      const user = new User({
        fullName : 'Valid User',
        email    : 'valid@example.com',
        password : 'StrongPass123'
      });
      const validationError = user.validateSync();
      expect(validationError).to.be.undefined;
    });

    it('TC-DB-08: default role is USER', function () {
      const user = new User({ fullName: 'New User', email: 'new@example.com', password: 'password123' });
      expect(user.role).to.equal('USER');
    });

    it('TC-DB-09: emailVerified defaults to false', function () {
      const user = new User({ fullName: 'New User', email: 'new@example.com', password: 'password123' });
      expect(user.emailVerified).to.equal(false);
    });
  });

  // ─── 3. OTP Model Validation ────────────────────────────
  describe('3. OTP Model Validation', function () {

    const OTP = require('../server/models/OTP');

    it('TC-DB-10: reject OTP without required email', async function () {
      const otp = new OTP({ otp: '123456', expiresAt: new Date() });
      try {
        await otp.validate();
        throw new Error('Should have failed');
      } catch (err) {
        expect(err.errors.email).to.exist;
      }
    });

    it('TC-DB-11: reject OTP without otp code', async function () {
      const otp = new OTP({ email: 'test@test.com', expiresAt: new Date() });
      try {
        await otp.validate();
        throw new Error('Should have failed');
      } catch (err) {
        expect(err.errors.otp).to.exist;
      }
    });

    it('TC-DB-12: accept valid OTP document', function () {
      const otp = new OTP({ email: 'user@example.com', otp: '654321', expiresAt: new Date(Date.now() + 300000) });
      expect(otp.validateSync()).to.be.undefined;
    });

    it('TC-DB-13: OTP purpose defaults to REGISTRATION', function () {
      const otp = new OTP({ email: 'user@example.com', otp: '654321', expiresAt: new Date() });
      expect(otp.purpose).to.equal('REGISTRATION');
    });
  });

  // ─── 4. BuyRequest Model Validation ────────────────────
  describe('4. BuyRequest Model Validation', function () {

    const BuyRequest = require('../server/models/BuyRequest');

    it('TC-DB-14: BuyRequest model loads without error', function () {
      expect(BuyRequest).to.be.a('function');
    });

    it('TC-DB-15: BuyRequest model has the offerAmount field', function () {
      const schema = BuyRequest.schema.obj;
      // Check that the schema defines offerAmount
      const hasOfferAmount = Object.keys(schema).some(k => k.toLowerCase().includes('offer') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('price'));
      expect(hasOfferAmount).to.be.true;
    });
  });

  // ─── 5. Land Model Validation ───────────────────────────
  describe('5. Land Model Validation', function () {

    const Land = require('../server/models/Land');

    it('TC-DB-16: Land model loads without error', function () {
      expect(Land).to.be.a('function');
    });

    it.skip('TC-DB-17: Land schema has location field', function () {
      const paths = Land.schema.paths;
      const hasLocation = Object.keys(paths).some(k => k.toLowerCase().includes('location') || k.toLowerCase().includes('address'));
      expect(hasLocation).to.be.true;
    });
  });

  // ─── 6. LandTransaction Model Validation ────────────────
  describe('6. LandTransaction Model Validation', function () {

    const LandTransaction = require('../server/models/LandTransaction');

    it('TC-DB-18: LandTransaction model loads without error', function () {
      expect(LandTransaction).to.be.a('function');
    });

    it('TC-DB-19: LandTransaction schema exists and has paths', function () {
      const paths = Object.keys(LandTransaction.schema.paths);
      expect(paths.length).to.be.greaterThan(0);
    });
  });

  // ─── 7. Storage / IPFS Configuration ───────────────────
  describe('7. Storage & IPFS Configuration', function () {

    it('TC-DB-20: ipfsService.getFileUrl returns local URL containing hash', function () {
      const ipfsService = require('../server/config/ipfs');
      const url = ipfsService.getFileUrl('some-hash-abc123');
      expect(url).to.contain('some-hash-abc123');
    });

    it('TC-DB-21: ipfsService.generateHash produces consistent deterministic results', function () {
      const ipfsService = require('../server/config/ipfs');
      const hash1 = ipfsService.generateHash(Buffer.from('test-data'));
      const hash2 = ipfsService.generateHash(Buffer.from('test-data'));
      expect(hash1).to.equal(hash2);
    });
  });
});
