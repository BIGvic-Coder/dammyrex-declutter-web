import { Module } from '@nestjs/common';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminGuard } from './auth/admin.guard';
import { AdminInspectionsController } from './inspections/admin-inspections.controller';
import { AdminItemsController } from './items/admin-items.controller';
import { AdminStatsController } from './stats/admin-stats.controller';

@Module({
  controllers: [
    AdminAuthController,
    AdminItemsController,
    AdminInspectionsController,
    AdminStatsController,
  ],
  providers: [AdminGuard],
})
export class AdminModule {}
