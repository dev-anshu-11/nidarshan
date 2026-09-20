import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  // allowed values: 'user' | 'admin'
  role: text("role").default("user").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});

export const cases = sqliteTable("cases", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  caseNumber: text("caseNumber").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  payload: text("payload").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});

export const evidenceFiles = sqliteTable("evidence_files", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  caseNumber: text("caseNumber").notNull(),
  originalName: text("originalName").notNull(),
  // allowed values: 'CSV' | 'EML'
  format: text("format").notNull(),
  mimeType: text("mimeType").notNull(),
  sizeBytes: integer("sizeBytes").notNull(),
  sha256: text("sha256").notNull(),
  storageKey: text("storageKey").notNull(),
  storageUrl: text("storageUrl").notNull(),
  rowCount: integer("rowCount").notNull().default(0),
  headers: text("headers").notNull(),
  preview: text("preview").notNull(),
  receivedIps: text("receivedIps").notNull(),
  entities: text("entities").notNull(),
  textSummary: text("textSummary").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});

export const apkArtifacts = sqliteTable("apk_artifacts", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  caseNumber: text("caseNumber").notNull(),
  originalName: text("originalName").notNull(),
  sha256: text("sha256").notNull(),
  sizeBytes: integer("sizeBytes").notNull(),
  storageKey: text("storageKey").notNull(),
  storageUrl: text("storageUrl").notNull(),
  permissions: text("permissions").notNull(),
  urls: text("urls").notNull(),
  ips: text("ips").notNull(),
  riskFlags: text("riskFlags").notNull(),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  caseNumber: text("caseNumber").notNull(),
  action: text("action").notNull(),
  actor: text("actor").notNull().default("investigator"),
  detail: text("detail").notNull(),
  evidenceHash: text("evidenceHash"),
  createdAt: integer("createdAt", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;
export type EvidenceFile = typeof evidenceFiles.$inferSelect;
export type InsertEvidenceFile = typeof evidenceFiles.$inferInsert;
export type ApkArtifact = typeof apkArtifacts.$inferSelect;
export type InsertApkArtifact = typeof apkArtifacts.$inferInsert;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = typeof auditEvents.$inferInsert;
