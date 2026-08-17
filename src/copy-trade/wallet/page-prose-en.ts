/**
 * Canonical English prose for the `/for-dummies/copy-wallet` walkthrough,
 * split into section-level keys for the Translation Catalog under
 * `wallet.page` (issue #74) — the same construction as the cluster page. The
 * stitcher in content.ts joins these back into the three page blocks; the
 * English output is byte-identical to the pre-split literals.
 *
 * Link targets and config values never enter the translation payload:
 * `{clusterHref}`, `{hubHref}`, `{methodologyHref}`, `{market}` and `{asOf}`
 * are filled by the stitcher. The leader labels (`leader-a`, `leader-b`) are
 * never translated — translations carry them through verbatim, including
 * inside knob labels and scenario names.
 */

import { WALLET_KNOB_GROUP_LABELS, WALLET_KNOBS, WALLET_SCENARIOS } from "./config";

// Type aliases (not interfaces) so the shapes get TypeScript's implicit index
// signature and stay assignable to the catalog's ProseNode.
export type WalletPageProse = {
	title: string;
	description: string;
	sections: {
		intro: string;
		storyHeading: string;
		step1: string;
		step2: string;
		step3: string;
		step4: string;
		step5: string;
		step6: string;
		step7: string;
		step8: string;
		step9: string;
		step10: string;
		step11: string;
		step12: string;
		step13: string;
		hardWired: string;
		notClaiming: string;
		notThis: string;
	};
	md: {
		inOneSentence: string;
		knobsHeading: string;
		knobsBlurb: string;
		tableRole: string;
		tableKey: string;
		tableLive: string;
		gasLabel: string;
		payoutLabel: string;
		notPublished: string;
		killLabel: string;
	};
	ui: {
		ariaLabel: string;
		tryIt: string;
		defaultsNote: string;
		reset: string;
		incomingSignal: string;
		stageBoot: string;
		stageAlert: string;
		stageExecutor: string;
		flagBoot: string;
		flagAlert: string;
		flagExecutor: string;
		explainer: string;
		noscript: string;
		exitHeading: string;
		soldLabel: string;
		soldAria: string;
		soldNote: string;
		peakLabel: string;
		closeLine: string;
		exitNote: string;
	};
	knobs: Record<string, string>;
	knobGroups: Record<string, string>;
	scenarios: Record<string, string>;
};

