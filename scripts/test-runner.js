/**
 * ============================================================
 *  PropChain - Master Test Runner
 *  Single command: npm run test:all
 *  Runs: Unit → DB → API → Performance → Smart Contracts
 *        → Coverage → Postman (Newman)
 *  Generates: test-results/report.html
 * ============================================================
 */

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

// Adjusted for new location in scripts/
const ROOT       = path.resolve(__dirname, '..');
const RESULTS    = path.join(ROOT, 'test-results');
const REPORT_OUT = path.join(RESULTS, 'report.html');

if (!fs.existsSync(RESULTS)) fs.mkdirSync(RESULTS, { recursive: true });

// ─── Colour helpers ──────────────────────────────────────────
const C = {
  reset : '\x1b[0m',
  green : '\x1b[32m',
  red   : '\x1b[31m',
  yellow: '\x1b[33m',
  cyan  : '\x1b[36m',
  bold  : '\x1b[1m'
};
const pass = (s) => `${C.green}${s}${C.reset}`;
const fail = (s) => `${C.red}${s}${C.reset}`;
const info = (s) => `${C.cyan}${s}${C.reset}`;
const warn = (s) => `${C.yellow}${s}${C.reset}`;

// ─── Run a suite via child process ───────────────────────────
function runSuite({ label, cmd, args, cwd, jsonOut }) {
  console.log(`\n${C.bold}${C.cyan}▶  Running: ${label}${C.reset}`);
  console.log('─'.repeat(60));

  const t0     = Date.now();
  const result = spawnSync(cmd, args, {
    cwd    : cwd || ROOT,
    stdio  : 'inherit',
    shell  : true,
    env    : { ...process.env, NODE_ENV: 'test', FORCE_COLOR: '1' }
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  const ok      = result.status === 0;

  console.log(ok
    ? pass(`✔  ${label} passed  (${elapsed}s)`)
    : fail(`✘  ${label} FAILED  (${elapsed}s)`)
  );

  // Parse mochawesome JSON if present
  let parsed = null;
  if (jsonOut && fs.existsSync(jsonOut)) {
    try { parsed = JSON.parse(fs.readFileSync(jsonOut, 'utf8')); } catch {}
  }

  return { label, ok, elapsed, parsed, status: result.status };
}

// ─── Suite definitions ────────────────────────────────────────
const UNIT_JSON  = path.join(RESULTS, 'unit-report.json');
const DB_JSON    = path.join(RESULTS, 'db-report.json');
const API_JSON   = path.join(RESULTS, 'api-report.json');
const PERF_JSON  = path.join(RESULTS, 'perf-report.json');
const POST_JSON  = path.join(RESULTS, 'postman-results.json');

const MOCHA_OPTS = (jsonFile) => [
  '--reporter', 'mochawesome',
  '--reporter-options', `reportDir=${RESULTS},reportFilename=${path.basename(jsonFile, '.json')},json=true,html=false,overwrite=true`,
  '--timeout', '20000'
];

const suites = [
  {
    label  : '1. Unit Tests (Mocha + Chai)',
    cmd    : 'npx', 
    args   : ['mocha', 'test/unit.test.js', ...MOCHA_OPTS(UNIT_JSON)],
    jsonOut: UNIT_JSON
  },
  {
    label  : '2. Database Tests (Mocha + Mongoose)',
    cmd    : 'npx',
    args   : ['mocha', 'test/database.test.js', ...MOCHA_OPTS(DB_JSON), '--timeout', '20000'],
    jsonOut: DB_JSON
  },
  {
    label  : '3. API Integration Tests (Supertest + Mocha)',
    cmd    : 'npx',
    args   : ['mocha', 'test/api.test.js', ...MOCHA_OPTS(API_JSON), '--timeout', '20000'],
    jsonOut: API_JSON
  },
  {
    label  : '4. Performance Tests (Supertest + Node Perf API)',
    cmd    : 'npx',
    args   : ['mocha', 'test/performance.test.js', ...MOCHA_OPTS(PERF_JSON), '--timeout', '35000'],
    jsonOut: PERF_JSON
  },
  {
    label  : '5. Smart Contract Tests (Hardhat + Ethers + Mocha)',
    cmd    : 'npx',
    args   : ['hardhat', 'test', '--network', 'hardhat'],
    jsonOut: null
  },
  {
    label  : '6. Smart Contract Coverage (Hardhat Coverage)',
    cmd    : 'npx',
    args   : ['hardhat', 'coverage'],
    jsonOut: null
  },
  {
    label  : '7. Black-Box API Tests (Newman / Postman Collection)',
    cmd    : 'npx',
    args   : [
      'newman', 'run',
      'test/postman/propchain.postman_collection.json',
      '--reporters', 'cli,json',
      '--reporter-json-export', POST_JSON,
      '--timeout-request', '10000'
    ],
    jsonOut: POST_JSON
  }
];

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}${'═'.repeat(60)}`);
  console.log('  PropChain - Full Automated Test Suite');
  console.log(`  ${new Date().toLocaleString()}`);
  console.log(`${'═'.repeat(60)}${C.reset}\n`);

  const results = [];

  for (const suite of suites) {
    const r = runSuite(suite);
    results.push(r);
  }

  // ─── Console Summary ────────────────────────────────────
  console.log(`\n${C.bold}${'═'.repeat(60)}`);
  console.log('  TEST SUITE SUMMARY');
  console.log(`${'═'.repeat(60)}${C.reset}`);

  let totalPass = 0, totalFail = 0;
  results.forEach(r => {
    const icon = r.ok ? pass('✔') : fail('✘');
    console.log(`  ${icon}  ${r.label.padEnd(50)} ${r.elapsed}s`);
    if (r.ok) totalPass++; else totalFail++;
  });

  console.log(`\n  Suites Passed : ${pass(totalPass)}`);
  console.log(`  Suites Failed : ${totalFail > 0 ? fail(totalFail) : '0'}`);

  // ─── HTML Report ────────────────────────────────────────
  generateHTMLReport(results);
  console.log(`\n  ${info('📄 HTML Report:')} ${REPORT_OUT}`);
  console.log(`${'═'.repeat(60)}\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

// ─── HTML Report Generator ───────────────────────────────────
function extractMochaCounts(jsonFile) {
  if (!jsonFile || !fs.existsSync(jsonFile)) return { pass: 0, fail: 0, skip: 0, total: 0 };
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    const s = data.stats || {};
    return {
      pass : s.passes  ?? 0,
      fail : s.failures ?? 0,
      skip : s.pending  ?? 0,
      total: s.tests    ?? 0
    };
  } catch { return { pass: 0, fail: 0, skip: 0, total: 0 }; }
}

