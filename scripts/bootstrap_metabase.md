# Optional: bootstrap Metabase via UI or API

Metabase will start with its application DB pointing at `metabase_app`. On first launch, visit:

- Metabase: http://localhost:3000

Complete the setup wizard:
1) Create the admin account.
2) Add a database:
   - Database type: Postgres
   - Name: App
   - Host: postgres
   - Port: 5432
   - Database name: app
   - Database username: value of POSTGRES_USER from .env (default: postgres)
   - Database password: value of POSTGRES_PASSWORD from .env (default: postgres)

You can then build questions and dashboards on `users` and `orders`.

If you want to automate adding the data source, use the Metabase API after the first-run setup is finished and you have an admin session. Metabase does not expose a pure env-only way to add external data sources. The usual pattern is:
- Log in to get a session
- POST to `/api/database` with your connection JSON
