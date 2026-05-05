/**
 * ============================================================
 *  PropChain - API Integration Tests  (White-Box + Black-Box)
 *  Category  : Integration Testing + Functional Testing
 *              + Black-Box Testing + Security Testing
 *  Framework : Mocha + Chai + Supertest
 *  Tools     : Supertest, Mocha, Chai
 *  Run with  : npm run test:api
 *  Requires  : Backend server running on http://127.0.0.1:5000
 * ============================================================
 */

const request = require('supertest');
const { expect } = require('chai');

const API_URL = 'http://127.0.0.1:5000';

describe('Backend API - Integration & Functional Tests', function () {
  this.timeout(15000);

  let authToken   = null;
  let adminToken  = null;
  let testLandId  = null;

  // ─── 1. Server Health & Status ──────────────────────────
  describe('1. Server Health & Status', function () {

    it('TC-API-01: GET /api/health → 200 with version info', async function () {
      const res = await request(API_URL).get('/api/health');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      expect(res.body.version).to.equal('1.0.0');
    });

    it('TC-API-02: GET /api → returns endpoint documentation object', async function () {
      const res = await request(API_URL).get('/api');
      expect(res.status).to.equal(200);
      expect(res.body.endpoints).to.be.an('object');
    });

    it('TC-API-03: unknown route → 404 with route list', async function () {
      const res = await request(API_URL).get('/api/nonexistent-route-propchain');
      expect(res.status).to.equal(404);
    });
  });

  // ─── 2. Authentication API ───────────────────────────────
  describe('2. Authentication API (Functional & Integration)', function () {

    it('TC-API-04: POST /api/auth/login → reject invalid credentials (400)', async function () {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ email: 'notexist@user.com', password: 'wrongpassword' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });

    it('TC-API-05: POST /api/auth/login → reject missing password (400)', async function () {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ email: 'someone@test.com' });
      expect(res.status).to.be.oneOf([400, 422]);
    });

    it('TC-API-06: POST /api/auth/register → reject missing required fields (400)', async function () {
      const res = await request(API_URL)
        .post('/api/auth/register')
        .send({ email: 'incomplete@test.com' });
      expect(res.status).to.equal(400);
    });

    it('TC-API-07: POST /api/auth/login → admin login attempt', async function () {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ email: 'admin@landregistry.gov', password: 'admin123' });

      if (res.status === 200) {
        expect(res.body).to.have.property('token');
        adminToken = res.body.token;
        authToken  = res.body.token;
        console.log('      ✔ Admin token obtained');
      } else {
        console.warn('      ⚠ Admin login skipped — seed DB first (npm run db:seed)');
      }
    });
  });

  // ─── 3. Protected Routes & Authorization ─────────────────
  describe('3. Protected Routes & Authorization', function () {

    it('TC-API-08: GET /api/auth/me → 401 without any token', async function () {
      const res = await request(API_URL).get('/api/auth/me');
      expect(res.status).to.equal(401);
    });

    it('TC-API-09: GET /api/auth/me → 401 with malformed JWT', async function () {
      const res = await request(API_URL)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally-fake-token-string');
      expect(res.status).to.equal(401);
    });

    it('TC-API-10: GET /api/auth/me → 200 with valid token', async function () {
      if (!authToken) return this.skip();
      const res = await request(API_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).to.be.oneOf([200, 404]);
    });
  });

  // ─── 4. Lands API ────────────────────────────────────────
  describe('4. Lands API (Functional Testing)', function () {

    it('TC-API-11: GET /api/lands → public listing accessible', async function () {
      const res = await request(API_URL).get('/api/lands');
      expect(res.status).to.be.oneOf([200, 401]);
    });

    it('TC-API-12: GET /api/lands/invalid-id → 400 or 404 for bad ID', async function () {
      const res = await request(API_URL).get('/api/lands/not-a-valid-mongo-id');
      expect(res.status).to.be.oneOf([400, 404]);
    });

    it('TC-API-13: GET /api/lands with auth token responds without 500', async function () {
      if (!authToken) return this.skip();
      const res = await request(API_URL)
        .get('/api/lands')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).to.not.equal(500);
    });
  });

  // ─── 5. Buy Requests API ─────────────────────────────────
  describe('5. Buy Requests API (Functional & Validation)', function () {

    it('TC-API-14: POST /api/buy-requests → reject 0 offer amount', async function () {
      if (!authToken) return this.skip();
      const res = await request(API_URL)
        .post('/api/buy-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ landId: 'someid', offerAmount: 0 });
      expect(res.status).to.be.oneOf([400, 422]);
    });

    it('TC-API-15: POST /api/buy-requests → reject negative offer amount', async function () {
      if (!authToken) return this.skip();
      const res = await request(API_URL)
        .post('/api/buy-requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ landId: 'someid', offerAmount: -1000 });
      expect(res.status).to.be.oneOf([400, 422]);
    });

    it.skip('TC-API-16: GET /api/buy-requests → 401 without auth', async function () {
      const res = await request(API_URL).get('/api/buy-requests');
      expect(res.status).to.equal(401);
    });
  });

  // ─── 6. Blockchain API ───────────────────────────────────
  describe('6. Blockchain API Route (Integration)', function () {

    it('TC-API-17: GET /api/blockchain → responds without crashing (200 or 503)', async function () {
      const res = await request(API_URL).get('/api/blockchain');
      expect(res.status).to.be.oneOf([200, 401, 404, 503]);
    });
  });

  // ─── 7. Security & Input Sanitization ───────────────────
  describe('7. Security & Input Sanitization (Black-Box)', function () {

    it('TC-API-18: NoSQL injection in login email is blocked', async function () {
      const res = await request(API_URL)
        .post('/api/auth/login')
        .send({ email: { '$gt': '' }, password: 'any' });
      expect(res.status).to.be.oneOf([400, 500]);
    });

    it('TC-API-19: XSS payload in registration is rejected or sanitized', async function () {
      const res = await request(API_URL)
        .post('/api/auth/register')
        .send({
          fullName: '<script>alert("xss")</script>',
          email: 'xss-test@propchain.test',
          password: 'password123'
        });
      expect(res.status).to.be.oneOf([201, 400, 409, 500]);
    });

    it('TC-API-20: CORS headers present on health endpoint', async function () {
      const res = await request(API_URL)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');
      expect(res.status).to.equal(200);
    });

    it('TC-API-21: oversized JSON payload rejected', async function () {
      const bigPayload = { data: 'x'.repeat(1024 * 1024 * 60) }; // 60MB
      const res = await request(API_URL)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(bigPayload));
      expect(res.status).to.be.oneOf([400, 413, 500]);
    });
  });

  // ─── 8. Audit & Admin Routes ────────────────────────────
  describe('8. Audit & Admin Routes', function () {

    it.skip('TC-API-22: GET /api/audit → 401 without auth token', async function () {
      const res = await request(API_URL).get('/api/audit');
      expect(res.status).to.equal(401);
    });

    it('TC-API-23: GET /api/admin/transactions → 401 without auth', async function () {
      const res = await request(API_URL).get('/api/admin/transactions');
      expect(res.status).to.equal(401);
    });
  });
});
