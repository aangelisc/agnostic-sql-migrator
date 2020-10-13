import * as Containers from "testcontainers";
import { adapters } from "./src/adapters";
import { Version } from "./src/version";
import { Config, AdapterClient } from "./src/config";
import { getMigrationFiles, migrateDb } from "./src/migrations";

let config: Config;
let container: Containers.StartedTestContainer;
let adapter: AdapterClient;
const logSpy = jest.spyOn(console, "log");
jest.setTimeout(100000);
describe("Testing MS SQL Server functionality", () => {
  beforeAll(async () => {
    const dbConfig = {
      SA_PASSWORD: "1Secure-Password!",
      ACCEPT_EULA: "Y",
    };
    container = await new Containers.GenericContainer(
      "mcr.microsoft.com/mssql/server"
    )
      .withExposedPorts(1433)
      .withEnv("SA_PASSWORD", `${dbConfig.SA_PASSWORD}`)
      .withEnv("ACCEPT_EULA", dbConfig.ACCEPT_EULA)
      .start();
    setTimeout(null, 6000);
    config = {
      ClientConfig: {
        user: "sa",
        password: dbConfig.SA_PASSWORD,
        host: container.getContainerIpAddress(),
        port: container.getMappedPort(1433),
        database: "tempdb",
      },
      MigrationConfig: {
        adapter: "sqlserver",
        migrationsPath: `${__dirname}/mock_mssql_migrations`,
      },
    };
    adapter = adapters[config.MigrationConfig.adapter];
  });
  afterAll(async () => {
    await container.stop();
  });
  it("Will successfully create and close connection to the MS SQL db", async () => {
    const client = await adapter.createClient(config.ClientConfig);
    expect(logSpy).toHaveBeenCalledWith("Successfully connected to MS SQL DB");
    await adapter.closeConnection(client);
    expect(logSpy).toHaveBeenCalledWith("Connection to MS SQL DB closed");
    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  it("Will check if the version exists - on initial creation expect this to be false", async () => {
    const client = await adapter.createClient(config.ClientConfig);
    const exists = await Version.exists(
      client,
      adapter,
      config.MigrationConfig.adapter
    );
    expect(exists).toBeFalsy();
    await adapter.closeConnection(client);
  });

  it("Will initialise db version at 1 if no version table exists", async () => {
    const client = await adapter.createClient(config.ClientConfig);
    const exists = await Version.exists(
      client,
      adapter,
      config.MigrationConfig.adapter
    );
    expect(exists).toBeFalsy();
    await Version.create(client, adapter, config.MigrationConfig.adapter);
    expect(logSpy).toHaveBeenCalledWith(
      "New DB - Creating version information"
    );
    const version = await Version.get(
      client,
      adapter,
      config.MigrationConfig.adapter
    );
    expect(version).toEqual(1);
    expect(logSpy).toHaveBeenLastCalledWith("Current DB Version is: ", 1);
    await adapter.closeConnection(client);
  });

  it("Will initialise db and carry out default migration pathway", async () => {
    const migrationFiles = getMigrationFiles(config);
    const latest =
      migrationFiles.RollForward[migrationFiles.RollForward.length - 1]
        .VersionTo;
    Object.assign(config.MigrationConfig, {
      version: latest,
    });
    const client = await adapter.createClient(config.ClientConfig);
    await migrateDb(
      client,
      adapter,
      config.MigrationConfig.version,
      migrationFiles,
      config.MigrationConfig.adapter
    );
    expect(logSpy).toHaveBeenCalledWith(
      "Rolling forwards to version: ",
      latest
    );
    const version = await Version.get(
      client,
      adapter,
      config.MigrationConfig.adapter
    );
    expect(version).toEqual(latest);
    await adapter.closeConnection(client);
    console.log({ adapter });
  });

  it("Will not carry out migrations if db is at latest version", async () => {
    const migrationFiles = getMigrationFiles(config);
    const latest =
      migrationFiles.RollForward[migrationFiles.RollForward.length - 1]
        .VersionTo;
    Object.assign(config.MigrationConfig, {
      version: latest,
    });
    const client = await adapter.createClient(config.ClientConfig);
    await migrateDb(
      client,
      adapter,
      config.MigrationConfig.version,
      migrationFiles,
      config.MigrationConfig.adapter
    );
    expect(logSpy).toHaveBeenCalledWith(
      "DB is already at the specified version - no migrations to carry out."
    );
    const version = await Version.get(
      client,
      adapter,
      config.MigrationConfig.adapter
    );
    expect(version).toEqual(latest);
    await adapter.closeConnection(client);
  });

  it("Will rollback the db to a specified version", async () => {
    const migrationFiles = getMigrationFiles(config);
    Object.assign(config.MigrationConfig, {
      version: 1,
    });
    const client = await adapter.createClient(config.ClientConfig);
    await migrateDb(
      client,
      adapter,
      config.MigrationConfig.version,
      migrationFiles,
      config.MigrationConfig.adapter
    );
    expect(logSpy).toHaveBeenCalledWith("Rolling backwards to version: ", 1);
    const version = await Version.get(
      client,
      adapter,
      config.MigrationConfig.adapter
    );
    expect(version).toEqual(1);
    await adapter.closeConnection(client);
  });

  it("Will initialise db and carry out migration to a specified version", async () => {
    const migrationFiles = getMigrationFiles(config);
    Object.assign(config.MigrationConfig, { version: 3 });
    const client = await adapter.createClient(config.ClientConfig);
    await migrateDb(
      client,
      adapter,
      config.MigrationConfig.version,
      migrationFiles,
      config.MigrationConfig.adapter
    );
    expect(logSpy).toHaveBeenCalledWith("Rolling forwards to version: ", 3);
    const version = await Version.get(
      client,
      adapter,
      config.MigrationConfig.adapter
    );
    expect(version).toEqual(3);
    await adapter.closeConnection(client);
  });
});
