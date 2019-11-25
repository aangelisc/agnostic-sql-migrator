import * as Containers from "testcontainers";
import { adapters } from "../src/adapters";
import { Version } from "../src/version";
import { Config, AdapterClient } from "../src/config";

let config: Config;
let container: Containers.StartedTestContainer;
let adapter: AdapterClient;
const logSpy = jest.spyOn(console, "log");

describe("Testing Postgres functionality", () => {
  beforeAll(async () => {
    const dbConfig = {
      POSTGRES_PASSWORD: "password",
      POSTGRES_DB: "testdb",
      POSTGRES_USER: "postgres"
    };
    container = await new Containers.GenericContainer("postgres")
      .withExposedPorts(5432)
      .withEnv("POSTGRES_PASSWORD", dbConfig.POSTGRES_PASSWORD)
      .withEnv("POSTGRES_USER", dbConfig.POSTGRES_USER)
      .withEnv("POSTGRES_DB", "testdb")
      .start();
    config = {
      adapter: "postgres",
      user: "postgres",
      password: "password",
      host: "localhost",
      port: container.getMappedPort(5432),
      database: "testdb",
      migrationsPath: "./mock_migrations"
    };
    adapter = adapters[config.adapter];
  });
  afterAll(async () => {
    await container.stop();
  });

  it("Will successfully create and close connection to the Postgres db", async () => {
    const client = await adapter.createClient(config);
    expect(logSpy).toHaveBeenCalledWith(
      "Successfully connected to Postgres DB"
    );
    await adapter.closeConnection(client);
    expect(logSpy).toHaveBeenCalledWith("Connection to Postgres DB closed");
    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  it("Will check if the version exists", async () => {
    const client = await adapter.createClient(config);
    const exists = await Version.exists(client, adapter);
    console.log(exists);
    await adapter.closeConnection(client);
  });
});
