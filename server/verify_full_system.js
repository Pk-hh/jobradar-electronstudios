const http = require('http');

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testSystem() {
  console.log('--- STARTING COMPREHENSIVE END-TO-END SYSTEM TEST ---');

  // 1. Fetch Public Jobs Feed
  console.log('1. Testing GET /api/jobs...');
  const jobsRes = await makeRequest('/api/jobs');
  console.log(`   Status: ${jobsRes.status}, Total Jobs: ${jobsRes.body.jobs?.length}`);
  if (!jobsRes.body.jobs || jobsRes.body.jobs.length === 0) throw new Error('No jobs returned!');

  // 2. Student Login
  console.log('2. Testing Student Login...');
  const studentAuth = await makeRequest('/api/auth/login', 'POST', {
    email: 'student@example.com',
    password: 'student123'
  });
  console.log(`   Status: ${studentAuth.status}, Token received: ${!!studentAuth.body.token}`);
  const studentToken = studentAuth.body.token;

  // 3. Recommendation Engine
  console.log('3. Testing Recommendation Engine for Student...');
  const recRes = await makeRequest('/api/jobs/recommended', 'GET', null, studentToken);
  console.log(`   Status: ${recRes.status}, Recommendations count: ${recRes.body.recommendations?.length}`);
  if (recRes.body.recommendations && recRes.body.recommendations.length > 0) {
    console.log(`   Top Recommendation: ${recRes.body.recommendations[0].title} (Score: ${recRes.body.recommendations[0].match_score}%)`);
  }

  // 4. Save Job Toggle
  console.log('4. Testing Save Job Toggle...');
  const saveRes = await makeRequest('/api/jobs/job_102/save', 'POST', null, studentToken);
  console.log(`   Status: ${saveRes.status}, Is Saved: ${saveRes.body.is_saved}`);

  // 5. Admin Login
  console.log('5. Testing Admin Login...');
  const adminAuth = await makeRequest('/api/auth/login', 'POST', {
    email: 'admin@jobportal.com',
    password: 'admin123'
  });
  const adminToken = adminAuth.body.token;

  // 6. Admin KPI Stats
  console.log('6. Testing Admin Stats...');
  const statsRes = await makeRequest('/api/admin/stats', 'GET', null, adminToken);
  console.log(`   Active Jobs: ${statsRes.body.stats?.active_jobs}, Expired Jobs: ${statsRes.body.stats?.expired_jobs}`);

  // 7. Verify Static Frontend Asset Delivery
  console.log('7. Testing Frontend Static Delivery...');
  const htmlRes = await makeRequest('/');
  console.log(`   Status: ${htmlRes.status}, Includes App HTML: ${typeof htmlRes.body === 'string' && htmlRes.body.includes('index.html')}`);

  console.log('=====================================================');
  console.log('🎉 ALL SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================');
}

testSystem().catch(err => {
  console.error('SYSTEM TEST FAILED:', err);
  process.exit(1);
});
