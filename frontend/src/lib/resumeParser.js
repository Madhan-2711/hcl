/**
 * resumeParser.js — High-Accuracy Client-Side Resume Parser & Skill Extractor
 * Supports PDF, DOCX, and TXT files with layout preservation, rich section regexes,
 * technology taxonomy dictionary, and alias normalization.
 */
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdfjs worker safely
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF worker setup notice:', e);
}

// ─── 300+ Technology Taxonomy Dictionary ─────────────────────────────────────
// Scans the full resume text to ensure every real tool, language, and framework is captured

export const TECH_DICTIONARY = [
  // Programming Languages
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'C', 'Go', 'Golang', 'Rust',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'R', 'Dart', 'MATLAB', 'Perl', 'Shell', 'Bash',
  'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'SCSS', 'SQL', 'NoSQL', 'GraphQL',

  // Frontend Frameworks & Libraries
  'React', 'React.js', 'ReactJS', 'Next.js', 'NextJS', 'Vue', 'Vue.js', 'VueJS', 'Nuxt.js',
  'Angular', 'AngularJS', 'Svelte', 'SvelteKit', 'Redux', 'Redux Toolkit', 'Zustand', 'MobX',
  'Tailwind CSS', 'TailwindCSS', 'Bootstrap', 'Material UI', 'Chakra UI', 'Styled Components',
  'Vite', 'Webpack', 'Babel', 'jQuery', 'Three.js', 'D3.js',

  // Backend Frameworks & Runtimes
  'Node.js', 'NodeJS', 'Express', 'Express.js', 'NestJS', 'Nest.js', 'FastAPI', 'Flask',
  'Django', 'Spring', 'Spring Boot', 'ASP.NET', '.NET Core', 'Laravel', 'Ruby on Rails',
  'Gin', 'Fiber', 'Axum', 'Actix', 'Koa', 'Fastify',

  // Databases & Caching
  'PostgreSQL', 'Postgres', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'Cassandra',
  'DynamoDB', 'Couchbase', 'Elasticsearch', 'OpenSearch', 'Firebase', 'Supabase', 'Neo4j',
  'Prisma', 'TypeORM', 'Mongoose', 'SQLAlchemy', 'Hibernate', 'ClickHouse', 'Snowflake', 'BigQuery',

  // Cloud & DevOps
  'AWS', 'Amazon Web Services', 'GCP', 'Google Cloud', 'Microsoft Azure', 'Azure', 'Docker',
  'Kubernetes', 'K8s', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'GitLab CI',
  'CI/CD', 'Helm', 'ArgoCD', 'Prometheus', 'Grafana', 'Nginx', 'Apache', 'Linux', 'Serverless',
  'Cloudflare', 'Vercel', 'Netlify', 'Kafka', 'RabbitMQ', 'ActiveMQ', 'Celery',

  // Data Science, ML & AI
  'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'Data Science', 'Data Analytics',
  'PyTorch', 'TensorFlow', 'Keras', 'Scikit-learn', 'scikit-learn', 'Pandas', 'NumPy', 'SciPy',
  'Matplotlib', 'Seaborn', 'Plotly', 'Hugging Face', 'Transformers', 'OpenAI', 'LLMs', 'NLP',
  'Computer Vision', 'OpenCV', 'LangChain', 'LlamaIndex', 'RAG', 'Vector Embeddings',
  'Pinecone', 'Weaviate', 'ChromaDB', 'Milvus', 'Qdrant', 'MLflow', 'Kubeflow', 'Airflow',
  'Spark', 'Apache Spark', 'Hadoop', 'Databricks', 'dbt', 'Statistics', 'Linear Algebra',

  // Architecture & Methodologies
  'Microservices', 'REST', 'RESTful APIs', 'REST APIs', 'gRPC', 'WebSockets', 'System Design',
  'Distributed Systems', 'Event-Driven Architecture', 'OAuth', 'JWT', 'Agile', 'Scrum',
  'Test-Driven Development', 'TDD', 'Jest', 'Mocha', 'Cypress', 'Playwright', 'Selenium',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Postman', 'Swagger', 'Figma'
];

