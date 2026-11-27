
import type { BaseRecord, DbContract } from "../db_contract";

import {
  cert,
  deleteApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";

import {
  getFirestore,
  type Firestore,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

// --------------------------------------------------
// Global connection cache
// --------------------------------------------------

interface FirebaseAdminState {
  app: App;
  db: Firestore;
}

declare global {
  // eslint-disable-next-line no-var
  var __firebaseAdminState: FirebaseAdminState | undefined;
}

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const APP_NAME = "nextjs-firebase-admin";

// Only allow safe Firestore collection path segments.
const COLLECTION_SEGMENT_REGEX = /^[a-zA-Z0-9_-]+$/;

// Restrict document IDs to safe single path segments.
const ID_REGEX = /^[a-zA-Z0-9_-]+$/;

// Restrict field names to safe identifiers.
const FIELD_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const RESERVED_FIELDS = new Set([
  "id",
  "_id",
  "$id",
  "created_at",
]);

// --------------------------------------------------
// Firebase connection helper
// --------------------------------------------------

function getFirebaseDb(): Firestore {
  if (globalThis.__firebaseAdminState) {
    return globalThis.__firebaseAdminState.db;
  }

  try {
    // Credentials are loaded lazily.
    // This file can safely be imported when Firebase is disabled.

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Firebase configuration is missing. " +
          "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, " +
          "and FIREBASE_PRIVATE_KEY in your environment."
      );
    }

    const existingApp = getApps().find(
      (app) => app.name === APP_NAME
    );

    const app =
      existingApp ??
      initializeApp(
        {
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
          projectId,
        },
        APP_NAME
      );

    const db = getFirestore(app);

    // Reuse the connection across Next.js hot reloads.
    globalThis.__firebaseAdminState = {
      app,
      db,
    };

    return db;
  } catch (error) {
    globalThis.__firebaseAdminState = undefined;
    throw error;
  }
}

// --------------------------------------------------
// Connection failure handling
// --------------------------------------------------

function isConnectionError(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error)
  ) {
    return false;
  }

  const code = String(error.code);

  return [
    "unavailable",
    "deadline-exceeded",
    "internal",
    "resource-exhausted",
    "cancelled",
    "UNAVAILABLE",
    "DEADLINE_EXCEEDED",
    "INTERNAL",
  ].includes(code);
}

async function resetFirebaseConnection(): Promise<void> {
  const state = globalThis.__firebaseAdminState;

  globalThis.__firebaseAdminState = undefined;

  if (state) {
    try {
      await deleteApp(state.app);
    } catch {
      // Ignore cleanup errors.
    }
  }
}

async function withFirebaseDb<T>(
  operation: (db: Firestore) => Promise<T>
): Promise<T> {
  const db = getFirebaseDb();

  try {
    return await operation(db);
  } catch (error) {
    if (isConnectionError(error)) {
      await resetFirebaseConnection();
    }

    throw error;
  }
}

// --------------------------------------------------
// Collection validation
// --------------------------------------------------

function validateCollection(collection: string): string {
  if (
    typeof collection !== "string" ||
    collection.length === 0 ||
    collection.length > 1500
  ) {
    throw new Error("Invalid Firebase collection name.");
  }

  const segments = collection.split("/");

  // Firestore collection paths must have an odd
  // number of path segments.

  if (
    segments.length % 2 === 0 ||
    segments.some(
      (segment) =>
        !segment ||
        segment.length > 1500 ||
        !COLLECTION_SEGMENT_REGEX.test(segment)
    )
  ) {
    throw new Error(
      `Invalid Firestore collection path: ${collection}`
    );
  }

  return collection;
}

// --------------------------------------------------
// Document ID validation
// --------------------------------------------------

function validateId(id: string): string {
  if (
    typeof id !== "string" ||
    id.length === 0 ||
    id.length > 1500 ||
    !ID_REGEX.test(id)
  ) {
    throw new Error("Invalid Firebase document ID.");
  }

  return id;
}

// --------------------------------------------------
// Payload sanitization
// --------------------------------------------------

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (
    value === null ||
    typeof value !== "object" ||
    value instanceof Date
  ) {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (!FIELD_REGEX.test(key)) {
      throw new Error(
        `Invalid or unsafe Firebase field name: ${key}`
      );
    }

    result[key] = sanitizeValue(nestedValue);
  }

  return result;
}

function sanitizePayload(
  data: Record<string, unknown>
): DocumentData {
  const result: DocumentData = {};

  for (const [key, value] of Object.entries(data)) {
    // Never allow callers to override system fields.
    if (RESERVED_FIELDS.has(key)) {
      continue;
    }

    if (!FIELD_REGEX.test(key)) {
      throw new Error(
        `Invalid or unsafe Firebase field name: ${key}`
      );
    }

    result[key] = sanitizeValue(value);
  }

  return result;
}

// --------------------------------------------------
// Record normalization
// --------------------------------------------------

