import type { JourneyItem, Language, PortfolioArticle, Profile, Project, SkillGroup } from './types';

export const initialProfile: Profile = {
  name: 'Hamid Alhaj',
  shortName: 'HA',
  role: 'Full-Stack Developer',
  eyebrow: 'INFORMATICS ENGINEERING GRADUATE',
  headline: 'I turn ideas into useful, reliable web products.',
  summary:
    'I build clean user experiences and dependable APIs with React, TypeScript, Node.js, and NestJS. I am especially interested in backend engineering and API security.',
  location: 'Salamiya, Syria',
  availability: 'Open to junior developer opportunities',
  cvUrl: '/cv.pdf',
  github: 'https://github.com/hamidAlhaj',
  linkedin: 'https://www.linkedin.com/in/hamid-alhaj-63437b410/',
  socialLinks: [
    { label: 'GitHub', href: 'https://github.com/hamidAlhaj', short: 'GH' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hamid-alhaj-63437b410/', short: 'in' },
  ],
};

export const initialProjects: Project[] = [
  {
    imageUrl: 'https://raw.githubusercontent.com/hamidAlhaj/API-Auditor-Pro/main/frontend/favicon.svg',
    id: 'api-security-auditor',
    name: 'API Security Auditor Pro',
    category: 'Security',
    subtitle: 'Graduation project · API security',
    description:
      'A security-focused toolkit for testing APIs, comparing vulnerable and protected endpoints, and making common weaknesses easier to understand.',
    tags: ['React', 'TypeScript', 'Vite', 'Flask', 'SQLite', 'API Security'],
    highlights: [
      'Request builder with multiple authentication methods',
      'Checks for SQL injection, IDOR/BOLA, broken authentication, and missing rate limits',
      'Secure sample API with role-based access and ownership checks',
    ],
    theme: 'violet',
    githubUrl: 'https://github.com/hamidAlhaj/API-Auditor-Pro',
    featured: true,
  },
  {
    imageUrl: 'https://raw.githubusercontent.com/Yazan-Shartooh/Team-4-Finora/main/client/public/finora-icon.svg',
    id: 'finora',
    name: 'Finora',
    category: 'Full-stack',
    subtitle: 'Team project · Budget management',
    description:
      'A personal finance application for organizing income and expenses, managing budgets, and understanding spending through a structured backend.',
    tags: ['NestJS', 'TypeScript', 'MongoDB', 'REST API'],
    highlights: [
      'Modular backend organized around categories, transactions, budgets, and reports',
      'Collaborative development with a shared team codebase',
      'Practice with controllers, services, modules, and API integration',
    ],
    theme: 'mint',
    githubUrl: 'https://github.com/Yazan-Shartooh/Team-4-Finora',
    featured: true,
  },
  {
    imageUrl: 'https://opengraph.githubassets.com/1/hamidAlhaj/mystery-room-b4f',
    id: 'mystery-room',
    name: 'Mystery Room',
    category: 'Full-stack',
    subtitle: 'Team project · Interactive puzzle game',
    description:
      'A browser-based mystery experience where players solve puzzles and progress through a connected game flow.',
    tags: ['React', 'JavaScript', 'Express.js', 'REST API'],
    highlights: [
      'Led backend setup and integrated the first puzzle with the frontend',
      'Implemented API behavior for hints and game progression',
      'Helped coordinate changes through a protected main branch',
    ],
    theme: 'blue',
    githubUrl: 'https://github.com/hamidAlhaj/mystery-room-b4f',
    liveUrl: 'https://hamidalhaj.github.io/mystery-room-b4f/',
    featured: true,
  },
  {
    imageUrl: 'https://opengraph.githubassets.com/1/Fadi-Habil17/Decision-Lab',
    id: 'decisionlab',
    name: 'DecisionLab',
    category: 'Frontend',
    subtitle: 'Team project · Decision-making workspace',
    description:
      'A collaborative workspace concept focused on structuring decisions and presenting information in a clear, approachable interface.',
    tags: ['React', 'TypeScript', 'Vite'],
    highlights: [
      'Frontend workstream covering the app shell and navigation',
      'Reusable UI structure for a growing application',
      'Type-safe React components and project organization',
    ],
    theme: 'orange',
    githubUrl: 'https://github.com/Fadi-Habil17/Decision-Lab',
    featured: true,
  },
  {
    imageUrl: 'https://opengraph.githubassets.com/1/hamidAlhaj/Note-taking-react',
    id: 'note-taking',
    name: 'Note-taking App',
    category: 'Frontend',
    subtitle: 'Personal project · Productivity',
    description:
      'A lightweight notes application built to practice component-driven React development and persistent browser storage.',
    tags: ['React', 'JavaScript', 'CSS', 'localStorage'],
    highlights: [
      'Create and manage notes in a focused interface',
      'Persist notes in the browser with localStorage',
      'Built and published as a small standalone web project',
    ],
    theme: 'pink',
    githubUrl: 'https://github.com/hamidAlhaj/Note-taking-react',
    liveUrl: 'https://hamidalhaj.github.io/Note-taking-react/',
    featured: true,
  },
  {
    imageUrl: 'https://raw.githubusercontent.com/hamidAlhaj/eLibrary/main/logo.png',
    id: 'elibrary',
    name: 'eLibrary',
    category: 'Frontend',
    subtitle: 'Personal project · Book discovery',
    description:
      'A responsive digital-library website built with HTML, CSS, and JavaScript. It fetches book information from the Gutendex API and supports keeping selected books in the browser.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Gutendex API', 'localStorage'],
    highlights: [
      'Search and browse book information using the Gutendex API',
      'Save selected books locally in the browser',
      'Practise asynchronous API requests and client-side state persistence',
    ],
    theme: 'blue',
    githubUrl: 'https://github.com/hamidAlhaj/eLibrary',
    featured: true,
  },
];

