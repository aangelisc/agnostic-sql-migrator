import { Client } from "pg";

export const Version = {
  exists: async (client: Client): Promise<boolean> => {
    const exists = await client.query(
      "SELECT EXISTS(SELECT * FROM information_schema.tables WHERE table_name = 'version') as value;"
    );
    return exists.rows[0].value;
  },
  create: async (client: Client): Promise<void> => {
    await client.query(
      "CREATE TABLE version (value INT);INSERT INTO version(value) VALUES(1);"
    );
  },
  update: async (client: Client, version: number): Promise<void> => {
    await client.query("UPDATE version SET value=$1", [version]);
  },
  get: async (client: Client): Promise<number> => {
    const version = await client.query("SELECT value FROM version");
    return Number.parseInt(version.rows[0].value);
  }
};