function normalizeRecord<T extends BaseRecord>(
  snapshot: QueryDocumentSnapshot<DocumentData> | {
    id: string;
    data: () => DocumentData | undefined;
  }
): T {
  const documentData = snapshot.data();

  if (!documentData) {
    throw new Error(
      `Firebase document ${snapshot.id} has no data.`
    );
  }

  const record: Record<string, unknown> = {
    ...documentData,
    id: String(snapshot.id),
  };

  // Normalize created_at to an ISO string.
  const createdAt = record.created_at;

  if (
    createdAt &&
    typeof createdAt === "object" &&
    "toDate" in createdAt &&
    typeof createdAt.toDate === "function"
  ) {
    record.created_at = (
      createdAt.toDate() as Date
    ).toISOString();
  } else if (createdAt instanceof Date) {
    record.created_at = createdAt.toISOString();
  } else if (
    createdAt !== undefined &&
    typeof createdAt !== "string"
  ) {
    record.created_at = String(createdAt);
  }

  return record as T;
}

// --------------------------------------------------
// Firebase Database Adapter
// --------------------------------------------------

export const db_firebase: DbContract = {

  // -----------------------------------------------
  // GET ALL
  // -----------------------------------------------

  async getAll<T extends BaseRecord>(
    collection: string
  ): Promise<T[]> {
    const collectionPath = validateCollection(collection);

    return withFirebaseDb(async (db) => {
      const snapshot = await db
        .collection(collectionPath)
        .get();

      return snapshot.docs.map((doc) =>
        normalizeRecord<T>(doc)
      );
    });
  },

  // -----------------------------------------------
  // GET BY ID
  // -----------------------------------------------

  async getById<T extends BaseRecord>(
    collection: string,
    id: string
  ): Promise<T | null> {
    const collectionPath = validateCollection(collection);
    const documentId = validateId(id);

    return withFirebaseDb(async (db) => {
      const snapshot = await db
        .collection(collectionPath)
        .doc(documentId)
        .get();

      if (!snapshot.exists) {
        return null;
      }

      return normalizeRecord<T>(snapshot);
    });
  },

  // -----------------------------------------------
  // INSERT
  // -----------------------------------------------

  async insert<T extends Partial<BaseRecord>>(
    collection: string,
    data: T
  ): Promise<T & BaseRecord> {
    const collectionPath = validateCollection(collection);

    if (
      data === null ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "Firebase insert requires a valid object."
      );
    }

    const payload = sanitizePayload(
      data as Record<string, unknown>
    );

    return withFirebaseDb(async (db) => {
      const now = new Date().toISOString();

      // Firestore generates a fresh document ID.
      const documentReference = await db
        .collection(collectionPath)
        .add({
          ...payload,
          created_at: now,
        });

      // Retrieve the inserted document.
      const snapshot = await documentReference.get();

      if (!snapshot.exists) {
        throw new Error(
          `Firebase insert failed: document ${documentReference.id} ` +
            "could not be retrieved."
        );
      }

      const record = normalizeRecord<T & BaseRecord>(
        snapshot
      );

      return record;
    });
  },

  // -----------------------------------------------
  // UPDATE
  // -----------------------------------------------

  async update<T extends Partial<BaseRecord>>(
    collection: string,
    id: string,
    data: T
  ): Promise<T & BaseRecord> {
    const collectionPath = validateCollection(collection);
    const documentId = validateId(id);

    if (
      data === null ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "Firebase update requires a valid object."
      );
    }

    const payload = sanitizePayload(
      data as Record<string, unknown>
    );

    return withFirebaseDb(async (db) => {
      const documentReference = db
        .collection(collectionPath)
        .doc(documentId);

      // Check that the document exists first.
      const existingSnapshot =
        await documentReference.get();

      if (!existingSnapshot.exists) {
        throw new Error(
          `Firebase update failed: no document found ` +
            `with ID "${documentId}" in "${collectionPath}".`
        );
      }

      // Do not overwrite created_at or the document ID.
      // An empty update is treated as a read-only update.
      if (Object.keys(payload).length > 0) {
        await documentReference.update(payload);
      }

      // Retrieve the updated document.
      const updatedSnapshot =
        await documentReference.get();

      if (!updatedSnapshot.exists) {
        throw new Error(
          `Firebase update failed: updated document ` +
            `"${documentId}" could not be retrieved.`
        );
      }

      return normalizeRecord<T & BaseRecord>(
        updatedSnapshot
      );
    });
  },

  // -----------------------------------------------
  // REMOVE
  // -----------------------------------------------

  async remove(
    collection: string,
    id: string
  ): Promise<void> {
    const collectionPath = validateCollection(collection);
    const documentId = validateId(id);

    return withFirebaseDb(async (db) => {
      await db
        .collection(collectionPath)
        .doc(documentId)
        .delete();
    });
  },
};

// --------------------------------------------------
// Default export
// --------------------------------------------------

export default db_firebase;
