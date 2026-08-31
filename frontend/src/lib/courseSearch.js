/**
 * courseSearch.js — Curated Web Course Search & Dynamic Course Catalog Extension
 * Discovers and returns authoritative web courses (Coursera, freeCodeCamp, edX, Microsoft Learn, Kaggle, etc.)
 * when relevant courses are missing from the local Supabase database.
 */

export const CURATED_WEB_COURSES = [
  // ─── Data Analyst Track ───────────────────────────────────────────────────
  {
    title: 'Google Data Analytics Professional Certificate',
    description: 'Master in-demand skills in data cleaning, SQL query optimization, Tableau dashboards, and R programming to solve complex real-world business challenges.',
    difficulty: 'beginner',
    duration_hours: 24,
    track: 'data_scientist',
    url: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    skills: ['SQL', 'Data Cleaning', 'Tableau', 'Data Visualization', 'Spreadsheets', 'Statistics'],
  },
  {
    title: 'Data Analysis with Python and Pandas (freeCodeCamp)',
    description: 'Learn end-to-end data exploration, numerical computation, and DataFrame transformations using NumPy, Pandas, Matplotlib, and Seaborn with interactive notebook projects.',
    difficulty: 'beginner',
    duration_hours: 18,
    track: 'data_scientist',
    url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/',
    skills: ['Python', 'Pandas', 'NumPy', 'Data Analysis', 'Matplotlib', 'Seaborn'],
  },
  {
    title: 'Microsoft Power BI Data Analyst (PL-300)',
    description: 'Design robust dimensional data models, write complex DAX calculations, and build interactive executive KPI dashboards and enterprise reports.',
    difficulty: 'intermediate',
    duration_hours: 20,
    track: 'data_scientist',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/',
    skills: ['Power BI', 'DAX', 'Data Modeling', 'Business Intelligence', 'Data Visualization'],
  },
  {
    title: 'Tableau 2024: Business Intelligence & Data Storytelling',
    description: 'Create publication-ready visual storytelling dashboards, level of detail (LOD) expressions, parameters, and interactive geographic heatmaps in Tableau.',
    difficulty: 'intermediate',
    duration_hours: 16,
    track: 'data_scientist',
    url: 'https://www.coursera.org/learn/analytics-tableau',
    skills: ['Tableau', 'Data Storytelling', 'Dashboards', 'Data Visualization'],
  },
  {
    title: 'Advanced SQL for Analytical Querying & Window Functions',
    description: 'Deep dive into CTEs, window functions (ROW_NUMBER, NTILE, LAG/LEAD), recursive queries, partition strategies, and performance indexing.',
    difficulty: 'intermediate',
    duration_hours: 14,
    track: 'data_scientist',
    url: 'https://www.coursera.org/learn/sql-for-data-science',
    skills: ['SQL', 'Window Functions', 'PostgreSQL', 'Query Optimization', 'Data Warehousing'],
  },

  // ─── Machine Learning & AI Track ──────────────────────────────────────────
  {
    title: 'Machine Learning Specialization (DeepLearning.AI & Stanford)',
    description: 'Andrew Ng’s flagship curriculum covering supervised learning, regularized linear/logistic regression, tree ensembles, unsupervised clustering, and recommender systems.',
    difficulty: 'beginner',
    duration_hours: 30,
    track: 'ml_engineer',
    url: 'https://www.coursera.org/specializations/machine-learning-introduction',
    skills: ['Machine Learning', 'Python', 'Scikit-learn', 'Algorithms', 'Linear Regression'],
  },
  {
    title: 'Practical Deep Learning for Coders (Fast.ai)',
    description: 'Top-down hands-on PyTorch deep learning course covering Computer Vision, Natural Language Processing, tabular models, and production model inference.',
    difficulty: 'intermediate',
    duration_hours: 28,
    track: 'ml_engineer',
    url: 'https://course.fast.ai/',
    skills: ['Deep Learning', 'PyTorch', 'Computer Vision', 'Neural Networks', 'NLP'],
  },
  {
    title: 'Hugging Face Transformers & Modern NLP Course',
    description: 'Build, fine-tune, and deploy state-of-the-art Transformer language models, tokenizers, RAG systems, and vector embedding pipelines using the Hugging Face ecosystem.',
    difficulty: 'advanced',
    duration_hours: 22,
    track: 'ml_engineer',
    url: 'https://huggingface.co/learn/nlp-course/',
    skills: ['Transformers', 'NLP', 'Hugging Face', 'PyTorch', 'Vector Embeddings', 'RAG'],
  },
  {
    title: 'MLOps: Machine Learning Engineering for Production',
    description: 'Deploy resilient ML pipelines with feature stores, model tracking with MLflow, data validation with Great Expectations, and continuous monitoring.',
    difficulty: 'advanced',
    duration_hours: 24,
    track: 'ml_engineer',
    url: 'https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops',
    skills: ['MLOps', 'Model Deployment', 'Docker', 'Kubernetes', 'CI/CD', 'MLflow'],
  },

  // ─── Frontend & Full Stack Track ──────────────────────────────────────────
  {
    title: 'Full Stack Open — University of Helsinki',
    description: 'Deep modern JavaScript curriculum covering React, Redux, Node.js, Express, REST APIs, GraphQL, TypeScript, and containerized Docker deployments.',
    difficulty: 'intermediate',
    duration_hours: 35,
    track: 'frontend',
    url: 'https://fullstackopen.com/en/',
    skills: ['React', 'Node.js', 'Express', 'TypeScript', 'GraphQL', 'REST APIs'],
  },
  {
    title: 'Official React & Next.js App Router Masterclass',
    description: 'Master React 19 Server Components, Streaming SSR, Optimistic UI, Server Actions, and dynamic layout routing in Next.js.',
    difficulty: 'intermediate',
    duration_hours: 18,
    track: 'frontend',
    url: 'https://react.dev/learn',
    skills: ['React', 'Next.js', 'JavaScript', 'TypeScript', 'Tailwind CSS'],
  },

  // ─── Backend & Cloud / DevOps Track ───────────────────────────────────────
  {
    title: 'FastAPI & High-Performance Python Backend Architecture',
    description: 'Build enterprise-grade asynchronous RESTful microservices, Pydantic schemas, dependency injection, OAuth2 authentication, and Celery background workers.',
    difficulty: 'intermediate',
    duration_hours: 16,
    track: 'backend',
    url: 'https://fastapi.tiangolo.com/tutorial/',
    skills: ['FastAPI', 'Python', 'REST APIs', 'PostgreSQL', 'AsyncIO', 'Authentication'],
  },
  {
    title: 'AWS Cloud Practitioner & Solutions Architect Essentials',
    description: 'Core cloud infrastructure fundamentals: EC2, S3, RDS, Lambda serverless, VPC networking, IAM security policies, and cost optimization.',
    difficulty: 'beginner',
    duration_hours: 18,
    track: 'backend',
    url: 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/',
    skills: ['AWS', 'Cloud Basics', 'DevOps', 'Security', 'Serverless'],
  },
  {
    title: 'Docker & Kubernetes Containerization for Production',
    description: 'Master multi-stage Dockerfiles, Docker Compose service orchestration, Kubernetes Pods, Deployments, ConfigMaps, Ingress controllers, and Helm charts.',
    difficulty: 'intermediate',
    duration_hours: 20,
    track: 'backend',
    url: 'https://training.linuxfoundation.org/',
    skills: ['Docker', 'Kubernetes', 'DevOps', 'CI/CD', 'Microservices'],
  }
];

