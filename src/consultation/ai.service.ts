import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import { Consultation } from '@prisma/client';
import { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';

@Injectable()
export class AIService {
  private readonly groqClient: Groq;

  constructor() {
    this.groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  async generateResponse(
    userMessage: string,
    consultation: Consultation & { doctor: any; aiResponses: any[]; user: any },
  ): Promise<string> {
    try {
      // Buat konteks dokter
      let doctorContext = `You are Dr. ${consultation.doctor.name}, a specialist in ${consultation.doctor.specialization} with ${consultation.doctor.experience} years of experience. Your bio: ${consultation.doctor.bio}`;
      
      // Hitung umur pasien
      const dateOfBirth = new Date(consultation.user.dateOfBirth);
      const age = this.calculateAge(dateOfBirth);
      doctorContext +=  `Patient: ${consultation.user.firstName} ${consultation.user.lastName}, born on ${dateOfBirth.toDateString()}, age ${age} years.`;

      // Ambil riwayat pesan AI
      const historyMessages = consultation.aiResponses.map((resp) => ({
        role: resp.role as 'user' | 'assistant',
        content: resp.message,
      }));
        

      // Gabungkan pesan untuk prompt
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are Dr. ${consultation.doctor.name}, a specialist in ${consultation.doctor.specialization} with ${consultation.doctor.experience} years of experience. Your bio: ${consultation.doctor.bio}`
        },
        {
          role: 'assistant',
          content: `Patient: ${consultation.user.firstName} ${consultation.user.lastName}, born on ${new Date(consultation.user.dateOfBirth).toDateString()}, age ${this.calculateAge(new Date(consultation.user.dateOfBirth))} years.`
        },
        ...historyMessages
      ];
      
      console.log('Messages to be sent to Groq:', JSON.stringify(messages, null, 2));
      // Panggil Groq API
      const completion = await this.groqClient.chat.completions.create({
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        messages,
      });

      return completion.choices[0].message.content ?? 'No response generated';
    } catch (error) {
      console.error('Error calling Groq API:', error);
      return 'I apologize, but I am unable to respond at the moment. Please try again later.';
    }
  }}
