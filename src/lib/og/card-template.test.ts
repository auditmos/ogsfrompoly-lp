import { BRAND_CARD_MODEL, type CardModel } from "./card-model";
import { cardToImageTree, type ImageNode } from "./card-template";

function collectText(node: ImageNode | string | (ImageNode | string)[] | undefined): string {
	if (node === undefined) return "";
	if (typeof node === "string") return node;
	if (Array.isArray(node)) return node.map(collectText).join(" ");
	return collectText(node.props.children);
}

const statementModel: CardModel = {
	variant: "statement",
	eyebrow: "WEEKLY · May 25 – May 31, 2026",
	title: "Skilled wallets held the line",
	stats: [
		{ label: "Hit rate", value: "64%", tone: "default" },
		{ label: "Hypo. PnL", value: "+$1,240", tone: "accent" },
		{ label: "Alerts", value: "12", tone: "default" },
	],
	footer: "ogsfrompoly.com",
};

describe("cardToImageTree", () => {
	it("rasterizes at the fixed 1200×630 card size", () => {
		const tree = cardToImageTree(statementModel);

		expect(tree.props.style.width).toBe(1200);
		expect(tree.props.style.height).toBe(630);
	});

	it("surfaces the eyebrow, title, footer and every stat label + value of a statement card", () => {
		const text = collectText(cardToImageTree(statementModel));

		expect(text).toContain("WEEKLY · May 25 – May 31, 2026");
		expect(text).toContain("Skilled wallets held the line");
		expect(text).toContain("ogsfrompoly.com");
		for (const stat of statementModel.stats) {
			expect(text).toContain(stat.label);
			expect(text).toContain(stat.value);
		}
	});

	it("renders the brand tagline on the brand card", () => {
		const text = collectText(cardToImageTree(BRAND_CARD_MODEL));

		expect(text).toContain(BRAND_CARD_MODEL.title);
		expect(text).toContain(BRAND_CARD_MODEL.tagline ?? "__no_tagline__");
	});
});
