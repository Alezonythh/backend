import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Doctor } from '@prisma/client';

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Doctor[]> {
    return this.prisma.doctor.findMany();
  }

  async findOne(id: number): Promise<Doctor | null> {
    return this.prisma.doctor.findUnique({
      where: { id },
    });
  }
  async create(data: {
    name: string;
    specialization: string;
    experience: number;
    rating: number;
    bio: string;
    photoUrl?: string;
  }): Promise<Doctor> {
    return this.prisma.doctor.create({
      data,
    });
  }

  async update(id: number, data: {
    name?: string;
    specialization?: string;
    experience?: number;
    rating?: number;
    bio?: string;
    photoUrl?: string;
    isAvailable?: boolean;
  }): Promise<Doctor> {
    return this.prisma.doctor.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<Doctor> {
    return this.prisma.doctor.delete({
      where: { id },
    });
  }
}