import { readdirSync, readFileSync } from "fs";
import { Version } from "./version";
import * as path from "path";
import { Client } from "pg";
import { adapters } from "./adapters";

export interface ClientConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export type Adapters = "postgres" | undefined;

export type AdapterClients = Client;

export type Config = ClientConfig & { adapter: Adapters; version?: number };

interface Migration {
  Path: string;
  Version: number;
}

export interface AdapterClient {
  createClient: (config: ClientConfig) => Promise<AdapterClients>;
  query: (client: Client, query: string) => any;
  closeConnection: (client: Client) => Promise<void>;
}

interface Migrations {
  RollBackward: Migration[];
  RollForward: Migration[];
}

const createConfig = (defaultVersion: number): Config => {
  const args = process.argv.slice(2);
  const argMap = new Map<string, string>();
  args.map(arg => {
    const keyVal = arg.split("=");
    argMap.set(keyVal[0], keyVal[1]);
  });
  const adapter: Adapters = argMap.get("ADAPTER")
    ? (argMap.get("ADAPTER").toLowerCase() as Adapters)
    : (process.env.ADAPTER.toLowerCase() as Adapters) || undefined;
  const user = argMap.get("USER") ? argMap.get("USER") : process.env.USER || "";
  const password = argMap.get("PASSWORD")
    ? argMap.get("PASSWORD")
    : process.env.PASSWORD || "";
  const host = argMap.get("HOST") ? argMap.get("HOST") : process.env.HOST || "";
  const port = argMap.get("PORT")
    ? Number.parseInt(argMap.get("PORT"))
    : Number.parseInt(process.env.PORT) || 5432;
  const database = argMap.get("DATABASE")
    ? argMap.get("DATABASE")
    : process.env.DATABASE || "";
  const version = argMap.get("VERSION")
    ? Number.parseInt(argMap.get("VERSION"))
    : defaultVersion;
  return {
    adapter,
    user,
    password,
    host,
    port,
    database,
    version
  };
};

const getMigrationFiles = (): Migrations => {
  const migrationsPath = path.resolve(__dirname, "../db_migrations");
  const files = readdirSync(migrationsPath);
  if (files.length === 0) {
    throw new Error("No migrations found - check db_migrations folder");
  }
  const RollBackward: Migration[] = files
    .map(file => {
      const numbers = file.split(".")[0];
      const number1 = Number.parseInt(numbers.split("-")[0]);
      const number2 = Number.parseInt(numbers.split("-")[1]);
      if (number1 > number2) {
        return {
          Path: path.join(migrationsPath, file),
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
          Path: path.join(migrationsPath, file),
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

const migrateDb = async (
  client: AdapterClients,
  adapter: AdapterClient,
  version: number,
  migrations: Migrations
) => {
  const versionExists = await Version.exists(client, adapter);
  if (!versionExists) {
    console.log("New DB - Creating version information");
    await Version.create(client, adapter);
  }
  let currentVersion = await Version.get(client, adapter);
  console.log("Current DB Version is: ", currentVersion);
  if (currentVersion === version) {
    console.log(
      "DB is already at the specified version - no migrations to carry out."
    );
  }
  if (currentVersion < version) {
    console.log("Rolling forwards to version: ", version);
    const rollforward = migrations.RollForward.filter(
      item => item.Version <= version
    );
    await executeMigrations(client, adapter, version, rollforward);
  }
  if (currentVersion > version) {
    console.log("Rolling backwards to version: ", version);
    const rollbackward = migrations.RollBackward.filter(
      item => item.Version >= version
    );
    await executeMigrations(client, adapter, version, rollbackward);
  }
};

const executeMigrations = async (
  client: AdapterClients,
  adapter: AdapterClient,
  version: number,
  migrations: Migration[]
) => {
  await adapter.query(client, "BEGIN;");
  let migrationsSuccessful = true;
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    const query = readFileSync(migration.Path).toString();
    console.log("Executing migration: ", query);
    try {
      await adapter.query(client, query);
    } catch (err) {
      console.log(
        `Failed to migrate to version ${migration.Version} with error: ${err}`
      );
      await adapter.query(client, "ROLLBACK;");
      migrationsSuccessful = false;
      break;
    }
  }
  if (migrationsSuccessful) {
    await adapter.query(client, "COMMIT");
    await adapter.query(client, `UPDATE version SET value=${version}`);
    console.log(
      "Migrations successfully completed. DB is now on version: ",
      version
    );
  }
};

const entrypoint = async () => {
  const migrationFiles = getMigrationFiles();
  const config = createConfig(
    migrationFiles.RollForward[migrationFiles.RollForward.length - 1].Version
  );
  const adapter = adapters[config.adapter];
  const client = await adapter.createClient(config);
  await migrateDb(client, adapter, config.version, migrationFiles);
  await adapter.closeConnection(client);
};

entrypoint().catch(err => console.log(err));
