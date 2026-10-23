export type SocialLink = {
  label: string;
  href: string;
  short: string;
};

export type Profile = {
  name: string;
  shortName: string;
  role: string;
  eyebrow: string;
  headline: string;
  summary: string;
  location: string;
  availability: string;
  cvUrl?: string;
  email?: string;
  github: string;
  linkedin: string;
  socialLinks: SocialLink[];
};

export type ProjectCategory = 'Full-stack' | 'Frontend' | 'Backend' | 'Security';

export type Project = {
  id: string;
  name: string;
  category: ProjectCategory;
  subtitle: string;
  description: string;
  tags: string[];
  highlights: string[];
  theme: 'violet' | 'mint' | 'blue' | 'orange' | 'pink';
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  featured: boolean;
};

export type SkillGroup = {
  title: string;
  note: string;
  skills: string[];
};

export type JourneyItem = {
  period: string;
  title: string;
  organization: string;
  description: string;
  kind: 'education' | 'bootcamp' | 'project';
};

export type PortfolioArticle = {
  id: string;
  title: string;
  excerpt: string;
  readTime: string;
  topic: string;
  tags: string[];
  coverUrl: string;
  body: string[];
  linkedinUrl?: string;
};

export type Language = {
  name: string;
  level: string;
  note: string;
  mark: string;
};