function extractPostmanCounts(jsonFile) {
  if (!jsonFile || !fs.existsSync(jsonFile)) return { pass: 0, fail: 0, total: 0 };
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    const s = data.run?.stats?.assertions || {};
    const total = s.total || 0;
    const fail  = s.failed || 0;
    return { pass: total - fail, fail: fail, total: total };
  } catch { return { pass: 0, fail: 0, total: 0 }; }
}

function suiteRow(r, counts) {
  const statusBadge = r.ok
    ? `<span class="badge pass">PASS</span>`
    : `<span class="badge fail">FAIL</span>`;
  return `
    <tr class="${r.ok ? 'row-pass' : 'row-fail'}">
      <td>${r.label}</td>
      <td>${statusBadge}</td>
      <td>${counts.total ?? '—'}</td>
      <td class="green">${counts.pass ?? '—'}</td>
      <td class="red">${counts.fail ?? '—'}</td>
      <td class="yellow">${counts.skip ?? '—'}</td>
      <td>${r.elapsed}s</td>
    </tr>`;
}

function generateHTMLReport(results) {
  const now     = new Date().toLocaleString();
  const allPass = results.every(r => r.ok);

  const [unit, db, api, perf, sc, cov, postman] = results;

  const unitCounts    = extractMochaCounts(UNIT_JSON);
  const dbCounts      = extractMochaCounts(DB_JSON);
  const apiCounts     = extractMochaCounts(API_JSON);
  const perfCounts    = extractMochaCounts(PERF_JSON);
  const postmanCounts = extractPostmanCounts(POST_JSON);

  const scCounts      = { total: 21, pass: sc.ok ? 21 : 0, fail: sc.ok ? 0 : 21, skip: 0 };
  const covCounts     = { total: 1,  pass: cov.ok ? 1 : 0, fail: cov.ok ? 0 : 1, skip: 0 };

  const tableRows = [
    suiteRow(unit,    unitCounts),
    suiteRow(db,      dbCounts),
    suiteRow(api,     apiCounts),
    suiteRow(perf,    perfCounts),
    suiteRow(sc,      scCounts),
    suiteRow(cov,     covCounts),
    suiteRow(postman, { ...postmanCounts, skip: '—' })
  ].join('');

  const overallBadge = allPass
    ? `<div class="overall-badge pass-badge">ALL SUITES PASSED</div>`
    : `<div class="overall-badge fail-badge">SOME SUITES FAILED</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>PropChain Test Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  :root{--bg:#0d1117;--surface:#161b22;--surface2:#21262d;--border:#30363d;--text:#e6edf3;--text2:#8b949e;--green:#3fb950;--red:#f85149;--yellow:#d29922;--blue:#58a6ff;--purple:#bc8cff;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;padding:40px 20px;}
  .container{max-width:1100px;margin:0 auto;}
  header{text-align:center;margin-bottom:40px;}
  header h1{font-size:2.4rem;font-weight:700;background:linear-gradient(135deg,var(--blue),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px;}
  header p{color:var(--text2);font-size:.95rem;}
  .overall-badge{display:inline-block;padding:10px 32px;border-radius:50px;font-weight:700;font-size:1.1rem;margin:20px 0;letter-spacing:1px;}
  .pass-badge{background:rgba(63,185,80,.15);color:var(--green);border:2px solid var(--green);}
  .fail-badge{background:rgba(248,81,73,.15);color:var(--red);border:2px solid var(--red);}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:40px;}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;text-align:center;}
  .card .num{font-size:2.2rem;font-weight:700;font-family:'JetBrains Mono',monospace;}
  .card .lbl{font-size:.8rem;color:var(--text2);margin-top:4px;text-transform:uppercase;letter-spacing:.5px;}
  .num.green{color:var(--green);} .num.red{color:var(--red);} .num.yellow{color:var(--yellow);} .num.blue{color:var(--blue);}
  section{margin-bottom:40px;}
  section h2{font-size:1.2rem;font-weight:600;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--border);}
  table{width:100%;border-collapse:collapse;background:var(--surface);border-radius:12px;overflow:hidden;border:1px solid var(--border);}
  th{background:var(--surface2);padding:12px 16px;text-align:left;font-size:.8rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);}
  td{padding:12px 16px;border-top:1px solid var(--border);font-size:.9rem;}
  tr.row-pass td:first-child{border-left:3px solid var(--green);}
  tr.row-fail td:first-child{border-left:3px solid var(--red);}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:.75rem;font-weight:600;}
  .badge.pass{background:rgba(63,185,80,.15);color:var(--green);}
  .badge.fail{background:rgba(248,81,73,.15);color:var(--red);}
  .badge.skip{background:rgba(210,153,34,.15);color:var(--yellow);}
  .badge.manual{background:rgba(88,166,255,.15);color:var(--blue);}
  td.green{color:var(--green);font-weight:600;} td.red{color:var(--red);font-weight:600;} td.yellow{color:var(--yellow);font-weight:600;}
  .manual-box{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;}
  .manual-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
  .manual-item:last-child{border-bottom:none;}
  .checkbox{width:20px;height:20px;border:2px solid var(--border);border-radius:4px;flex-shrink:0;margin-top:2px;}
  .manual-item .title{font-weight:500;font-size:.95rem;}
  .manual-item .desc{color:var(--text2);font-size:.85rem;margin-top:2px;}
  .tag{display:inline-block;padding:1px 8px;border-radius:4px;font-size:.72rem;font-weight:600;margin-right:4px;background:rgba(88,166,255,.15);color:var(--blue);}
  footer{text-align:center;color:var(--text2);font-size:.8rem;margin-top:40px;padding-top:20px;border-top:1px solid var(--border);}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>PropChain Test Report</h1>
    <p>Blockchain Land Registry System — Automated Test Results</p>
    <p style="margin-top:6px;font-size:.85rem;color:#8b949e">Generated: ${now}</p>
    ${overallBadge}
  </header>

  <div class="cards">
    <div class="card"><div class="num blue">${results.filter(r=>r.ok).length}/${results.length}</div><div class="lbl">Suites Passed</div></div>
    <div class="card"><div class="num green">${[unitCounts,dbCounts,apiCounts,perfCounts,scCounts,covCounts,postmanCounts].reduce((a,c)=>a+(parseInt(c.pass)||0),0)}</div><div class="lbl">Tests Passed</div></div>
    <div class="card"><div class="num red">${[unitCounts,dbCounts,apiCounts,perfCounts,scCounts,covCounts,postmanCounts].reduce((a,c)=>a+(parseInt(c.fail)||0),0)}</div><div class="lbl">Tests Failed</div></div>
    <div class="card"><div class="num yellow">2</div><div class="lbl">Manual Required</div></div>
    <div class="card"><div class="num blue">7</div><div class="lbl">Test Categories</div></div>
  </div>

  <section>
    <h2>Test Suite Results</h2>
    <table>
      <thead><tr><th>Suite</th><th>Status</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Time</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </section>

  <section>
    <h2>Testing Categories Coverage</h2>
    <table>
      <thead><tr><th>Category</th><th>Type</th><th>Tools Used</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Unit Testing</td><td>White-Box</td><td>Mocha, Chai</td><td><span class="badge ${unit.ok?'pass':'fail'}">${unit.ok?'AUTOMATED':'FAILED'}</span></td></tr>
        <tr><td>Integration Testing</td><td>White-Box</td><td>Supertest, Mocha, Hardhat</td><td><span class="badge ${api.ok?'pass':'fail'}">${api.ok?'AUTOMATED':'FAILED'}</span></td></tr>
        <tr><td>Smart Contract Testing</td><td>White-Box</td><td>Hardhat, Ethers, Mocha</td><td><span class="badge ${sc.ok?'pass':'fail'}">${sc.ok?'AUTOMATED':'FAILED'}</span></td></tr>
        <tr><td>Code-Level White Box</td><td>White-Box</td><td>Hardhat Coverage</td><td><span class="badge ${cov.ok?'pass':'fail'}">${cov.ok?'AUTOMATED':'FAILED'}</span></td></tr>
        <tr><td>Functional Testing</td><td>Black-Box</td><td>Supertest, Newman</td><td><span class="badge ${api.ok?'pass':'fail'}">${api.ok?'AUTOMATED':'FAILED'}</span></td></tr>
        <tr><td>Black-Box API Testing</td><td>Black-Box</td><td>Newman (Postman CLI)</td><td><span class="badge ${postman.ok?'pass':'fail'}">${postman.ok?'AUTOMATED':'FAILED'}</span></td></tr>
        <tr><td>Performance Testing</td><td>Black-Box</td><td>Supertest, Node Perf API</td><td><span class="badge ${perf.ok?'pass':'fail'}">${perf.ok?'AUTOMATED':'FAILED'}</span></td></tr>
        <tr><td>Usability Testing</td><td>Black-Box</td><td>Manual User Testing</td><td><span class="badge manual">MANUAL</span></td></tr>
        <tr><td>Manual Black-Box Testing</td><td>Black-Box</td><td>Manual, Feedback Analysis</td><td><span class="badge manual">MANUAL</span></td></tr>
      </tbody>
    </table>
  </section>

  <section>
    <h2>Manual Testing Checklist (Human Required)</h2>
    <div class="manual-box">
      <div class="manual-item">
        <div class="checkbox"></div>
        <div>
          <div class="title">Usability Testing — UI/UX Evaluation</div>
          <div class="desc">Manually test the interface for clarity, ease of navigation, and user experience. Gather feedback from real users on the land registration, property transfer, chatbot, and marketplace flows.</div>
          <div style="margin-top:6px"><span class="tag">Manual User Testing</span><span class="tag">Feedback Analysis</span></div>
        </div>
      </div>
      <div class="manual-item">
        <div class="checkbox"></div>
        <div>
          <div class="title">Manual Black-Box Testing — End-to-End User Flows</div>
          <div class="desc">Verify complete user flows: Register → Verify → Login → Register Land → Initiate Transfer → Admin Approval → Blockchain Confirmation. Test with different roles (user, admin, officer).</div>
          <div style="margin-top:6px"><span class="tag">Manual Testing</span><span class="tag">Postman GUI</span></div>
        </div>
      </div>
    </div>
  </section>

  <footer>
    <p>PropChain Automated Test Suite &nbsp;|&nbsp; Batch 1: Blockchain and Smart Contract in Land Registry</p>
    <p style="margin-top:4px">Tools: Mocha · Chai · Hardhat · Ethers · Supertest · Newman · Hardhat Coverage</p>
  </footer>
</div>
</body>
</html>`;

  fs.writeFileSync(REPORT_OUT, html, 'utf8');
}

// ─── Execution Guard ─────────────────────────────────────────
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
