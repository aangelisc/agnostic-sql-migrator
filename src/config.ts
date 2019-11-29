import { Client } from "pg";
import { getMigrationFiles, migrateDb } from "./migrations";
import { adapters } from "./adapters";
import { resolve } from "path";
import { Connection } from "mysql2/promise";

export interface ClientConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export interface MigrationConfig {
  adapter: Adapters;
  migrationsPath: string;
  version?: number;
}

export interface Config {
  ClientConfig: ClientConfig;
  MigrationConfig: MigrationConfig;
}

export type Adapters = "postgres" | "mysql" | undefined;

export type AdapterClients = Client | Connection;

export interface AdapterClient {
  createClient: (config: ClientConfig) => Promise<AdapterClients>;
  query: (client: AdapterClients, query: string) => any;
  closeConnection: (client: Client | Connection) => Promise<void>;
}

export const createConfig = (defaultVersion?: number): Config => {
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
    : defaultVersion
    ? defaultVersion
    : undefined;
  const migrationsPath = argMap.get("MIGRATIONS_PATH")
    ? resolve(argMap.get("MIGRATIONS_PATH"))
    : resolve(process.env.MIGRATIONS_PATH);
  return {
    ClientConfig: { user, password, host, port, database },
    MigrationConfig: { adapter, version, migrationsPath }
  };
};

export const entrypoint = async () => {
  let config = createConfig();
  const migrationFiles = getMigrationFiles(config);
  if (!config.MigrationConfig.version) {
    Object.assign(config.MigrationConfig, {
      version:
        migrationFiles.RollForward[migrationFiles.RollForward.length - 1]
          .VersionTo
    });
  }
  const adapter = adapters[config.MigrationConfig.adapter];
  const client = await adapter.createClient(config.ClientConfig);
  await migrateDb(
    client,
    adapter,
    config.MigrationConfig.version,
    migrationFiles
  );
  await adapter.closeConnection(client);
};
