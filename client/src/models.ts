export type Entry<T = Record<string, any>> = {
  id: string;
  slug: string;
  position: number;
  published: boolean;
  data: T;
  readTime?: string;
};
export type Portfolio = {
  profile: Entry | null;
  settings: Entry | null;
  projects: Entry[];
  skills: Entry[];
  articles: Entry[];
  journey: Entry[];
};
