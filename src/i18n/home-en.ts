/**
 * Canonical English prose for the home page, keyed for the Translation
 * Catalog. Tracer scope (issue #67): only the keys the localized home page
 * renders; full home coverage arrives with the Phase 3 issue.
 */

// A type alias (not an interface) so the shape gets TypeScript's implicit
// index signature and stays assignable to the catalog's ProseNode.
export type HomeProse = {
	meta: {
		title: string;
		description: string;
	};
	hero: {
		heading: string;
		intro: string;
	};
	install: {
		eyebrow: string;
		caption: string;
	};
	latest: {
		eyebrow: string;
		viewAll: string;
	};
	skin: {
		eyebrow: string;
		body: string;
		cta: string;
	};
};

export const HOME_EN: HomeProse = {
	meta: {
		title: "ogsfrompoly — skilled traders on Polymarket",
		description: "We measure who is actually skilled on Polymarket — and we show our work, weekly.",
	},
	hero: {
		heading: "We measure who is actually skilled on Polymarket — and we show our work, weekly.",
		intro:
			"Open-book strategy track record and project P&L. Aggregate-only. Truncated wallet IDs. No live alpha, no signup, no newsletter — just RSS and a markdown feed your agent can read.",
	},
	install: {
		eyebrow: "Install for your LLM agent",
		caption: "Pipes the project's llms.txt into your agent's context",
	},
	latest: {
		eyebrow: "Latest statement",
		viewAll: "View all statements →",
	},
	skin: {
		eyebrow: "Skin in the game",
		body: "Two small bots trade real money alongside the record — one follows a crowd of skilled wallets, one mirrors two hand-picked traders. Every rule and every live setting, explained in plain English with a simulator you can drag.",
		cta: "Copy trading for dummies →",
	},
};
