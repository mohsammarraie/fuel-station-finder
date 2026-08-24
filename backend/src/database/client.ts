import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | undefined;

function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Copy .env.example to .env and configure the database connection.",
    );
  }

  return databaseUrl;
}

export function getDatabasePool(): pg.Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: requireDatabaseUrl(),
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL connection error", error);
  });

  return pool;
}

export async function closeDatabasePool(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
}
