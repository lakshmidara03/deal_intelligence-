import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  ensureSalesRep() {
    return this.db.one(
      `insert into users (full_name, email, role)
       values ($1, $2, $3)
       on conflict (email) do update set full_name = excluded.full_name, role = excluded.role
       returning id, full_name, email, role`,
      ["Sales Rep", "sales.rep@example.com", "sales_rep"]
    );
  }
}
