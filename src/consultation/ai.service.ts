import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Consultation } from '@prisma/client';

@Injectable()
export class AIService {
  private readonly apiUrl = process.env.GROOQ_API_URL || 'https://api.grooq.ai';
  private readonly apiKey = process.env.GROOQ_API_KEY;

  async generateResponse(
    userMessage: string,
    consultation: Consultation & { doctor: any, aiResponses: any[] },
  ): Promise<string> {
    try {
      // Create context for the AI based on the doctor's information
      const doctorContext = `You are Dr. ${consultation.doctor.name}, a specialist in ${consultation.doctor.specialization} with ${consultation.doctor.experience} years of experience. Your bio: ${consultation.doctor.bio}`;
      
      // Get conversation history
      const conversationHistory = consultation.aiResponses.map(resp => resp.message).join('\n');
      
      // Call the Grooq API
      const response = await axios.post(
        `${this.apiUrl}/generate`,
        {
          prompt: userMessage,
          context: doctorContext,
          history: conversationHistory,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.response;
    } catch (error) {
      console.error('Error calling Grooq API:', error);
      return 'I apologize, but I am unable to respond at the moment. Please try again later.';
    }
  }
}