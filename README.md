# Agnostic SQL Migrator

A useful tool to carry out database migrations on Postgres, MySQL, or SQL Server databases. The tool was written in TypeScript and comes bundled with it's own types.

---

## Configuration

This tool requires the SQL DB configuration information to be provided. This can be provided either via the environment, programmatically, or as command line arguments (if running locally).

Argument precedence is as follows:

A programmatic configuration variable takes highest precedence.

This is then followed by a command line configuration variable.

Then finally an environment variable.

Possible command line arguments/environment variables are:

- ADAPTER - the type of SQL database you are targeting accepting values `postgres`, `sqlserver`, or `mysql` (defined by the type Adapters)
- USER - the user on the database to login as
- PASSWORD - user password
- HOST - host server location
- PORT - host server port for connection
- DATABASE - database name
- MIGRATIONS_PATH - the directory that the migrations are located at

There is also the optional `VERSION` argument which can be provided to specify which DB version to migrate to. If this remains unspecified then the migrator will migrate
to the highest possible version of the database it can find.

A restriction that is placed on the migration files is that they must be named as follows:
`[version from]-[version to].sql` with the lowest possible version being `1`. The versions can skip e.g. `1-4.sql`. This also applies to rollback
versions e.g. `4-1.sql`.

## Installation

Add a personal access token to your `.npmrc` in order to be able to access the `@dogfood20` GitHub packages registry.
If you don't know how to do this click [here](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line).

Your `.npmrc` should then include the following:

```
//npm.pkg.github.com/:_authToken=<YOUR_ACCESS_TOKEN>
@dogfood20:registry=https://npm.pkg.github.com
```

Install the tool via `npm` using:

`npm install @dogfood20/agnostic-sql-migrator`

or if you're using `yarn`:

`yarn add @dogfood20/agnostic-sql-migrator`

## Usage

Import and use the entrypoint using the following:

If your configuration variables are already defined in your environment

```
import {migrator} from '@dogfood20/agnostic-sql-migrator';

const migrateDb = async () => {
    await migrator();
};
```

Otherwise you can call:

```
import {migrator, ClientConfig, MigrationConfig} fromm '@dogfood20/agnostic-sql-migrator';
import {resolve} from 'path';

const migrationsPath = resolve(PATH_TO_MIGRATIONS);

const clientConfig: ClientConfig = {
  user: "postgres",
  password: "password",
  host: "localhost",
  port: 5432,
  database: "testdb"
};

const migrationConfig: MigrationConfig = {
  adapter: "postgres",
  migrationsPath,
  version: 10
};

const migrate = async () => {
    await migrator({ClientConfig: clientConfig, MigrationConfig: migrationConfig});
};

```

To call from command line you can use the following command:

`node_modules/.bin/agnostic-sql-migrator --VERSION=YOUR_VERSION` for example.

You can specify as many of the arguments described above as you like, but all the required arguments have to be specified either here
in the command line, or as part of your environment variables, otherwise the command will fail.
