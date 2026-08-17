import type { APIRoute } from "astro";
import { forDummiesMarkdownFor } from "@/copy-trade/hub-content";
import { markdownResponse } from "@/lib/dual-format/markdown-response";

export const GET: APIRoute = () => markdownResponse({ body: forDummiesMarkdownFor("pl") });
