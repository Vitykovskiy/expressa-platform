import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool | undefined;

  constructor(private readonly configuration: ConfigService) {}

  onModuleInit(): void {
    const connectionString = this.configuration.get<string>("DATABASE_URL");

    if (connectionString === undefined) {
      throw new Error("Invalid environment variable: DATABASE_URL");
    }

    this.pool = new Pool({ connectionString });
  }

  get connectionPool(): Pool {
    if (this.pool === undefined) {
      throw new Error("Database connection pool is not initialized");
    }

    return this.pool;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
