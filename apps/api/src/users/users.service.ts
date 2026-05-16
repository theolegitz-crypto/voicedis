import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { safeUserSelect } from '../common/selects';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: safeUserSelect,
    });
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: safeUserSelect,
    });
  }

  async getById(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: safeUserSelect,
    });
  }
}

