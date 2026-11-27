
import type { BaseRecord, DbContract } from "../db_contract";

// --------------------------------------------------
// GLOBAL TYPES
// --------------------------------------------------

type StorageCache = {
  initialized: boolean;
};

type StoredRecord = BaseRecord & Record<string, unknown>;

// --------------------------------------------------
// GLOBAL STORAGE CACHE
// Prevents unnecessary initialization during hot reload.
// --------------------------------------------------

const globalForStorage = globalThis as typeof globalThis & {
  __localStorageDbCache?: StorageCache;
};

// --------------------------------------------------
// CONNECTION HELPER
// LocalStorage is browser-based.
// No environment credentials are required.
// --------------------------------------------------

function getConnection(): Storage {
  if (typeof window === "undefined") {
    throw new Error(
      "LocalStorage is unavailable. This adapter must run in the browser."
    );
  }

  try {
    const storage = window.localStorage;

    // Initialize the global cache only once.
    if (!globalForStorage.__localStorageDbCache) {
      globalForStorage.__localStorageDbCache = {
        initialized: true,
      };
    }

    return storage;
  } catch {
    globalForStorage.__localStorageDbCache = undefined;

    throw new Error(
      "Unable to access LocalStorage. Check browser storage permissions."
    );
  }
}

// --------------------------------------------------
// COLLECTION VALIDATION
// Each collection maps to a separate LocalStorage key.
// Blocks invalid collection names and path injection.
// --------------------------------------------------

function validateCollection(collection: string): string {
  if (
    typeof collection !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(collection)
  ) {
    throw new Error(
      `Invalid LocalStorage collection name: ${collection}`
    );
  }

  return collection;
}

// --------------------------------------------------
// ID VALIDATION
// Validates incoming record IDs.
// --------------------------------------------------

function validateId(id: string): string {
  if (
    typeof id !== "string" ||
    id.length === 0 ||
    id.length > 200 ||
    /[\u0000-\u001F\u007F]/.test(id)
  ) {
    throw new Error(`Invalid LocalStorage record ID: ${id}`);
  }

  return id;
}

// --------------------------------------------------
// STORAGE KEY HELPER
// Creates a unique storage key for each collection.
// --------------------------------------------------

function getStorageKey(collection: string): string {
  return `app_db_${validateCollection(collection)}`;
}

// --------------------------------------------------
// READ RECORDS
// Retrieves and parses records from LocalStorage.
// --------------------------------------------------

