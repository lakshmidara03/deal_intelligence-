import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly config: ConfigService) {
    this.pool = new Pool({
      connectionString: this.config.get<string>("DATABASE_URL"),
      max: 12,
      idleTimeoutMillis: 30000
    });
  }

  async onModuleInit() {
    await this.pool.query("select 1");
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
    return this.pool.query<T>(text, params);
  }

  async one<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
    const result = await this.query<T>(text, params);
    return result.rows[0] ?? null;
  }

  async many<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
    const result = await this.query<T>(text, params);
    return result.rows;
  }
}
