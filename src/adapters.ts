import { postgres } from "./db-adapters/postgres";
import { mysql } from "./db-adapters/mysql";
import { sqlserver } from "./db-adapters/sqlserver";
export const adapters = {
  postgres,
  mysql,
  sqlserver
};
