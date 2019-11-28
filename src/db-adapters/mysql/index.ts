import { AdapterClient } from "../../config";
import {
  Connection,
  createConnection,
  ConnectionOptions
} from "mysql2/promise";

const createClient = async (config: ConnectionOptions): Promise<Connection> => {
  try {
    const client = await createConnection(config);
    await client.connect();
    console.log("Successfully connected to Postgres DB");
    return client;
  } catch (err) {
    throw err;
  }
};

const query = async (client: Connection, query: string) => {
  const res = await client.query(query);
  return res;
};

const closeConnection = async (client: Connection): Promise<void> => {
  try {
    await client.end();
    console.log("Connection to Postgres DB closed");
  } catch (err) {
    throw err;
  }
};

export const mysql: AdapterClient = {
  createClient,
  query,
  closeConnection
};
