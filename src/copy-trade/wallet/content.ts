/**
 * Reader-facing prose for `/for-dummies/copy-wallet`.
 *
 * Same construction as the cluster page: three markdown blocks so the HTML
 * page can slot the interactive panels between them, while `walletCopyMarkdown`
 * stitches the same prose into one self-contained document for the `.md` twin —
 * with a generated knob table standing in for the sliders, so the two surfaces
 * can never disagree about a default.
 */

import {
	formatWalletKnobValue,
	WALLET_CONFIG_AS_OF,
	WALLET_CONFIG_MARKET,
	WALLET_KNOBS,
	WALLET_LIVE_CONFIG,
} from "./config";
import { walletSummarySentence } from "./simulator";

export const walletCopyTitle = "Wallet copy for dummies";
export const walletCopyDescription =
	"Plain-English walkthrough of the ogsfrompoly wallet-copy bot — the one that mirrors two hand-picked skilled traders: when it copies, when it refuses, when it leaves, and which numbers you can actually turn.";

export const walletCopyIntroMarkdown = `# ${walletCopyTitle}

${walletCopyDescription}

Alongside the published track record, a second small bot mirrors two individual
traders — wallets our skill test already flagged, promoted from the same
leaderboard the weekly statements are built on. Where
[cluster copy](/for-dummies/copy-cluster) waits for a *crowd* of skilled wallets
to agree, this one asks a different question: **what does one proven trader do
when they really mean it?**

Think of it as a **very patient apprentice** shadowing two masters. It ignores
almost everything they do. Only when one of them commits serious money to a
fresh bet does it place one small copy of its own — $5, on its own separate
account, behind its own kill switch.

Every number on this page is the live setting for the **${WALLET_CONFIG_MARKET}**
markets as of **${WALLET_CONFIG_AS_OF}**, read from \`config/wallet_copy.yml\`.
Not sure which of the two bots you wanted? [The chooser](/for-dummies) compares
them side by side.
`;

