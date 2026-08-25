# CSC 425 Full-Stack Development Starter

Welcome to CSC 425: Web-Based Services and Applications with Dr. Jason T. Owen.

This public starter repository provides the foundation for building a full-stack web application with:

- React and Vite for the frontend
- TypeScript for typed frontend development
- JavaScript and Node.js for the backend
- Express.js for the web API
- PostgreSQL for the database

You should already have:

- A GitHub account
- Git installed and connected to GitHub
- Visual Studio Code installed
- This repository cloned to your computer

Use a personal email address for GitHub if you want your coursework to become part of a professional coding portfolio.

## Technology Overview

| Technology | Purpose |
| --- | --- |
| Node.js | Runs JavaScript outside the browser |
| npm | Installs and manages project packages |
| React | Builds the user interface |
| Vite | Runs and builds the frontend project |
| TypeScript | Adds type checking to JavaScript |
| Express.js | Creates the backend web server and API |
| PostgreSQL | Stores application data |
| `pg` | Connects the Express server to PostgreSQL |

## 1. Install Node.js and npm

Download and install the current LTS version of Node.js from [nodejs.org](https://nodejs.org/).

Node.js includes npm. After installation, open the VS Code terminal and verify both programs:

```bash
node --version
npm --version
```

Use Node.js 20 or newer and npm 10 or newer.

If either command is not recognized, restart VS Code and try again.

You should see the current branch and repository status without an error.

## 2. Install Project Dependencies

This repository contains separate frontend and backend applications. Install the packages for both:

```bash
npm run install:all
```

If the root helper script is unavailable, install them separately:

```bash
cd client
npm install
cd ../server
npm install
cd ..
```

Do not commit any `node_modules` folder. Dependencies are recorded in `package.json` and restored with `npm install`.

## 3. Install PostgreSQL

Download PostgreSQL for your operating system from [postgresql.org/download](https://www.postgresql.org/download/).

During installation:

1. Keep the default port `5432` unless it is already in use.
2. Create and remember the password for the `postgres` superuser.
3. Install pgAdmin if the installer offers it.
4. Allow PostgreSQL to run as a background service.

Verify the command-line client:

```bash
psql --version
```

If `psql` is not recognized, you may use the PostgreSQL SQL Shell or pgAdmin instead. Windows users may also need to add PostgreSQL's `bin` directory to the system PATH.

## 4. Create the Course Database

Connect to PostgreSQL:

```bash
psql -U postgres
```

Enter the password you created during installation. At the `postgres=#` prompt, run:

```sql
CREATE DATABASE csc425fa26;
```

Confirm that it exists:

```sql
\l
```

Exit PostgreSQL:

```sql
\q
```

Test the new database connection:

```bash
psql -U postgres -d csc425fa26
```

Exit again with `\q`.

## 5. Configure Environment Variables

The backend reads private configuration from a `.env` file. From the repository root, copy the example file:

macOS or Linux:

```bash
cp server/.env.example server/.env
```

Windows PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

Open `server/.env` and enter your PostgreSQL information:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=csc425fa26
DB_USER=postgres
DB_PASSWORD=replace_with_your_password
```

Replace `replace_with_your_password` with your actual PostgreSQL password.

Never commit `.env`. The repository's `.gitignore` should exclude it. The `.env.example` file may be committed because it contains field names but no real passwords.

## 6. Start the Application

From the repository root, start the frontend and backend together:

```bash
npm run dev
```

The default development addresses are:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000](http://localhost:3000)

Keep the terminal running while you work. Press `Ctrl+C` to stop the development servers.

If the root development script is unavailable, use two terminals.

Terminal 1:

```bash
cd client
npm run dev
```

Terminal 2:

```bash
cd server
npm run dev
```

## 7. Verify the Development Environment

Complete each check before beginning an assignment:

- Open [http://localhost:5173](http://localhost:5173) and confirm that the React app appears.
- Open [http://localhost:3000/api/health](http://localhost:3000/api/health) and confirm that the API responds.
- Confirm that the health response reports a successful database connection.
- Edit `client/src/App.tsx`, save it, and confirm that the browser refreshes automatically.
- Run `git status` and confirm that `.env` and `node_modules` are not listed.

## Recommended VS Code Extensions

Install these from the VS Code Extensions view:

- ESLint
- Prettier - Code formatter
- ES7+ React/Redux/React-Native snippets
- PostgreSQL by Chris Kolkman

## Project Structure

```text
csc425-fullstack-starter/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── db.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Important npm Scripts

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run install:all` | Installs frontend and backend packages |
| `npm run dev` | Starts the frontend and backend |
| `npm run build` | Creates the production frontend build |
| `npm run lint` | Checks the project for code-quality issues |

Within `client`, Vite also provides:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Type-checks and builds the frontend |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint on frontend code |

Within `server`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts Express with automatic restart |
| `npm start` | Starts Express normally |

## Packages Used by the Starter

Frontend dependencies:

- `react`
- `react-dom`
- `typescript`
- `vite`
- `@vitejs/plugin-react`
- ESLint and TypeScript ESLint packages

Backend dependencies:

- `express` for API routes and HTTP responses
- `pg` for PostgreSQL connections
- `dotenv` for loading local environment variables
- `cors` for controlled frontend-to-backend requests during development
- `nodemon` for restarting the server after code changes

The packages are already declared in the repository's `package.json` files. Students should use `npm install`, not reinstall each package individually.

## Building the Starter Repository From Scratch

This section is for the repository maintainer or for students who need to understand how the foundation was created. Students cloning the completed starter should skip this section.

Create the React, Vite, and TypeScript frontend:

```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
cd ..
```

Create the Express and JavaScript backend:

```bash
mkdir server
cd server
npm init -y
npm install express pg dotenv cors
npm install --save-dev nodemon
mkdir src
cd ..
```

Create the root package and development helper:

```bash
npm init -y
npm install --save-dev concurrently
```

The root `package.json` should include scripts similar to:

```json
{
  "private": true,
  "scripts": {
    "install:all": "npm install --prefix client && npm install --prefix server",
    "dev": "concurrently \"npm run dev --prefix client\" \"npm run dev --prefix server\"",
    "build": "npm run build --prefix client",
    "lint": "npm run lint --prefix client"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

The backend `server/package.json` should include:

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  }
}
```

Package versions may be newer than the examples. Commit the generated `package-lock.json` files so every student receives a consistent dependency tree.

## Common Problems

### `node` or `npm` is not recognized

Restart VS Code after installing Node.js. If the problem continues, restart the computer and confirm that Node.js was added to the system PATH.

### Port 5173 or 3000 is already in use

Stop the other development server with `Ctrl+C`, or close the application using that port before restarting the project.

### PostgreSQL password authentication failed

Confirm the username and password in `server/.env`. The password must match the one created during PostgreSQL installation.

### The API cannot connect to PostgreSQL

Confirm that PostgreSQL is running, the database is named `csc425fa26`, the port is `5432`, and all values in `server/.env` are correct.

### PowerShell blocks an npm script

Use Command Prompt or Git Bash in VS Code, or ask the instructor before changing the computer's PowerShell execution policy.

## Setup Checklist

- [ ] Node.js LTS and npm are installed.
- [ ] The repository is cloned and open in VS Code.
- [ ] Frontend and backend dependencies are installed.
- [ ] PostgreSQL is installed and running.
- [ ] The `csc425fa26` database exists.
- [ ] `server/.env` contains the correct local database values.
- [ ] The React frontend opens at `http://localhost:5173`.
- [ ] The Express API responds at `http://localhost:3000/api/health`.
- [ ] The backend connects successfully to PostgreSQL.
- [ ] `.env` and `node_modules` are excluded from Git.
- [ ] Hot Module Replacement works after editing `client/src/App.tsx`.

## Documentation

- [Node.js documentation](https://nodejs.org/docs/latest/api/)
- [React documentation](https://react.dev/)
- [Vite documentation](https://vite.dev/guide/)
- [TypeScript documentation](https://www.typescriptlang.org/docs/)
- [Express.js documentation](https://expressjs.com/)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- Course materials and assignments are available in Canvas.

## Next Step

When every verification check passes, your development environment is ready. Review Canvas for the first project requirement before changing the starter code.

## Course

CSC 425: Web-Based Services and Applications  
Fall 2026  
Dr. Jason T. Owen
