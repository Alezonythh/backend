import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { ConsultationModule } from './consultation/consultation.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [AuthModule, DoctorModule, ConsultationModule, ConfigModule.forRoot({
    isGlobal: true, // agar bisa diakses di seluruh app
  }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
