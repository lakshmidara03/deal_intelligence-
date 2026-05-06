import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AccountsModule } from './accounts/accounts.module';
import { DealsModule } from './deals/deals.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['backend/.env', '.env', 'packages/database/.env']
    }),
    HttpModule,
    AccountsModule,
    DealsModule
  ],
  providers: [PrismaService]
})
export class AppModule {}
