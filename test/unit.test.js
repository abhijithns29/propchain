/**
 * ============================================================
 *  PropChain - Unit Tests  (White-Box)
 *  Category  : Unit Testing
 *  Framework : Mocha + Chai
 *  Tools     : Mocha, Chai
 *  Run with  : npm run test:unit
 *  Note      : No server or DB required — pure logic tests
 * ============================================================
 */

const { expect } = require('chai');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ─── 1. OTP Generation Logic ───────────────────────────────
describe('1. OTP Service - Unit Tests', function () {

  const otpService = {
    generateOTP: () => Math.floor(100000 + Math.random() * 900000).toString()
  };

  it('TC-UT-01: should generate a 6-digit OTP string', function () {
    const otp = otpService.generateOTP();
    expect(otp).to.be.a('string');
    expect(otp).to.have.lengthOf(6);
  });

  it('TC-UT-02: should generate OTP within valid numeric range (100000-999999)', function () {
    const otp = otpService.generateOTP();
    const num = parseInt(otp);
    expect(num).to.be.at.least(100000);
    expect(num).to.be.at.most(999999);
  });

  it('TC-UT-03: should generate unique OTPs on 50 consecutive calls', function () {
    const otps = new Set();
    for (let i = 0; i < 50; i++) otps.add(otpService.generateOTP());
    expect(otps.size).to.be.greaterThan(40);
  });

  it('TC-UT-04: should always return string type', function () {
    for (let i = 0; i < 10; i++) {
      expect(typeof otpService.generateOTP()).to.equal('string');
    }
  });
});

// ─── 2. IPFS / Storage Hash Generation ────────────────────
describe('2. IPFS Service - Hash Generation', function () {

  function generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  it('TC-UT-05: should generate a valid SHA-256 hash (64 hex chars)', function () {
    const hash = generateHash('test-land-document');
    expect(hash).to.be.a('string');
    expect(hash).to.have.lengthOf(64);
  });

  it('TC-UT-06: same input must always produce same hash (deterministic)', function () {
    const input = 'blockchain-land-certificate-2026';
    expect(generateHash(input)).to.equal(generateHash(input));
  });

  it('TC-UT-07: different inputs must produce different hashes', function () {
    expect(generateHash('document-A')).to.not.equal(generateHash('document-B'));
  });

  it('TC-UT-08: should hash Buffer data', function () {
    const hash = generateHash(Buffer.from('land-deed-binary-content'));
    expect(hash).to.be.a('string').with.lengthOf(64);
  });
});

// ─── 3. Input Validation Rules ────────────────────────────
describe('3. Input Validation - Data Integrity', function () {

  const emailRegex  = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  const aadhaarRegex = /^\d{12}$/;
  const panRegex    = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const walletRegex = /^0x[a-fA-F0-9]{40}$/;

  describe('3a. Email Validation', function () {
    it('TC-UT-09: valid email addresses are accepted', function () {
      expect(emailRegex.test('user@example.com')).to.be.true;
      expect(emailRegex.test('admin@landregistry.gov')).to.be.true;
    });
    it('TC-UT-10: invalid email addresses are rejected', function () {
      expect(emailRegex.test('invalid-email')).to.be.false;
      expect(emailRegex.test('@domain.com')).to.be.false;
      expect(emailRegex.test('')).to.be.false;
    });
  });

  describe('3b. Aadhaar Number Validation', function () {
    it('TC-UT-11: valid 12-digit Aadhaar accepted', function () {
      expect(aadhaarRegex.test('123456789012')).to.be.true;
    });
    it('TC-UT-12: invalid Aadhaar lengths rejected', function () {
      expect(aadhaarRegex.test('12345678')).to.be.false;
      expect(aadhaarRegex.test('1234567890123')).to.be.false;
      expect(aadhaarRegex.test('abcdefghijkl')).to.be.false;
    });
  });

  describe('3c. PAN Card Validation', function () {
    it('TC-UT-13: valid PAN format accepted (ABCDE1234F)', function () {
      expect(panRegex.test('ABCDE1234F')).to.be.true;
      expect(panRegex.test('ZZZZZ9999Z')).to.be.true;
    });
    it('TC-UT-14: invalid PAN formats rejected', function () {
      expect(panRegex.test('abcde1234f')).to.be.false;
      expect(panRegex.test('ABC')).to.be.false;
    });
  });

  describe('3d. Ethereum Wallet Address Validation', function () {
    it('TC-UT-15: valid Ethereum addresses accepted', function () {
      expect(walletRegex.test('0x1234567890abcdef1234567890abcdef12345678')).to.be.true;
    });
    it('TC-UT-16: invalid wallet addresses rejected', function () {
      expect(walletRegex.test('0x1234')).to.be.false;
      expect(walletRegex.test('')).to.be.false;
    });
  });
});

