import { SOURCE_PAPERS } from "./citations";

describe("SOURCE_PAPERS", () => {
	it("lists exactly the two source papers cited by the methodology", () => {
		expect(SOURCE_PAPERS).toHaveLength(2);
	});

	it("provides non-empty authors, year, and title for every paper", () => {
		for (const paper of SOURCE_PAPERS) {
			expect(paper.authors.length).toBeGreaterThan(0);
			expect(paper.authors.every((a) => a.trim().length > 0)).toBe(true);
			expect(Number.isInteger(paper.year)).toBe(true);
			expect(paper.year).toBeGreaterThanOrEqual(2000);
			expect(paper.title.trim().length).toBeGreaterThan(0);
		}
	});

	it("includes the Gomez-Cram et al. paper on crowd wisdom vs informed minority", () => {
		const paper = SOURCE_PAPERS.find((p) => p.authors.includes("Gomez-Cram"));
		expect(paper).toBeDefined();
		expect(paper?.title.toLowerCase()).toContain("prediction market accuracy");
		expect(paper?.title.toLowerCase()).toContain("crowd wisdom");
		expect(paper?.authors).toEqual(expect.arrayContaining(["Gomez-Cram", "Guo", "Jensen", "Kung"]));
		expect(paper?.year).toBe(2026);
	});

	it("includes the Akey et al. paper on winners and losers in prediction markets", () => {
		const paper = SOURCE_PAPERS.find((p) => p.authors.includes("Akey"));
		expect(paper).toBeDefined();
		expect(paper?.title.toLowerCase()).toContain("wins");
		expect(paper?.title.toLowerCase()).toContain("loses");
		expect(paper?.title.toLowerCase()).toContain("prediction markets");
		expect(paper?.authors).toEqual(
			expect.arrayContaining(["Akey", "Grégoire", "Harvie", "Martineau"]),
		);
		expect(paper?.year).toBe(2026);
	});
});
