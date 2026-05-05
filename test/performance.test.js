/**
 * ============================================================
 *  PropChain - Performance Tests
 *  Category  : Performance Testing
 *  Framework : Mocha + Chai + Supertest + Node performance API
 *  Tools     : Supertest, Node Event Simulator (performance API)
 *  Run with  : npm run test:performance
 *  Requires  : Backend server running on http://127.0.0.1:5000
 * ============================================================
 *
 *  Thresholds (per PropChain SLA):
 *    - Health/static endpoints  : < 500  ms
 *    - Auth endpoints           : < 1500 ms
 *    - Lands/DB-heavy endpoints : < 2000 ms
 *    - Blockchain endpoints     : < 5000 ms
 * ============================================================
 */

const request = require('supertest');
const { expect } = require('chai');
const { performance } = require('perf_hooks');

const API_URL = 'http://127.0.0.1:5000';

// ─── Helpers ─────────────────────────────────────────────────
async function measureRequest(method, url, body = null, headers = {}) {
  const start = performance.now();
  let res;
  if (method === 'GET') {
    let req = request(API_URL).get(url);
    Object.entries(headers).forEach(([k, v]) => req.set(k, v));
    res = await req;
  } else if (method === 'POST') {
    let req = request(API_URL).post(url).send(body || {});
    Object.entries(headers).forEach(([k, v]) => req.set(k, v));
    res = await req;
  }
  const duration = performance.now() - start;
  return { res, duration };
}

// Storage for report
const perfResults = [];

function recordResult(tcId, name, durationMs, thresholdMs, passed) {
  perfResults.push({ tcId, name, durationMs: Math.round(durationMs), thresholdMs, passed });
}

