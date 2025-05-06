import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { ConsultationModule } from './consultation/consultation.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthSupportModule } from './health-support/health-support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // agar bisa diakses di seluruh app
    }),
    PrismaModule,
    AuthModule,
    ConsultationModule,
    DoctorModule,
    HealthSupportModule, // Make sure this is included
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
