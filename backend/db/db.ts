import { desc, eq } from "drizzle-orm";
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../drizzle/schema';
import { apkArtifacts, auditEvents, cases, evidenceFiles, InsertApkArtifact, InsertAuditEvent, InsertCase, InsertEvidenceFile, InsertUser, users } from "../drizzle/schema";
import { CaseSnapshot } from "../shared/nidarshan";
import { ENV } from "../_core/env";

const sqlite = new Database('./nidarshan.db');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;

export async function getDb() {
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLatestCase(): Promise<CaseSnapshot | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).orderBy(desc(cases.createdAt)).limit(1);
  if (!result[0]) return undefined;
  return { ...result[0], payload: JSON.parse(result[0].payload) } as CaseSnapshot;
}

export async function getCaseByNumber(caseNumber: string): Promise<CaseSnapshot | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.caseNumber, caseNumber)).limit(1);
  if (!result[0]) return undefined;
  return { ...result[0], payload: JSON.parse(result[0].payload) } as CaseSnapshot;
}

export async function insertCase(input: InsertCase): Promise<CaseSnapshot | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(cases).values(input).returning();
  if (!result[0]) return undefined;
  return { ...result[0], payload: JSON.parse(result[0].payload) } as CaseSnapshot;
}

export async function insertEvidenceFile(input: InsertEvidenceFile) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(evidenceFiles).values(input).returning();
  return result[0];
}

export async function listEvidenceFiles(caseNumber: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidenceFiles).where(eq(evidenceFiles.caseNumber, caseNumber)).orderBy(desc(evidenceFiles.createdAt));
}

export async function insertApkArtifact(input: InsertApkArtifact) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(apkArtifacts).values(input).returning();
  return result[0];
}

export async function listApkArtifacts(caseNumber: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apkArtifacts).where(eq(apkArtifacts.caseNumber, caseNumber)).orderBy(desc(apkArtifacts.createdAt));
}

export async function insertAuditEvent(input: InsertAuditEvent) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(auditEvents).values(input).returning();
  return result[0];
}

export async function listAuditEvents(caseNumber: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditEvents).where(eq(auditEvents.caseNumber, caseNumber)).orderBy(desc(auditEvents.createdAt));
}
