/**
 * Canonical English prose for the `/for-dummies/copy-cluster` walkthrough,
 * split into section-level keys for the Translation Catalog under
 * `cluster.page` (issue #73) — one key per heading/section, exactly as the
 * i18n plan agreed. The stitcher in content.ts joins these back into the
 * three page blocks; the English output is byte-identical to the pre-split
 * literals.
 *
 * Link targets and config values never enter the translation payload:
 * `{walletHref}`, `{hubHref}`, `{methodologyHref}`, `{market}` and `{asOf}`
 * are filled by the stitcher, so a config-date bump or a link flip cannot
 * strand a translation. Knob labels, group labels and scenario tab labels are
 * registered from the config module so the slider panel and the `.md` knob
 * table translate through the same catalog.
 */

import { KNOB_GROUP_LABELS, KNOBS, SCENARIOS } from "./config";

// Type aliases (not interfaces) so the shapes get TypeScript's implicit index
// signature and stay assignable to the catalog's ProseNode.
export type ClusterPageProse = {
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
		step14: string;
		step15: string;
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
		stageAlert: string;
		stageExecutor: string;
		flagAlert: string;
		flagExecutor: string;
		explainer: string;
		noscript: string;
	};
	knobs: Record<string, string>;
	knobGroups: Record<string, string>;
	scenarios: Record<string, string>;
};

