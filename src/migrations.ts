import { readdirSync, readFileSync } from "fs";
import { AdapterClients, AdapterClient, Config } from "./config";
import { Version } from "./version";
import * as path from "path";

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
  const files = readdirSync(config.migrationsPath);
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
          Path: path.join(config.migrationsPath, file),
          VersionTo: number2,
          VersionFrom: number1
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
          Path: path.join(config.migrationsPath, file),
          VersionTo: number2,
          VersionFrom: number1
        };
      }
    })
    .filter(item => item !== undefined);
  return {
    RollBackward,
    RollForward
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
  migrations: Migrations
) => {
  const versionExists = await Version.exists(client, adapter);
  if (!versionExists) {
    await Version.create(client, adapter);
  }
  let currentVersion = await Version.get(client, adapter);
  if (currentVersion === version) {
    console.log(
      "DB is already at the specified version - no migrations to carry out."
    );
  }
  if (currentVersion < version) {
    console.log("Rolling forwards to version: ", version);
    const rollforward = migrations.RollForward.filter(
      item => item.VersionFrom <= version && item.VersionTo >= currentVersion
    );
    console.log(rollforward);
    await executeMigrations(client, adapter, version, rollforward);
  }
  if (currentVersion > version) {
    console.log("Rolling backwards to version: ", version);
    const rollbackward = migrations.RollBackward.filter(
      item => item.VersionFrom >= version && item.VersionTo <= currentVersion
    );
    console.log({ rollbackward });
    await executeMigrations(client, adapter, version, rollbackward);
  }
};

export const executeMigrations = async (
  client: AdapterClients,
  adapter: AdapterClient,
  version: number,
  migrations: Migration[]
) => {
  await adapter.query(client, "BEGIN;");
  let migrationsSuccessful = true;
  if (migrations.length === 0) {
  }
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    const query = readFileSync(migration.Path).toString();
    console.log("Executing migration: ", query);
    try {
      await adapter.query(client, query);
    } catch (err) {
      console.log(
        `Failed to migrate to version ${migration.VersionTo} with error: ${err}`
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
