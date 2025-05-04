import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Consultation, AIResponse } from '@prisma/client';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Get()
  async findAll(@Request() req): Promise<Consultation[]> {
    return this.consultationService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Consultation & { aiResponses: AIResponse[] }> {
    return this.consultationService.findOne(+id);
  }

  @Post()
  async create(
    @Request() req,
    @Body() data: { doctorId: number },
  ): Promise<Consultation> {
    return this.consultationService.create({
      userId: req.user.userId,
      doctorId: data.doctorId,
    });
  }

  @Post(':id/start')
  async startConsultation(@Param('id') id: string): Promise<Consultation> {
    return this.consultationService.startConsultation(+id);
  }

  @Post(':id/end')
  async endConsultation(@Param('id') id: string): Promise<Consultation> {
    return this.consultationService.endConsultation(+id);
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() data: { message: string },
  ): Promise<AIResponse> {
    return this.consultationService.addUserMessage(+id, data.message);
  }
}