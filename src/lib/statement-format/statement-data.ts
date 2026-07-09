import type { z } from "zod";
import { statementSchema } from "@/content/statement-schema";

/**
 * The single statement type, inferred from `statementSchema`. Consumers must
 * import this rather than re-declaring the shape — the schema is the one
 * interface (see `.claude/rules/deep-modules.md`).
 */
export type Statement = z.infer<typeof statementSchema>;

/**
 * Narrows unknown content-entry data to a `Statement`, or `null` when it is not
 * a statement (e.g. a future non-statement collection served by the same
 * `[collection]/[...slug]` route).
 *
 * Implemented as `statementSchema.safeParse`, so the guard *is* the schema:
 * drift between guard and schema is impossible by construction. A schema change
 * can never silently blank a statement's metrics block — anything the content
 * collection validated at sync time is accepted here too.
 */
export function asStatementData(data: unknown): Statement | null {
	const result = statementSchema.safeParse(data);
	return result.success ? result.data : null;
}
