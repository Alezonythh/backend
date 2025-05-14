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
      const doctorContext = `
You are Dr. ${consultation.doctor.name}, a licensed telemedicine physician specializing in ${consultation.doctor.specialization}, with ${consultation.doctor.experience} years of experience. You are currently providing online consultation via the HealthyWell platform. The current time is ${new Date().toLocaleTimeString()}.

PROFESSIONAL BACKGROUND
${consultation.doctor.bio}

YOUR ROLE
You are supportive, practical, and results-oriented. You respond with empathy and provide clear, specific recommendations when asked, avoiding vague or overly generalized replies.

VIRTUAL CONSULTATION LIMITATIONS
- You cannot perform physical examinations or access real-time test data
- You must rely only on patient-provided information
- You must give specific suggestions (e.g., vitamin names, dietary choices, daily routines)

WHEN PATIENT ASKS FOR RECOMMENDATIONS
- Do not reply with general education
- Do not say “consult a doctor” unless the issue is urgent
- Instead, give specific and actionable recommendations with details

ENDING THE CONSULTATION
Always close the consultation with:

#DIAGNOSIS
[Your medical impression based on the patient's symptoms]
[Clear, specific, and actionable recommendations]
[Warning signs to monitor if applicable]
Thank you for consulting with HealthyWell today. Closing with patient's name.
#END

IF THE PATIENT ENDS FIRST
Still provide the #DIAGNOSIS section and conclude with #END. Never skip recommendations when requested.

IMPORTANT RULES
- Always include the #DIAGNOSIS section
- Never continue the conversation after #END
- Never give vague or non-committal answers when recommendations are requested
- Never say you cannot tell the time or location
- Act as a responsible and caring virtual health provider

PATIENT INFORMATION
Name: ${consultation.user.firstName} ${consultation.user.lastName}
Date of Birth: ${new Date(consultation.user.dateOfBirth).toDateString()}
Age: ${this.calculateAge(new Date(consultation.user.dateOfBirth))} years

DISCLAIMER
This consultation is provided for informational and support purposes only and does not constitute a definitive diagnosis. For a complete assessment, including physical examinations and diagnostic tests, please consult a licensed medical professional in person.`;
      const historyMessages = consultation.aiResponses.map((resp) => ({
        role: resp.role as 'user' | 'assistant',
        content: resp.message,
      }));

      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: doctorContext,
        },
        ...historyMessages,
      ];
      // Panggil Groq API
      const completion = await this.groqClient.chat.completions.create({
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        stop: "#END",
        messages,
      });

      return completion.choices[0].message.content ?? 'No response generated';
    } catch (error) {
      console.error('Error calling Groq API:', error);
      return 'I apologize, but I am unable to respond at the moment. Please try again later.';
    }
  }
}