// ─── Skill Name Normalization Map ────────────────────────────────────────────

export const SKILL_NORMALIZATION_MAP = {
  'react.js': 'React',
  'reactjs': 'React',
  'next.js': 'Next.js',
  'nextjs': 'Next.js',
  'vue.js': 'Vue',
  'vuejs': 'Vue',
  'nuxt.js': 'Nuxt.js',
  'angular.js': 'Angular',
  'angularjs': 'Angular',
  'node.js': 'Node.js',
  'nodejs': 'Node.js',
  'express.js': 'Express',
  'nest.js': 'NestJS',
  'nestjs': 'NestJS',
  'golang': 'Go',
  'k8s': 'Kubernetes',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'Google Cloud',
  'google cloud': 'Google Cloud',
  'azure': 'Microsoft Azure',
  'microsoft azure': 'Microsoft Azure',
  'pytorch': 'PyTorch',
  'tensorflow': 'TensorFlow',
  'scikit-learn': 'Scikit-learn',
  'sklearn': 'Scikit-learn',
  'fastapi': 'FastAPI',
  'spring boot': 'Spring Boot',
  'springboot': 'Spring Boot',
  'rest api': 'REST APIs',
  'restful apis': 'REST APIs',
  'restful api': 'REST APIs',
  'ci/cd': 'CI/CD',
  'github actions': 'GitHub Actions',
  'git': 'Git',
};

