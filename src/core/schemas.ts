import { z } from "zod";

export const sourceSchema = z.enum(["manual", "agent", "git-diff", "imported"]);
export const authoritySchema = z.enum(["user", "agent", "system"]);
export const confidenceSchema = z.enum(["low", "medium", "high"]);

const stringArraySchema = z.array(z.string());

const recordBaseSchema = z.object({
  id: z.string().min(1),
  source: sourceSchema,
  authority: authoritySchema,
  confidence: confidenceSchema,
  deleted_at: z.string().datetime().optional(),
  delete_reason: z.string().optional()
});

const timestampedSchema = recordBaseSchema.extend({
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional()
});

const updatableSchema = timestampedSchema.extend({
  updated_at: z.string().datetime()
});

export const conceptSchema = updatableSchema.extend({
  type: z.literal("concept"),
  name: z.string().min(1),
  summary: z.string().min(1),
  details: z.string(),
  files: stringArraySchema,
  tags: stringArraySchema
});

export const decisionSchema = updatableSchema.extend({
  type: z.literal("decision"),
  title: z.string().min(1),
  context: z.string(),
  decision: z.string().min(1),
  consequences: z.string(),
  files: stringArraySchema,
  tags: stringArraySchema
});

export const eventSchema = timestampedSchema.extend({
  type: z.literal("event"),
  summary: z.string().min(1),
  details: z.string(),
  files: stringArraySchema,
  tags: stringArraySchema.default([])
});

export const noteSchema = timestampedSchema.extend({
  type: z.literal("note"),
  title: z.string().min(1).optional(),
  body: z.string().min(1),
  files: stringArraySchema.default([]),
  tags: stringArraySchema
});

export const articleSchema = updatableSchema.extend({
  type: z.literal("article"),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  body: z.string(),
  categories: stringArraySchema.default([]),
  aliases: stringArraySchema.default([]),
  source_record_ids: stringArraySchema.default([]),
  files: stringArraySchema.default([]),
  tags: stringArraySchema.default([])
});

export const symbolSchema = updatableSchema.extend({
  type: z.literal("symbol"),
  name: z.string().min(1),
  kind: z.string().min(1),
  file: z.string().min(1),
  summary: z.string(),
  tags: stringArraySchema.default([])
});

export const linkSchema = timestampedSchema.extend({
  type: z.literal("link"),
  from: z.string().min(1),
  to: z.string().min(1),
  relationship: z.string().min(1)
});

export const anyRecordSchema = z.discriminatedUnion("type", [
  conceptSchema,
  decisionSchema,
  eventSchema,
  noteSchema,
  articleSchema,
  symbolSchema,
  linkSchema
]);

export const recordSchemas = {
  article: articleSchema,
  concept: conceptSchema,
  decision: decisionSchema,
  event: eventSchema,
  note: noteSchema,
  symbol: symbolSchema,
  link: linkSchema
} as const;

export const recordTypes = [
  "article",
  "concept",
  "decision",
  "event",
  "note",
  "symbol",
  "link"
] as const;

export type Source = z.infer<typeof sourceSchema>;
export type Authority = z.infer<typeof authoritySchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type ConceptRecord = z.infer<typeof conceptSchema>;
export type DecisionRecord = z.infer<typeof decisionSchema>;
export type EventRecord = z.infer<typeof eventSchema>;
export type NoteRecord = z.infer<typeof noteSchema>;
export type ArticleRecord = z.infer<typeof articleSchema>;
export type SymbolRecord = z.infer<typeof symbolSchema>;
export type LinkRecord = z.infer<typeof linkSchema>;
export type AnyRecord = z.infer<typeof anyRecordSchema>;
export type RecordType = (typeof recordTypes)[number];

export type RecordByType = {
  article: ArticleRecord;
  concept: ConceptRecord;
  decision: DecisionRecord;
  event: EventRecord;
  note: NoteRecord;
  symbol: SymbolRecord;
  link: LinkRecord;
};
