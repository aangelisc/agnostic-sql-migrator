import { AdapterClient, Adapters } from './config';

export const adapters = async (adapter: Adapters): Promise<AdapterClient> => {
  try {
    switch (adapter) {
      case 'postgres':
        const pg = await import('./db-adapters/postgres');
        return (await import('./db-adapters/postgres'))
          .default as unknown as AdapterClient;
      case 'mysql':
        return (await import('./db-adapters/mysql'))
          .default as unknown as AdapterClient;
      case 'sqlserver':
        return (await import('./db-adapters/sqlserver'))
          .default as unknown as AdapterClient;
      default:
        throw new Error(`Invalid adapter specified: ${adapter}`);
    }
  } catch (err) {
    if (adapter) {
      console.error(
        'Are you missing the peer dependency for your chosen adapter?'
      );
    }
    throw err;
  }
};
