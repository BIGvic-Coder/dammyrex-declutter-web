import { Module } from '@nestjs/common';
import { AdminGuard } from '../admin/auth/admin.guard';
import { AdminAdsController, AdminSettingsController } from './admin-ads.controller';
import { AdsController } from './ads.controller';

@Module({
  controllers: [AdsController, AdminAdsController, AdminSettingsController],
  providers: [AdminGuard],
})
export class AdsModule {}
