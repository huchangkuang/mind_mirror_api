import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TestsModule } from './modules/tests/tests.module';
import { MbtiModule } from './modules/mbti/mbti.module';
import { CityMatchModule } from './modules/city-match/city-match.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FeedbackModule,
    TestsModule,
    MbtiModule,
    CityMatchModule,
  ],
})
export class AppModule {}
