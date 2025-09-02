# Metabase + Postgres demo

A minimal repo that runs Metabase against a Postgres instance. Postgres seeds:
- `metabase_app` for Metabase internal metadata
- `app` for demo tables: `users` and `orders`

## Prereqs
- Docker and Docker Compose

## Run

```bash
docker compose up -d
```

Services:

* Postgres on `localhost:5433`
* Metabase on `http://localhost:3000`
* App on `http://localhost:5050` (or `${APP_PORT}` if set)

First launch steps:

1. Open Metabase at `http://localhost:3000`
2. Create the admin user in the wizard
3. Add a database:

   * Type: Postgres
   * Name: App
   * Host: `postgres`
   * Port: `5432`
   * DB name: `app`
   * User: `postgres` (or your `.env` value)
   * Password: `postgres` (or your `.env` value)

## Schema overview

**users**

* id BIGSERIAL PK
* email TEXT (unique)
* name TEXT
* created_at, updated_at
* index: unique on email

**orders**

* id BIGSERIAL PK
* user_id BIGINT FK -> users(id) on delete cascade
* name TEXT
* amount INTEGER
* created_at, updated_at
* index: orders(user_id)

## Useful psql

Connect to Postgres:

```bash
docker exec -it demo_postgres psql -U postgres
```

List DBs:

```sql
\l
```

Use the `app` DB:

```sql
\c app
```

## Reset data

Stop and remove volumes:

```bash
docker compose down -v
docker compose up -d
```

This will re-run the init scripts and reseed the data.
