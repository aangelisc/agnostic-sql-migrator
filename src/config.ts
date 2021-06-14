import { Client } from 'pg';
import { getMigrationFiles, migrateDb } from './migrations';
import { adapters } from './adapters';
import { resolve } from 'path';
import { Connection } from 'mysql2/promise';
import { ConnectionPool } from 'mssql';

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

export type Adapters = 'postgres' | 'mysql' | 'sqlserver' | undefined;

export type AdapterClients = Client | Connection | ConnectionPool;

export interface AdapterClient {
  createClient: (config: ClientConfig) => Promise<AdapterClients>;
  query: (client: AdapterClients, query: string) => any;
  closeConnection: (client: AdapterClients) => Promise<void>;
}

export const createConfig = (defaultVersion?: number): Config => {
  const args = process.argv.slice(2);
  const argMap = new Map<string, string>();
  args.map((arg) => {
    const keyVal = arg.split('=');
    argMap.set(keyVal[0], keyVal[1]);
  });
  const adapter: Adapters = argMap.get('ADAPTER')
    ? (argMap.get('ADAPTER').toLowerCase() as Adapters)
    : process.env.ADAPTER
    ? (process.env.ADAPTER.toLowerCase() as Adapters)
    : undefined;
  const user = argMap.get('USER') ? argMap.get('USER') : process.env.USER || '';
  const password = argMap.get('PASSWORD')
    ? argMap.get('PASSWORD')
    : process.env.PASSWORD
    ? process.env.PASSWORD
    : undefined;
  const host = argMap.get('HOST')
    ? argMap.get('HOST')
    : process.env.HOST
    ? process.env.HOST
    : undefined;
  const port = argMap.get('PORT')
    ? Number.parseInt(argMap.get('PORT'))
    : process.env.PORT
    ? Number.parseInt(process.env.PORT)
    : undefined;
  const database = argMap.get('DATABASE')
    ? argMap.get('DATABASE')
    : process.env.DATABASE
    ? process.env.DATABASE
    : undefined;
  const version = argMap.get('VERSION')
    ? Number.parseInt(argMap.get('VERSION'))
    : defaultVersion
    ? defaultVersion
    : undefined;
  const migrationsPath = argMap.get('MIGRATIONS_PATH')
    ? resolve(argMap.get('MIGRATIONS_PATH'))
    : process.env.MIGRATIONS_PATH
    ? resolve(process.env.MIGRATIONS_PATH)
    : undefined;
  return {
    ClientConfig: { user, password, host, port, database },
    MigrationConfig: { adapter, version, migrationsPath },
  };
};

export const migrator = async (userConfig?: Partial<Config>) => {
  let config = createConfig();
  config = userConfig
    ? {
        ClientConfig: { ...config.ClientConfig, ...userConfig.ClientConfig },
        MigrationConfig: {
          ...config.MigrationConfig,
          ...userConfig.MigrationConfig,
        },
      }
    : {
        ClientConfig: config.ClientConfig,
        MigrationConfig: config.MigrationConfig,
      };
  const migrationFiles = getMigrationFiles(config);
  if (!config.MigrationConfig.version) {
    Object.assign(config.MigrationConfig, {
      version:
        migrationFiles.RollForward[migrationFiles.RollForward.length - 1]
          .VersionTo,
    });
  }
  const adapter = await adapters(config.MigrationConfig.adapter);
  const client = await adapter.createClient(config.ClientConfig);
  try {
    await migrateDb(
      client,
      adapter,
      config.MigrationConfig.version,
      migrationFiles,
      config.MigrationConfig.adapter
    );
  } finally {
    await adapter.closeConnection(client);
  }
};
