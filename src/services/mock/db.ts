/**
 * In-memory mock database with AsyncStorage persistence, so the demo survives
 * a reload (important for the web build).
 *
 * `EXPO_PUBLIC_SEED=empty` starts a brand-new user (onboarding + empty states);
 * anything else seeds a populated returning user.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type MockDb, SCHEMA_VERSION, seedEmpty, seedFull } from './fixtures';

const STORAGE_KEY = 'shuttlecoach.mockdb.v1';

export type SeedMode = 'full' | 'empty';

export const SEED_MODE: SeedMode =
  process.env.EXPO_PUBLIC_SEED === 'empty' ? 'empty' : 'full';

function freshSeed(mode: SeedMode = SEED_MODE): MockDb {
  return mode === 'empty' ? seedEmpty() : seedFull();
}

let db: MockDb | null = null;
let loadPromise: Promise<MockDb> | null = null;

/** Load (once) the persisted DB, falling back to a fresh seed. */
export function loadDb(): Promise<MockDb> {
  if (db) return Promise.resolve(db);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<MockDb>) : null;
      // Discard a persisted DB whose schema version no longer matches —
      // loading a structurally-stale object would crash API methods.
      db =
        parsed && parsed.schemaVersion === SCHEMA_VERSION
          ? (parsed as MockDb)
          : freshSeed();
    } catch {
      db = freshSeed();
    }
    return db;
  })();
  return loadPromise;
}

/** Synchronous accessor — callers should `await loadDb()` first. */
export function getDb(): MockDb {
  if (!db) db = freshSeed();
  return db;
}

/** Write the current DB to storage. Failures are non-fatal. */
export async function persist(): Promise<void> {
  if (!db) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage is best-effort for the mock; ignore.
  }
}

/** Reset the DB to a fresh seed (used by Sign Out / Delete Account). */
export async function resetDb(mode: SeedMode): Promise<MockDb> {
  db = freshSeed(mode);
  // Clear the cached load promise so a subsequent loadDb() cannot resolve to
  // the previous session's data.
  loadPromise = null;
  await persist();
  return db;
}
