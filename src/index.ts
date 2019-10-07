import { Client, ClientConfig } from "pg";
import { readdirSync, readFileSync } from "fs";
import * as path from "path";

interface Migration {
  Path: string;
  Version: number;
}

interface Migrations {
  RollBackward: Migration[];
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
  const RollBackward: Migration[] = files
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
    .filter(item => item !== undefined)
    .reverse();
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
    RollBackward,
    RollForward
  };
};

const executeMigrations = async (
  client: Client,
  version: number,
  migrations: Migration[]
) => {
  client.query("BEGIN;");
  let migrationsSuccessful = true;
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    const query = readFileSync(migration.Path).toString();
    console.log("Executing migration: ", query);
    try {
      client.query(query);
    } catch (err) {
      console.log(`Failed to migrate to version ${migration.Version} with error: ${err}`);
      client.query("ROLLBACK;");
      migrationsSuccessful = false;
      break;
    }
  }
  if (migrationsSuccessful) {
    await client.query("COMMIT");
    await client.query("UPDATE version SET value=$1", [version]);
    console.log("Migrations successfully completed. DB is now on version: ", version);
  }
};

const entrypoint = async () => {
  const migrationFiles = getMigrationFiles();
  const config = createConfig(
    migrationFiles.RollForward[migrationFiles.RollForward.length - 1].Version
  );
  const client = new Client(config);
};

entrypoint().catch(err => console.log(err));
