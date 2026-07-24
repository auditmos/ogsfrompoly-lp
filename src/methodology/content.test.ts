import { SOURCE_PAPERS } from "./citations";
import { methodologyMarkdown } from "./content";

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
	});
});
