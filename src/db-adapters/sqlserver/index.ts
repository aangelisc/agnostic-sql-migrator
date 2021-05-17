import { ConnectionPool } from 'mssql';
import { AdapterClient, ClientConfig } from '../../config';

const createClient = async (config: ClientConfig): Promise<ConnectionPool> => {
  try {
    const updatedConfig = Object.assign(config, { server: config.host });
    const connectionPool = new ConnectionPool(updatedConfig);
    await connectionPool.connect();
    console.log('Successfully connected to MS SQL DB');
    return connectionPool;
  } catch (err) {
    throw err;
  }
};

const query = async (
  connectionPool: ConnectionPool,
  query: string
): Promise<any> => {
  try {
    const res = await connectionPool.query(query);
    return res.recordset;
  } catch (err) {
    throw err;
  }
};

const closeConnection = async (
  connectionPool: ConnectionPool
): Promise<void> => {
  try {
    await connectionPool.close();
    console.log('Connection to MS SQL DB closed');
  } catch (err) {
    throw err;
  }
};

export const sqlserver: AdapterClient = {
  createClient,
  query,
  closeConnection,
};
