import { AdapterClients, AdapterClient } from "./config";

export const Version = {
  exists: async (
    client: AdapterClients,
    adapter: AdapterClient
  ): Promise<boolean> => {
    const exists = await adapter.query(
      client,
      "SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name = 'version') as value;"
    );
    return exists.rows[0].value;
  },
  create: async (
    client: AdapterClients,
    adapter: AdapterClient
  ): Promise<void> => {
    console.log("New DB - Creating version information");
    await adapter.query(
      client,
      "CREATE TABLE version (value INT);INSERT INTO version(value) VALUES(1);"
    );
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
    const currentVersion = Number.parseInt(version.rows[0].value);
    console.log("Current DB Version is: ", currentVersion);
    return currentVersion;
  }
};
