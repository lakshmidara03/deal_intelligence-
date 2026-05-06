import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.accountsService.login(dto);
  }

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.accountsService.signup(dto);
  }
}
