import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { 
  EmailAlreadyExistsException, 
  UsernameAlreadyExistsException,
  InvalidPasswordException,
  EmailNotFoundException,
  WeakPasswordException
} from '../common/decorators/custom-errors.decorator';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new EmailNotFoundException();
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidPasswordException();
    }
    
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    };
  }

  async register(body: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
  }) {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    
    if (existingEmail) {
      throw new EmailAlreadyExistsException();
    }
    
    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: body.username },
    });
    
    if (existingUsername) {
      throw new UsernameAlreadyExistsException();
    }
    
    // Validate password strength
    if (body.password.length < 6) {
      throw new WeakPasswordException();
    }
    
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: body.username,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        email: body.email,
      },
    });
    
    const { password, ...result } = user;
    return result;
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
      },
    });
    return user;
  }
  
  
}