export const walletCopyStoryMarkdown = `## The whole story, one step at a time

### 1. It follows two traders, not a crowd

The two wallets it mirrors were picked from our own skill leaderboard — the
same measured, classified roster the rest of this site reports on. On this page
they are only ever **leader-a** and **leader-b**, which are literally their
labels in the config. Their addresses are never published: flagging a skilled
wallet in public would invite the whole market to front-run them, and watching
them watch us would leak our own positions too.

One signal here is one wallet's actions. There is no quorum to wait for and no
crowd to count — which is exactly why every remaining check works differently
than on the [cluster page](/for-dummies/copy-cluster).

### 2. It only moves when the leader really means it

Each leader has a **conviction bar** (\`min_leader_notional_usdc\`): the bot
copies a bet only once that leader's own position on it reaches the bar. And
the bar is set *per leader*, against that leader's own history, because the
same dollar figure does not mean the same thing twice.

Measured over 90 days: leader-a's positions have a **median of $285** and a
90th percentile of $1,729 — a **$500** bar selects their most convinced third,
and our $5 copy is about 1% of what they stake. leader-b's median is **$5**;
at a $500 bar this rail would fire roughly once a quarter while reading as an
armed leader, so their bar is **$100**. A knob that looks armed and never fires
is worse than no knob.

The bar fires **once per fresh bet**, at the moment it is first crossed.
Scale-ins never re-trigger it, and a bet only becomes fresh again after the
leader has fully closed it — or flipped sides.

### 3. It counts what the leader holds, not what they clicked

On a two-outcome market, buying one side and selling the other are the same
opinion. So conviction is measured in what the leader **ends up holding**, at
the price of *that* outcome — not in the words on the trade ticket.

The difference is not small. Selling 500 shares of a nearly-worthless outcome
at half a cent collects about **$2** of cash — but it is roughly **$498** of
conviction on the *other* outcome, and the bot now counts it that way. The
entry price follows the held outcome too: before that was fixed, a position a
leader had built by selling could show a price drift of thousands of percent
and be refused as stale — a bug that rejected exactly the trades it existed to
copy.

### 4. It refuses a leader who trades both sides

The rail most likely to refuse an entry. Before copying, the bot looks at the
leader's own flow on this bet over the last **48 hours** and compares buys to
sells (smaller ÷ larger, in dollars). Above **0.5** (\`max_wallet_two_sided_ratio\`)
it refuses: a wallet trading both sides of the same bet is making a market,
not expressing a view — and every flip a copier follows is a full, paid round
trip. On the cluster bot, one live flip-follow was measured at **$0.25 on a $5
position — about 5% — to end up short what it had just been long**.

One honest subtlety: an empty window is **"nothing to weigh"**, not a clean
score of zero. When the 48 hours contain no flow to measure, the rail stands
down and says it was unmeasured, rather than pretending the leader passed. The
distinction was added after real skips showed most early readings were exactly
this: zeros over empty windows, dressed up as evidence.

### 5. The usual safety checks

The rest of the entry gate is the same family of questions the cluster bot
asks, in the same spirit:

- **"Is there anyone here to trade with?"** — under **$1,000** of liquidity
  (\`min_liquidity_usdc\`), skip.
- **"Is this market about to end?"** — under **1 hour** to resolution
  (\`min_seconds_to_resolution\`), skip.
- **"Has the price already run past the leader?"** — skip if the ask has moved
  more than **3%** past the leader's effective entry (\`staleness_pct\`) *and*
  more than **two price steps** (\`staleness_min_ticks\`). A move the market's
  own grid cannot subdivide is noise, not information.
- **"Is a share too dear?"** — never pay more than **$0.95**
  (\`max_entry_price\`). At the top of the price range a copy risks $5 to win
  cents, and one bad resolution erases hundreds of wins.
- **"Am I already copying this leader enough?"** — at most **2 open copies per
  leader** (\`max_open_copies_per_leader\`), so one leader on a spree cannot eat
  the whole budget. This rail has no cluster equivalent.
- **"Do I have room, and a floor?"** — at most **$20** open in total
  (\`exposure_cap_usdc\`), never spending the account below **$5**
  (\`working_capital_floor_usdc\`).

### 6. What it deliberately does not check

Three rails from the cluster bot are **absent here**, and honesty about that
matters more than symmetry:

- **No fee rail.** The cluster bot's most expensive lesson — the exchange's
  per-share fee was 77% of its early losses — produced a fee ceiling there
  that works out to a **$0.60 minimum price**. This bot has no such rail: a 7¢
  outcome its sibling would refuse sails through. The bet is that a leader's
  own conviction already filters the cheap-lottery-ticket trades; that bet is
  not yet proven.
- **No reversal window.** The cluster bot refuses a crowd whose members just
  switched sides. Here the two-sided flow rail plays that role for a single
  wallet.
- **No gas check at entry.** The venue's relayer pays for settlement, and the
  trading account itself structurally holds no gas at all — an entry-path gas
  rail refused *every* entry before it was removed. Gas is a payout question:
  the weekly sweep keeps **2 POL** back (\`gas_reserve_pol\`).

### 7. A ticket that cannot exist refuses to boot

The order itself is the same shape as the cluster bot's: **fill-or-kill**, at
a limit of the current ask plus **1%** of room (\`slippage_pct\`) but never less
than **two price steps** (\`slippage_min_ticks\`), snapped onto the market's own
price grid. It fills completely or dies; a killed order is not retried.

The venue's 5-share minimum is handled differently, though — **at boot, not
per order**. The service works out the worst limit price its own rails allow
(with a $0.95 ceiling and two steps of room, that is $0.97) and refuses to
start at all if the ticket cannot buy five shares there. Under **$4.85** a bet,
the bot will not boot — a config that cannot trade should fail once, loudly,
at startup, not once per signal forever.

### 8. It holds through trims, and leaves at half

Exits are where this bot most differs from its sibling. The cluster bot leaves
at the *first* sale by anyone in the crowd. This one is deliberately harder to
shake out:

- A leader **trimming** their position is information, not an exit. The bot
  records it and holds.
- Once the leader's cumulative selling reaches **50% of their peak position**
  (\`trim_close_fraction\`), the bot closes its **whole** leg at once. Measured
  against the peak, not per fill — a leader bleeding out 20% at a time would
  never trip a per-fill rule. And always the whole leg, never a slice: a
  proportional sliver can drop under the venue's 5-share minimum and become
  unsellable.
- A leader going to **zero**, or **flipping** to the other side, closes the leg
  immediately. A flip also starts a fresh bet — the bot can close and re-enter
  on the other side in the same breath, exactly as the leader did.
- A leader **removed or disabled in the config** has their legs closed within a
  minute. A market that **resolves** is redeemed.

*The shape of this is hard-wired. The only exit number you can turn is the
trim threshold.*

### 9. A failed exit is queued, not forgotten

An exit order can die just like an entry. Each one gets **three attempts**,
tracked per position in a durable queue — one stuck leg cannot block the
others — and if the third fails the bot says so loudly rather than going
quiet. A market that resolved but has not been redeemed yet is marked
**unpaid** in the books, never counted as cash it does not have.

### 10. The kill switch stops buying, never selling

At any moment the kill switch halts new entries **while exits, retries and
settlements keep working** — so a halt can never strand an open position. It
stops taking risk; it does not abandon it.

### 11. Its money cannot touch the other bot's

Wallet copy trades a **separate account with its own key**, its own books, its
own alert channel, its own kill switch and its own service. A wallet-copy bug
can spend only wallet-copy money; neither bot can even read the other's
records. The one thing they share, on purpose, is the destination of the
weekly profit sweep — named in the config as \`profit_destination\` behind a
\`destination_allowlist\`, with a **$1** dust threshold (\`dust_threshold_usdc\`);
the addresses themselves are never published.

### 12. Where it is today

The feature went live on **2026-08-11**. It then spent its first days
correctly copying **nothing** — with bars this high, silence is the expected
state, and the operations tooling exists precisely to prove that silence is
health rather than breakage. Its first real position followed within days.
That is the entire live history so far: read every number on this page as a
version 1, argued from measurement but barely exercised in production.
`;