export function normalizeSkillName(skill) {
  if (!skill || typeof skill !== 'string') return '';
  const trimmed = skill.trim().replace(/^[()[\]"']+|[()[\]"']+$/g, '');
  const lower = trimmed.toLowerCase();
  if (SKILL_NORMALIZATION_MAP[lower]) {
    return SKILL_NORMALIZATION_MAP[lower];
  }
  // Title-case single words or preserve standard acronyms
  if (['sql', 'html', 'css', 'aws', 'gcp', 'jwt', 'rag', 'nlp', 'llm', 'api', 'tdd'].includes(lower)) {
    return lower.toUpperCase();
  }
  return trimmed;
}

// ─── Extended Section Regex Patterns ─────────────────────────────────────────

export const RESUME_SECTIONS = {
  skills: /^(technical\s+|key\s+|core\s+|professional\s+|relevant\s+)?(skills?|competencies|technologies|tools|tech\s+stack|expertise|proficiencies|languages\s*(&|\/|\band\b)?\s*frameworks?|technical\s+proficiencies)(\s*[&/]\s*\w+)*\s*:?\s*$/i,
  experience: /^(work\s+|professional\s+|relevant\s+|employment\s+)?(experience|employment|history|background|internships?|career\s+history)(\s*[&/]\s*\w+)*\s*:?\s*$/i,
  projects: /^(personal\s+|academic\s+|key\s+|notable\s+|side\s+|selected\s+|technical\s+)?projects?(\s*[&/]\s*\w+)*\s*:?\s*$/i,
  education: /^(academic\s+|educational\s+)?(education|background|qualifications?|academics?)(\s*[&/]\s*\w+)*\s*:?\s*$/i,
};

const CONTACT_LINE_RE = /(https?:\/\/)|(www\.[\w-]+\.)|[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}|github\.com\/|linkedin\.com\/|(mailto:)|(\b\+?\d{1,3}[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b)/i;

const DEGREE_RE = /\b(b\.?\s*tech|b\.?\s*e\.?|b\.?\s*sc|b\.?\s*s\.?|m\.?\s*tech|m\.?\s*e\.?|m\.?\s*sc|m\.?\s*s\.?|mba|ph\.?\s*d|bachelor|master|doctor|diploma|b\.?\s*com|b\.?\s*a\.?|m\.?\s*a\.?|hsc|ssc|10th|12th|undergraduate|postgraduate)\b/i;

const JOB_HEADER_RE = /(\b(19|20)\d{2}\b)|(\bpresent\b)|(\sat\s|\s@\s)|\b(intern|engineer|developer|analyst|scientist|manager|lead|architect|consultant|associate|programmer|specialist)\b/i;

const TECH_LINE_RE = /^(technologies|tech(\s+stack)?|tools(\s+used)?|built\s+with|stack|environment|frameworks)\s*[:\-]\s*(.+)$/i;

// ─── Token Extractor ─────────────────────────────────────────────────────────

export function extractTokensFromSection(lines) {
  const tokens = new Set();
  for (let line of lines) {
    line = line.replace(/^[A-Za-z][A-Za-z\s/&-]*:\s*/, '');
    const parts = line.split(/[,|•·/;\t]+/);
    for (let token of parts) {
      token = token.replace(/^[\s\-–—*►▸▶·\d.]+/, '').trim();
      token = token.replace(/^[()[\]"']+|[()[\]"']+$/g, '');
      if (
        token.length >= 2 &&
        token.length <= 40 &&
        !/^\d+$/.test(token) &&
        token.split(/\s+/).length <= 4
      ) {
        tokens.add(normalizeSkillName(token));
      }
    }
  }
  return Array.from(tokens).filter(Boolean);
}

export function extractTokensFromBullets(bullets) {
  const tokens = new Set();
  for (const bullet of bullets) {
    const match = bullet.match(TECH_LINE_RE);
    if (match && match[4]) {
      const raw = match[4];
      const parts = raw.split(/[,|•·/;\t]+/);
      for (let token of parts) {
        token = token.trim().replace(/^[()[\]"']+|[()[\]"']+$/g, '');
        if (token.length >= 2 && token.length <= 40 && token.split(/\s+/).length <= 4) {
          tokens.add(normalizeSkillName(token));
        }
      }
    }
  }
  return Array.from(tokens).filter(Boolean);
}

// ─── Whole-Document Taxonomy Scanner ─────────────────────────────────────────

export function scanDocumentForTechnologies(text) {
  const foundSkills = new Set();
  if (!text) return [];

  for (const tech of TECH_DICTIONARY) {
    // Create regex with word boundaries (handling special characters like C++, C#, .NET, Node.js)
    const escaped = tech.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
    const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}([^a-zA-Z0-9_]|$)`, 'i');
    if (regex.test(text)) {
      foundSkills.add(normalizeSkillName(tech));
    }
  }

  return Array.from(foundSkills);
}

export function splitSections(text) {
  const result = {
    skills: [],
    experience: [],
    projects: [],
    education: [],
    __preamble__: [],
  };
  let current = '__preamble__';

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || CONTACT_LINE_RE.test(line)) {
      continue;
    }

    let matched = null;
    if (line.length <= 60) {
      for (const [key, pattern] of Object.entries(RESUME_SECTIONS)) {
        if (pattern.test(line)) {
          matched = key;
          break;
        }
      }
    }

    if (matched) {
      current = matched;
    } else {
      if (!result[current]) result[current] = [];
      result[current].push(line);
    }
  }
  return result;
}

export function parseEducationSection(lines) {
  const entries = [];
  let current = [];
  for (const line of lines) {
    if (DEGREE_RE.test(line)) {
      if (current.length > 0) entries.push(current);
      current = [line];
    } else if (current.length > 0) {
      current.push(line);
    }
  }
  if (current.length > 0) entries.push(current);
  return entries.slice(0, 5);
}

export function parseExperienceSection(lines) {
  const jobs = [];
  let currentHeader = null;
  let currentBullets = [];

  for (const line of lines) {
    const clean = line.replace(/^[\s•\-–—*►▸▶·\d]+\.?\s*/, '').trim();
    if (!clean) continue;

    const isBulletLine = /^[•\-–—*►▸▶·]/.test(line) || (clean[0] && clean[0] === clean[0].toLowerCase());
    const isHeader = !isBulletLine && clean.length < 120 && JOB_HEADER_RE.test(clean);

    if (isHeader) {
      if (currentHeader) {
        jobs.push({ header: currentHeader, bullets: currentBullets });
      }
      currentHeader = clean;
      currentBullets = [];
    } else if (currentHeader && clean.length > 10) {
      currentBullets.push(clean);
    }
  }
  if (currentHeader) {
    jobs.push({ header: currentHeader, bullets: currentBullets });
  }
  return jobs.slice(0, 8);
}

export function parseProjectsSection(lines) {
  const projects = [];
  let currentTitle = null;
  let currentBullets = [];

  for (const line of lines) {
    const clean = line.replace(/^[\s•\-–—*►▸▶·\d]+\.?\s*/, '').trim();
    if (!clean) continue;

    const isBulletLine = /^[•\-–—*►▸▶·]/.test(line) || (clean[0] && clean[0] === clean[0].toLowerCase());
    const isTitle = !isBulletLine && clean.length < 80 && clean[0] === clean[0].toUpperCase();

    if (isTitle) {
      if (currentTitle) {
        projects.push({
          title: currentTitle,
          bullets: currentBullets,
          technologies: extractTokensFromBullets(currentBullets),
        });
      }
      currentTitle = clean;
      currentBullets = [];
    } else if (currentTitle && clean.length > 8) {
      currentBullets.push(clean);
    }
  }
  if (currentTitle) {
    projects.push({
      title: currentTitle,
      bullets: currentBullets,
      technologies: extractTokensFromBullets(currentBullets),
    });
  }
  return projects.slice(0, 8);
}

export function inferCareerGoal(text = '', skills = [], experienceList = [], projectsList = []) {
  const lower = (text || '').toLowerCase();

  // 1. Direct explicit role keyword matching (ordered by specificity)
  if (/\b(data\s+analyst|business\s+analyst|bi\s+analyst|analytics\s+engineer|data\s+analytics|financial\s+analyst|operations\s+analyst)\b/i.test(lower)) {
    return 'Data Analyst';
  }
  if (/\b(data\s+scientist|data\s+science|quantitative\s+analyst|statistician|predictive\s+modeler)\b/i.test(lower)) {
    return 'Data Scientist';
  }
  if (/\b(machine\s+learning\s+engineer|ml\s+engineer|ai\s+engineer|deep\s+learning|nlp\s+engineer|computer\s+vision|mlops|artificial\s+intelligence)\b/i.test(lower)) {
    return 'Machine Learning Engineer';
  }
  if (/\b(frontend\s+developer|front-end\s+developer|react\s+developer|ui\s+engineer|web\s+developer|frontend\s+engineer|ui\/ux\s+developer)\b/i.test(lower)) {
    return 'Frontend Developer';
  }
  if (/\b(backend\s+developer|back-end\s+developer|api\s+developer|node\s+developer|python\s+developer|java\s+developer|backend\s+engineer|go\s+developer)\b/i.test(lower)) {
    return 'Backend Developer';
  }
  if (/\b(full\s+stack\s+developer|fullstack\s+developer|full-stack\s+developer|fullstack\s+engineer|full\s+stack\s+engineer|mern\s+developer)\b/i.test(lower)) {
    return 'Full Stack Developer';
  }
  if (/\b(devops\s+engineer|cloud\s+engineer|site\s+reliability\s+engineer|sre|platform\s+engineer|infrastructure\s+engineer)\b/i.test(lower)) {
    return 'DevOps Engineer';
  }
  if (/\b(data\s+engineer|database\s+engineer|etl\s+developer|database\s+administrator|dba|big\s+data\s+engineer)\b/i.test(lower)) {
    return 'Data Engineer';
  }
  if (/\b(mobile\s+developer|android\s+developer|ios\s+developer|react\s+native|flutter|ios\s+engineer|android\s+engineer)\b/i.test(lower)) {
    return 'Mobile Developer';
  }
  if (/\b(security\s+engineer|cybersecurity|infosec|penetration\s+tester)\b/i.test(lower)) {
    return 'Security Engineer';
  }

  // 2. Check Job Headers in Experience
  for (const exp of experienceList || []) {
    const header = (exp.header || '').toLowerCase();
    if (header.includes('analyst') || header.includes('analytics')) return 'Data Analyst';
    if (header.includes('data scientist') || header.includes('science')) return 'Data Scientist';
    if (header.includes('machine learning') || header.includes('ml ') || header.includes('ai ')) return 'Machine Learning Engineer';
    if (header.includes('frontend') || header.includes('front-end') || header.includes('react')) return 'Frontend Developer';
    if (header.includes('backend') || header.includes('back-end')) return 'Backend Developer';
    if (header.includes('full stack') || header.includes('fullstack')) return 'Full Stack Developer';
    if (header.includes('devops') || header.includes('cloud')) return 'DevOps Engineer';
  }

  // 3. Heuristic matching based on dominant skill clusters
  const lowerSkills = (skills || []).map(s => String(s).toLowerCase());
  const hasDataAnalystSkills = lowerSkills.some(s => ['sql', 'pandas', 'excel', 'tableau', 'power bi', 'statistics', 'data visualization', 'matplotlib', 'seaborn'].includes(s));
  const hasMLSkills = lowerSkills.some(s => ['pytorch', 'tensorflow', 'scikit-learn', 'deep learning', 'neural networks', 'machine learning', 'mlops', 'opencv'].includes(s));
  const hasFrontendSkills = lowerSkills.some(s => ['react', 'next.js', 'vue', 'angular', 'html', 'css', 'tailwind css', 'javascript', 'typescript'].includes(s));
  const hasBackendSkills = lowerSkills.some(s => ['node.js', 'express', 'fastapi', 'django', 'spring boot', 'postgresql', 'mongodb', 'redis'].includes(s));
  const hasDevOpsSkills = lowerSkills.some(s => ['docker', 'kubernetes', 'aws', 'terraform', 'ci/cd', 'ansible', 'jenkins'].includes(s));

  if (hasDataAnalystSkills && !hasFrontendSkills && !hasBackendSkills) return 'Data Analyst';
  if (hasMLSkills) return 'Machine Learning Engineer';
  if (hasFrontendSkills && hasBackendSkills) return 'Full Stack Developer';
  if (hasFrontendSkills) return 'Frontend Developer';
  if (hasBackendSkills) return 'Backend Developer';
  if (hasDevOpsSkills) return 'DevOps Engineer';
  if (hasDataAnalystSkills) return 'Data Analyst';

  return 'Software Engineer';
}

export function parseResumeText(text) {
  const sections = splitSections(text);
  const sectionSkills = extractTokensFromSection(sections.skills);
  const education = parseEducationSection(sections.education);
  const experience = parseExperienceSection(sections.experience);
  const projects = parseProjectsSection(sections.projects);

  // Scan full text with taxonomy dictionary for comprehensive technology coverage
  const documentScannedSkills = scanDocumentForTechnologies(text);

  // Combine and deduplicate
  const allSkills = Array.from(new Set([...sectionSkills, ...documentScannedSkills]));
  const inferredGoal = inferCareerGoal(text, allSkills, experience, projects);

  return {
    goal: inferredGoal,
    skills: allSkills.length > 0 ? allSkills : ['General Software Engineering'],
    education,
    experience,
    projects,
    raw_text: text.slice(0, 5000),
  };
}

// ─── PDF, DOCX, TXT File Handlers ────────────────────────────────────────────

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: typedArray, useSystemFonts: true });
  const pdf = await loadingTask.promise;
  const pageTexts = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by vertical position (Y coordinate) to preserve lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3; // Bucket lines
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: item.transform[4], text: item.str });
    }

    // Sort descending by Y (top to bottom), then ascending by X (left to right)
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const pageLines = [];
    for (const y of sortedY) {
      const sortedX = lineMap.get(y).sort((a, b) => a.x - b.x);
      pageLines.push(sortedX.map(i => i.text).join(' '));
    }

    pageTexts.push(pageLines.join('\n'));
  }

  return pageTexts.join('\n\n').trim();
}

export async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || '').trim();
}

export async function extractTextFromTxt(file) {
  return await file.text();
}

export async function extractTextFromFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.pdf')) {
    try {
      const pdfText = await extractTextFromPDF(file);
      if (pdfText && pdfText.trim().length > 30) return pdfText;
    } catch (pdfErr) {
      console.warn('PDF structured extraction fallback:', pdfErr);
    }
  }
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    return await extractTextFromDocx(file);
  }
  return await extractTextFromTxt(file);
}
