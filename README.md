# Lab Postgres Migrator

A useful tool to carry out migrations on Postgres databases.

---

## Usage

This tool requires the Postgres DB configuration information to be provided. This can be provided either via the environment (if running in a lambda), or as command line arguments (if running locally). If the command line arguments are passed then they will supersede the environment arguments.

Command line configuration arguments would be as follows:

```- PG_USER - the user on the database
- PG_PASSWORD - user password
- PG_HOST - host server location
- PG_PORT - host server port for connection
- PG_DB - database name
```

There is also the optional `VERSION` argument which can be provided on the command line to specify which DB version to migrate to.
