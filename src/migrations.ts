import { readdirSync, readFileSync } from 'fs';
import { AdapterClients, AdapterClient, Config, Adapters } from './config';
import { Version } from './version';
import * as path from 'path';
import { Transaction, ConnectionPool, Request } from 'mssql';

export interface Migration {
  Path: string;
  VersionFrom: number;
  VersionTo: number;
}

export interface Migrations {
  RollBackward: Migration[];
  RollForward: Migration[];
}

export const getMigrationFiles = (config: Config): Migrations => {
  const files = readdirSync(config.MigrationConfig.migrationsPath);
  if (files.length === 0) {
    throw new Error('No migrations found - check migrations folder');
  }
  const RollBackward: Migration[] = files
    .map((file) => {
      const numbers = file.split('.')[0];
      const number1 = Number.parseInt(numbers.split('-')[0]);
      const number2 = Number.parseInt(numbers.split('-')[1]);
      if (number1 > number2) {
        return {
          Path: path.join(config.MigrationConfig.migrationsPath, file),
          VersionTo: number2,
          VersionFrom: number1,
        };
      }
    })
    .filter((item) => item !== undefined)
    .sort((a, b) => (a.VersionTo > b.VersionTo ? -1 : 1));
  const RollForward: Migration[] = files
    .map((file) => {
      const numbers = file.split('.')[0];
      const number1 = Number.parseInt(numbers.split('-')[0]);
      const number2 = Number.parseInt(numbers.split('-')[1]);
      if (number1 < number2) {
        return {
          Path: path.join(config.MigrationConfig.migrationsPath, file),
          VersionTo: number2,
          VersionFrom: number1,
        };
      }
    })
    .filter((item) => item !== undefined)
    .sort((a, b) => (a.VersionTo > b.VersionTo ? 1 : -1));
  return {
    RollBackward,
    RollForward,
  };
};

export const validateMigrations = (
  versionTo: number,
  versionFrom: number,
  migrations: Migration[]
): boolean => {
  let migrationsValid = true;

  return migrationsValid;
};

export const migrateDb = async (
  client: AdapterClients,
  adapter: AdapterClient,
  version: number,
  migrations: Migrations,
  adapterType: Adapters
) => {
  const versionExists = await Version.exists(client, adapter, adapterType);
  if (!versionExists) {
    await Version.create(client, adapter, adapterType);
  }
  let currentVersion = await Version.get(client, adapter, adapterType);
  if (currentVersion === version) {
    console.log(
      'DB is already at the specified version - no migrations to carry out.'
    );
  }
  if (currentVersion < version) {
    console.log('Rolling forwards to version: ', version);
    const rollforward = migrations.RollForward.filter(
      (item) =>
        item.VersionFrom <= version &&
        item.VersionTo <= version &&
        item.VersionTo > currentVersion
    );
    await executeMigrations(client, adapter, version, rollforward, adapterType);
  }
  if (currentVersion > version) {
    console.log('Rolling backwards to version: ', version);
    const rollbackward = migrations.RollBackward.filter(
      (item) =>
        item.VersionFrom >= version &&
        item.VersionTo >= version &&
        item.VersionTo < currentVersion
    );
    await executeMigrations(
      client,
      adapter,
      version,
      rollbackward,
      adapterType
    );
  }
};

export const executeMigrations = async (
  client: AdapterClients,
  adapter: AdapterClient,
  version: number,
  migrations: Migration[],
  adapterType: Adapters
) => {
  if (migrations.length === 0) {
    return;
  }
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    const query = readFileSync(migration.Path).toString();
    console.log('Executing migration: ', query);
    try {
      await adapter.query(client, query);
      await Version.update(client, adapter, migration.VersionTo, adapterType);
    } catch (err) {
      throw new Error(`Failed to execute migration with error: ${err}`);
    }
  }
  console.log(
    'Migrations successfully completed. DB is now on version: ',
    version
  );
};
