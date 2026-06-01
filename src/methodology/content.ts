import { SOURCE_PAPERS } from "./citations";

export const methodologyTitle = "Methodology";
export const methodologyDescription =
	"Academic foundation, the sign-randomization skill test, and the disclosure policy that bounds what ogsfrompoly publishes.";

function formatAuthors(authors: readonly string[]): string {
	const [first, ...rest] = authors;
	if (first === undefined) return "";
	if (rest.length === 0) return first;
	const last = rest[rest.length - 1];
	if (last === undefined) return first;
	const head = [first, ...rest.slice(0, -1)].join(", ");
	return `${head}, & ${last}`;
}

function formatCitation(): string {
	return SOURCE_PAPERS.map((p) => `- ${formatAuthors(p.authors)} (${p.year}). *${p.title}*.`).join(
		"\n",
	);
}

export const methodologyMarkdown = `# ${methodologyTitle}

${methodologyDescription}

## Academic foundation

The strategy track record published here is grounded in two 2026 papers on
prediction-market skill and outcomes:

${formatCitation()}

Both papers converge on a counter-intuitive finding: realized PnL is a poor
proxy for skill on short horizons. Gomez-Cram, Guo, Jensen, & Kung (2026)
attribute prediction-market accuracy to an informed minority rather than crowd
wisdom; Akey, Grégoire, Harvie, & Martineau (2026) document that roughly 60 %
of "lucky winners" become losers in the next period. The implication for any
public scorecard is direct: rank traders by a statistical skill test, not by
their last quarter's bankroll.

## Method: the sign-randomization skill test

Skill is measured by a **sign-randomization** procedure rather than by
realized PnL. For each wallet that meets the minimum threshold of **≥ 20
events**, we take the wallet's only-realized PnL series — every trade whose
underlying market resolved within the period — and run **1,000 sims** in
which the sign of every trade outcome is randomly flipped. The skill score is
the **p-value**: the share of simulated histories whose total PnL meets or
exceeds the wallet's actual total. A wallet is flagged as skilled when the
p-value clears a pre-registered threshold, not when its PnL number is large.

We track three categories — **Politics**, **Macro/Finance**, and **Crypto**.
**Sports is excluded**: the literature treats sports markets as a separate
microstructure and the sample is large enough to dominate without it.

Before the skill test, wallets are filtered by a **cluster + counterparty-HHI**
screen that removes coordinated multi-wallet entities and concentrated
counterparties, since both inflate the apparent skill signal of any single
address in the cluster.

## Disclosure policy

The site is open-book about methodology and aggregate results, and closed about
anything that could front-run a position or expose an individual trader's
identity. The rules are load-bearing and apply equally to the rendered HTML,
the raw \`.md\` feed, and the RSS payload.

- **Wallets appear only as truncated, opaque IDs** — e.g. \`wallet_a3f8\`. We
  never publish a full EVM address, and the content schema enforces this:
  any frontmatter field containing a 40-character hex address is rejected at
  build time. Truncated IDs are deliberately not reversible to on-chain
  identities.
- **No live alpha. Ever.** We never publish a live alert, a still-open
  position, or anything a reader could use to front-run a trade in flight.
  Results are retrospective and aggregate only.
- **No leaderboards.** We do not rank named wallets against each other. The
  unit of publication is the strategy cohort, not the individual address.
- **No raw warehouse exports.** Aggregate counts, hit rates, and category
  distributions only — never anything that could reconstruct an individual
  wallet's history.

When a published number sits close to the line, we delay by 30+ days or
anonymize the category before publishing. When in doubt, we don't publish.
`;