/**
 * Find relevant web courses for a given goal or list of skills
 */
export function searchWebCourses(goal = '', neededSkills = [], count = 4) {
  const gLower = (goal || '').toLowerCase();
  const lowerSkills = neededSkills.map(s => String(s).toLowerCase());

  const scored = CURATED_WEB_COURSES.map(course => {
    let score = 0;

    // Track relevance
    if (gLower.includes('analyst') || gLower.includes('analytics')) {
      if (course.track === 'data_scientist') score += 5;
    } else if (gLower.includes('machine learning') || gLower.includes('ml') || gLower.includes('ai')) {
      if (course.track === 'ml_engineer') score += 5;
    } else if (gLower.includes('frontend') || gLower.includes('react')) {
      if (course.track === 'frontend') score += 5;
    } else if (gLower.includes('backend') || gLower.includes('cloud') || gLower.includes('devops')) {
      if (course.track === 'backend') score += 5;
    }

    // Title / Description keyword match
    const text = `${course.title} ${course.description}`.toLowerCase();
    for (const word of gLower.split(/\s+/)) {
      if (word.length > 3 && text.includes(word)) score += 2;
    }

    // Skills match
    for (const skill of course.skills || []) {
      if (lowerSkills.some(ls => ls.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ls))) {
        score += 4;
      }
    }

    return { course, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(s => s.course);
}

