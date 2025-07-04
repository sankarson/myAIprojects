import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Use DATABASE_URL if provided, otherwise default to local SQLite file
const databaseUrl = process.env.DATABASE_URL || 'sqlite:./database.sqlite';
const sqliteUrl = databaseUrl.startsWith('sqlite:') ? databaseUrl.slice(7) : './database.sqlite';

const sqlite = new Database(sqliteUrl);
export const db = drizzle(sqlite, { schema });
