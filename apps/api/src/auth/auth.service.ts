import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect } from '../common/selects';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('Email is already registered');
      }

      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
        passwordHash,
        status: UserStatus.OFFLINE,
      },
      select: safeUserSelect,
    });

    const accessToken = await this.signToken({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      accessToken,
      user,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.signToken({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    const safeUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: safeUserSelect,
    });

    return {
      accessToken,
      user: safeUser,
    };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: safeUserSelect,
    });
  }

  async getUserFromToken(token: string): Promise<AuthUser> {
    try {
      return await this.jwtService.verifyAsync<AuthUser>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async signToken(payload: AuthUser) {
    return this.jwtService.signAsync(payload);
  }
}

