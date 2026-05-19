import { BadRequestException, Body, Controller, Post, UnauthorizedException } from "@nestjs/common";

interface LoginBody {
  email?: string;
  password?: string;
}

@Controller("auth")
export class AuthController {
  @Post("login")
  login(@Body() body: LoginBody) {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      throw new BadRequestException("Email and password are required");
    }

    if (this.looksMalicious(email) || this.looksMalicious(password)) {
      throw new BadRequestException("Blocked suspicious login input");
    }

    if (email !== "sales.rep@example.com" || password !== "SalesRep@123") {
      throw new UnauthorizedException("Invalid email or password");
    }

    return {
      id: "mock-sales-rep",
      name: "Sales Rep",
      email: "sales.rep@example.com",
      role: "SALES_REP"
    };
  }

  @Post("sales-rep")
  loginAsSalesRep() {
    return this.login({ email: "sales.rep@example.com", password: "SalesRep@123" });
  }

  private looksMalicious(value: string) {
    return /['"`;]/.test(value) || /\b(or|and)\b\s+1=1/i.test(value) || /--|\/\*|\*\//.test(value);
  }
}
