import { Db, MongoClient } from 'mongodb';

/**
 * Serverless-safe MongoDB connection.
 * Caches the client on `globalThis` so warm Vercel invocations reuse a single
 * connection instead of opening a new one per request.
 */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'scavenger_hunt';

if (!uri) {
  throw new Error('MONGODB_URI is not set. Add it to your environment (.env.local / Vercel).');
}

interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

const globalForMongo = globalThis as unknown as GlobalWithMongo;

const clientPromise: Promise<MongoClient> =
  globalForMongo._mongoClientPromise ??
  (globalForMongo._mongoClientPromise = new MongoClient(uri).connect());

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
