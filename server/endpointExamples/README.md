# Student Lookup: PostgreSQL lab

Start with the guide for your operating system:

- [Mac PDF](guides/PostgreSQL_Express_Lab_Mac.pdf)
- [Windows PDF](guides/PostgreSQL_Express_Lab_Windows.pdf)
- [Linux PDF — Ubuntu 24.04 LTS](guides/PostgreSQL_Express_Lab_Linux.pdf)

The Mac guide now finds Postgres.app in either `/Applications` or `~/Applications`; an existing app does not need to be moved. New Mac installations use the personal Applications folder. Each guide checks the actual SQL connection before configuring Express, and checks `/api/health` before opening Student Lookup. Existing database installations are checked before any initialization or replacement.

## Find the code

| File | Purpose |
| --- | --- |
| [setup.sql](setup.sql) | Create the student table and insert the three starter records; run once. |
| [studentDb.js](studentDb.js) | Read the private connection settings, connect to PostgreSQL, and query/insert students. |
| [studentServer.js](studentServer.js) | Handle GET and POST, then return JSON. |
| [../src/app.js](../src/app.js) | Attach these routes at `/api/students`. |
| [lab-notes-jason-owen.md](lab-notes-jason-owen.md) | Completed instructor example and verification results. |
| [lookup-jason-owen.png](lookup-jason-owen.png) | Student Lookup displaying the new database record. |

`Dashboardstudent.tsx` already renders `StudentLookup.tsx`, which calls GET `/api/students`. Its form does not need to change. The three lab source files above follow the PDF code; the app has the four mounting edits described in Step 7.

## Run the completed Mac example

From the repository root, start the database if it is stopped:

```bash
PG_TOOLS="Postgres.app/Contents/Versions/18/bin"
export PATH="/Applications/$PG_TOOLS:$HOME/Applications/$PG_TOOLS:$PATH"
pg_ctl -D server/local-postgres/data \
  -l server/local-postgres/server.log -o "-p 5432 -k /tmp" start
```

Then run `npm run dev` and open `http://localhost:5173/#student-lookup`. Search for **Morgan Ellis**. The completed example has student ID **4**. Do not rerun initialization, the seed SQL, or the POST example when restarting.

The database is named `student_lookup`, at `localhost:5432`, with login `postgres`. Its password is in the ignored `server/.env` file. Its records are in the ignored `server/local-postgres/data` folder. The previous instructor database and its startup configuration are preserved under `server/local-postgres/backups`; the old automatic startup was disabled so the PDF's start/stop commands control this lab.

## Maintain the handouts

Editable Markdown and `build_pdfs.py` are in [guides](guides). With `reportlab` and `pymupdf` installed in a Python virtual environment, run `python server/endpointExamples/guides/build_pdfs.py`. The builder checks page counts, essential commands, and text boundaries.

The live Mac example was checked through PostgreSQL, GET/POST, the existing browser lookup, and a full database/API restart. Windows and Linux installation steps were reviewed against their linked official documentation; they were not executed on those operating systems. The older `server/test/transcripts.test.js` still contains assumptions about the previous mock student directory; it has not been rewritten as part of this exact-code lab.
