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
		"Plain-English walkthrough of the ogsfrompoly cluster-copy bot — the one that follows a crowd of skilled wallets: when it buys, when it skips, when it sells, and which numbers you can actually turn.",
	sections: {
		intro: `Alongside the published track record, a small bot mirrors the wallets our skill
test flags — but only when several of them agree at once. This page is the whole
mechanism in plain language: what it does, step by step, and which numbers are
knobs versus rules welded into the code.

It is one of two bots. The other one, [wallet copy]({walletHref}),
follows two named traders instead of waiting for a crowd — if you are not sure
which page you want, start from [the chooser]({hubHref}).

Think of it as a **very cautious impersonator** standing in the market, watching
traders who have already proven themselves. It is deliberately timid. The money
is real, but the position sizes below are tiny on purpose — the point of the
first live run is to be correct, not to be big.

Every number on this page is the live setting for the **{market}** market
as of **{asOf}**, read from \`config/copy_trade.yml\`.`,
		storyHeading: "## The whole story, one step at a time",
		step1: `### 1. It listens for a crowd, never for one trader

It does not move because a single wallet bought something. Only when at least
**3 skilled wallets** trade the same thing at once (\`cluster_threshold\`) does it
say: that is a quorum, worth a look.

"The same thing at once" turned out to be three separate requirements, and for a
long time it was only really checking one of them. A crowd now has to be three
wallets that each **took** the price on offer rather than posting a quote and
waiting; that each landed on the **same side of the same bet**, not merely the
same market; and that each arrived in a **separate transaction**. Two wallets
filled by one trade are one decision wearing two names, and a market maker whose
quote happened to get hit never had an opinion at all.

Tightening that took a month of alerts from **263 down to 14** — and, replayed
over the positions actually opened, **32 of 38** would never have been taken.
None of the three rules was redundant: alone, they caught 14%, 48% and 25% of the
bad crowds respectively.`,
		step2: `### 2. If the crowd is selling, it buys the other side

You can only sell something you already own, and a fresh position owns nothing.
So for a long time every "the crowd is selling" signal simply bounced off the
exchange — and that is roughly **40%** of the signals we get.

The way around it is the shape of the market itself. A market with two outcomes
prices them so they add up to $1, and exactly one of them ends up worth $1. So
selling "yes" at 90¢ and buying "no" at 10¢ are the same opinion, and the second
one is an ordinary purchase the bot can actually make.

Positions opened that way are **mirrors**. The bot remembers both sides — the one
it holds and the one the crowd trades — because it needs the second one to know
when to get out.`,
		step3: `### 3. Is the crowd even still of that opinion?

A crowd can agree at 3pm and be arguing with itself by 3:02. If any of the same
wallets was on the **opposite** side of this same market within the last
**10 minutes** (\`reversal_lookback_s\`), the signal is refused — they are not a
crowd, they are a wallet changing its mind in public.

The window is not a guess. The flips actually recorded ran **121 to 457 seconds**
apart, and then nothing until 915 seconds; 600 sits in that gap, which buys the
whole benefit with the least collateral damage.

There is a second number here, and it is the most misleading one on the page.
\`max_reversed_wallets\` is set to **0**, which looks like a switched-off rail and
is the exact opposite: it means **no** flipper is tolerated, so a single one
refuses the whole crowd. Raising it is what loosens the rule. The rail is turned
off by setting the *window* to zero, not this.

It also refuses from the other direction. If setting the flippers aside leaves
fewer than 3 wallets still standing, the signal goes too — not because too many
changed their mind, but because the ones who did were the reason it looked like a
crowd at all.

One trap worth naming, because getting it wrong was worse than not having the
rule. On a two-outcome market, buying "yes" and selling "no" are the *same*
trade, and the exchange reports both. Comparing the words "bought" and "sold"
therefore found **82 flips that never happened** out of 263 alerts — the same
trade, seen twice — and would have thrown away real winning positions, including
the best one on the book. Direction has to be worked out against the outcome
being held, never read off the label.`,
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
the market is able to make, so a percentage on its own would call the tiniest
possible flicker "stale" and nothing would ever pass. The step floor says: a move
the market cannot subdivide is noise, not information.

The trade-off is real and worth stating plainly: on a market that only quotes
whole cents, two steps is 2¢ — and 2¢ against a 10¢ outcome is a 20% move, not a
3% one. On those markets the step floor, not the percentage, is the rule that
actually binds.

For a mirror, every one of these checks is measured on the side the bot really
buys. The same move is 5.4% on a 24¢ outcome and 1.7% on its 76¢ twin; measuring
the wrong one would throw away exactly the cheap outcomes that selling crowds
favour.`,
		step5: `### 5. What the outcome costs, and what the fee takes

Two checks that between them decide which prices the bot will trade at all.

**The fee.** The exchange charges its fee **per share**, not per dollar. Buy a
cheap outcome and $5 buys a lot of shares, so the same $5 hands over far more in
fees: as a share of the ticket the fee works out to \`5% × (1 − price)\`. It is
**4.5% on a 10¢ outcome and 0.3% on a 94¢ one**. Capping that at **2%**
(\`max_entry_fee_pct\`) is therefore not really a fee rule — it is a **minimum
price of $0.60**, written in the units that matter.

This was worth doing. Across the first eight closed positions the price moved
against us by $0.46 in total while the fees came to **$1.58** — the fee was
**77%** of everything lost, and 3.4× the market's own contribution. In one
position the price moved *in our favour* and the trade still lost money.

Raising the bet does not help, and it is worth seeing why: the fee and the
winnings both scale with the number of shares, so the ratio never changes.
Doubling the ticket doubles the loss.

**The price.** Separately, it will not pay more than **$0.95** a share
(\`max_entry_price\`). At 95¢ a $5 ticket can win 26¢ and lose $5 — about 19 to 1
against. At 99.8¢ it stakes $5 to win a single cent, 500 to 1, where one bad
resolution erases several hundred wins.

The fee is not the argument up here — as a share of the *available* gain it is
roughly constant at any high price. The exchange's own **price grid** is. Markets
quote in steps of a tenth of a cent, and one step is 2% of everything a 95¢
ticket can make, but **half** of everything a 99.8¢ one can. Above that the
smallest move the market is capable of showing is most of the prize.`,
		step6: `### 6. It checks its own wallet

*"Do I have room?"* — it holds at most **$20** open at any one moment
(\`exposure_cap_usdc\`), which is four $5 tickets.

*"Will this take me too low?"* — it never trades if the spendable balance would
drop below **$5** (\`working_capital_floor_usdc\`). In practice that floor is what
stops it long before the cap does.`,
		step7: `### 7. It buys small, and refuses to overpay

If everything lines up it buys **$5** (\`trade_size_usdc\`), all-or-nothing: the
order either fills completely or it is thrown away. The price limit is **1%**
over what the crowd paid (\`slippage_pct\`), but never tighter than **two price
steps** (\`slippage_min_ticks\`) — 1% of a 34¢ outcome is less than one cent, which
on a whole-cent market rounds to no room at all, and an order with no room is an
order that gets killed. The limit is then snapped onto the market's grid, because
the exchange only accepts prices that sit exactly on it.

Why **$5** and not $1? The exchange will not accept an order for fewer than
**5 shares**. A dollar buys 5 shares only if the outcome costs 20¢ or less; above
that, every single order was refused. The bot now counts the shares itself before
sending, rather than finding out from the exchange — a refusal for this reason is
ambiguous, and an ambiguous refusal ties up part of the cap for a position that
does not exist.`,
		step8: `### 8. Where the money actually sits

Since Polymarket's exchange upgrade, a plain wallet is no longer accepted as the
party placing an order. So the cash sits in a Polymarket deposit wallet, and the
key only **signs** on that wallet's behalf.

Two separate on-chain permissions have to be in place: one to spend the cash (to
buy), one to move outcome tokens (to sell). They break independently — there was
an afternoon when buying worked all day and every sale bounced off a missing
permission. The pre-flight check now reads both straight off the chain instead of
trusting the config to be right about them.`,
		step9: `### 9. It holds, and leaves at the first reversal

Then it watches the same wallets, and leaves as soon as the **first** of them
turns around. It does not wait for the others to agree.

- On a normal position it holds what they hold, so **their sale** is the exit.
- On a mirror they hold the outcome they sold, so **their buy-back** is the exit.
  Them selling *more* of it is doubling down — the same opinion again, not a
  reversal — so it deliberately does not close us.

Riding to resolution is only the fallback, for when nobody reverses first.

*This one is hard-wired. There is no setting for it.*`,
		step10: `### 10. A failed exit is retried, not forgotten

An exit order can be refused just like an entry, and it used to vanish with one
line in a log. Now the event is kept: **three attempts**, roughly a minute apart
and widening, each one reported. If the third fails it says so loudly rather than
going quiet. Replaying is safe — if the position closed in the meantime, the
retry does nothing at all.`,
		step11: `### 11. Nothing disappears quietly

Every skip and every refusal is written down with its numbers: the limit the bot
asked for, the price after grid rounding, the best price on the book, and how
much size was actually sitting at our limit. Without those, "my limit was too
tight" and "the book was too thin" look identical — and their fixes are
opposites.`,
		step12: `### 12. It goes around again

Sold, cash back, room free, next signal. One position per crowd, never two, and a
crowd it has already closed is never re-entered. On a first-ever start it begins
at the newest alert rather than replaying the entire history into a live wallet.`,
		step13: `### 13. Once a week it sweeps the profit

It counts the profit it booked and sends the surplus above the **$5** floor to
the payout address (\`profit_destination\`) — but only if that address is on the
allowlist (\`destination_allowlist\`, the safety catch), only if the amount clears
the **$1** dust threshold (\`dust_threshold_usdc\`), and only if at least **2 POL**
of gas is left (\`gas_reserve_pol\`). With no gas it could not close a position, so
the payout is the thing that gives way. A losing week pays out nothing at all.
The first payout ever made needs a human to say yes.`,
		step14: `### 14. The big red button

At any moment the kill switch (\`kill_switch\`) stops the bot **buying** anything
new — while it keeps watching and closing whatever is already open. It stops
taking risk; it does not abandon it. There is also a shadow mode that decides
exactly as normal but writes each would-be order to a file instead of sending it.`,
		hardWired: `## What is hard-wired, and not a setting

- **"First skilled wallet reverses → we are out."** Fixed logic, with resolution
  as the backstop. There is no take-profit and no stop-loss to tune.
- **Selling is copied by buying the other outcome.** Whether and how a selling
  crowd gets mirrored is fixed; there is no "only copy buys" switch.
- **One position per crowd**, and no re-entry into a crowd already closed.
- **Entry is an all-or-nothing order priced on the exchange's grid.** *How* it
  enters is fixed. You only tune the thresholds around it — slippage, staleness,
  liquidity.
- **The 5-share minimum order is the exchange's rule**, not ours. The bot only
  respects it.

**Why split it that way?** How much, when to skip, how much at once, how much to
leave behind — all of that is a number, and numbers are safe to expose. How it
buys and when it sells — the entire copying logic — lives in code, so that one
careless line of YAML cannot quietly derail the strategy.`,
		notClaiming: `## What we are not claiming yet

Three limits worth knowing, because they change how the bot's own numbers should
be read.

- **The bookkeeping now captures the exchange's fee, and it changed the
  picture.** Every closed position used to record a fee of zero, which made all
  of them look better than they were; reconciled against the settlement records
  on chain, the missing cost was **entirely** that fee, and it is now computed
  from each market's own published curve and recorded per fill. Network gas is
  still written down as zero, and that one is correct rather than pending — on
  this exchange the settlement transaction is paid for by a relayer, not by us.
- **The "price already run" rule is weaker than 3% on coarse markets** — see the
  two-step floor in step 4. Roughly one market in twenty quotes in whole cents,
  and on those the effective rule is far more permissive than the setting reads.
- **The rails are young, and mostly unexercised.** The crowd-independence rule
  cut the signal count by roughly 95%, so the ones added after it — the reversal
  window, the price ceiling — have had very little live traffic to prove
  themselves against. They are argued from measurements taken *before* they were
  armed, and the honest position is that we do not yet know how often they fire.
- **The price ceiling is not justified by money recovered.** The four positions
  it would have refused are worth about **5 cents** between them. It is bought as
  insurance against a lopsided bet — $5 staked to win a cent — not as a fix for a
  measured loss, and it should not be read as one.`,
		notThis: `## What this page is not

These are operating parameters for our own small bot, published in the same
spirit as the rest of the track record. They are not advice, not a signal
service, and not a claim that mirroring skilled wallets will keep working.

The bot's wallet addresses are never published anywhere on this site — watching
the execution wallet in real time would expose open positions, which is exactly
what the [disclosure policy]({methodologyHref}) exists to prevent.`,
	},
	md: {
		inOneSentence: "In one sentence",
		knobsHeading: "The knobs",
		knobsBlurb: `The site renders these as sliders you can drag to watch the bot's decision flip.
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
		tryIt: "Try it — the bot's decision, live",
		defaultsNote: "defaults = {market} config, {asOf}",
		reset: "Reset to our live config",
		incomingSignal: "Incoming signal",
		stageAlert: "First, upstream — is there an alert at all?",
		stageExecutor: "Then the bot's own rails, in order",
		flagAlert: "no alert is raised — the bot is never asked",
		flagExecutor: "the real bot stops here",
		explainer:
			"The real executor short-circuits at the first ✗ in the second list and moves on. Every check is scored here so you can see what each knob does. Prices are always the ones on the side the bot would really buy — for a selling crowd, that is the opposite outcome. The last two checks are the exchange's own rules: the limit has to be reachable, and the order has to be big enough. Between the two lists the executor also runs a handful of bookkeeping checks — is this crowd already open, is the kill switch on — that are left out here because none of them is a number you can turn.",
		noscript:
			"With JavaScript off this shows our live config against the first example signal. The sliders and signal buttons need JavaScript to recompute.",
	},
	knobs: Object.fromEntries(KNOBS.map((knob) => [knob.key, knob.label])),
	knobGroups: { ...KNOB_GROUP_LABELS },
	scenarios: Object.fromEntries(SCENARIOS.map((scenario) => [scenario.id, scenario.label])),
};
