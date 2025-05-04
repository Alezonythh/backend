import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from './ai.service';
import { Consultation, AIResponse } from '@prisma/client';

@Injectable()
export class ConsultationService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async findAllByUser(userId: number): Promise<Consultation[]> {
    return this.prisma.consultation.findMany({
      where: { userId },
      include: {
        doctor: true,
      },
    });
  }

  async findOne(id: number): Promise<Consultation & { aiResponses: AIResponse[] }> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        doctor: true,
        user: true,
        aiResponses: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    return consultation;
  }

  async create(data: {
    userId: number;
    doctorId: number;
  }): Promise<Consultation> {
    return this.prisma.consultation.create({
      data: {
        userId: data.userId,
        doctorId: data.doctorId,
        status: 'pending',
      },
      include: {
        doctor: true,
      },
    });
  }

  async startConsultation(id: number): Promise<Consultation> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    return this.prisma.consultation.update({
      where: { id },
      data: {
        status: 'active',
        startedAt: new Date(),
      },
    });
  }

  async endConsultation(id: number): Promise<Consultation> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    return this.prisma.consultation.update({
      where: { id },
      data: {
        status: 'completed',
        endedAt: new Date(),
      },
    });
  }
    async addUserMessage(
      consultationId: number,
      userMessage: string,
    ): Promise<AIResponse> {
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          doctor: true,
          user: true,
          aiResponses: {
            orderBy: {
              timestamp: 'asc', 
            },
          },
        },
      });
    
      if (!consultation) {
        throw new NotFoundException(`Consultation with ID ${consultationId} not found`);
      }
    
      if (consultation.status !== 'active') {
        throw new Error('Consultation must be active to add messages');
      }
    
      // 1️⃣ Simpan pesan user terlebih dahulu
      await this.prisma.aIResponse.create({
        data: {
          consultationId,
          message: userMessage,
          role: 'user',
        },
      });
    
      // 2️⃣ Refresh consultation agar aiResponses berisi pesan user juga
      const updatedConsultation = await this.prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          doctor: true,
          user: true,
          aiResponses: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });
    
      // 3️⃣ Generate AI response
      const aiResponse = await this.aiService.generateResponse(
        userMessage,
        updatedConsultation!,
      );
    
      // 4️⃣ Simpan pesan AI
      return this.prisma.aIResponse.create({
        data: {
          consultationId,
          message: aiResponse,
          role: 'assistant',
        },
      });
    }
    }