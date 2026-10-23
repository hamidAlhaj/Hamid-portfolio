import { Controller, Get } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller()
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('profile')
  getProfile() {
    return this.portfolioService.getProfile();
  }

  @Get('projects')
  getProjects() {
    return this.portfolioService.getProjects();
  }

  @Get('skills')
  getSkills() {
    return this.portfolioService.getSkills();
  }

  @Get('articles')
  getArticles() {
    return this.portfolioService.getArticles();
  }
}
