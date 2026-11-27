
import { Client, Databases, ID, Query } from "node-appwrite";
import type { BaseRecord, DbContract } from "../db_contract";

// --------------------------------------------------
// DATABASE ADAPTER CONTRACT
// --------------------------------------------------

export interface DatabaseAdapter {
  getAll<T>(table: string): Promise<T[]>;
  getById<T>(table: string, id: string): Promise<T | null>;
  insert<T>(
    table: string,
    data: Omit<T, "id" | "createdAt">
  ): Promise<T>;
  update<T>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<T>;
  remove(table: string, id: string): Promise<boolean>;
}

// --------------------------------------------------
// GLOBAL CLIENT CACHE
// Prevents duplicate clients during Next.js hot reload.
// --------------------------------------------------

interface AppwriteCache {
  client: Client;
  databases: Databases;
}

declare global {
  // eslint-disable-next-line no-var
  var __appwriteDbCache: AppwriteCache | undefined;
}

// --------------------------------------------------
// CONNECTION HELPER
// Credentials are loaded lazily.
// --------------------------------------------------

function getConnection(): AppwriteCache {
  if (globalThis.__appwriteDbCache) {
    return globalThis.__appwriteDbCache;
  }

  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Missing Appwrite environment variables. Check APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY."
    );
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  globalThis.__appwriteDbCache = {
    client,
    databases,
  };

  return globalThis.__appwriteDbCache;
}

// --------------------------------------------------
// DATABASE ID HELPER
// --------------------------------------------------

function getDatabaseId(): string {
  const databaseId = process.env.APPWRITE_DATABASE_ID;

  if (!databaseId) {
    throw new Error(
      "Missing APPWRITE_DATABASE_ID environment variable."
    );
  }

  validateAppwriteId(databaseId, "Database ID");

  return databaseId;
}

// --------------------------------------------------
// VALIDATION HELPERS
// --------------------------------------------------

function validateTable(table: string): string {
  if (
    typeof table !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(table)
  ) {
    throw new Error(`Invalid Appwrite collection name: ${table}`);
  }

  return table;
}

function validateAppwriteId(
  id: string,
  label = "Document ID"
): string {
  if (
    typeof id !== "string" ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(id)
  ) {
    throw new Error(`Invalid ${label}: ${id}`);
  }

  return id;
}

// --------------------------------------------------
// ERROR HANDLING
// Reset cached client after failed requests.
// --------------------------------------------------

async function execute<T>(
  operation: (databases: Databases) => Promise<T>
): Promise<T> {
  const connection = getConnection();

  try {
    return await operation(connection.databases);
  } catch (error) {
    globalThis.__appwriteDbCache = undefined;
    throw error;
  }
}

// --------------------------------------------------
// DOCUMENT NORMALIZATION
// Always expose a plain string id.
// --------------------------------------------------

function normalizeDocument<T>(document: unknown): T {
  if (
    typeof document !== "object" ||
    document === null
  ) {
    throw new Error("Invalid Appwrite document returned.");
  }

  const record = document as Record<string, unknown>;

  const nativeId = record.$id ?? record.id;

  if (typeof nativeId !== "string") {
    throw new Error(
      "Appwrite document does not contain a valid ID."
    );
  }

  const normalized = { ...record };

  delete normalized.$id;
  delete normalized.$collectionId;
  delete normalized.$databaseId;
  delete normalized.$permissions;

  normalized.id = nativeId;

  if (typeof normalized.createdAt !== "string") {
    normalized.createdAt =
      typeof record.$createdAt === "string"
        ? record.$createdAt
        : new Date().toISOString();
  }

  delete normalized.$createdAt;
  delete normalized.$updatedAt;

  // Keep compatibility with the shared database contract.
  const contractRecord = normalized as unknown as BaseRecord | DbContract;

  return contractRecord as T;
}

// --------------------------------------------------
// PAYLOAD SANITIZATION
// Blocks system-field overwrites and unsafe keys.
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
      key === "createdAt" ||
      key === "$createdAt" ||
      key === "$updatedAt" ||
      key === "$permissions" ||
      key === "$collectionId" ||
      key === "$databaseId"
    ) {
      continue;
    }

    // Reject operator-style and path-style keys.
    if (
      !/^[a-zA-Z][a-zA-Z0-9_]{0,254}$/.test(key) ||
      key.startsWith("$") ||
      key.includes(".")
    ) {
      throw new Error(
        `Invalid or unsafe document field: ${key}`
      );
    }

    sanitized[key] = value;
  }

  return sanitized;
}

