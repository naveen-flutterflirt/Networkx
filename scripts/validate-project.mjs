import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const fail = (msg) => { throw new Error(msg); };
const exists = (p) => fs.existsSync(path.join(root, p));

const pkg = readJson('package.json');
const firebase = readJson('firebase.json');
const careers = readJson('data/careerPaths.json');
const careerSeo = readJson('data/careerSeo.json');
const legacySitemap = readJson('data/legacySitemap.json');

if (pkg.name !== 'itlearn360-career-intelligence') fail('Unexpected package name.');
if (firebase?.hosting?.public !== 'out') fail('Firebase Hosting must deploy the Next static export from out/.');
if (!Array.isArray(careers.paths) || careers.paths.length !== 23) fail(`Expected 23 career paths, found ${careers.paths?.length ?? 0}.`);
if (!Array.isArray(careerSeo) || careerSeo.length !== 23) fail(`Expected 23 career SEO rows, found ${careerSeo?.length ?? 0}.`);
if (!Array.isArray(legacySitemap) || legacySitemap.length < 200) fail('Legacy sitemap inventory is unexpectedly small.');

const ids = new Set();
const slugs = new Set();
const warnings = [];
const requiredSeo = ['h1','title','description','primaryKeyword','secondaryKeywords','canonical','breadcrumbTitle','ogImage','robots','dateModified'];
for (const c of careers.paths) {
  if (!c.id || ids.has(c.id)) fail(`Duplicate/missing career id: ${c.id}`);
  if (!c.slug || slugs.has(c.slug)) fail(`Duplicate/missing career slug: ${c.slug}`);
  ids.add(c.id); slugs.add(c.slug);
  for (const key of requiredSeo) if (c.seo?.[key] === undefined || c.seo?.[key] === null || c.seo?.[key] === '') fail(`Career ${c.id} missing seo.${key}`);
  const expectedCanonical = `https://www.itlearn360.com/career-paths/${c.slug}`;
  if (c.seo.canonical !== expectedCanonical) fail(`Career ${c.id} canonical mismatch: ${c.seo.canonical}`);
  for (const related of c.relatedPathIds || []) if (!careers.paths.some((x) => x.id === related)) warnings.push(`Career ${c.id} references non-present relatedPathId ${related}`);

  // Runtime-shape guardrail. Most career fields are arrays. Two interview
  // fields are allowed to be either arrays or a single string because the
  // canonical data currently contains both shapes and lib/careers.ts
  // normalizes them before rendering.
  const arrayFields = ['whoIsItFor','jobRoles','skills','tools','workflows','stages','curriculum','portfolioDeliverables','courseIds','courses','relatedPathIds'];
  for (const field of arrayFields) {
    if (c[field] !== undefined && c[field] !== null && !Array.isArray(c[field])) fail(`Career ${c.id}.${field} must be an array.`);
  }
  if (c.interviewPrep) {
    for (const field of ['resumeBullets','jobTitlesToSearch']) {
      const value = c.interviewPrep[field];
      if (value !== undefined && value !== null && !Array.isArray(value) && typeof value !== 'string') fail(`Career ${c.id}.interviewPrep.${field} has an unsupported type.`);
      if (typeof value === 'string') warnings.push(`Career ${c.id}.interviewPrep.${field} is a string and will be normalized to a one-item array.`);
    }
    const questions = c.interviewPrep.topQuestions;
    if (questions !== undefined && questions !== null && !Array.isArray(questions)) fail(`Career ${c.id}.interviewPrep.topQuestions must be an array.`);
  }
}