// ─── 4. Buy Request Validation ────────────────────────────
describe('4. Buy Request Price Validation', function () {

  function validateBuyRequest(offerAmount, listingPrice) {
    if (!offerAmount || offerAmount <= 0) return { valid: false, error: 'Offer amount must be greater than 0' };
    if (!listingPrice || listingPrice <= 0) return { valid: false, error: 'Listing price must be greater than 0' };
    return { valid: true };
  }

  it('TC-UT-17: offer amount of 0 must be rejected', function () {
    const result = validateBuyRequest(0, 100000);
    expect(result.valid).to.be.false;
    expect(result.error).to.include('greater than 0');
  });

  it('TC-UT-18: negative offer amount must be rejected', function () {
    const result = validateBuyRequest(-5000, 100000);
    expect(result.valid).to.be.false;
  });

  it('TC-UT-19: valid offer amount is accepted', function () {
    const result = validateBuyRequest(500000, 450000);
    expect(result.valid).to.be.true;
  });

  it('TC-UT-20: listing price of 0 must be rejected', function () {
    const result = validateBuyRequest(100000, 0);
    expect(result.valid).to.be.false;
    expect(result.error).to.include('Listing price');
  });
});

// ─── 5. JWT Token Structure ───────────────────────────────
describe('5. JWT Token - Structure Validation', function () {

  const secret = 'test-secret-for-unit-testing';

  it('TC-UT-21: creates a valid 3-part JWT', function () {
    const token = jwt.sign({ id: 'user123', role: 'USER' }, secret, { expiresIn: '1h' });
    expect(token).to.be.a('string');
    expect(token.split('.')).to.have.lengthOf(3);
  });

  it('TC-UT-22: decoded token contains correct payload', function () {
    const payload = { id: 'admin001', role: 'ADMIN', email: 'admin@test.com' };
    const token   = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    expect(decoded.id).to.equal('admin001');
    expect(decoded.role).to.equal('ADMIN');
  });

  it('TC-UT-23: wrong secret causes token verification to throw', function () {
    const token = jwt.sign({ id: 'user1' }, secret);
    expect(() => jwt.verify(token, 'wrong-secret')).to.throw();
  });

  it('TC-UT-24: expired token is rejected', function (done) {
    const token = jwt.sign({ id: 'user1' }, secret, { expiresIn: '1ms' });
    setTimeout(() => {
      expect(() => jwt.verify(token, secret)).to.throw('jwt expired');
      done();
    }, 50);
  });

  it('TC-UT-25: malformed token string is rejected', function () {
    expect(() => jwt.verify('not.a.real.token', secret)).to.throw();
    expect(() => jwt.verify('', secret)).to.throw();
  });
});

// ─── 6. Password Hashing (bcrypt) ────────────────────────
describe('6. Password Hashing - bcrypt', function () {

  it('TC-UT-26: hashed password differs from plain text', async function () {
    const password = 'SecurePassword123!';
    const hash = await bcrypt.hash(password, 10);
    expect(hash).to.not.equal(password);
    expect(hash.length).to.be.greaterThan(50);
  });

  it('TC-UT-27: correct password passes bcrypt compare', async function () {
    const password = 'MyLandRegistry2026';
    const hash = await bcrypt.hash(password, 10);
    expect(await bcrypt.compare(password, hash)).to.be.true;
  });

  it('TC-UT-28: incorrect password fails bcrypt compare', async function () {
    const hash = await bcrypt.hash('correctPassword', 10);
    expect(await bcrypt.compare('wrongPassword', hash)).to.be.false;
  });

  it('TC-UT-29: same password produces different hashes each time (salt)', async function () {
    const password = 'SamePassword';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    expect(hash1).to.not.equal(hash2);
  });
});

// ─── 7. Utility Functions ─────────────────────────────────
describe('7. Utility Functions', function () {

  describe('7a. File Extension Handling', function () {
    it('TC-UT-30: extracts correct file extension', function () {
      expect(path.extname('document.pdf')).to.equal('.pdf');
      expect(path.extname('image.jpg')).to.equal('.jpg');
    });
    it('TC-UT-31: returns empty string for no extension', function () {
      expect(path.extname('noextension')).to.equal('');
    });
  });

  describe('7b. Data Sanitization', function () {
    it('TC-UT-32: trims whitespace from user input', function () {
      expect('  admin@landregistry.gov  '.trim()).to.equal('admin@landregistry.gov');
    });
    it('TC-UT-33: converts email to lowercase', function () {
      expect('Admin@LandRegistry.GOV'.toLowerCase()).to.equal('admin@landregistry.gov');
    });
  });

  describe('7c. Land Valuation Sanity', function () {
    it('TC-UT-34: land valuation must be a positive number', function () {
      const isValidValuation = (v) => typeof v === 'number' && v > 0;
      expect(isValidValuation(500000)).to.be.true;
      expect(isValidValuation(0)).to.be.false;
      expect(isValidValuation(-1000)).to.be.false;
      expect(isValidValuation(NaN)).to.be.false;
    });

    it('TC-UT-35: land area (sq ft) must be a positive integer', function () {
      const isValidArea = (a) => Number.isInteger(a) && a > 0;
      expect(isValidArea(1500)).to.be.true;
      expect(isValidArea(0)).to.be.false;
      expect(isValidArea(1.5)).to.be.false;
    });
  });
});
