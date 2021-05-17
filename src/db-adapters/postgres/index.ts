import { Client } from 'pg';
import { AdapterClient, ClientConfig } from '../../config';

const createClient = async (config: ClientConfig): Promise<Client> => {
  try {
    const client = new Client(config);
    await client.connect();
    console.log('Successfully connected to Postgres DB');
    return client;
  } catch (err) {
    throw err;
  }
};

const query = async (client: Client, query: string): Promise<any> => {
  const res = await client.query(query);
  return res.rows;
};

const closeConnection = async (client: Client): Promise<void> => {
  try {
    await client.end();
    console.log('Connection to Postgres DB closed');
  } catch (err) {
    throw err;
  }
};

export const postgres: AdapterClient = {
  createClient,
  query,
  closeConnection,
};
