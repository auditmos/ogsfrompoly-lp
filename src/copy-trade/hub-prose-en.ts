/**
 * Canonical English strings for the `/for-dummies` chooser hub, keyed for the
 * Translation Catalog (issue #72). The hub's data-not-prose structure (cards,
 * facts, comparison rows) lives in hub-content.ts and is preserved — these are
 * only the translatable leaves it resolves per locale. `{href}`, `{mdHref}`
 * and `{methodologyHref}` placeholders are filled by the stitcher so link
 * targets never enter the translation payload.
 */

// A type alias (not an interface) so the shape gets TypeScript's implicit
// index signature and stays assignable to the catalog's ProseNode.
type BotProse = {
	name: string;
	tagline: string;
	follows: string;
	fires: string;
	leaves: string;
	ticket: string;
};

type CompareRowProse = {
	label: string;
	cluster: string;
	wallet: string;
};

export type HubProse = {
	title: string;
	description: string;
	eyebrow: string;
	heading: string;
	choose: string;
	read: string;
	sideBySide: string;
	sharedNote: string;
	mdRead: string;
	advice: {
		lead: string;
		link: string;
		md: string;
	};
	facts: {
		follows: string;
		fires: string;
		leaves: string;
		ticket: string;
	};
	cluster: BotProse;
	wallet: BotProse;
	compare: {
		signal: CompareRowProse;
		guard: CompareRowProse;
		fees: CompareRowProse;
		exit: CompareRowProse;
		money: CompareRowProse;
		liveSince: CompareRowProse;
	};
};

export const HUB_EN: HubProse = {
	title: "Copy trading for dummies",
	description:
		"Two small agents trade tiny amounts of real money next to the published track record. One follows a crowd of skilled wallets. The other mirrors two hand-picked traders. Pick a walkthrough. Each one explains every rule in plain English and lets you play with the live settings.",
	eyebrow: "for dummies",
	heading: "Two agents. Two questions.",
	choose: "Choose a walkthrough",
	read: "Read the walkthrough →",
	sideBySide: "Side by side",
	sharedNote:
		"Everything else is shared DNA. Macro markets only. $5 all-or-nothing tickets on the exchange's own price grid. The same rails for liquidity and timing. The same rail for a price that already ran. A $5 spendable floor. Kill switches that stop buying but never selling. A weekly profit sweep. Every skip written down with its numbers.",
	mdRead: "Read the full walkthrough at {href} — or as markdown at {mdHref}.",
	advice: {
		lead: "Neither page is advice. No wallet is ever published —",
		link: "methodology & disclosure",
		md: `Neither page is advice or a signal service. No wallet involved in either agent
is ever published. See the [methodology and disclosure policy]({methodologyHref}).`,
	},
	facts: {
		follows: "follows",
		fires: "fires when",
		leaves: "leaves when",
		ticket: "ticket",
	},
	cluster: {
		name: "Copy the crowd",
		tagline:
			"Waits for at least three skilled wallets on the same side of the same bet, in separate trades. Then it buys $5 of it. One wallet is an opinion. Three arriving separately is information.",
		follows: "any crowd from our skilled roster",
		fires: "3+ wallets agree at once",
		leaves: "the first of them reverses",
		ticket: "$5, all-or-nothing",
	},
	wallet: {
		name: "Copy the trader",
		tagline:
			"Shadows two hand-picked skilled traders and ignores almost everything they do. Then one commits serious money to a fresh bet. It places one small copy on its own separate account.",
		follows: "two named leaders, anonymised",
		fires: "a leader stakes past their own bar",
		leaves: "the leader unwinds half, flips, or closes",
		ticket: "$5, all-or-nothing",
	},
	compare: {
		signal: {
			label: "A signal is",
			cluster: "3+ skilled wallets on the same side, in separate trades",
			wallet: "one leader's fresh bet crossing their own conviction bar ($500 / $100)",
		},
		guard: {
			label: "Its extra guard",
			cluster: "a crowd member on the other side within 10 minutes refuses the crowd",
			wallet: "a leader trading both sides of the bet within 48 hours is refused",
		},
		fees: {
			label: "Fee rail",
			cluster: "yes — in effect a $0.60 minimum price",
			wallet: "none, and its page says so plainly",
		},
		exit: {
			label: "Leaves when",
			cluster: "the first wallet of the crowd reverses",
			wallet: "the leader unwinds half of their peak, flips, or closes",
		},
		money: {
			label: "Money",
			cluster: "its own pool, at most $20 open",
			wallet: "its own separate account, at most $20 open",
		},
		liveSince: {
			label: "Live since",
			cluster: "July 2026",
			wallet: "August 11, 2026",
		},
	},
};
