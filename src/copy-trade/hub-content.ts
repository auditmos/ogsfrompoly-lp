/**
 * Reader-facing content for the `/for-dummies` chooser — the small hub that
 * routes readers to the right bot's walkthrough.
 *
 * The cards and the comparison rows are data, not prose, and both surfaces
 * (the HTML page and the `.md` twin) render from the same arrays, so the two
 * can never disagree about what either bot does.
 */

export const forDummiesTitle = "Copy trading for dummies";
export const forDummiesDescription =
	"Two small bots trade tiny, real money alongside the published track record — one follows a crowd of skilled wallets, the other mirrors two hand-picked traders. Pick your walkthrough; each explains every rule in plain English and lets you play with the live settings.";

interface BotFact {
	readonly label: string;
	readonly value: string;
}

export interface BotCard {
	readonly id: "cluster" | "wallet";
	/** Small mono line above the name, e.g. `"bot 01 · cluster copy"`. */
	readonly eyebrow: string;
	/** The friendly name, e.g. `"Copy the crowd"`. */
	readonly name: string;
	/** One-paragraph ELI5 of the whole idea. */
	readonly tagline: string;
	readonly href: string;
	/** The `.md` twin, for agents and feed readers. */
	readonly mdHref: string;
	readonly facts: readonly BotFact[];
}

export const BOT_CARDS: readonly BotCard[] = [
	{
		id: "cluster",
		eyebrow: "bot 01 · cluster copy",
		name: "Copy the crowd",
		tagline:
			"Waits until at least three skilled wallets land on the same side of the same bet, in separate trades, then buys $5 of it. One wallet is an opinion; three arriving separately is information.",
		href: "/for-dummies/copy-cluster",
		mdHref: "/for-dummies/copy-cluster.md",
		facts: [
			{ label: "follows", value: "any crowd from our skilled roster" },
			{ label: "fires when", value: "3+ wallets agree at once" },
			{ label: "leaves when", value: "the first of them reverses" },
			{ label: "ticket", value: "$5, all-or-nothing" },
		],
	},
	{
		id: "wallet",
		eyebrow: "bot 02 · wallet copy",
		name: "Copy the trader",
		tagline:
			"Shadows two hand-picked skilled traders and ignores almost everything they do — until one commits serious money to a fresh bet. Then it places one small copy on its own separate account.",
		href: "/for-dummies/copy-wallet",
		mdHref: "/for-dummies/copy-wallet.md",
		facts: [
			{ label: "follows", value: "two named leaders, anonymised" },
			{ label: "fires when", value: "a leader stakes past their own bar" },
			{ label: "leaves when", value: "the leader unwinds half, flips, or closes" },
			{ label: "ticket", value: "$5, all-or-nothing" },
		],
	},
];

export interface CompareRow {
	readonly label: string;
	readonly cluster: string;
	readonly wallet: string;
}

export const COMPARE_ROWS: readonly CompareRow[] = [
	{
		label: "A signal is",
		cluster: "3+ skilled wallets on the same side, in separate trades",
		wallet: "one leader's fresh bet crossing their own conviction bar ($500 / $100)",
	},
	{
		label: "Its extra guard",
		cluster: "a crowd member on the other side within 10 minutes refuses the crowd",
		wallet: "a leader trading both sides of the bet within 48 hours is refused",
	},
	{
		label: "Fee rail",
		cluster: "yes — in effect a $0.60 minimum price",
		wallet: "none, and its page says so plainly",
	},
	{
		label: "Leaves when",
		cluster: "the first wallet of the crowd reverses",
		wallet: "the leader has unwound half of their peak, flipped, or closed",
	},
	{
		label: "Money",
		cluster: "its own pool, at most $20 open",
		wallet: "its own separate account, at most $20 open",
	},
	{
		label: "Live since",
		cluster: "July 2026",
		wallet: "August 11, 2026",
	},
];

/** The shared-DNA note both surfaces show under the comparison. */
export const forDummiesSharedNote =
	"Everything else is shared DNA: Macro markets only, $5 all-or-nothing tickets on the exchange's own price grid, the same liquidity, timing and price-already-ran rails, a $5 spendable floor, kill switches that stop buying but never selling, a weekly profit sweep, and every skip written down with its numbers.";

function renderCardSection(card: BotCard): string[] {
	return [
		`## ${card.name} — ${card.eyebrow.split("·")[1]?.trim() ?? card.id}`,
		"",
		card.tagline,
		"",
		...card.facts.map((fact) => `- **${fact.label}**: ${fact.value}`),
		"",
		`Read the full walkthrough at [${card.href}](${card.href}) — or as markdown at [${card.mdHref}](${card.mdHref}).`,
		"",
	];
}

function renderCompareTable(): string {
	return [
		"| | Cluster copy | Wallet copy |",
		"|---|---|---|",
		...COMPARE_ROWS.map((row) => `| ${row.label} | ${row.cluster} | ${row.wallet} |`),
	].join("\n");
}

export const forDummiesMarkdown = `# ${forDummiesTitle}

${forDummiesDescription}

${BOT_CARDS.flatMap(renderCardSection).join("\n")}
## Side by side

${renderCompareTable()}

${forDummiesSharedNote}

Neither page is advice or a signal service, and no wallet involved in either
bot is ever published — see the [methodology and disclosure policy](/methodology).
`;
