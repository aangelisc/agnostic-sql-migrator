import { join } from "path";
import { mkdirSync, rmdirSync } from "fs";
import { getMigrationFiles } from "../src/migrations";
import { Config } from "../src/config";

const config: Config = {
  adapter: "postgres",
  user: "postgres",
  password: "password",
  host: "localhost",
  port: 5432,
  database: "testdb",
  migrationsPath: `${__dirname}/mock_migrations`
};

describe("Testing migration utility functions", () => {
  it("Will throw an error if no migrations are found", () => {
    const emptyMigrationsPath = join(__dirname, "empty_migrations");
    mkdirSync(emptyMigrationsPath);
    Object.assign(config, { migrationsPath: emptyMigrationsPath });
    try {
      getMigrationFiles(config);
    } catch (err) {
      const errVal: Error = err;
      expect(errVal.message).toEqual(
        "No migrations found - check migrations folder"
      );
    }
    rmdirSync(emptyMigrationsPath);
  });
});