export const walletCopyClosingMarkdown = `## What is hard-wired, and not a setting

- **The conviction bar fires once per fresh bet.** Scale-ins never re-trigger;
  only a full close or a flip resets it.
- **Positions are counted in the held outcome.** Buying one side and selling
  the other are the same opinion, normalised before any rule looks at them.
- **Exits close the whole leg, always** — at the trim threshold, on a flip, on
  a close-out, on config removal, or at resolution. There is no partial close,
  no take-profit and no stop-loss to tune.
- **One leg per bet per leader.** The same market copied from both leaders is
  two independent legs.
- **Entry is a fill-or-kill order priced on the exchange's grid**, and the
  venue's 5-share minimum is enforced at boot, not per order.
- **Macro markets only**, qualified against the same catalog as everything
  else on this site.
- **The kill switch spares exits.** Only entries can be halted.

**Why split it that way?** The same reason as on the cluster page: thresholds
are numbers, and numbers are safe to expose. The copying logic itself — what
counts as conviction, how exits work — lives in code, so one careless line of
YAML cannot quietly derail the strategy.

## What we are not claiming yet

- **The live history is days old.** The feature went live on 2026-08-11 and
  has opened a single-digit number of positions. Every rail on this page is
  argued from measurements taken *before* it was armed; almost none has a
  meaningful record of firing in production.
- **There is no fee rail, and that is a bet, not a proof.** The cluster bot's
  fee lesson (77% of its early losses) has no guard here. If the leaders'
  conviction does not filter cheap outcomes the way we expect, this page will
  say so — after the books do.
- **The two-sided rail's early evidence was thin.** Most of its first readings
  were zeros over empty measurement windows; the payload now distinguishes
  "measured clean" from "nothing to weigh", but the rail itself has yet to
  prove its threshold against real traffic.
- **Redemption is not automatic.** A resolved win sits in the books as closed
  but explicitly *unpaid* until it is redeemed — the books refuse to count
  money that has not arrived.

## What this page is not

These are the operating parameters of our own small bot, published in the same
spirit as the rest of the track record. They are not advice, not a signal
service, and not a claim that mirroring skilled traders will keep working.

None of the wallets involved — the two leaders, the bot's own trading account,
or the payout address — is ever published anywhere on this site. Watching any
of them in real time would expose open positions, which is exactly what the
[disclosure policy](/methodology) exists to prevent.
`;

/**
 * The knob table that replaces the interactive panels on the `.md` surface.
 * Generated from {@link WALLET_KNOBS} so an added knob cannot go missing here.
 */
function renderKnobTable(): string {
	const rows = WALLET_KNOBS.map(
		(knob) =>
			`| ${knob.label} | \`${knob.yamlKey}\` | ${formatWalletKnobValue(knob.unit, WALLET_LIVE_CONFIG[knob.key])} |`,
	);
	return [
		"| Role in the story | Key | Live (Macro) |",
		"|---|---|---|",
		...rows,
		"| Gas kept back before any payout (sweep only, not an entry rail) | `gas_reserve_pol` | 2 POL |",
		"| Payout address, allowlist, dust threshold | `profit_destination`, `destination_allowlist`, `dust_threshold_usdc` | not published |",
		"| Stop new entries (exits keep working) | `kill_switch` | — |",
	].join("\n");
}

export const walletCopyMarkdown = `${walletCopyIntroMarkdown}
## In one sentence

> ${walletSummarySentence(WALLET_LIVE_CONFIG)}

## The knobs

The site renders these as sliders you can drag to watch the bot's decision
flip. In markdown they are just the table:

${renderKnobTable()}

${walletCopyStoryMarkdown}
${walletCopyClosingMarkdown}`;
