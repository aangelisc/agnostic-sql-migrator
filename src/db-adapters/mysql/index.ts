import { AdapterClient, ClientConfig } from '../../config';
import { Connection, createConnection } from 'mysql2/promise';

const createClient = async (config: ClientConfig): Promise<Connection> => {
  try {
    const client = await createConnection({
      ...config,
      multipleStatements: true,
    });
    console.log('Successfully connected to MySQL DB');
    return client;
  } catch (err) {
    throw err;
  }
};

const query = async (client: Connection, query: string) => {
  const res = await client.query(query);
  return res[0];
};

const closeConnection = async (client: Connection): Promise<void> => {
  try {
    await client.end();
    console.log('Connection to MySQL DB closed');
  } catch (err) {
    throw err;
  }
};

export default {
  createClient,
  query,
  closeConnection,
} as AdapterClient;
