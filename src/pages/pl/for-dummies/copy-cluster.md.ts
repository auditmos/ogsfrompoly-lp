import type { APIRoute } from "astro";
import { clusterMarkdownFor } from "@/copy-trade/cluster/content";
import { markdownResponse } from "@/lib/dual-format/markdown-response";

export const GET: APIRoute = () => markdownResponse({ body: clusterMarkdownFor("pl") });