export const initialSkills: SkillGroup[] = [
  {
    title: 'Frontend',
    note: 'Interfaces that are responsive, accessible, and maintainable.',
    skills: ['React', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Vite'],
  },
  {
    title: 'Backend',
    note: 'Structured server-side logic and APIs.',
    skills: ['Node.js', 'Express.js', 'NestJS', 'REST APIs', 'MongoDB', 'SQLite'],
  },
  {
    title: 'Security & workflow',
    note: 'Practical testing, authentication, and team collaboration.',
    skills: ['JWT', 'API Security', 'Postman', 'Git', 'GitHub', 'Python'],
  },
];

export const journey: JourneyItem[] = [
  {
    period: 'University',
    title: 'Informatics Engineering Graduate',
    organization: 'Arab University for Science and Technology (AUST)',
    description:
      'Software-focused studies, team projects, and a graduation project centered on API security. The graduation project was rated Excellent after defense.',
    kind: 'education',
  },
  {
    period: '2026',
    title: 'Full-Stack Development Bootcamp',
    organization: 'Bytes4Future Syria',
    description:
      'Working with React, TypeScript, Express.js, NestJS, team workflows, Git, and problem-solving through hands-on projects.',
    kind: 'bootcamp',
  },
  {
    period: 'Current focus',
    title: 'Backend engineering & application security',
    organization: 'Independent learning and project work',
    description:
      'Deepening NestJS and TypeScript skills while exploring API security patterns, authorization, and reliable application design.',
    kind: 'project',
  },
];


export const initialLanguages: Language[] = [
  { name: 'Arabic', level: 'Native', note: 'Native language', mark: 'ع' },
  { name: 'English', level: 'B2 · Upper-intermediate', note: 'Professional learning and communication', mark: 'EN' },
];

export const initialArticles: PortfolioArticle[] = [
  {
    id: 'express-vs-nestjs',
    title: 'Express.js or NestJS? A practical perspective',
    excerpt: 'What changes when you move from a lightweight, flexible framework to a more structured backend architecture?',
    readTime: '4 min read',
    topic: 'Backend development',
    tags: ['Express.js', 'NestJS', 'TypeScript'],
    coverUrl: '/images/articles/express-vs-nest.svg',
    body: [
      'I started learning Express.js more than a year ago. Its minimal approach gave me room to understand routes, middleware, and how an HTTP API works without hiding too much behind a framework.',
      'While working with NestJS in the Bytes4Future Bootcamp, the biggest difference for me was structure. Modules, controllers, and services make responsibilities easier to locate and help a team agree on a consistent project layout.',
      'I do not see this as a simple winner-versus-loser comparison. Express.js is still a solid choice when flexibility and a small footprint matter. NestJS brings useful conventions when an application or team needs more structure. The right choice depends on the project, the team, and the trade-offs you are willing to maintain.'
    ]
  },
  {
    id: 'authorization-is-more-than-roles',
    title: 'Authorization is more than a role check',
    excerpt: 'A user can have the right role and still be trying to access a record they do not own. Authorization needs more context.',
    readTime: '5 min read',
    topic: 'API security',
    tags: ['API Security', 'Authorization', 'NestJS'],
    coverUrl: '/images/articles/api-authorization.svg',
    body: [
      'Checking whether a user is signed in answers only part of the question. A role check tells us what a class of users may do, but it does not automatically prove that this particular user may access a particular record.',
      'For example, a user with permission to view projects should not automatically be able to read every project in the database. The backend should verify workspace membership or ownership at the resource level, not rely only on a button being hidden in the frontend.',
      'A safer API combines authentication, role or permission checks, resource ownership, input validation, and consistent tests for allowed and denied cases. These controls solve different problems, so they should be designed together.'
    ]
  },
  {
    id: 'building-api-security-auditor',
    title: 'Building an API Security Auditor',
    excerpt: 'Lessons from turning API security concepts into a graduation project with repeatable checks and readable reports.',
    readTime: '4 min read',
    topic: 'Project notes',
    tags: ['OWASP API Top 10', 'Testing', 'Security'],
    coverUrl: '/images/articles/api-auditor.svg',
    body: [
      'For my graduation project, I worked on API Security Auditor Pro to make common API weaknesses easier to test and explain. The project brings request building, collections, scan history, and report generation into one workflow.',
      'The checks focus on issues such as SQL injection, broken object-level authorization, weak authentication, mass assignment, and missing rate limits. A key design goal is to show why a finding matters, not simply mark a request as failed.',
      'The project also taught me to distinguish a useful security signal from a confirmed vulnerability. Automated checks can help prioritize investigation, but findings still need careful verification and clear remediation guidance.'
    ]
  },
];
