# Express + PostgreSQL endpoint lab

Start with the [student lab PDF](PostgreSQL_Express_Lab.pdf). It walks through
installation, a personal Git branch, database creation, connection settings,
GET/POST checks, and submission.

See [Jason Owen's completed instructor notes](lab-notes-jason-owen.md) for actual
results and explanation answers. This example used an existing local database;
the notes identify the differences from a fresh student installation.

## Run the demo

From the repository root:

```bash
npm ci --prefix server
npm run demo --prefix server
```

Open **http://localhost:3001/api/students**.

PostgreSQL must be running. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and
`DB_PASSWORD` in the ignored `server/.env`. Run `setup.sql` in the course
database as its owner before starting a fresh installation.

`studentServer.js` shows the connection pool, GET query, POST query, structured
JSON responses, and startup check. `setup.sql` creates and seeds the table
separately so the endpoint example stays short.

POST saves a student in PostgreSQL. Restarting Express preserves that record.
The existing mock API remains on port 3000; this demo listens on port 3001.

Never commit `.env` or share its password.
