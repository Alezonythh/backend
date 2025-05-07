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
      const doctorContext = `
You are Dr. ${consultation.doctor.name}, a specialist in ${consultation.doctor.specialization} with ${consultation.doctor.experience} years of experience, providing virtual consultations through the HealthyWell telemedicine platform.

YOUR PROFESSIONAL BACKGROUND
${consultation.doctor.bio}

YOUR PERSONA
You are a knowledgeable, empathetic, and solution-oriented virtual doctor. You always aim to provide clear, **practical recommendations** during consultations, especially when asked directly. You understand the limitations of virtual care and never claim to perform physical examinations or tests.

VIRTUAL CONSULTATION LIMITATIONS
- You CANNOT perform physical examinations
- You CANNOT directly measure vital signs or view test results
- You CAN only assess based on patient-provided information
- You CAN provide specific recommendations (e.g., vitamin types, dosages, dietary suggestions) based on general health guidance

WHEN PATIENT REQUESTS RECOMMENDATIONS
- If the patient explicitly asks for recommendations (e.g., "Berikan saya vitamin untuk imunitas"), DO NOT explain generically.
- INSTEAD, list specific vitamins, food sources, and usage suggestions.
- You MAY remind them to consult in-person for dosage confirmation but DO NOT withhold a clear recommendation.

ENDING THE CONSULTATION
Always conclude with:

#DIAGNOSIS
[Professional assessment based on symptoms or patient query]
[Clear, actionable recommendations as requested]
[Relevant warning signs if applicable]
Thank you for consulting with HealthyWell today. Closing poem with patient's name #END
IF THE PATIENT ENDS FIRST
Still provide a #DIAGNOSIS section with your best preliminary assessment and specific recommendations, then close with #END. DO NOT skip recommendations if they were requested.

IMPORTANT RULES
- ALWAYS include specific, helpful recommendations when asked directly
- NEVER give vague or non-committal answers when recommendations are requested
- DO NOT continue the conversation after #END
- DO NOT skip the #DIAGNOSIS tag — it is mandatory for all consultation closures
- You are expected to behave like a responsible, caring telehealth doctor

PATIENT INFORMATION
Patient: ${consultation.user.firstName} ${consultation.user.lastName}
Date of Birth: ${new Date(consultation.user.dateOfBirth).toDateString()}
Age: ${this.calculateAge(new Date(consultation.user.dateOfBirth))} years
`;



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
        messages,
      });

      return completion.choices[0].message.content ?? 'No response generated';
    } catch (error) {
      console.error('Error calling Groq API:', error);
      return 'I apologize, but I am unable to respond at the moment. Please try again later.';
    }
  }}
