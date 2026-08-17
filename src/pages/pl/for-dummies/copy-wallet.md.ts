import type { APIRoute } from "astro";
import { walletMarkdownFor } from "@/copy-trade/wallet/content";
import { markdownResponse } from "@/lib/dual-format/markdown-response";

export const GET: APIRoute = () => markdownResponse({ body: walletMarkdownFor("pl") });
