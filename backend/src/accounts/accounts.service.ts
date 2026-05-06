import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountRole } from '../../../packages/database/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.employee.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        title: true,
        _count: {
          select: { deals: true }
        }
      }
    });
  }

  async login(dto: LoginDto) {
    const account = await this.prisma.employee.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (!account || account.password !== dto.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.toSession(account);
  }

  async signup(dto: SignupDto) {
    const existing = await this.prisma.employee.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const account = await this.prisma.employee.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: dto.password,
        role: dto.role as AccountRole,
        title: dto.title
      }
    });

    return this.toSession(account);
  }

  private toSession(account: {
    id: string;
    name: string;
    email: string;
    role: AccountRole;
    title: string;
  }) {
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      title: account.title
    };
  }
}
