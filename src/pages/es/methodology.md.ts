import type { APIRoute } from "astro";
import { markdownResponse } from "@/lib/dual-format/markdown-response";
import { methodologyMarkdownFor } from "@/methodology/content";

export const GET: APIRoute = () => markdownResponse({ body: methodologyMarkdownFor("es") });