// --------------------------------------------------
// DATABASE ADAPTER
// Appwrite DocumentsDB implementation.
// --------------------------------------------------

export const db_appwrite: DatabaseAdapter = {

  // ------------------------------------------------
  // GET ALL
  // Retrieves every document with pagination.
  // ------------------------------------------------

  async getAll<T>(table: string): Promise<T[]> {
    const collectionId = validateTable(table);
    const databaseId = getDatabaseId();

    return execute(async (databases) => {
      const results: T[] = [];
      const pageSize = 100;
      let offset = 0;

      while (true) {
        const response = await databases.listDocuments({
          databaseId,
          collectionId,
          queries: [
            Query.limit(pageSize),
            Query.offset(offset),
          ],
        });

        const documents = response.documents;

        results.push(
          ...documents.map((document) =>
            normalizeDocument<T>(document)
          )
        );

        if (documents.length < pageSize) {
          break;
        }

        offset += pageSize;
      }

      return results;
    });
  },

  // ------------------------------------------------
  // GET BY ID
  // Returns null when the document does not exist.
  // ------------------------------------------------

  async getById<T>(
    table: string,
    id: string
  ): Promise<T | null> {
    const collectionId = validateTable(table);
    const documentId = validateAppwriteId(id);
    const databaseId = getDatabaseId();

    try {
      return await execute(async (databases) => {
        const document = await databases.getDocument({
          databaseId,
          collectionId,
          documentId,
        });

        return normalizeDocument<T>(document);
      });
    } catch (error) {
      const statusCode = (
        error as { code?: number }
      )?.code;

      if (statusCode === 404) {
        return null;
      }

      throw error;
    }
  },

  // ------------------------------------------------
  // INSERT
  // Automatically generates ID and ISO createdAt.
  // Retrieves the inserted document before returning.
  // ------------------------------------------------

  async insert<T>(
    table: string,
    data: Omit<T, "id" | "createdAt">
  ): Promise<T> {
    const collectionId = validateTable(table);
    const databaseId = getDatabaseId();

    const payload = sanitizePayload(
      data as Record<string, unknown>
    );

    payload.createdAt = new Date().toISOString();

    return execute(async (databases) => {
      const created = await databases.createDocument({
        databaseId,
        collectionId,
        documentId: ID.unique(),
        data: payload,
      });

      const documentId = created.$id;

      if (!documentId) {
        throw new Error(
          "Appwrite insert succeeded but returned no document ID."
        );
      }

      const document = await databases.getDocument({
        databaseId,
        collectionId,
        documentId,
      });

      if (!document) {
        throw new Error(
          `Inserted document ${documentId} could not be retrieved.`
        );
      }

      return normalizeDocument<T>(document);
    });
  },

  // ------------------------------------------------
  // UPDATE
  // Protects IDs and createdAt from modification.
  // Throws when the document does not exist.
  // ------------------------------------------------

  async update<T>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    const collectionId = validateTable(table);
    const documentId = validateAppwriteId(id);
    const databaseId = getDatabaseId();

    const payload = sanitizePayload(
      data as Record<string, unknown>
    );

    return execute(async (databases) => {
      // Verify the document exists before updating.
      await databases.getDocument({
        databaseId,
        collectionId,
        documentId,
      });

      await databases.updateDocument({
        databaseId,
        collectionId,
        documentId,
        data: payload,
      });

      // Retrieve the updated document.
      const updated = await databases.getDocument({
        databaseId,
        collectionId,
        documentId,
      });

      if (!updated) {
        throw new Error(
          `Updated document ${documentId} could not be retrieved.`
        );
      }

      return normalizeDocument<T>(updated);
    });
  },

  // ------------------------------------------------
  // REMOVE
  // Deletes a document by its validated ID.
  // Returns false when the document does not exist.
  // ------------------------------------------------

  async remove(
    table: string,
    id: string
  ): Promise<boolean> {
    const collectionId = validateTable(table);
    const documentId = validateAppwriteId(id);
    const databaseId = getDatabaseId();

    try {
      return await execute(async (databases) => {
        await databases.deleteDocument({
          databaseId,
          collectionId,
          documentId,
        });

        return true;
      });
    } catch (error) {
      const statusCode = (
        error as { code?: number }
      )?.code;

      if (statusCode === 404) {
        return false;
      }

      throw error;
    }
  },
};

// --------------------------------------------------
// DEFAULT EXPORT
// --------------------------------------------------

export default db_appwrite;