describe('Performance Tests - API Response Times', function () {
  this.timeout(30000);

  // ─── 1. Static & Health Endpoints ───────────────────────
  describe('1. Static & Health Endpoints (threshold: <500ms)', function () {

    it('TC-PERF-01: GET /api/health → <500ms', async function () {
      const { res, duration } = await measureRequest('GET', '/api/health');
      expect(res.status).to.equal(200);
      recordResult('TC-PERF-01', 'GET /api/health', duration, 500, duration < 500);
      console.log(`      ⏱  ${Math.round(duration)}ms`);
      expect(duration).to.be.below(500);
    });

    it('TC-PERF-02: GET /api → <500ms (API doc)', async function () {
      const { res, duration } = await measureRequest('GET', '/api');
      expect(res.status).to.equal(200);
      recordResult('TC-PERF-02', 'GET /api', duration, 500, duration < 500);
      console.log(`      ⏱  ${Math.round(duration)}ms`);
      expect(duration).to.be.below(500);
    });
  });

  // ─── 2. Auth Endpoints ──────────────────────────────────
  describe('2. Authentication Endpoints (threshold: <1500ms)', function () {

    it('TC-PERF-03: POST /api/auth/login (invalid) → <1500ms', async function () {
      const { res, duration } = await measureRequest('POST', '/api/auth/login', {
        email: 'noexist@test.com', password: 'wrongpass'
      });
      expect(res.status).to.be.oneOf([400, 401, 403]);
      recordResult('TC-PERF-03', 'POST /api/auth/login (fail)', duration, 1500, duration < 1500);
      console.log(`      ⏱  ${Math.round(duration)}ms`);
      expect(duration).to.be.below(1500);
    });

    it('TC-PERF-04: POST /api/auth/register (incomplete) → <1500ms', async function () {
      const { res, duration } = await measureRequest('POST', '/api/auth/register', {
        email: 'perf-test@example.com'
      });
      expect(res.status).to.be.oneOf([400, 422]);
      recordResult('TC-PERF-04', 'POST /api/auth/register (fail)', duration, 1500, duration < 1500);
      console.log(`      ⏱  ${Math.round(duration)}ms`);
      expect(duration).to.be.below(1500);
    });
  });

  // ─── 3. Lands Endpoints ─────────────────────────────────
  describe('3. Lands/DB Endpoints (threshold: <2000ms)', function () {

    it('TC-PERF-05: GET /api/lands → <2000ms', async function () {
      const { res, duration } = await measureRequest('GET', '/api/lands');
      expect(res.status).to.be.oneOf([200, 401]);
      recordResult('TC-PERF-05', 'GET /api/lands', duration, 2000, duration < 2000);
      console.log(`      ⏱  ${Math.round(duration)}ms`);
      expect(duration).to.be.below(2000);
    });

    it.skip('TC-PERF-06: GET /api/land-transactions → <2000ms', async function () {
      const { res, duration } = await measureRequest('GET', '/api/land-transactions');
      expect(res.status).to.be.oneOf([200, 401]);
      recordResult('TC-PERF-06', 'GET /api/land-transactions', duration, 2000, duration < 2000);
      console.log(`      ⏱  ${Math.round(duration)}ms`);
      expect(duration).to.be.below(2000);
    });

    it.skip('TC-PERF-07: GET /api/users → <2000ms', async function () {
      const { res, duration } = await measureRequest('GET', '/api/users');
      expect(res.status).to.be.oneOf([200, 401, 403]);
      recordResult('TC-PERF-07', 'GET /api/users', duration, 2000, duration < 2000);
      console.log(`      ⏱  ${Math.round(duration)}ms`);
      expect(duration).to.be.below(2000);
    });
  });

  // ─── 4. Blockchain Endpoint ──────────────────────────────
  describe('4. Blockchain Endpoints (threshold: <5000ms)', function () {

    it('TC-PERF-08: GET /api/blockchain → <5000ms', async function () {
      const { res, duration } = await measureRequest('GET', '/api/blockchain');
      expect(res.status).to.be.oneOf([200, 401, 404, 503]);
      recordResult('TC-PERF-08', 'GET /api/blockchain', duration, 5000, duration < 5000);
      console.log(`      ⏱  ${Math.round(duration)}ms`);
      expect(duration).to.be.below(5000);
    });
  });

  // ─── 5. Concurrent Load Simulation ──────────────────────
  describe('5. Concurrent Load Simulation (Node Event Simulator)', function () {

    it('TC-PERF-09: 10 concurrent health checks all respond < 1000ms each', async function () {
      const start = performance.now();
      const requests = Array.from({ length: 10 }, () =>
        request(API_URL).get('/api/health')
      );
      const results = await Promise.all(requests);
      const total = performance.now() - start;

      results.forEach(r => expect(r.status).to.equal(200));
      recordResult('TC-PERF-09', '10x concurrent GET /api/health', total, 1000, total < 1000);
      console.log(`      ⏱  ${Math.round(total)}ms for 10 concurrent requests`);
      expect(total).to.be.below(1000);
    });

    it('TC-PERF-10: 5 concurrent failed logins complete < 3000ms total', async function () {
      const start = performance.now();
      const requests = Array.from({ length: 5 }, () =>
        request(API_URL)
          .post('/api/auth/login')
          .send({ email: `load-test-${Date.now()}@test.com`, password: 'wrongpass' })
      );
      const results = await Promise.all(requests);
      const total = performance.now() - start;

      results.forEach(r => expect(r.status).to.be.oneOf([400, 401, 403]));
      recordResult('TC-PERF-10', '5x concurrent POST /api/auth/login', total, 3000, total < 3000);
      console.log(`      ⏱  ${Math.round(total)}ms for 5 concurrent logins`);
      expect(total).to.be.below(3000);
    });
  });

  // ─── 6. Summary Table ────────────────────────────────────
  after(function () {
    console.log('\n  ┌─────────────────────────────────────────────────────────────────────┐');
    console.log('  │                  PERFORMANCE TEST SUMMARY                           │');
    console.log('  ├────────────┬─────────────────────────────────────┬─────────┬───────┤');
    console.log('  │ Test ID    │ Endpoint                            │ Time(ms)│ Pass? │');
    console.log('  ├────────────┼─────────────────────────────────────┼─────────┼───────┤');
    perfResults.forEach(r => {
      const id       = r.tcId.padEnd(10);
      const name     = r.name.substring(0, 36).padEnd(36);
      const time     = String(r.durationMs).padStart(7);
      const status   = r.passed ? '  ✔    ' : '  ✘    ';
      console.log(`  │ ${id} │ ${name} │${time} │${status}│`);
    });
    console.log('  └────────────┴─────────────────────────────────────┴─────────┴───────┘\n');
  });
});
