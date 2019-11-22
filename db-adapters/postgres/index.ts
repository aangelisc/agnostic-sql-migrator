import { Client, QueryResult, QueryResultBase } from "pg";
import { AdapterClient } from "../../src/index";

const createClient = async (config: any): Promise<Client> => {
  const client = new Client(config);
  await client.connect();
  return client;
};

const query = async (
  client: Client,
  query: string
): Promise<QueryResultBase & QueryResult> => {
  const res = await client.query(query);
  return res;
};

const closeConnection = async (client: Client): Promise<void> => {
  await client.end();
};

export const adapterClient: AdapterClient = {
  createClient,
  query,
  closeConnection
};
