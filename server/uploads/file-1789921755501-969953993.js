const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'job_platform.db');
const db = new Database(dbPath);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');

function initDB() {
  console.log('Initializing database tables...');

  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'user',
      qualification TEXT,
      degree TEXT,
      branch TEXT,
      graduation_year INTEGER,
      skills TEXT,
      preferred_locations TEXT,
      preferred_categories TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Jobs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      logo TEXT,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      work_mode TEXT NOT NULL,
      salary TEXT,
      stipend TEXT,
      experience TEXT NOT NULL,
      qualification TEXT,
      branch TEXT,
      skills TEXT,
      eligibility TEXT,
      vacancies INTEGER DEFAULT 1,
      posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      application_start DATETIME,
      application_deadline DATETIME NOT NULL,
      selection_process TEXT,
      official_notification_url TEXT,
      application_url TEXT NOT NULL,
      source TEXT,
      status TEXT DEFAULT 'Published',
      verified INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      clicks_count INTEGER DEFAULT 0
    );
  `);

  // Saved Jobs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_jobs (
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, job_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // Applications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      status TEXT DEFAULT 'Applied',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      job_id TEXT,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Notification Preferences
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY,
      new_jobs INTEGER DEFAULT 1,
      internships INTEGER DEFAULT 1,
      govt_jobs INTEGER DEFAULT 1,
      deadline_reminders INTEGER DEFAULT 1,
      recommendations INTEGER DEFAULT 1
    );
  `);

  // Job Reports Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_reports (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      user_id TEXT,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount > 0) return;

  console.log('Seeding initial data...');
  const salt = bcrypt.genSaltSync(10);

  // Admin User
  const adminId = 'usr_admin_1';
  const adminPass = bcrypt.hashSync('admin123', salt);
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, qualification, degree, branch, graduation_year, skills, preferred_locations, preferred_categories)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    'System Admin',
    'admin@jobportal.com',
    adminPass,
    '+91 9876543210',
    'admin',
    'B.Tech',
    'Computer Science',
    'CSE',
    2023,
    JSON.stringify(['Management', 'Recruitment', 'Platform Operations']),
    JSON.stringify(['All India']),
    JSON.stringify(['Jobs', 'Government', 'Internships'])
  );

  // Student User
  const studentId = 'usr_student_1';
  const studentPass = bcrypt.hashSync('student123', salt);
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, phone, role, qualification, degree, branch, graduation_year, skills, preferred_locations, preferred_categories)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    studentId,
    'Rahul Sharma',
    'student@example.com',
    studentPass,
    '+91 9123456789',
    'user',
    'B.Tech',
    'Bachelor of Technology',
    'Computer Science & Engineering',
    2026,
    JSON.stringify(['React', 'Node.js', 'Python', 'SQL', 'Data Structures']),
    JSON.stringify(['Hyderabad', 'Remote', 'Bengaluru']),
    JSON.stringify(['Jobs', 'Internships', 'Freshers', 'Work From Home'])
  );

  db.prepare(`
    INSERT INTO notification_preferences (user_id) VALUES (?)
  `).run(studentId);

  // Sample Jobs
  const sampleJobs = [
    {
      id: 'job_101',
      title: 'Software Engineer – Fresher',
      company: 'ABC Technologies',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      description: 'ABC Technologies is hiring Associate Software Engineers for our Core Engineering team. You will work on scalable web applications, REST APIs, and modern frontend frameworks.',
      category: 'Freshers',
      sub_category: 'Software',
      type: 'Full Time',
      location: 'Hyderabad',
      work_mode: 'On-site',
      salary: '₹4.5 – 6.5 LPA',
      stipend: null,
      experience: 'Fresher (0-1 Yrs)',
      qualification: 'B.Tech / B.E / M.Tech / MCA',
      branch: 'CSE, IT, ECE',
      skills: JSON.stringify(['Java', 'JavaScript', 'React', 'SQL', 'Git']),
      eligibility: '60% or 6.5 CGPA throughout academics (10th, 12th, Graduation). No active backlogs.',
      vacancies: 25,
      posted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 5 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      selection_process: '1. Online Coding Assessment\n2. Technical Interview Round 1\n3. Technical Interview Round 2\n4. HR Discussion',
      official_notification_url: 'https://abctechnologies.example.com/careers/freshers-2026',
      application_url: 'https://abctechnologies.example.com/apply/se-fresher',
      source: 'Official Campus Portal',
      status: 'Published',
      verified: 1,
      featured: 1
    },
    {
      id: 'job_102',
      title: 'AI/ML Research Intern',
      company: 'TensorAI Labs',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      description: 'TensorAI Labs invites applications for 6-month AI/ML Research Interns. You will research LLM optimization, computer vision models, and model quantization techniques.',
      category: 'Internships',
      sub_category: 'AI/ML',
      type: 'Internship',
      location: 'Remote',
      work_mode: 'Remote',
      salary: null,
      stipend: '₹30,000 / month',
      experience: 'Fresher / Student',
      qualification: 'B.Tech / M.Tech / MS / PhD',
      branch: 'CSE, Data Science, AI, Mathematics',
      skills: JSON.stringify(['Python', 'PyTorch', 'TensorFlow', 'Deep Learning', 'NLP']),
      eligibility: 'Strong mathematical background in linear algebra & probability. Hands-on PyTorch experience.',
      vacancies: 8,
      posted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 3 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      selection_process: '1. GitHub Portfolio Screening\n2. ML Problem Solving Interview\n3. Team Fit Interview',
      official_notification_url: 'https://tensorai.example.com/internships/ml-2026',
      application_url: 'https://tensorai.example.com/apply/ml-intern',
      source: 'Direct Recruiter Posting',
      status: 'Published',
      verified: 1,
      featured: 1
    },
    {
      id: 'job_103',
      title: 'SSC CGL 2026 - Combined Graduate Level',
      company: 'Staff Selection Commission (SSC)',
      logo: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=120&auto=format&fit=crop&q=80',
      description: 'Official Notification for SSC CGL 2026. Staff Selection Commission will conduct the Combined Graduate Level Examination for filling up Group B and Group C posts in various Ministries/Departments.',
      category: 'Government',
      sub_category: 'SSC',
      type: 'Full Time',
      location: 'All India',
      work_mode: 'On-site',
      salary: '₹35,400 – ₹1,12,400 / month (Level 6/7 Pay Matrix)',
      stipend: null,
      experience: 'Fresher (Age 18-30 Years)',
      qualification: 'Bachelor\'s Degree in any discipline from a recognized University',
      branch: 'All Branches / Streams',
      skills: JSON.stringify(['General Intelligence', 'Quantitative Aptitude', 'English Comprehension', 'General Awareness']),
      eligibility: 'Age Limit: 18 to 30 years as of cutoff date. Relaxation applicable for reserved categories.',
      vacancies: 14250,
      posted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 4 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
      selection_process: '1. Tier-I Computer Based Exam\n2. Tier-II Computer Based Exam & Data Entry Speed Test\n3. Document Verification & Medical Exam',
      official_notification_url: 'https://ssc.gov.in/notifications/cgl-2026-pdf',
      application_url: 'https://ssc.gov.in/apply-cgl-2026',
      source: 'Official Govt Gazette',
      status: 'Published',
      verified: 1,
      featured: 1
    },
    {
      id: 'job_104',
      title: 'ISRO Scientist / Engineer \'SC\' Recruitment',
      company: 'Indian Space Research Organisation (ISRO)',
      logo: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=120&auto=format&fit=crop&q=80',
      description: 'ISRO Centralised Recruitment Board (ICRB) invites online applications for Scientist/Engineer \'SC\' in Civil, Electrical, Mechanical, Electronics, and Computer Science streams.',
      category: 'Government',
      sub_category: 'Defence',
      type: 'Full Time',
      location: 'Bengaluru / Sriharikota / All India',
      work_mode: 'On-site',
      salary: '₹56,100 / month (Pay Matrix Level 10) + HRA & DA',
      stipend: null,
      experience: 'Fresher / GATE Qualified',
      qualification: 'B.E / B.Tech or equivalent with aggregate minimum 65% marks or CGPA 6.84/10',
      branch: 'CSE, ECE, Mechanical, Civil, Electrical',
      skills: JSON.stringify(['Core Engineering', 'Control Systems', 'C/C++', 'Circuit Design', 'Thermodynamics']),
      eligibility: 'First Class B.E/B.Tech degree. Valid GATE score or ISRO Written Test scorecard.',
      vacancies: 210,
      posted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 3 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
      selection_process: '1. Written Test (100 Objective Questions)\n2. Technical Interview (80% GATE/Written + 20% Interview weightage)',
      official_notification_url: 'https://isro.gov.in/careers/isro-sc-2026.pdf',
      application_url: 'https://apps.isro.gov.in/icrb2026',
      source: 'ISRO Official Portal',
      status: 'Published',
      verified: 1,
      featured: 1
    },
    {
      id: 'job_105',
      title: 'Embedded Systems & Firmware Engineer',
      company: 'Qualcomm India',
      logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&auto=format&fit=crop&q=80',
      description: 'Qualcomm is seeking Entry Level Embedded Software Engineers to build next-generation Snapdragon IoT, Automotive, and 5G modem drivers.',
      category: 'Private',
      sub_category: 'Embedded Systems',
      type: 'Full Time',
      location: 'Bengaluru',
      work_mode: 'Hybrid',
      salary: '₹14 – 18 LPA',
      stipend: null,
      experience: '0-2 Years',
      qualification: 'B.Tech / M.Tech',
      branch: 'ECE, EEE, Embedded Systems, CSE',
      skills: JSON.stringify(['Embedded C', 'C++', 'RTOS', 'ARM Architecture', 'Linux Kernel']),
      eligibility: 'Strong C/C++ programming foundation, understanding of OS concepts, microcontrollers, and protocols (SPI, I2C, UART).',
      vacancies: 12,
      posted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 2 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      selection_process: '1. Online C/Data Structures Test\n2. Technical Round 1 (Systems Programming)\n3. Technical Round 2 (Architecture Design)\n4. Managerial & HR',
      official_notification_url: 'https://qualcomm.example.com/careers/embedded-2026',
      application_url: 'https://qualcomm.example.com/jobs/req109283',
      source: 'Qualcomm Career Portal',
      status: 'Published',
      verified: 1,
      featured: 0
    },
    {
      id: 'job_106',
      title: 'VLSI Chip Design Graduate Apprentice',
      company: 'Texas Instruments',
      logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&auto=format&fit=crop&q=80',
      description: '1-Year Government Apprenticeship Program under NATS at Texas Instruments Bengaluru. Training on Digital IC design, Verilog synthesis, and DFT testing.',
      category: 'Apprenticeships',
      sub_category: 'VLSI',
      type: 'Apprenticeship',
      location: 'Bengaluru',
      work_mode: 'On-site',
      salary: null,
      stipend: '₹35,000 / month',
      experience: 'Fresher (2025/2026 Batch)',
      qualification: 'B.Tech / M.Tech',
      branch: 'ECE, Microelectronics, VLSI',
      skills: JSON.stringify(['Verilog', 'SystemVerilog', 'Digital Design', 'CMOS', 'Cadence EDA']),
      eligibility: 'Graduated in 2025 or graduating in 2026 with minimum 70% marks. Enrolled on NATS portal.',
      vacancies: 15,
      posted_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 6 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
      selection_process: '1. Written Digital Logic Test\n2. Verilog Coding Interview\n3. Selection Board Interview',
      official_notification_url: 'https://ti.example.com/apprenticeship-2026',
      application_url: 'https://ti.example.com/apply/nats-vlsi',
      source: 'NATS National Apprenticeship Portal',
      status: 'Published',
      verified: 1,
      featured: 0
    },
    {
      id: 'job_107',
      title: 'Full Stack Web Developer (React + Node)',
      company: 'NextGen Soft Solutions',
      logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80',
      description: 'Join NextGen Soft as a Full Stack Web Developer. You will be responsible for creating modern responsive UIs and robust backend APIs for high-traffic SaaS products.',
      category: 'Work From Home',
      sub_category: 'Web Development',
      type: 'Full Time',
      location: 'Remote',
      work_mode: 'Remote',
      salary: '₹6.0 – 9.0 LPA',
      stipend: null,
      experience: '1-3 Years',
      qualification: 'B.Tech / BCA / MCA / B.Sc CS',
      branch: 'CSE, IT, Application Software',
      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'MongoDB', 'Tailwind CSS']),
      eligibility: 'At least 1 year of hands-on React & Node.js experience. Proven portfolio or deployed project links required.',
      vacancies: 6,
      posted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 4 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      selection_process: '1. Take-home Full Stack Assignment (24h)\n2. Live Code Review\n3. Founder Discussion',
      official_notification_url: 'https://nextgensoft.example.com/careers/fullstack',
      application_url: 'https://nextgensoft.example.com/apply/dev',
      source: 'LinkedIn Partner Post',
      status: 'Published',
      verified: 1,
      featured: 0
    },
    {
      id: 'job_108',
      title: 'SBI Probationary Officer (PO) Recruitment 2026',
      company: 'State Bank of India (SBI)',
      logo: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=120&auto=format&fit=crop&q=80',
      description: 'State Bank of India invites applications for the post of Probationary Officer in branches across India. High growth potential, pension benefits, and official quarter allowances.',
      category: 'Government',
      sub_category: 'Banking',
      type: 'Full Time',
      location: 'All India',
      work_mode: 'On-site',
      salary: '₹65,000 / month starting CTC (~₹8.2 LPA equivalent)',
      stipend: null,
      experience: 'Fresher (Age 21-30 Years)',
      qualification: 'Graduation in any discipline from a recognized University',
      branch: 'Any Graduate (Engineering, Commerce, Science, Arts)',
      skills: JSON.stringify(['Reasoning Ability', 'Quantitative Aptitude', 'Banking Awareness', 'English Language']),
      eligibility: 'Candidates in the final year/semester of graduation can also apply provisionally.',
      vacancies: 2000,
      posted_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 7 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 16 * 86400000).toISOString(),
      selection_process: '1. Preliminary Examination\n2. Main Examination & Descriptive Test\n3. Psychometric Test, Group Exercise & Interview',
      official_notification_url: 'https://sbi.co.in/careers/sbi-po-2026-notification.pdf',
      application_url: 'https://ibpsonline.ibps.in/sbipo2026',
      source: 'SBI Official Portal',
      status: 'Published',
      verified: 1,
      featured: 1
    },
    {
      id: 'job_109',
      title: 'Walk-in Drive: Junior QA & Software Tester',
      company: 'TCS - Tata Consultancy Services',
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
      description: 'Direct Walk-in Interview for Junior QA Testers at TCS Siruseri Campus, Chennai. Immediate joiners preferred. Bring updated resume, Government ID, and degree certificates.',
      category: 'Walk-in',
      sub_category: 'Software Testing',
      type: 'Full Time',
      location: 'Chennai',
      work_mode: 'On-site',
      salary: '₹3.6 – 4.5 LPA',
      stipend: null,
      experience: '0-1 Years',
      qualification: 'B.Sc / BCA / B.Tech',
      branch: 'All CS/IT & Science Streams',
      skills: JSON.stringify(['Manual Testing', 'Selenium Java', 'Bug Tracking', 'Jira', 'SQL Queries']),
      eligibility: '2024, 2025, 2026 passouts. Walk-in venue registration closes at 11:00 AM on interview day.',
      vacancies: 50,
      posted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 1 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
      selection_process: '1. On-the-spot Aptitude & Technical Test\n2. One-on-one Interview\n3. Immediate Spot Offer Letter',
      official_notification_url: 'https://tcs.example.com/walkin/chennai-qa-2026',
      application_url: 'https://tcs.example.com/register/walkin-qa',
      source: 'TCS NextStep Portal',
      status: 'Published',
      verified: 1,
      featured: 0
    },
    {
      id: 'job_110',
      title: 'Graduate Engineer Trainee (GET) - Campus Drive',
      company: 'L&T Construction',
      logo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&auto=format&fit=crop&q=80',
      description: 'Larsen & Toubro Limited is conducting a pool campus recruitment drive for Graduate Engineer Trainees across Civil, Mechanical, and Electrical domains.',
      category: 'Campus Jobs',
      sub_category: 'Mechanical / Civil',
      type: 'Full Time',
      location: 'Mumbai / Delhi NCR / Chennai',
      work_mode: 'On-site',
      salary: '₹5.25 LPA + Site Allowances',
      stipend: null,
      experience: 'Fresher (2026 Graduating)',
      qualification: 'B.E / B.Tech',
      branch: 'Civil, Mechanical, Electrical',
      skills: JSON.stringify(['AutoCAD', 'Structural Engineering', 'Project Management', 'Construction Planning']),
      eligibility: 'Minimum 65% aggregate throughout Xth, XIIth, and B.Tech up to 6th Semester.',
      vacancies: 100,
      posted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 3 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 8 * 86400000).toISOString(),
      selection_process: '1. Online Cognitive & Domain Assessment\n2. Group Discussion\n3. Technical & HR Panel Interview',
      official_notification_url: 'https://lntecc.example.com/campus/get-2026',
      application_url: 'https://lntecc.example.com/apply/get-2026',
      source: 'University Placement Cell',
      status: 'Published',
      verified: 1,
      featured: 0
    },
    {
      id: 'job_111',
      title: 'NTPC Executive Trainees via GATE 2026',
      company: 'NTPC Limited (PSU)',
      logo: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=120&auto=format&fit=crop&q=80',
      description: 'NTPC Limited, India\'s premier Maharatna power utility, is recruiting Executive Trainees in Electrical, Mechanical, Electronics, and Instrumentation disciplines through GATE 2026 score.',
      category: 'Government',
      sub_category: 'PSU',
      type: 'Full Time',
      location: 'All India Power Stations',
      work_mode: 'On-site',
      salary: '₹50,000 – ₹1,60,000 / month (E-1 Level) (~₹15 LPA total CTC)',
      stipend: null,
      experience: 'Fresher (GATE 2026 Qualified)',
      qualification: 'Full-time Bachelor Degree in Engineering or Technology',
      branch: 'Electrical, Mechanical, Electronics, Instrumentation',
      skills: JSON.stringify(['Power Systems', 'Thermal Engineering', 'Instrumentation', 'Control Systems']),
      eligibility: 'Not less than 65% marks in engineering degree. GATE 2026 paper score in corresponding discipline.',
      vacancies: 350,
      posted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 4 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 22 * 86400000).toISOString(),
      selection_process: '1. GATE 2026 Shortlisting (85% weightage)\n2. Group Discussion (5% weightage)\n3. Personal Interview (10% weightage)',
      official_notification_url: 'https://careers.ntpc.co.in/et-2026-advt.pdf',
      application_url: 'https://careers.ntpc.co.in/apply',
      source: 'NTPC Official Gazette',
      status: 'Published',
      verified: 1,
      featured: 1
    },
    {
      id: 'job_112',
      title: 'UI/UX Design Intern',
      company: 'DesignCraft Studio',
      logo: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=120&auto=format&fit=crop&q=80',
      description: 'DesignCraft Studio is looking for a creative UI/UX Design Intern with a keen eye for modern mobile interfaces, wireframing, and Figma design systems.',
      category: 'Internships',
      sub_category: 'Design',
      type: 'Internship',
      location: 'Remote',
      work_mode: 'Remote',
      salary: null,
      stipend: '₹20,000 / month',
      experience: 'Fresher',
      qualification: 'Any Degree / Design Diploma',
      branch: 'Design, Fine Arts, CSE, Human-Computer Interaction',
      skills: JSON.stringify(['Figma', 'Prototyping', 'User Research', 'Wireframing', 'Design Systems']),
      eligibility: 'Figma portfolio showcasing mobile app UI designs or case studies.',
      vacancies: 4,
      posted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 2 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() + 11 * 86400000).toISOString(),
      selection_process: '1. Portfolio Evaluation\n2. 48-Hour Design Challenge\n3. Design Review Interview',
      official_notification_url: 'https://designcraft.example.com/interns',
      application_url: 'https://designcraft.example.com/apply/design-intern',
      source: 'Dribbble Jobs',
      status: 'Published',
      verified: 1,
      featured: 0
    },
    {
      id: 'job_199',
      title: 'Legacy Technical Assistant Drive (Expired Sample)',
      company: 'Old Corp Ltd',
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
      description: 'This is an example of an expired job opportunity used to test automatic expiration logic.',
      category: 'Private',
      sub_category: 'Software',
      type: 'Full Time',
      location: 'Pune',
      work_mode: 'On-site',
      salary: '₹3.5 LPA',
      stipend: null,
      experience: '0-1 Years',
      qualification: 'B.Sc / BCA',
      branch: 'CSE',
      skills: JSON.stringify(['C', 'SQL']),
      eligibility: 'Past deadline job sample.',
      vacancies: 2,
      posted_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      application_start: new Date(Date.now() - 30 * 86400000).toISOString(),
      application_deadline: new Date(Date.now() - 2 * 86400000).toISOString(), // Past deadline!
      selection_process: 'Closed',
      official_notification_url: 'https://example.com/old',
      application_url: 'https://example.com/old-apply',
      source: 'Archive',
      status: 'Expired',
      verified: 1,
      featured: 0
    }
  ];

  const insertJobStmt = db.prepare(`
    INSERT INTO jobs (
      id, title, company, logo, description, category, sub_category, type, location, work_mode,
      salary, stipend, experience, qualification, branch, skills, eligibility, vacancies,
      posted_at, application_start, application_deadline, selection_process,
      official_notification_url, application_url, source, status, verified, featured
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `);

  for (const job of sampleJobs) {
    insertJobStmt.run(
      job.id, job.title, job.company, job.logo, job.description, job.category, job.sub_category, job.type, job.location, job.work_mode,
      job.salary, job.stipend, job.experience, job.qualification, job.branch, job.skills, job.eligibility, job.vacancies,
      job.posted_at, job.application_start, job.application_deadline, job.selection_process,
      job.official_notification_url, job.application_url, job.source, job.status, job.verified, job.featured
    );
  }

  // Seed Saved Job for student
  db.prepare(`
    INSERT INTO saved_jobs (user_id, job_id, saved_at) VALUES (?, ?, ?)
  `).run(studentId, 'job_101', new Date().toISOString());

  // Seed Application for student
  db.prepare(`
    INSERT INTO applications (id, user_id, job_id, status, notes) VALUES (?, ?, ?, ?, ?)
  `).run('app_1', studentId, 'job_102', 'Applied', 'Applied directly via company official career portal on 18 Sep.');

  // Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, job_id, type, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(
    'notif_1',
    studentId,
    '🔔 NEW JOB ALERT: Software Engineer – Fresher',
    'ABC Technologies posted a new fresher opportunity in Hyderabad! Apply before Oct 5.',
    'job_101',
    'NEW_JOB',
    0
  );

  insertNotif.run(
    'notif_2',
    studentId,
    '🏛️ GOVT JOB: ISRO Scientist Recruitment 2026',
    'ISRO opened 210 Scientist/Engineer vacancies across CSE, ECE & Mech.',
    'job_104',
    'GOVT_JOB',
    0
  );

  insertNotif.run(
    'notif_3',
    studentId,
    '⏰ DEADLINE APPROACHING: TensorAI Internship',
    'AI/ML Research Intern application deadline is in 10 days.',
    'job_102',
    'DEADLINE_SOON',
    1
  );

  console.log('Seeding complete! Admin: admin@jobportal.com / admin123 | Student: student@example.com / student123');
}

module.exports = { db, initDB };