function readRecords<T extends BaseRecord>(
  collection: string
): T[] {
  const storage = getConnection();
  const key = getStorageKey(collection);

  try {
    const rawData = storage.getItem(key);

    if (!rawData) {
      return [];
    }

    const records: unknown = JSON.parse(rawData);

    if (!Array.isArray(records)) {
      throw new Error(
        `Invalid LocalStorage data format for collection: ${collection}`
      );
    }

    return records.map((record) => normalizeRecord<T>(record));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse LocalStorage data for collection: ${collection}`
      );
    }

    throw error;
  }
}

// --------------------------------------------------
// WRITE RECORDS
// Saves records as JSON.
// --------------------------------------------------

function writeRecords<T extends BaseRecord>(
  collection: string,
  records: T[]
): void {
  const storage = getConnection();
  const key = getStorageKey(collection);

  try {
    storage.setItem(key, JSON.stringify(records));
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "QuotaExceededError"
    ) {
      throw new Error(
        "LocalStorage quota exceeded. Remove old records or reduce stored data."
      );
    }

    throw new Error(
      `Failed to save LocalStorage records: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// --------------------------------------------------
// RECORD NORMALIZATION
// Ensures every record has a plain string ID.
// Supports id, _id, and $id.
// --------------------------------------------------

function normalizeRecord<T extends BaseRecord>(
  record: unknown
): T {
  if (
    typeof record !== "object" ||
    record === null ||
    Array.isArray(record)
  ) {
    throw new Error("Invalid LocalStorage record.");
  }

  const item = record as Record<string, unknown>;

  const nativeId = item.id ?? item._id ?? item.$id;

  if (
    typeof nativeId !== "string" ||
    nativeId.length === 0
  ) {
    throw new Error(
      "LocalStorage record does not contain a valid ID."
    );
  }

  const {
    _id: _nativeId,
    $id: _appwriteId,
    ...rest
  } = item;

  return {
    ...rest,
    id: nativeId,
  } as T;
}

// --------------------------------------------------
// PAYLOAD SANITIZATION
// Removes protected fields and unsafe keys.
// Prevents overwriting system fields.
// --------------------------------------------------

function sanitizePayload(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (
      key === "id" ||
      key === "_id" ||
      key === "$id" ||
      key === "created_at" ||
      key.startsWith("$") ||
      key.startsWith("_") ||
      !/^[a-zA-Z][a-zA-Z0-9_]{0,99}$/.test(key)
    ) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

// --------------------------------------------------
// CONNECTION ERROR HANDLER
// Clears cached storage state after access failures.
// --------------------------------------------------

function resetCache(): void {
  globalForStorage.__localStorageDbCache = undefined;
}

// ==================================================
// LOCALSTORAGE DATABASE ADAPTER
// Implements the DbContract interface.
// ==================================================

export const db_localstorage: DbContract = {

  // ------------------------------------------------
  // GET ALL RECORDS
  // Returns every record from a collection.
  // ------------------------------------------------

  async getAll<T extends BaseRecord>(
    collection: string
  ): Promise<T[]> {
    try {
      validateCollection(collection);

      return readRecords<T>(collection);
    } catch (error) {
      if (error instanceof DOMException) {
        resetCache();
      }

      throw error;
    }
  },

  // ------------------------------------------------
  // GET RECORD BY ID
  // Returns null when the record does not exist.
  // ------------------------------------------------

  async getById<T extends BaseRecord>(
    collection: string,
    id: string
  ): Promise<T | null> {
    try {
      const validCollection = validateCollection(collection);
      const validId = validateId(id);

      const records = readRecords<T>(validCollection);

      return records.find((record) => record.id === validId) ?? null;
    } catch (error) {
      if (error instanceof DOMException) {
        resetCache();
      }

      throw error;
    }
  },

  // ------------------------------------------------
  // INSERT RECORD
  // Generates a unique ID.
  // Attaches created_at as an ISO string.
  // Retrieves the inserted record before returning.
  // ------------------------------------------------

  async insert<T extends Partial<BaseRecord>>(
    collection: string,
    data: T
  ): Promise<T & BaseRecord> {
    try {
      const validCollection = validateCollection(collection);

      const records = readRecords<BaseRecord>(validCollection);

      const payload = sanitizePayload(
        data as Record<string, unknown>
      );

      const newRecord = {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as T & BaseRecord;

      records.push(newRecord);

      writeRecords(validCollection, records);

      // Retrieve the inserted record.
      const insertedRecord = records.find(
        (record) => record.id === newRecord.id
      );

      if (!insertedRecord) {
        throw new Error(
          "LocalStorage insert failed: unable to retrieve inserted record."
        );
      }

      return normalizeRecord<T & BaseRecord>(insertedRecord);
    } catch (error) {
      if (error instanceof DOMException) {
        resetCache();
      }

      throw error;
    }
  },

  // ------------------------------------------------
  // UPDATE RECORD
  // Updates an existing record by ID.
  // Preserves id and created_at.
  // Throws when the record does not exist.
  // ------------------------------------------------

  async update<T extends Partial<BaseRecord>>(
    collection: string,
    id: string,
    data: T
  ): Promise<T & BaseRecord> {
    try {
      const validCollection = validateCollection(collection);
      const validId = validateId(id);

      const records = readRecords<BaseRecord>(validCollection);

      const index = records.findIndex(
        (record) => record.id === validId
      );

      if (index === -1) {
        throw new Error(
          `LocalStorage update failed: record ${validId} was not found.`
        );
      }

      const existingRecord = records[index];

      const payload = sanitizePayload(
        data as Record<string, unknown>
      );

      const updatedRecord = {
        ...existingRecord,
        ...payload,
        id: existingRecord.id,
        created_at: existingRecord.created_at,
      } as BaseRecord;

      records[index] = updatedRecord;

      writeRecords(validCollection, records);

      return normalizeRecord<T & BaseRecord>(updatedRecord);
    } catch (error) {
      if (error instanceof DOMException) {
        resetCache();
      }

      throw error;
    }
  },

  // ------------------------------------------------
  // REMOVE RECORD
  // Deletes a record by ID.
  // Returns void as required by DbContract.
  // Does not throw when the record is missing.
  // ------------------------------------------------

  async remove(
    collection: string,
    id: string
  ): Promise<void> {
    try {
      const validCollection = validateCollection(collection);
      const validId = validateId(id);

      const records = readRecords<BaseRecord>(validCollection);

      const filteredRecords = records.filter(
        (record) => record.id !== validId
      );

      if (filteredRecords.length === records.length) {
        return;
      }

      writeRecords(validCollection, filteredRecords);
    } catch (error) {
      if (error instanceof DOMException) {
        resetCache();
      }

      throw error;
    }
  },
};

// --------------------------------------------------
// DEFAULT EXPORT
// --------------------------------------------------

export default db_localstorage;