export const CLUSTER_PAGE_EN: ClusterPageProse = {
	title: "Cluster copy for dummies",
	description:
		"Plain-English walkthrough of the ogsfrompoly cluster-copy agent, the one that follows a crowd of skilled wallets. When it buys. When it skips. When it sells. And which numbers you can turn.",
	sections: {
		intro: `A small agent runs next to the published track record. It mirrors the wallets our
skill test flags, but only when several of them agree at once. This page is the
whole mechanism in plain language: what it does, step by step, and which numbers
are knobs versus rules welded into the code.

It is one of two agents. The other one, [wallet copy]({walletHref}), follows two
named traders instead of waiting for a crowd. Not sure which page you want?
Start from [the chooser]({hubHref}).

Think of a **very cautious impersonator** standing in the market, watching
traders who have already proven themselves. It is timid on purpose. The money is
real. The position sizes below are tiny by design — the point of the first live
run is to be right, not to be big.

Every number on this page is the live setting for the **{market}** market
as of **{asOf}**, read from \`config/copy_trade.yml\`.`,
		storyHeading: "## The whole story, one step at a time",
		step1: `### 1. It listens for a crowd, never for one trader

One wallet buying something moves nothing. It takes at least **3 skilled
wallets** trading the same thing at once (\`cluster_threshold\`) before the agent
calls it a quorum worth a look.

"The same thing at once" turned out to be three requirements, and for a long
time we only checked one. A crowd now needs three wallets that each **took** the
price on offer instead of posting a quote and waiting. Each has to land on the
**same side of the same bet**, not just the same market. Each has to arrive in a
**separate transaction**. Two wallets filled by one trade are one decision
wearing two names, and a market maker whose quote got hit never had an opinion.

Tightening that took a month of alerts from **263 down to 14**. Replayed over
the positions we had opened, **32 of 38** would never have been taken. No rule
was redundant: alone, they caught 14%, 48% and 25% of the bad crowds.`,
		step2: `### 2. If the crowd is selling, it buys the other side

You can only sell what you already own, and a fresh position owns nothing. So
for a long time every "the crowd is selling" signal bounced off the exchange.
That is roughly **40%** of the signals we get.

The way around it is the shape of the market. A market with two outcomes prices
them to add up to $1, and exactly one of them ends up worth $1. Selling "yes" at
90¢ and buying "no" at 10¢ are the same opinion. The second one is an ordinary
purchase the agent can make.

Positions opened that way are **mirrors**. The agent remembers both sides — the
one it holds and the one the crowd trades — because it needs the second one to
know when to get out.`,
		step3: `### 3. Is the crowd even still of that opinion?

A crowd can agree at 3pm and argue with itself by 3:02. If any of the same
wallets took the **opposite** side of this same market in the last **10 minutes**
(\`reversal_lookback_s\`), the agent refuses the signal. That is not a crowd. That
is a wallet changing its mind in public.

The window is not a guess. The flips we recorded ran **121 to 457 seconds**
apart, then nothing until 915. 600 sits in that gap. It buys the whole benefit
with the least collateral damage.

A second number sits here, and it is the most misleading one on the page.
\`max_reversed_wallets\` is **0**. That looks like a switched-off rail and means
the exact opposite: it tolerates **no** flipper, so a single one refuses the
whole crowd. Raising it loosens the rule. To turn the rail off you set the
*window* to zero, not this.

It also refuses from the other direction. Set the flippers aside and fewer than
3 wallets are left standing? The signal goes too — not because too many changed
their mind, but because the ones who did were the reason it looked like a crowd.

One trap worth naming, because getting it wrong was worse than having no rule.
On a two-outcome market, buying "yes" and selling "no" are the *same* trade, and
the exchange reports both. Comparing the words "bought" and "sold" found
**82 flips that never happened** out of 263 alerts — the same trade, seen twice.
It would have thrown away real winning positions, including the best one on the
book. We work direction out against the outcome being held. We never read it off
the label.`,
		step4: `### 4. Three safety checks before it will buy anything

- **"Is there anyone here to trade with?"** — if the market holds less than
  **$1,000** of liquidity (\`min_liquidity_usdc\`), it skips. Getting in is easy;
  getting out of a thin market is the part that hurts.
- **"Is this market about to end?"** — if less than **1 hour** remains before
  resolution (\`min_seconds_to_resolution\`), it skips.
- **"Has the price already run?"** — it skips only if the price moved against the
  crowd's entry by more than **3%** (\`staleness_pct\`) *and* by more than
  **two price steps** (\`staleness_min_ticks\`). Both, not either.

Why two rules for one question? Markets quote in fixed steps — a cent, or a
tenth of a cent. Three percent of a 2¢ outcome is smaller than the smallest move
the market can make. A percentage on its own would call the tiniest flicker
"stale" and nothing would ever pass. The step floor says it plainly: a move the
market cannot subdivide is noise, not information.

The trade-off is real. On a market that only quotes whole cents, two steps is
2¢ — and 2¢ against a 10¢ outcome is a 20% move, not a 3% one. On those markets
the step floor is the rule that binds, not the percentage.

For a mirror, the agent measures every one of these checks on the side it really
buys. The same move is 5.4% on a 24¢ outcome and 1.7% on its 76¢ twin. Measure
the wrong one and you throw away exactly the cheap outcomes that selling crowds
favour.`,
		step5: `### 5. What the outcome costs, and what the fee takes

Two checks decide which prices the agent will trade.

**The fee.** The exchange charges its fee **per share**, not per dollar. Buy a
cheap outcome and $5 buys a lot of shares, so the same $5 hands over far more in
fees. As a share of the ticket the fee works out to \`5% × (1 − price)\`. That is
**4.5% on a 10¢ outcome and 0.3% on a 94¢ one**. Capping it at **2%**
(\`max_entry_fee_pct\`) is not a fee rule at all. It is a **minimum price of
$0.60**, written in the units that matter.

This was worth doing. Across the first eight closed positions the price moved
against us by $0.46 in total. The fees came to **$1.58**. The fee was **77%** of
everything lost, and 3.4× the market's own contribution. In one position the
price moved *in our favour* and the trade still lost money.

Raising the bet does not help. The fee and the winnings both scale with the
number of shares, so the ratio never changes. Doubling the ticket doubles the
loss.

**The price.** Separately, it will not pay more than **$0.95** a share
(\`max_entry_price\`). At 95¢ a $5 ticket can win 26¢ and lose $5 — about 19 to 1
against. At 99.8¢ it stakes $5 to win a single cent, 500 to 1, where one bad
resolution erases several hundred wins.

The fee is not the argument up here. As a share of the *available* gain it stays
roughly constant at any high price. The exchange's own **price grid** is the
argument. Markets quote in steps of a tenth of a cent. One step is 2% of
everything a 95¢ ticket can make, but **half** of everything a 99.8¢ one can.
Above that, the smallest move the market can show is most of the prize.`,
		step6: `### 6. It checks its own wallet

*"Do I have room?"* — it holds at most **$20** open at any one moment
(\`exposure_cap_usdc\`), which is four $5 tickets.

*"Will this take me too low?"* — it never trades if the spendable balance would
drop below **$5** (\`working_capital_floor_usdc\`). In practice that floor stops
it long before the cap does.`,
		step7: `### 7. It buys small, and refuses to overpay

If everything lines up it buys **$5** (\`trade_size_usdc\`), all-or-nothing: the
order fills completely or it dies. The price limit is **1%** over what the crowd
paid (\`slippage_pct\`), but never tighter than **two price steps**
(\`slippage_min_ticks\`). 1% of a 34¢ outcome is less than a cent, which on a
whole-cent market rounds to no room at all. An order with no room is an order
that dies. The agent then snaps the limit onto the market's grid, because the
exchange only accepts prices that sit exactly on it.

Why **$5** and not $1? The exchange will not accept an order for fewer than
**5 shares**. A dollar buys 5 shares only if the outcome costs 20¢ or less.
Above that, the exchange refused every order. The agent now counts the shares
itself before sending instead of finding out from the exchange. A refusal for
this reason is ambiguous, and an ambiguous refusal ties up part of the cap for a
position that does not exist.`,
		step8: `### 8. Where the money actually sits

Since Polymarket's exchange upgrade, the exchange no longer accepts a plain
wallet as the party placing an order. So the cash sits in a Polymarket deposit
wallet, and the key only **signs** on that wallet's behalf.

Two on-chain permissions have to be in place: one to spend the cash (to buy),
one to move outcome tokens (to sell). They break independently. One afternoon
buying worked all day while every sale bounced off a missing permission. The
pre-flight check now reads both straight off the chain instead of trusting the
config.`,
		step9: `### 9. It holds, and leaves at the first reversal

Then it watches the same wallets, and leaves as soon as the **first** of them
turns around. It does not wait for the others to agree.

- On a normal position it holds what they hold, so **their sale** is the exit.
- On a mirror they hold the outcome they sold, so **their buy-back** is the exit.
  Them selling *more* of it is doubling down — the same opinion again, not a
  reversal — so it does not close us.

Riding to resolution is the fallback, for when nobody reverses first.

*The reversal rule itself is hard-wired. There is no setting for it — but since
the next step landed, it is no longer the only way out.*`,
		step10: `### 10. It also sells on its own numbers

For its first months this agent had exactly two ways out: the crowd turns
around, or the market resolves. There is now a third, and it does not ask the
crowd anything.

About once a minute it prices a full exit of every open position — what the best
bid would actually pay, minus the exit fee, against what the ticket cost
including the fee it paid going in. That reading is the whole rule. Down more
than \`auto_close_loss_pct\` and it sells. Up more than \`auto_close_profit_pct\`
and it sells.

Reading it net of fees rather than off the price is the point. A $5 ticket that
paid 15¢ to get in and would pay about that again to get out starts life roughly
**6% down**. "How much of what I put in would I get back" is the question an
operator actually has. "How far has the mid moved" is not.

Four details make it a rail rather than a hair trigger:

- **It wants the same answer twice.** One reading past the line arms it; the
  next consecutive reading past the same line fires it. A single flickering
  quote closes nothing.
- **An unreadable book is not a reading.** No resting bid means no price a sale
  could honestly happen at, so it skips that position for the minute and forgets
  the breach it was holding. An auto-close is an order, not a screen row.
- **It sells the whole position**, through the same exit path as everything
  else, booking the reason as a stop-loss or a take-profit so the closes feed
  can tell the two apart.
- **The kill switch does not gate it.** Halting entries must never strand an
  open position, so exits always flow.

Both numbers are read at boot, which makes arming them an edit and a restart.
Either one at \`0\` — or simply absent, which is how they parse — stands that
side down.

**Today both are absent.** The rail is deployed and armed on nothing; no
position has ever closed this way. When we do arm it, the values stay
unpublished. A live threshold is a number someone could trade against while the
position is still open, which is exactly what the disclosure policy exists to
prevent.

One sharp edge, because arming is not a neutral act: a position already past a
threshold when the service restarts closes within about two minutes. The
procedure is to read the open book first.`,
		step11: `### 11. A failed exit is retried, not forgotten

An exit order can be refused just like an entry, and it used to vanish with one
line in a log. Now we keep the event: **three attempts**, roughly a minute apart
and widening, each one reported. If the third fails the agent says so loudly
instead of going quiet. Replaying is safe. If the position closed in the
meantime, the retry does nothing.`,
		step12: `### 12. Nothing disappears quietly

We write down every skip and every refusal with its numbers: the limit the agent
asked for, the price after grid rounding, the best price on the book, and how
much size was sitting at our limit. Without those, "my limit was too tight" and
"the book was too thin" look identical — and their fixes are opposites.`,
		step13: `### 13. It goes around again

Sold, cash back, room free, next signal. One position per crowd, never two, and
it never re-enters a crowd it has already closed. On a first-ever start it
begins at the newest alert instead of replaying the whole history into a live
wallet.`,
		step14: `### 14. Once a week it sweeps the profit

It counts the profit it booked and sends the surplus above the **$5** floor to
the payout address (\`profit_destination\`). It pays only if that address is on
the allowlist (\`destination_allowlist\`, the safety catch), only if the amount
clears the **$1** dust threshold (\`dust_threshold_usdc\`), and only if at least
**2 POL** of gas is left (\`gas_reserve_pol\`). With no gas it could not close a
position, so the payout is the thing that gives way. A losing week pays out
nothing. The first payout ever made needs a human to say yes.`,
		step15: `### 15. The big red button

At any moment the kill switch (\`kill_switch\`) stops the agent **buying** anything
new — while it keeps watching and closing whatever is already open. It stops
taking risk; it does not abandon it. A shadow mode decides exactly as normal but
writes each would-be order to a file instead of sending it.`,
		hardWired: `## What is hard-wired, and not a setting

- **"First skilled wallet reverses → we are out."** Fixed logic, with resolution
  as the backstop. The stop-loss and take-profit thresholds are numbers you can
  turn; that they confirm over two readings, sell the whole position and ignore
  the kill switch is not.
- **Selling is copied by buying the other outcome.** Whether and how a selling
  crowd gets mirrored is fixed; there is no "only copy buys" switch.
- **One position per crowd**, and no re-entry into a crowd already closed.
- **Entry is an all-or-nothing order priced on the exchange's grid.** *How* it
  enters is fixed. You only tune the thresholds around it — slippage, staleness,
  liquidity.
- **The 5-share minimum order is the exchange's rule**, not ours. The agent only
  respects it.

**Why split it that way?** How much, when to skip, how much at once, how much to
leave behind — all of that is a number, and numbers are safe to expose. How it
buys and when it sells — the whole copying logic — lives in code. One careless
line of YAML must never derail the strategy.`,
		notClaiming: `## What we are not claiming yet

Four limits worth knowing. They change how you should read the agent's own
numbers.

- **The bookkeeping now captures the exchange's fee, and it changed the
  picture.** Every closed position used to record a fee of zero, which made all
  of them look better than they were. Reconciled against the on-chain settlement
  records, the missing cost was **entirely** that fee. We now compute it from
  each market's own published curve and record it per fill. We still write
  network gas down as zero, and that one is correct rather than pending — on this
  exchange a relayer pays for the settlement transaction, not us.
- **The "price already run" rule is weaker than 3% on coarse markets** — see the
  two-step floor in step 4. Roughly one market in twenty quotes in whole cents,
  and on those the effective rule is far more permissive than the setting reads.
- **The rails are young, and mostly unexercised.** The crowd-independence rule
  cut the signal count by roughly 95%, so the ones added after it — the reversal
  window, the price ceiling — have had very little live traffic to prove
  themselves against. We argue them from measurements taken *before* they were
  armed. The honest position: we do not yet know how often they fire.
- **Money recovered does not justify the price ceiling.** The four positions it
  would have refused are worth about **5 cents** between them. We buy it as
  insurance against a lopsided bet — $5 staked to win a cent — not as a fix for a
  measured loss. Do not read it as one.
- **The auto-close rail has never fired.** It shipped disarmed on purpose, so
  step 10 describes a mechanism with a live record of exactly nothing. Its
  arithmetic is tested against the same evaluator the agent runs, which is a
  different claim from knowing how it behaves against real books.`,
		notThis: `## What this page is not

These are operating parameters for our own small agent, published in the same
spirit as the rest of the track record. They are not advice, not a signal
service, and not a claim that mirroring skilled wallets will keep working.

We never publish the agent's wallet addresses anywhere on this site. Watch the
execution wallet in real time and you see open positions, which is exactly what
the [disclosure policy]({methodologyHref}) exists to prevent.`,
	},
	md: {
		inOneSentence: "In one sentence",
		knobsHeading: "The knobs",
		knobsBlurb: `The site renders these as sliders you can drag to watch the agent's decision flip.
In markdown they are just the table:`,
		tableRole: "Role in the story",
		tableKey: "Key",
		tableLive: "Live ({market})",
		payoutLabel: "Payout address, allowlist, dust threshold",
		notPublished: "not published",
		killLabel: "Stop everything",
	},
	ui: {
		ariaLabel: "Copy-trade decision simulator",
		tryIt: "Try it — the agent's decision, live",
		defaultsNote: "defaults = {market} config, {asOf}",
		reset: "Reset to our live config",
		incomingSignal: "Incoming signal",
		stageAlert: "First, upstream — is there an alert at all?",
		stageExecutor: "Then the agent's own rails, in order",
		flagAlert: "no alert is raised — the agent is never asked",
		flagExecutor: "the real agent stops here",
		explainer:
			"The real executor stops at the first ✗ in the second list and moves on. We score every check here so you can see what each knob does. Prices are always the ones on the side the agent would really buy — for a selling crowd, that is the opposite outcome. The last two checks are the exchange's own rules: the limit has to be reachable, and the order has to be big enough. Between the two lists the executor runs a handful of bookkeeping checks — is this crowd already open, is the kill switch on. We leave them out here because none of them is a number you can turn.",
		noscript:
			"With JavaScript off this shows our live config against the first example signal. The sliders and signal buttons need JavaScript to recompute.",
	},
	knobs: Object.fromEntries(KNOBS.map((knob) => [knob.key, knob.label])),
	knobGroups: { ...KNOB_GROUP_LABELS },
	scenarios: Object.fromEntries(SCENARIOS.map((scenario) => [scenario.id, scenario.label])),
};
