import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
async register(@Body() body: {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO format string
  email: string;
}) {
  return this.authService.register(body);
}

  @Post('login')
  async login(@Body() body: { email: string, password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }
  @Get('/')
  async getHello(): Promise<string> {
    return 'Hello World!';
  }
  @UseGuards(JwtAuthGuard)
  @Get('user')
  async getProfile(@Req() req: any) {
    const user = await this.authService.getUserById(req.user.userId);
    return user;
  }}