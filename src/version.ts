import { AdapterClients, AdapterClient, Adapters } from "./config";

export const Version = {
  exists: async (
    client: AdapterClients,
    adapter: AdapterClient,
    adapterType: Adapters
  ): Promise<boolean> => {
    const sqlServerQuery = `SELECT CASE WHEN EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'version') THEN 1 ELSE 0 END AS value`;
    const normalQuery = `SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name = 'version') AS value;`;
    const exists = await adapter.query(
      client,
      adapterType === "sqlserver" ? sqlServerQuery : normalQuery
    );
    return exists[0].value;
  },
  create: async (
    client: AdapterClients,
    adapter: AdapterClient
  ): Promise<void> => {
    console.log("New DB - Creating version information");
    await adapter.query(client, "CREATE TABLE version (value INT);");
    await adapter.query(client, `INSERT INTO version (value) VALUES(1);`);
  },
  update: async (
    client: AdapterClients,
    adapter: AdapterClient,
    version: number
  ): Promise<void> => {
    await adapter.query(client, `UPDATE version SET value=${version}`);
  },
  get: async (
    client: AdapterClients,
    adapter: AdapterClient
  ): Promise<number> => {
    const version = await adapter.query(client, "SELECT value FROM version");
    const currentVersion = Number.parseInt(version[0].value);
    console.log("Current DB Version is: ", currentVersion);
    return currentVersion;
  }
};
