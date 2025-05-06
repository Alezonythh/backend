import { Body, Controller, Post, UseGuards, Request, Logger } from '@nestjs/common';
import { HealthSupportService } from './health-support.service';
// Fix the import path for JwtAuthGuard
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('health-support')
export class HealthSupportController {
  private readonly logger = new Logger(HealthSupportController.name);
  
  constructor(private readonly healthSupportService: HealthSupportService) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@Body() body: { message: string; history: any[] }) {
    this.logger.log(`Received health support request: ${body.message}`);
    
    // Generate AI response
    const aiResponse = await this.healthSupportService.generateHealthSupportResponse(
      body.message,
      body.history
    );
    
    // Generate topic based on conversation
    const topic = await this.healthSupportService.generateTopicFromConversation(
      body.message,
      body.history,
      aiResponse
    );
    
    return { 
      message: aiResponse,
      topic: topic
    };
  }
}