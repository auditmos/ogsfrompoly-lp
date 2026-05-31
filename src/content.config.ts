import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { statementSchema } from "./content/statement-schema";

const statement = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/statements" }),
	schema: statementSchema,
});

export const collections = { statement };
