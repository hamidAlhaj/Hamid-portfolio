import { Injectable } from '@nestjs/common';
import { articles, profile, projects, skills } from './portfolio.data';

@Injectable()
export class PortfolioService {
  getProfile() {
    return profile;
  }

  getProjects() {
    return projects;
  }

  getSkills() {
    return skills;
  }

  getArticles() {
    return articles;
  }
}
