/**
 * Regenerate src/data/questions.ts by merging every per-exam JSON under
 * src/data/questions/. Run this after manually editing any of those JSON files
 * (e.g. after the classify-questions skill updates topics).
 *
 * Usage: bun scripts/regenerate-aggregate.ts
 */

import { regenerateAggregate } from "./lib/emit-data"

regenerateAggregate()
console.log("regenerated src/data/questions.ts")