// Career hub guardrails: every career should have hero video metadata, and the
// native career page must include the hero-video and relevant-quiz components.
for (const c of careers.paths) {
  if (!c.media?.youtubeVideoId) fail(`Career ${c.id} missing media.youtubeVideoId for hero video.`);
  if (!c.media?.thumbnailUrl) fail(`Career ${c.id} missing media.thumbnailUrl for hero video poster.`);
}
const careerDetailSource = fs.readFileSync(path.join(root, 'app/(native)/career-paths/[slug]/page.tsx'), 'utf8');
if (!careerDetailSource.includes('CareerHeroVideo')) fail('Career detail page is missing CareerHeroVideo.');
if (!careerDetailSource.includes('RelevantCareerQuizzes')) fail('Career detail page is missing RelevantCareerQuizzes.');
if (!exists('components/CareerHeroVideo.tsx')) fail('Missing CareerHeroVideo component.');
if (!exists('components/RelevantCareerQuizzes.tsx')) fail('Missing RelevantCareerQuizzes component.');

const seoSlugs = new Set(careerSeo.map((x) => x.slug));
for (const slug of slugs) if (!seoSlugs.has(slug)) fail(`careerSeo.json missing ${slug}`);

const requiredRoutes = [
  // Native-owned routes
  'app/(native)/page.tsx',
  'app/(native)/career-paths/page.tsx',
  'app/(native)/career-paths/[slug]/page.tsx',
  'app/(native)/market/page.tsx',
  'app/(native)/my-career/page.tsx',
  'app/(native)/resources/page.tsx',
  'app/(native)/advisor/page.tsx',
  // Original V1 route inventory preserved as wrappers
  'app/(legacy)/admin/page.tsx',
  'app/(legacy)/blog/page.tsx',
  'app/(legacy)/blogs/page.tsx',
  'app/(legacy)/career-intelligence/page.tsx',
  'app/(legacy)/career-path/page.tsx',
  'app/(legacy)/cert/page.tsx',
  'app/(legacy)/certifications/page.tsx',
  'app/(legacy)/certq/page.tsx',
  'app/(legacy)/contact/page.tsx',
  'app/(legacy)/course/page.tsx',
  'app/(legacy)/courses/page.tsx',
  'app/(legacy)/dashboard/page.tsx',
  'app/(legacy)/data-deletion/page.tsx',
  'app/(legacy)/ebooks/page.tsx',
  'app/(legacy)/enrollment-consent/page.tsx',
  'app/(legacy)/job-placement/page.tsx',
  'app/(legacy)/jobs/page.tsx',
  'app/(legacy)/learn/page.tsx',
  'app/(legacy)/login/page.tsx',
  'app/(legacy)/module/page.tsx',
  'app/(legacy)/payment/page.tsx',
  'app/(legacy)/payment-policy/page.tsx',
  'app/(legacy)/payment/cancel/page.tsx',
  'app/(legacy)/payment/success/page.tsx',
  'app/(legacy)/privacy-policy/page.tsx',
  'app/(legacy)/q/page.tsx',
  'app/(legacy)/quiz/page.tsx',
  'app/(legacy)/quizzes/page.tsx',
  'app/(legacy)/refund/page.tsx',
  'app/(legacy)/sql-editor/page.tsx',
  'app/(legacy)/terms/page.tsx',
  // Global compatibility/data files
  'app/(legacy)/layout.tsx',
  'components/SeoFromFirestore.tsx',
  'components/LegacyContextBar.tsx',
  'lib/firebase.ts',
  'lib/api.ts',
  'lib/market.ts',
  'public/dist/js/app.js',
  'public/dist/js/router.js',
  'public/dist/js/views/jobs.js',
  'public/dist/js/views/resume.js',
  'public/dist/styles.css',
  'public/legacy-theme.css',
  'firestore.jobs.rules.example',
  'public/ads.txt',
  'DATA_NOTES.md',
];
for (const p of requiredRoutes) if (!exists(p)) fail(`Missing required parity file: ${p}`);

// Architecture guardrails: V1 uses two Firebase projects and only one browser API.
const firebaseSource = fs.readFileSync(path.join(root, 'lib/firebase.ts'), 'utf8');
if (!firebaseSource.includes('e-learning-7d5c2')) fail('Main Firebase project e-learning-7d5c2 is not preserved.');
if (!firebaseSource.includes('gcresai')) fail('Separate Jobs Firebase project gcresai is not preserved.');
if (!firebaseSource.includes("namedApp('jobsApp')")) fail('Jobs Firebase named app initialization is missing.');

