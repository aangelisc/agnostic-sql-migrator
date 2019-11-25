import { Client, QueryResult, QueryResultBase } from "pg";
import { AdapterClient } from "../../config";

const createClient = async (config: any): Promise<Client> => {
  try {
    const client = new Client(config);
    await client.connect();
    console.log("Successfully connected to Postgres DB");
    return client;
  } catch (err) {
    throw err;
  }
};

const query = async (
  client: Client,
  query: string
): Promise<QueryResultBase & QueryResult> => {
  const res = await client.query(query);
  return res;
};

const closeConnection = async (client: Client): Promise<void> => {
  try {
    await client.end();
    console.log("Connection to Postgres DB closed");
  } catch (err) {
    throw err;
  }
};

export const adapterClient: AdapterClient = {
  createClient,
  query,
  closeConnection
};