export const WALLET_PAGE_EN: WalletPageProse = {
	title: "Wallet copy for dummies",
	description:
		"Plain-English walkthrough of the ogsfrompoly wallet-copy agent, the one that mirrors two hand-picked skilled traders. When it copies. When it refuses. When it leaves. And which numbers you can turn.",
	sections: {
		intro: `A second small agent runs next to the published track record. It mirrors two
individual traders — wallets our skill test already flagged, promoted from the
same leaderboard the weekly statements are built on. Where
[cluster copy]({clusterHref}) waits for a *crowd* of skilled wallets to agree,
this one asks a different question: **what does one proven trader do when they
really mean it?**

Think of a **very patient apprentice** shadowing two masters. It ignores almost
everything they do. Then one of them commits serious money to a fresh bet, and
it places one small copy of its own — $5, on its own separate account, behind
its own kill switch.

Every number on this page is the live setting for the **{market}**
markets as of **{asOf}**, read from \`config/wallet_copy.yml\`.
Not sure which of the two agents you wanted? [The chooser]({hubHref}) compares
them side by side.`,
		storyHeading: "## The whole story, one step at a time",
		step1: `### 1. It follows two traders, not a crowd

We picked the two wallets it mirrors from our own skill leaderboard — the same
measured, classified roster the rest of this site reports on. On this page they
are only ever **leader-a** and **leader-b**, which are literally their labels in
the config. We never publish their addresses. Flag a skilled wallet in public
and the whole market front-runs them, and watching them watch us would leak our
own positions too.

One signal here is one wallet's actions. There is no quorum to wait for and no
crowd to count. That is exactly why every remaining check works differently
than on the [cluster page]({clusterHref}).`,
		step2: `### 2. It only moves when the leader really means it

Each leader has a **conviction bar** (\`min_leader_notional_usdc\`). The agent
copies a bet only once that leader's own position on it reaches the bar. The
bar sits *per leader*, against that leader's own history, because the same
dollar figure does not mean the same thing twice.

Measured over 90 days: leader-a's positions have a **median of $285** and a
90th percentile of $1,729. A **$500** bar selects their most convinced third,
and our $5 copy is about 1% of what they stake. leader-b's median is **$5**. At
a $500 bar this rail would fire roughly once a quarter while reading as an armed
leader, so their bar is **$100**. A knob that looks armed and never fires is
worse than no knob.

The bar fires **once per fresh bet**, at the moment it is first crossed.
Scale-ins never re-trigger it. A bet becomes fresh again only after the leader
closes it in full — or flips sides.`,
		step3: `### 3. It counts what the leader holds, not what they clicked

On a two-outcome market, buying one side and selling the other are the same
opinion. So the agent measures conviction in what the leader **ends up holding**,
at the price of *that* outcome — not in the words on the trade ticket.

The difference is not small. Selling 500 shares of a nearly-worthless outcome
at half a cent collects about **$2** of cash. It is also roughly **$498** of
conviction on the *other* outcome, and the agent now counts it that way. The entry
price follows the held outcome too. Before we fixed that, a position a leader
had built by selling could show a price drift of thousands of percent and get
refused as stale — a bug that rejected exactly the trades it existed to copy.`,
		step4: `### 4. It refuses a leader who trades both sides

The rail most likely to refuse an entry. Before copying, the agent looks at the
leader's own flow on this bet over the last **48 hours** and compares buys to
sells (smaller ÷ larger, in dollars). Above **0.5**
(\`max_wallet_two_sided_ratio\`) it refuses. A wallet trading both sides of the
same bet is making a market, not expressing a view — and every flip a copier
follows is a full, paid round trip. On the cluster agent, one live flip-follow
cost **$0.25 on a $5 position — about 5% — to end up short what it had just
been long**.

One honest subtlety: an empty window is **"nothing to weigh"**, not a clean
score of zero. When the 48 hours contain no flow to measure, the rail stands
down and says it was unmeasured instead of pretending the leader passed. We
added the distinction after real skips showed most early readings were exactly
this: zeros over empty windows, dressed up as evidence.`,
		step5: `### 5. The usual safety checks

The rest of the entry gate is the same family of questions the cluster agent
asks, in the same spirit:

- **"Is there anyone here to trade with?"** — under **$1,000** of liquidity
  (\`min_liquidity_usdc\`), skip.
- **"Is this market about to end?"** — under **1 hour** to resolution
  (\`min_seconds_to_resolution\`), skip.
- **"Has the price already run past the leader?"** — skip if the ask has moved
  more than **3%** past the leader's effective entry (\`staleness_pct\`) *and*
  more than **two price steps** (\`staleness_min_ticks\`). A move the market's
  own grid cannot subdivide is noise, not information.
- **"Is a share too expensive?"** — never pay more than **$0.95**
  (\`max_entry_price\`). At the top of the price range a copy risks $5 to win
  cents, and one bad resolution erases hundreds of wins.
- **"Am I already copying this leader enough?"** — at most **2 open copies per
  leader** (\`max_open_copies_per_leader\`), so one leader on a spree cannot eat
  the whole budget. This rail has no cluster equivalent.
- **"Do I have room, and a floor?"** — at most **$20** open in total
  (\`exposure_cap_usdc\`), never spending the account below **$5**
  (\`working_capital_floor_usdc\`).`,
		step6: `### 6. What it deliberately does not check

Three rails from the cluster agent are **missing here**. Honesty about that
matters more than symmetry:

- **No fee rail.** The cluster agent's most expensive lesson — the exchange's
  per-share fee was 77% of its early losses — produced a fee ceiling there
  that works out to a **$0.60 minimum price**. This agent has no such rail. A 7¢
  outcome its sibling would refuse sails through. We are betting that a
  leader's own conviction already filters the cheap lottery tickets. That bet
  is not yet proven.
- **No reversal window.** The cluster agent refuses a crowd whose members just
  switched sides. Here the two-sided flow rail plays that role for a single
  wallet.
- **No gas check at entry.** The venue's relayer pays for settlement, and the
  trading account structurally holds no gas. An entry-path gas rail refused
  *every* entry before we removed it. Gas is a payout question: the weekly
  sweep keeps **2 POL** back (\`gas_reserve_pol\`).`,
		step7: `### 7. A ticket that cannot exist refuses to boot

The order is the same shape as the cluster agent's: **fill-or-kill**, at a limit
of the current ask plus **1%** of room (\`slippage_pct\`) but never less than
**two price steps** (\`slippage_min_ticks\`), snapped onto the market's own price
grid. It fills completely or dies. A killed order gets no retry.

The venue's 5-share minimum works differently — **at boot, not per order**. The
service works out the worst limit price its own rails allow (with a $0.95
ceiling and two steps of room, that is $0.97) and refuses to start if the ticket
cannot buy five shares there. Under **$4.85** a bet, the agent will not boot. A
config that cannot trade should fail once, loudly, at startup — not once per
signal forever.`,
		step8: `### 8. It holds through trims, and leaves at half

Exits are where this agent most differs from its sibling. The cluster agent leaves
at the *first* sale by anyone in the crowd. This one is harder to shake out on
purpose:

- A leader **trimming** their position is information, not an exit. The agent
  records it and holds.
- Once the leader's cumulative selling reaches **50% of their peak position**
  (\`trim_close_fraction\`), the agent closes its **whole** leg at once. Measured
  against the peak, not per fill — a leader bleeding out 20% at a time would
  never trip a per-fill rule. And always the whole leg, never a slice: a
  proportional sliver can drop under the venue's 5-share minimum and become
  unsellable.
- A leader going to **zero**, or **flipping** to the other side, closes the leg
  immediately. A flip also starts a fresh bet — the agent can close and re-enter
  on the other side in the same breath, exactly as the leader did.
- Remove or disable a leader in the config and the agent closes their legs within
  a minute. When a market **resolves**, the agent redeems it.

*The shape of this is hard-wired. The trim threshold is the one number in it you
can turn — the next step adds two more, and they do not watch the leader at
all.*`,
		step9: `### 9. And a stop-loss and a take-profit, on its own numbers

Step 8 is entirely about the leader. This is not. About once a minute the agent
prices a full exit of every open leg — what the best bid would pay, minus the
exit fee, against what the leg cost including the fee it paid going in — and
closes it if that reading is down more than \`auto_close_loss_pct\` or up more
than \`auto_close_profit_pct\`.

It matters more here than on the sibling agent. This one has no fee ceiling at
entry (step 6), so a cheap outcome the cluster agent would refuse outright can
be copied — and a cheap outcome is exactly where the per-share fee bites
hardest. A rail that measures what would really come back, rather than where the
price is, is the guard that absence leaves room for.

The mechanism is shared code with the cluster agent, so it behaves identically
on both: two consecutive readings past the same line before anything happens; an
unreadable book skips the leg for that minute and forgets the breach it was
holding; the whole leg goes at once, never a slice; and the kill switch does not
gate it, because halting entries must never strand an open position.

Both numbers are read at boot, and \`0\` — or an absent key, which parses the
same way — stands that side down. **Both are absent today.** The rail is
deployed on this agent and armed on neither side, so nothing has ever closed
this way, and the values we eventually arm will not be published. A live
threshold is something a reader could trade against while the leg is still
open.`,
		step10: `### 10. A failed exit is queued, not forgotten

An exit order can die just like an entry. Each one gets **three attempts**,
tracked per position in a durable queue — one stuck leg cannot block the
others — and if the third fails the agent says so loudly instead of going quiet.
A market that resolved but is not redeemed yet sits in the books as **unpaid**.
The books never count cash they do not have.`,
		step11: `### 11. The kill switch stops buying, never selling

At any moment the kill switch halts new entries **while exits, retries and
settlements keep working** — so a halt can never strand an open position. It
stops taking risk; it does not abandon it.`,
		step12: `### 12. Its money cannot touch the other agent's

Wallet copy trades a **separate account with its own key**, its own books, its
own alert channel, its own kill switch and its own service. A wallet-copy bug
can spend only wallet-copy money. Neither agent can even read the other's
records. The one thing they share, on purpose, is the destination of the
weekly profit sweep — named in the config as \`profit_destination\` behind a
\`destination_allowlist\`, with a **$1** dust threshold (\`dust_threshold_usdc\`).
We never publish the addresses themselves.`,
		step13: `### 13. Where it is today

The feature went live on **2026-08-11**. It spent its first days correctly
copying **nothing**. With bars this high, silence is the expected state, and the
operations tooling exists to prove that silence is health rather than breakage.
Its first real position followed within days. That is the entire live history so
far. Read every number on this page as a version 1: argued from measurement,
barely exercised in production.`,
		hardWired: `## What is hard-wired, and not a setting

- **The conviction bar fires once per fresh bet.** Scale-ins never re-trigger;
  only a full close or a flip resets it.
- **The agent counts positions in the held outcome.** Buying one side and selling
  the other are the same opinion, normalised before any rule looks at them.
- **Exits close the whole leg, always** — at the trim threshold, on a flip, on
  a close-out, on config removal, at resolution, or when the auto-close rail
  fires. There is no partial close. The rail's two thresholds are numbers you
  can turn; the two-reading confirmation and the whole-leg close are not.
- **One leg per bet per leader.** The same market copied from both leaders is
  two independent legs.
- **Entry is a fill-or-kill order priced on the exchange's grid**, and the
  venue's 5-share minimum is enforced at boot, not per order.
- **Macro markets only**, qualified against the same catalog as everything
  else on this site.
- **The kill switch spares exits.** Only entries can be halted.

**Why split it that way?** The same reason as on the cluster page: thresholds
are numbers, and numbers are safe to expose. The copying logic itself — what
counts as conviction, how exits work — lives in code. One careless line of YAML
must never derail the strategy.`,
		notClaiming: `## What we are not claiming yet

- **The live history is days old.** The feature went live on 2026-08-11 and
  has opened a single-digit number of positions. We argue every rail on this
  page from measurements taken *before* it was armed. Almost none has a
  meaningful record of firing in production.
- **There is no fee rail, and that is a bet, not a proof.** The cluster agent's
  fee lesson (77% of its early losses) has no guard here. If the leaders'
  conviction does not filter cheap outcomes the way we expect, this page will
  say so — after the books do.
- **The two-sided rail's early evidence was thin.** Most of its first readings
  were zeros over empty measurement windows. The payload now separates
  "measured clean" from "nothing to weigh", but the rail has yet to prove its
  threshold against real traffic.
- **Redemption is not automatic.** A resolved win sits in the books as closed
  but explicitly *unpaid* until it is redeemed — the books refuse to count
  money that has not arrived.
- **The auto-close rail has never fired.** It shipped disarmed on both agents,
  so step 9 describes a mechanism with no live record at all. Its arithmetic is
  pinned to the same evaluator the agent runs, which is a different claim from
  knowing how it behaves against real books.`,
		notThis: `## What this page is not

These are the operating parameters of our own small agent, published in the same
spirit as the rest of the track record. They are not advice, not a signal
service, and not a claim that mirroring skilled traders will keep working.

We never publish any of the wallets involved — the two leaders, the agent's own
trading account, or the payout address. Watch any of them in real time and you
see open positions, which is exactly what the
[disclosure policy]({methodologyHref}) exists to prevent.`,
	},
	md: {
		inOneSentence: "In one sentence",
		knobsHeading: "The knobs",
		knobsBlurb: `The site renders these as sliders you can drag to watch the agent's decision
flip. In markdown they are just the table:`,
		tableRole: "Role in the story",
		tableKey: "Key",
		tableLive: "Live ({market})",
		gasLabel: "Gas kept back before any payout (sweep only, not an entry rail)",
		payoutLabel: "Payout address, allowlist, dust threshold",
		notPublished: "not published",
		killLabel: "Stop new entries (exits keep working)",
	},
	ui: {
		ariaLabel: "Wallet-copy decision simulator",
		tryIt: "Try it — the agent's decision, live",
		defaultsNote: "defaults = {market} config, {asOf}",
		reset: "Reset to our live config",
		incomingSignal: "Incoming signal",
		stageBoot: "First — would the service even start?",
		stageAlert: "Then upstream — does the tracker raise a signal at all?",
		stageExecutor: "Then the agent's own rails, in order",
		flagBoot: "the service refuses to start — no signal is ever read",
		flagAlert: "no signal is emitted — the agent is never asked",
		flagExecutor: "the real agent stops here",
		explainer:
			"The real executor stops at the first ✗ in the last list and moves on. We score every check here so you can see what each knob does. Prices are always on the outcome the leader really holds — a position built by selling one side is a position in the other. The engine also runs a row of bookkeeping refusals — is this bet already copied, is the market in scope, is the kill switch on. We leave them out because none of them is a number you can turn.",
		noscript:
			"With JavaScript off this shows our live config against the first example signal. The sliders and signal buttons need JavaScript to recompute.",
		exitHeading: "And when does it leave? Drag the leader's selling",
		soldLabel: "The leader has sold this much of their peak position",
		soldAria: "How much of their peak position the leader has sold",
		soldNote: "the signal, not a setting",
		peakLabel: "their peak position",
		closeLine: "close line",
		exitNote:
			"A flip to the other side, a close to zero, a leader removed from the config, or the market resolving — each of those closes the leg whatever this slider says. Only the trim line is a setting.",
	},
	knobs: Object.fromEntries(WALLET_KNOBS.map((knob) => [knob.key, knob.label])),
	knobGroups: { ...WALLET_KNOB_GROUP_LABELS },
	scenarios: Object.fromEntries(WALLET_SCENARIOS.map((scenario) => [scenario.id, scenario.label])),
};
