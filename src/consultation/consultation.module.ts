import { Module } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { ConsultationController } from './consultation.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from './ai.service';

@Module({
  controllers: [ConsultationController],
  providers: [ConsultationService, AIService, PrismaService],
})
export class ConsultationModule {}