import type { APIRoute } from "astro";
import { markdownResponse } from "@/lib/dual-format/markdown-response";
import { methodologyMarkdown } from "@/methodology/content";

export const GET: APIRoute = () => markdownResponse({ body: methodologyMarkdown });
