import { randomUUID } from "crypto";
import type { RecordType } from "./schemas";

export function createId(type: RecordType): string {
  return `${type}_${randomUUID()}`;
}
