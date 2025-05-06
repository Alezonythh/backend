import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';

@Injectable()
export class HealthSupportService {
  private readonly groqClient: Groq;

  constructor() {
    this.groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async generateHealthSupportResponse(
    userMessage: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<string> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // Enhanced system message for doctor-like behavior
        const systemMessage: ChatCompletionMessageParam = {
          role: 'system',
          content: `You are an experienced medical professional providing virtual health consultations. 
          
          CONSULTATION APPROACH:
          1. Ask relevant follow-up questions to understand the patient's symptoms thoroughly
          2. Maintain a professional, empathetic tone
          3. Follow a structured medical consultation approach (symptoms, duration, severity, alleviating/aggravating factors)
          4. Provide evidence-based information and practical advice
          5. Always recommend seeking in-person medical care for serious conditions
          6. Respond in the same language the patient uses (support both English and Indonesian)
          
          MEMORY GUIDELINES:
          - Remember previous symptoms mentioned by the patient
          - Reference earlier parts of the conversation when relevant
          - Ask about symptom progression if the patient returns to discuss the same issue
          - Track medication or treatment recommendations you've previously suggested
          
          IMPORTANT RULES:
          - Never diagnose definitively - only suggest possibilities
          - Always clarify you are an AI assistant, not a replacement for in-person medical care
          - For emergencies, direct patients to emergency services immediately
          - Be particularly cautious with children, pregnant women, elderly patients
          - Support both English and Indonesian languages fluently
          
          If the patient speaks Indonesian, respond in Indonesian. If they speak English, respond in English.`
        };

        // Analyze conversation history to extract key medical information
        const patientContext = this.analyzeConversationHistory(conversationHistory);
        
        // Add context message if we have meaningful patient information
        const messages: ChatCompletionMessageParam[] = [systemMessage];
        
        if (patientContext) {
          messages.push({
            role: 'system',
            content: `PATIENT CONTEXT: ${patientContext}`
          });
        }
        
        // Add conversation history and new message
        messages.push(
          ...conversationHistory,
          { role: 'user', content: userMessage }
        );

        // Call Groq API with enhanced parameters
        const completion = await this.groqClient.chat.completions.create({
          model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.95,
          presence_penalty: 0.1, // Slight penalty to avoid repetition
          frequency_penalty: 0.1, // Slight penalty to encourage diverse responses
        });

        // Check if the completion was successful
        if (!completion || !completion.choices || completion.choices.length === 0) {
          console.error('Empty response from Groq API');
          throw new Error('Received empty response from AI service');
        }

        return completion.choices[0].message.content ?? 'I apologize, but I am unable to respond at the moment. Please try again later.';
      } catch (error) {
        retries++;
        console.error(`Error calling Groq API (attempt ${retries}/${maxRetries}):`, error);
        
        // If we've reached max retries, throw the final error
        if (retries >= maxRetries) {
          // Handle specific error types
          if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return 'Unable to connect to the health support service. Please check your internet connection and try again later.';
          }
          
          if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
            return 'The health support service is taking too long to respond. Please try again later.';
          }
          
          if (error.response && error.response.status === 401) {
            return 'Authentication with the health support service failed. Please contact support.';
          }
          
          return 'I apologize, but I am experiencing technical difficulties. Please try again later.';
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retries) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached due to the return in the final catch block
    return 'An unexpected error occurred with the health support service.';
  }

  // New method to generate topic from conversation
  async generateTopicFromConversation(
    userMessage: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
    aiResponse: string
  ): Promise<string> {
    try {
      // Create a prompt to extract the main topic
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are a health topic classifier. Based on the conversation between a user and a health assistant, 
          identify the main health topic being discussed. Return ONLY the topic name in Indonesian (2-5 words), 
          with no additional text, explanation or punctuation. For example: "Perawatan Kulit Wajah" or "Manajemen Nyeri Kepala".`
        },
        {
          role: 'user',
          content: `User's latest message: "${userMessage}"
          
          AI's latest response: "${aiResponse}"
          
          Previous conversation: ${conversationHistory.map(msg => 
            `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n\n')}`
        }
      ];

      // Call Groq API with minimal parameters for efficiency
      const completion = await this.groqClient.chat.completions.create({
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        messages,
        temperature: 0.3, // Lower temperature for more focused response
        max_tokens: 10,   // We only need a few words
      });

      // Extract and clean the topic
      let topic = completion.choices[0].message.content?.trim() || "Kesehatan Umum";
      
      // Remove any quotes or punctuation
      topic = topic.replace(/["'.,:;!?]/g, '');
      
      return topic;
    } catch (error) {
      console.error('Error generating topic:', error);
      return "Kesehatan Umum"; // Default topic if there's an error
    }
  }

  // Helper method to analyze conversation history and extract key medical information
  private analyzeConversationHistory(conversationHistory: { role: 'user' | 'assistant'; content: string }[]): string | null {
    if (!conversationHistory || conversationHistory.length === 0) {
      return null;
    }

    // Extract only user messages to analyze symptoms
    const userMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content);
    
    if (userMessages.length === 0) {
      return null;
    }

    // Extract key medical information
    const symptoms: string[] = [];
    const medications: string[] = [];
    const duration: string[] = [];
    const severity: string[] = [];
    
    // Simple keyword-based extraction (can be enhanced with NLP in production)
    const symptomKeywords = ['sakit', 'nyeri', 'pain', 'hurt', 'ache', 'flu', 'fever', 'demam', 'batuk', 'cough', 'pusing', 'headache', 'mual', 'nausea'];
    const medicationKeywords = ['obat', 'medicine', 'pill', 'tablet', 'syrup', 'sirup', 'antibiotics', 'antibiotik', 'paracetamol', 'ibuprofen'];
    const durationKeywords = ['hari', 'day', 'week', 'minggu', 'bulan', 'month', 'hour', 'jam', 'sejak', 'since'];
    const severityKeywords = ['parah', 'severe', 'mild', 'ringan', 'sedang', 'moderate', 'berat', 'heavy'];
    
    userMessages.forEach(message => {
      const lowerMsg = message.toLowerCase();
      
      // Check for symptoms
      symptomKeywords.forEach(keyword => {
        if (lowerMsg.includes(keyword)) {
          // Extract the context around the symptom (simple approach)
          const index = lowerMsg.indexOf(keyword);
          const start = Math.max(0, index - 20);
          const end = Math.min(lowerMsg.length, index + 30);
          const context = lowerMsg.substring(start, end);
          symptoms.push(context);
        }
      });
      
      // Similar extraction for other categories
      medicationKeywords.forEach(keyword => {
        if (lowerMsg.includes(keyword)) {
          const index = lowerMsg.indexOf(keyword);
          const start = Math.max(0, index - 20);
          const end = Math.min(lowerMsg.length, index + 30);
          const context = lowerMsg.substring(start, end);
          medications.push(context);
        }
      });
      
      durationKeywords.forEach(keyword => {
        if (lowerMsg.includes(keyword)) {
          const index = lowerMsg.indexOf(keyword);
          const start = Math.max(0, index - 20);
          const end = Math.min(lowerMsg.length, index + 30);
          const context = lowerMsg.substring(start, end);
          duration.push(context);
        }
      });
      
      severityKeywords.forEach(keyword => {
        if (lowerMsg.includes(keyword)) {
          const index = lowerMsg.indexOf(keyword);
          const start = Math.max(0, index - 20);
          const end = Math.min(lowerMsg.length, index + 30);
          const context = lowerMsg.substring(start, end);
          severity.push(context);
        }
      });
    });
    
    // Build patient context summary
    const contextParts: string[] = [];
    
    if (symptoms.length > 0) {
      contextParts.push(`Reported symptoms: ${symptoms.join('; ')}`);
    }
    
    if (medications.length > 0) {
      contextParts.push(`Mentioned medications: ${medications.join('; ')}`);
    }
    
    if (duration.length > 0) {
      contextParts.push(`Duration information: ${duration.join('; ')}`);
    }
    
    if (severity.length > 0) {
      contextParts.push(`Severity indicators: ${severity.join('; ')}`);
    }
    
    // Detect language preference
    const indonesianKeywords = ['saya', 'aku', 'sakit', 'obat', 'demam', 'batuk', 'pusing', 'mual', 'hari', 'minggu', 'bulan', 'jam', 'sejak', 'parah', 'ringan', 'sedang', 'berat'];
    let indonesianCount = 0;
    
    userMessages.forEach(message => {
      const lowerMsg = message.toLowerCase();
      indonesianKeywords.forEach(keyword => {
        if (lowerMsg.includes(keyword)) {
          indonesianCount++;
        }
      });
    });
    
    // If Indonesian keywords are detected frequently, note language preference
    if (indonesianCount > 3) {
      contextParts.push('Language preference: Indonesian');
    }
    
    return contextParts.length > 0 ? contextParts.join('. ') : null;
  }

  // Helper method to calculate age
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }
}