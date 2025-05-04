import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { Doctor } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  async findAll(): Promise<Doctor[]> {
    return this.doctorService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Doctor | null> {
    return this.doctorService.findOne(+id);
  }
  @Post()
  @UseGuards(JwtAuthGuard) // Ensure only authorized users can create
  async create(@Body() data: {
    name: string;
    specialization: string;
    experience: number;
    rating: number;
    bio: string;
    photoUrl?: string;
  }): Promise<Doctor> {
    return this.doctorService.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      specialization?: string;
      experience?: number;
      rating?: number;
      bio?: string;
      photoUrl?: string;
      isAvailable?: boolean;
    },
  ): Promise<Doctor> {
    return this.doctorService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string): Promise<Doctor> {
    return this.doctorService.remove(+id);
  }
}