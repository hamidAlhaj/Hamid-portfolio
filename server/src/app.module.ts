import { Module } from '@nestjs/common';
import { ContactModule } from './contact/contact.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PortfolioModule, ContactModule],
  controllers: [HealthController],
})
export class AppModule {}
