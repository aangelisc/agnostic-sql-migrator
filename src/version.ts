import { AdapterClients, AdapterClient, Adapters } from "./config";

export const Version = {
  exists: async (
    client: AdapterClients,
    adapter: AdapterClient,
    adapterType: Adapters
  ): Promise<boolean> => {
    const tableName = `${adapterType}_migration_table`;
    if (adapterType === "postgres") {
      const postgresQuery = `SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name = '${tableName}') AS value;`;
      const exists = await adapter.query(client, postgresQuery);
      return exists[0].value;
    } else if (adapterType === "mysql") {
      const mysqlQuery = `SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name='${tableName}') AS value;`;
      const exists = await adapter.query(client, mysqlQuery);
      return exists[0].value === 0 ? false : true;
    } else if (adapterType === "sqlserver") {
      const sqlServerQuery = `SELECT CASE WHEN EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}') THEN 1 ELSE 0 END AS value`;
      const exists = await adapter.query(client, sqlServerQuery);
      return exists[0].value === 0 ? false : true;
    }
  },
  create: async (
    client: AdapterClients,
    adapter: AdapterClient,
    adapterType: Adapters
  ): Promise<void> => {
    const tableName = `${adapterType}_migration_table`;
    console.log("New DB - Creating version information");
    await adapter.query(client, `CREATE TABLE ${tableName} (value INT);`);
    await adapter.query(client, `INSERT INTO ${tableName} (value) VALUES(1);`);
  },
  update: async (
    client: AdapterClients,
    adapter: AdapterClient,
    version: number,
    adapterType: Adapters
  ): Promise<void> => {
    const tableName = `${adapterType}_migration_table`;
    await adapter.query(client, `UPDATE ${tableName} SET value=${version}`);
  },
  get: async (
    client: AdapterClients,
    adapter: AdapterClient,
    adapterType: Adapters
  ): Promise<number> => {
    const tableName = `${adapterType}_migration_table`;
    const version = await adapter.query(
      client,
      `SELECT value FROM ${tableName}`
    );
    const currentVersion = Number.parseInt(version[0].value);
    console.log("Current DB Version is: ", currentVersion);
    return currentVersion;
  }
};
