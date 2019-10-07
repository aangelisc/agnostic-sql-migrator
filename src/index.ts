import { Client, ClientConfig } from "pg";
import { readdirSync } from "fs";
import * as path from "path";

interface Migration {
  Path: string;
  Version: number;
}

interface Migrations {
  RollBack: Migration[];
  RollForward: Migration[];
}

const createConfig = (defaultVersion: number): ClientConfig & { version?: number } => {
  const args = process.argv.slice(2);
  const argMap = new Map<string, string>();
  args.map(arg => {
    const keyVal = arg.split("=");
    argMap.set(keyVal[0], keyVal[1]);
  });
  const user = argMap.get("PG_USER") ? argMap.get("PG_USER") : process.env.PGUSER || "";
  const password = argMap.get("PG_PASSWORD")
    ? argMap.get("PG_PASSWORD")
    : process.env.PGPASSWORD || "";
  const host = argMap.get("PG_HOST") ? argMap.get("PG_HOST") : process.env.PGHOST || "";
  const port = argMap.get("PG_PORT")
    ? Number.parseInt(argMap.get("PG_PORT"))
    : Number.parseInt(process.env.PGPORT) || 5432;
  const database = argMap.get("PG_DB")
    ? argMap.get("PG_PORT")
    : process.env.PGDATABASE || "";
  const version = argMap.get("VERSION")
    ? Number.parseInt(argMap.get("VERSION"))
    : defaultVersion;
  return {
    user,
    password,
    host,
    port,
    database,
    version
  };
};

const getMigrationFiles = (): Migrations => {
  const files = readdirSync(path.resolve(__dirname, "../db_migrations"));
  const RollBack: Migration[] = files
    .map(file => {
      const numbers = file.split(".")[0];
      const number1 = Number.parseInt(numbers.split("-")[0]);
      const number2 = Number.parseInt(numbers.split("-")[1]);
      if (number1 > number2) {
        return {
          Path: file,
          Version: number2
        };
      }
    })
    .filter(item => item !== undefined);
  const RollForward: Migration[] = files
    .map(file => {
      const numbers = file.split(".")[0];
      const number1 = Number.parseInt(numbers.split("-")[0]);
      const number2 = Number.parseInt(numbers.split("-")[1]);
      if (number1 < number2) {
        return {
          Path: file,
          Version: number2
        };
      }
    })
    .filter(item => item !== undefined);
  return {
    RollBack,
    RollForward
  };
};
