import fs from 'node:fs';
import crypto from 'node:crypto';

const read = (p) => fs.readFileSync(p, 'utf8');
const checks = [];
function check(name, condition) { checks.push({name, ok:Boolean(condition)}); if (!condition) process.exitCode = 1; }

const nextConfig = read('next.config.mjs');
for (const prefix of ['jobs','blogs','blog','course','q','cert','certq','ebooks','module','learn','quiz','admin','career-path']) {
  check(`dev rewrite ${prefix}`, nextConfig.includes(`/${prefix}/:path*`));
}
const header = read('components/Header.tsx');
check('payment in course menu', header.includes("label: 'Make Payment'") && header.includes("href: '/payment'"));
check('payment in profile menu', header.includes('<a href="/payment">Make Payment</a>'));

const discovery = read('components/CareerDiscovery.tsx');
check('career questionnaire visible by default', discovery.includes('const [started, setStarted] = useState(true)'));

const courseRoute = read('app/(legacy)/course/[slug]/page.tsx');
const sitemap = JSON.parse(read('data/legacySitemap.json'));
check('manual testing course in sitemap', sitemap.some((x) => String(x.url||'').includes('/course/mastering-manual-testing-fundamentals')));
check('course static route generation', courseRoute.includes('generateStaticParams'));

const layout = read('app/(legacy)/layout.tsx');
const app = read('public/dist/js/app.js');
check('v313 app cache token', layout.includes('20260826-frontend-v313'));
check('jobs v313 import', app.includes('./views/jobs.js?v=20260826-frontend-v313'));
check('job v313 import', app.includes('./views/job.js?v=20260826-frontend-v313'));
check('courses v313 import', app.includes('./views/courses.js?v=20260826-frontend-v313'));
check('course v313 import', app.includes('./views/course.js?v=20260826-frontend-v313'));
check('quizzes v313 import', app.includes('./views/quizzes.js?v=20260826-frontend-v313'));
check('quiz v313 import', app.includes('./views/quiz.js?v=20260826-frontend-v313'));
check('player v313 import', app.includes('./views/player.js?v=20260826-frontend-v313'));

const jobs = read('public/dist/js/views/jobs.js');
check('jobs purpose-specific hero', jobs.includes('jobs-search-hero') && jobs.includes('Find your next role.'));
check('jobs stats null regression absent', !jobs.includes('jobs_statsContent'));
check('jobs redundant sidebar absent', !jobs.includes('CAREER-FIRST SEARCH') && !jobs.includes('CAREER RESOURCES'));

const job = read('public/dist/js/views/job.js');
check('job light purpose-specific hero', job.includes('background:linear-gradient(135deg,#f1faf6'));
check('career connection before application', job.indexOf('renderCareerConnection(job)') > -1 && job.indexOf('renderCareerConnection(job)') < job.indexOf('job-application-card'));
check('mapped career breadcrumb', job.includes('careerMapping.primary') && job.includes('careerMapping.primary.url'));

const courses = read('public/dist/js/views/courses.js');
check('course catalog hero', courses.includes('courseCatalogHeroV313'));
check('course catalog search in hero', courses.includes('courseCatalogSearchV313') && courses.includes('coursesSearch'));
const course = read('public/dist/js/views/course.js');
check('course detail hero', course.includes('courseDetailHeroV313'));
check('course detail action buttons', course.includes('courseHeroStartBtn') && course.includes('courseHeroSyllabusBtn'));

const quizzes = read('public/dist/js/views/quizzes.js');
check('quiz library hero', quizzes.includes('quizLibraryHeroV313'));
const pubQuiz = read('public/dist/js/views/quizPublic.js');
check('public quiz hero', pubQuiz.includes('quizDetailHeroV313') && pubQuiz.includes('quizJumpStartBtn'));
check('public quiz canonical uses public route', pubQuiz.includes('const canonicalPath=`/q/'));
const quiz = read('public/dist/js/views/quiz.js');
check('course quiz hero', quiz.includes('quizAttemptHeroV313'));
check('old protected quiz dark hero removed', !quiz.includes('background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%)'));

for (const name of ['jobs.js','job.js','courses.js','course.js','quizzes.js','quiz.js','quizPublic.js']) {
  const a = fs.readFileSync(`public/dist/js/views/${name}`);
  const b = fs.readFileSync(`public/js/views/${name}`);
  const hash = (x) => crypto.createHash('sha256').update(x).digest('hex');
  check(`${name} source/dist synchronized`, hash(a) === hash(b));
}

const failures = checks.filter((x)=>!x.ok);
for (const x of checks) console.log(`${x.ok?'PASS':'FAIL'}  ${x.name}`);
if (failures.length) {
  console.error(`\n${failures.length} frontend regression check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} frontend regression checks passed.`);
