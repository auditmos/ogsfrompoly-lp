import type { APIRoute } from "astro";
import { copyTradeMarkdown } from "@/copy-trade/content";
import { markdownResponse } from "@/lib/dual-format/markdown-response";

export const GET: APIRoute = () => markdownResponse({ body: copyTradeMarkdown });
