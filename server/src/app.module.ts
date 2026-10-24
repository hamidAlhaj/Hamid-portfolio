import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { PublicController, AdminController } from "./cms.controller";
import { CmsService } from "./cms.service";
import { DbService } from "./db.service";
import { AdminGuard } from "./admin.guard";
import { StorageService } from "./storage.service";
import { HealthController } from "./health.controller";
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }])],
  controllers: [PublicController, AdminController, HealthController],
  providers: [DbService, CmsService, AdminGuard, StorageService],
})
export class AppModule {}