const apiSource = fs.readFileSync(path.join(root, 'lib/api.ts'), 'utf8');
if (!apiSource.includes('https://api.itlearn360.com')) fail('Expected browser API base api.itlearn360.com is missing.');

const forbiddenApiVars = ['NEXT_PUBLIC_JOBS_API_BASE_URL', 'NEXT_PUBLIC_RAG_API_BASE_URL'];
for (const name of forbiddenApiVars) {
  for (const rel of ['lib', 'app', 'components', '.env.example']) {
    const target = path.join(root, rel);
    if (!fs.existsSync(target)) continue;
    const scanFiles = [];
    const collect = (node) => {
      const stat = fs.statSync(node);
      if (stat.isDirectory()) for (const entry of fs.readdirSync(node)) collect(path.join(node, entry));
      else scanFiles.push(node);
    };
    collect(target);
    for (const file of scanFiles) {
      if (fs.readFileSync(file, 'utf8').includes(name)) fail(`Forbidden split API variable ${name} found in ${path.relative(root, file)}`);
    }
  }
}

if (exists('public/legacy/index.html')) fail('Final architecture must not depend on public/legacy/index.html.');

// The unified shell owns these routes. Stale root-level public HTML files would
// compete with exported /route/index.html files when Firebase cleanUrls is on.
for (const conflict of ['public/courses.html', 'public/data-deletion.html']) {
  if (exists(conflict)) fail(`Conflicting stale public HTML must be removed: ${conflict}`);
}

const legacyLayoutSource = fs.readFileSync(path.join(root, 'app/(legacy)/layout.tsx'), 'utf8');
if (!legacyLayoutSource.includes("import Header from '@/components/Header'")) fail('Legacy routes must use the unified Next.js Header.');
if (!legacyLayoutSource.includes("import Footer from '@/components/Footer'")) fail('Legacy routes must use the unified Next.js Footer.');
if (legacyLayoutSource.includes('className="lms-header"')) fail('Old V1 public header is still rendered by the legacy layout.');

const legacyAppSource = fs.readFileSync(path.join(root, 'public/dist/js/app.js'), 'utf8');
for (const obsoleteShellInit of ['initCoursesMegaMenu();','initProfileMenu();','initFooter();']) {
  if (legacyAppSource.includes(obsoleteShellInit)) fail(`Obsolete V1 shell initialization remains: ${obsoleteShellInit}`);
}

const rewrites = firebase?.hosting?.rewrites || [];
const rewriteSources = new Set(rewrites.map((x) => x.source));
const requiredRewrites = ['/jobs/**','/blogs/**','/blog/**','/course/**','/q/**','/cert/**','/certq/**','/payment/**','/ebooks/**','/module/**','/learn/**','/quiz/**','/admin/**','/career-path/**'];
for (const source of requiredRewrites) if (!rewriteSources.has(source)) fail(`Missing Firebase dynamic-route rewrite: ${source}`);
for (const rewrite of rewrites) {
  if (rewrite.destination === '/legacy/index.html') fail(`Obsolete catch-all legacy destination found for ${rewrite.source}`);
}

// Validate relative ESM imports in the preserved V1 runtime.
const jsRoot = path.join(root, 'public/dist/js');
const jsFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) jsFiles.push(full);
  }
};
walk(jsRoot);
const importRe = /(?:from\s*|import\s*\()\s*["']([^"']+)["']/g;
for (const file of jsFiles) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = importRe.exec(text))) {
    const spec = match[1].split('?')[0];
    if (!spec.startsWith('.')) continue;
    const target = path.resolve(path.dirname(file), spec);
    if (!fs.existsSync(target)) fail(`Missing V1 JS import target: ${path.relative(root,file)} -> ${spec}`);
  }
}

console.log(JSON.stringify({
  ok: true,
  careerPaths: careers.paths.length,
  careerSeoRows: careerSeo.length,
  legacySitemapEntries: legacySitemap.length,
  preservedV1JsFiles: jsFiles.length,
  firebaseRewrites: rewrites.length,
  warnings,
}, null, 2));
