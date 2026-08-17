import { marked } from "marked";
import { resolveMethodologyProse } from "@/i18n/catalog";
import { SOURCE_PAPERS } from "./citations";
import { methodologyMarkdown, methodologyMarkdownFor } from "./content";
import { METHODOLOGY_EN } from "./prose-en";

describe("methodologyMarkdownFor", () => {
	it("stitches the English surface identical to the legacy export", () => {
		expect(methodologyMarkdownFor("en")).toBe(methodologyMarkdown);
	});

	it("never shows the authority note on the English surface", () => {
		expect(methodologyMarkdownFor("en")).not.toContain(METHODOLOGY_EN.note);
	});

	it.each([
		["pl"],
		["es"],
	] as const)("renders %s with a translated title and a translated authority note", (locale) => {
		const md = methodologyMarkdownFor(locale);
		const prose = resolveMethodologyProse(locale);

		expect(prose.title).not.toBe(METHODOLOGY_EN.title);
		expect(md).toContain(`# ${prose.title}`);
		expect(prose.note).not.toBe(METHODOLOGY_EN.note);
		expect(md).toContain(`> ${prose.note}`);
	});

	it.each([
		["pl"],
		["es"],
	] as const)("keeps the untranslated citation block verbatim on the %s surface", (locale) => {
		for (const paper of SOURCE_PAPERS) {
			expect(methodologyMarkdownFor(locale)).toContain(paper.title);
		}
	});

	// The dual-format invariant: the HTML page renders marked(methodologyMarkdownFor)
	// and the .md twin serves methodologyMarkdownFor verbatim, so proving every
	// catalog-resolved string is embedded in that one stitched surface proves the
	// two page surfaces can never disagree in any locale.
	it.each([
		["en"],
		["pl"],
		["es"],
	] as const)("stitches every resolved %s string into the one surface both formats render", (locale) => {
		const md = methodologyMarkdownFor(locale);
		const prose = resolveMethodologyProse(locale);

		expect(md).toContain(prose.title);
		expect(md).toContain(prose.description);
		for (const section of Object.values(prose.sections)) {
			expect(md).toContain(section);
		}

		const html = marked.parse(md, { async: false }) as string;
		expect(html).toContain(`>${prose.title}</h1>`);
		expect(html.includes(prose.note)).toBe(locale !== "en");
	});
});

describe("methodologyMarkdown", () => {
	it("cites every source paper by its full title", () => {
		for (const paper of SOURCE_PAPERS) {
			expect(methodologyMarkdown).toContain(paper.title);
		}
	});

	it("names every source paper's authors in the body", () => {
		for (const paper of SOURCE_PAPERS) {
			for (const author of paper.authors) {
				expect(methodologyMarkdown).toContain(author);
			}
		}
	});

	it("states each paper's publication year alongside the citation", () => {
		for (const paper of SOURCE_PAPERS) {
			expect(methodologyMarkdown).toContain(String(paper.year));
		}
	});

	describe("sign-randomization skill test", () => {
		const body = methodologyMarkdown.toLowerCase();

		it("names the test by the sign-randomization label", () => {
			expect(body).toMatch(/sign[-\s]randomization/);
		});

		it("states the 1,000-simulation count", () => {
			expect(body).toMatch(/1[,\s]?000\s+sim/);
		});

		it("states the minimum event threshold of 20", () => {
			expect(body).toMatch(/(≥|>=|at least)\s*20\s+event/);
		});

		it("frames the output as a p-value rather than realized PnL", () => {
			expect(body).toContain("p-value");
		});

		it("defines the p-value calculation formula", () => {
			expect(body).toContain("a = sum(x_i)");
			expect(body).toContain("b = 1,000 simulations");
			expect(body).toContain("t_j = sum(s_{j,i} * abs(x_i))");
			expect(body).toContain("p = count(t_j >= a) / b");
		});

		it("notes that only realized PnL feeds the test", () => {
			expect(body).toMatch(/only[-\s]realized\s+pnl/);
		});
	});

	describe("current public coverage", () => {
		const body = methodologyMarkdown.toLowerCase();

		it("states the current published category", () => {
			expect(body).toContain("macro-finance");
		});

		it("does not describe politics or crypto as part of the current public track record", () => {
			expect(body).not.toContain("politic");
			expect(body).not.toContain("crypto");
		});
	});

	describe("live copy bots", () => {
		it("discloses that real money runs behind the signals", () => {
			expect(methodologyMarkdown).toContain("## Skin in the game");
			expect(methodologyMarkdown).toContain("$5");
		});

		it("names both bots with their go-live framing", () => {
			expect(methodologyMarkdown).toContain("Cluster copy");
			expect(methodologyMarkdown).toContain("Wallet copy");
		});

		it("links the for-dummies walkthroughs as the full documentation", () => {
			expect(methodologyMarkdown).toContain("(/for-dummies)");
		});

		it("states how bot results reach the monthly statements", () => {
			// Cash-basis: swept realized profit only — never marks on open positions.
			expect(methodologyMarkdown.toLowerCase()).toContain("swept");
			expect(methodologyMarkdown.toLowerCase()).toMatch(/while that position is open/);
		});
	});

	describe("disclosure policy section", () => {
		const body = methodologyMarkdown.toLowerCase();

		it("has a dedicated disclosure section heading", () => {
			expect(methodologyMarkdown).toMatch(/##\s+Disclosure policy/);
		});

		it("states wallets appear only as truncated or hashed IDs", () => {
			expect(body).toContain("truncated");
			expect(body).toMatch(/wallet_[a-z0-9…]+/);
		});

		it("forbids publishing live alpha or live alerts", () => {
			expect(body).toMatch(/(no live alpha|never publish.*live)/);
		});

		it("states no leaderboards are published", () => {
			expect(body).toContain("leaderboard");
		});

		it("scopes results to methodology and aggregates only", () => {
			expect(body).toMatch(/aggregate/);
		});

		it("extends the policy to the bots' own wallets and the mirrored leaders", () => {
			// The for-dummies pages cite this page as the policy that keeps bot
			// wallets unwatchable — the policy has to actually say so.
			expect(body).toContain("leader-a");
			expect(body).toContain("payout address");
			expect(body).toMatch(/open bot position is never named/);
		});
	});
});
