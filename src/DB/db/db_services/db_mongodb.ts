
import { MongoClient, ObjectId, type Db, type Collection } from "mongodb";
import type { BaseRecord, DbContract } from "../db_contract";

// --------------------------------------------------
// MongoDB Connection Management
// --------------------------------------------------

interface MongoCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: MongoCache | undefined;
}

const cache: MongoCache =
  global._mongoCache ??
  (global._mongoCache = {
    client: null,
    promise: null,
  });

async function getClient(): Promise<MongoClient> {
  if (cache.client) {
    return cache.client;
  }

  if (!cache.promise) {
    cache.promise = (async () => {
      const uri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_DB_NAME;

      if (!uri) {
        throw new Error("Missing environment variable: MONGODB_URI");
      }

      if (!dbName) {
        throw new Error("Missing environment variable: MONGODB_DB_NAME");
      }

      const client = new MongoClient(uri, {
        maxPoolSize: 20,
        minPoolSize: 0,
        maxIdleTimeMS: 60000,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
      });

      try {
        await client.connect();

        cache.client = client;
        return client;
      } catch (error) {
        cache.client = null;
        cache.promise = null;

        await client.close().catch(() => undefined);

        throw error;
      }
    })();
  }

  try {
    return await cache.promise;
  } catch (error) {
    cache.client = null;
    cache.promise = null;
    throw error;
  }
}

async function getDatabase(): Promise<Db> {
  const client = await getClient();

  const dbName = process.env.MONGODB_DB_NAME;

  if (!dbName) {
    throw new Error("Missing environment variable: MONGODB_DB_NAME");
  }

  return client.db(dbName);
}

// --------------------------------------------------
// Collection Validation
// --------------------------------------------------

const COLLECTION_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

function validateCollectionName(collection: string): string {
  if (
    typeof collection !== "string" ||
    !COLLECTION_NAME_REGEX.test(collection)
  ) {
    throw new Error(
      `Invalid MongoDB collection name: ${String(collection)}`
    );
  }

  return collection;
}

async function getCollection<T extends Record<string, unknown>>(
  collection: string
): Promise<Collection<T>> {
  const db = await getDatabase();

  const collectionName = validateCollectionName(collection);

  return db.collection<T>(collectionName);
}

// --------------------------------------------------
// ID Validation and Normalization
// --------------------------------------------------

function validateId(id: string): ObjectId {
  if (typeof id !== "string" || !ObjectId.isValid(id)) {
    throw new Error(`Invalid MongoDB ObjectId: ${String(id)}`);
  }

  return new ObjectId(id);
}

function normalizeRecord<T extends Record<string, unknown>>(
  document: T | null
): (Omit<T, "_id"> & BaseRecord) | null {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;

  const normalizedId =
    _id instanceof ObjectId
      ? _id.toHexString()
      : String(_id);

  return {
    ...rest,
    id: normalizedId,
  } as Omit<T, "_id"> & BaseRecord;
}

// --------------------------------------------------
// Payload Sanitization
// --------------------------------------------------

function sanitizePayload<T extends Record<string, unknown>>(
  data: T,
  ignoreCreatedAt: boolean
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (
      key === "id" ||
      key === "_id" ||
      key === "$id" ||
      (ignoreCreatedAt && key === "created_at")
    ) {
      continue;
    }

    // Block MongoDB operators and dotted paths.
    if (
      key.startsWith("$") ||
      key.includes(".") ||
      key.includes("\0")
    ) {
      throw new Error(`Invalid MongoDB document key: ${key}`);
    }

    if (value === undefined) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

// --------------------------------------------------
// Database Adapter
// --------------------------------------------------

export const db_mongodb: DbContract = {
  // ----------------------------------------------
  // Get All Records
  // ----------------------------------------------

  async getAll<T extends BaseRecord>(
    collection: string
  ): Promise<T[]> {
    const col = await getCollection(collection);

    const documents = await col
      .find({})
      .toArray();

    return documents.map((document) => {
      const normalized = normalizeRecord(
        document as unknown as Record<string, unknown>
      );

      return normalized as T;
    });
  },

  // ----------------------------------------------
  // Get Record By ID
  // ----------------------------------------------

  async getById<T extends BaseRecord>(
    collection: string,
    id: string
  ): Promise<T | null> {
    const objectId = validateId(id);

    const col = await getCollection(collection);

    const document = await col.findOne({
      _id: objectId,
    } as never);

    if (!document) {
      return null;
    }

    const normalized = normalizeRecord(
      document as unknown as Record<string, unknown>
    );

    return normalized as T;
  },

  // ----------------------------------------------
  // Insert Record
  // ----------------------------------------------

  async insert<T extends Partial<BaseRecord>>(
    collection: string,
    data: T
  ): Promise<T & BaseRecord> {
    const col = await getCollection(collection);

    const sanitized = sanitizePayload(
      data as Record<string, unknown>,
      true
    );

    const now = new Date().toISOString();

    const document = {
      ...sanitized,
      created_at: now,
    };

    const result = await col.insertOne(
      document as never
    );

    if (!result.insertedId) {
      throw new Error(
        "MongoDB insert failed: No inserted ID returned."
      );
    }

    const insertedDocument = await col.findOne({
      _id: result.insertedId,
    } as never);

    if (!insertedDocument) {
      throw new Error(
        `MongoDB insert succeeded, but record ${result.insertedId.toString()} could not be retrieved.`
      );
    }

    const normalized = normalizeRecord(
      insertedDocument as unknown as Record<string, unknown>
    );

    if (!normalized) {
      throw new Error(
        "MongoDB insert failed: Record normalization failed."
      );
    }

    return normalized as T & BaseRecord;
  },

  // ----------------------------------------------
  // Update Record
  // ----------------------------------------------

  async update<T extends Partial<BaseRecord>>(
    collection: string,
    id: string,
    data: T
  ): Promise<T & BaseRecord> {
    const objectId = validateId(id);

    const col = await getCollection(collection);

    const sanitized = sanitizePayload(
      data as Record<string, unknown>,
      true
    );

    if (Object.keys(sanitized).length === 0) {
      throw new Error(
        "MongoDB update requires at least one valid field."
      );
    }

    const result = await col.updateOne(
      { _id: objectId } as never,
      {
        $set: sanitized,
      } as never
    );

    if (result.matchedCount === 0) {
      throw new Error(
        `MongoDB update failed: No record found with ID ${id}.`
      );
    }

    const updatedDocument = await col.findOne({
      _id: objectId,
    } as never);

    if (!updatedDocument) {
      throw new Error(
        `MongoDB update succeeded, but record ${id} could not be retrieved.`
      );
    }

    const normalized = normalizeRecord(
      updatedDocument as unknown as Record<string, unknown>
    );

    if (!normalized) {
      throw new Error(
        "MongoDB update failed: Record normalization failed."
      );
    }

    return normalized as T & BaseRecord;
  },

  // ----------------------------------------------
  // Remove Record
  // ----------------------------------------------

  async remove(
    collection: string,
    id: string
  ): Promise<void> {
    const objectId = validateId(id);

    const col = await getCollection(collection);

    const result = await col.deleteOne({
      _id: objectId,
    } as never);

    if (result.deletedCount === 0) {
      throw new Error(
        `MongoDB remove failed: No record found with ID ${id}.`
      );
    }
  },
};

export default db_mongodb;
