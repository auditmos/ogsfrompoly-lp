import { OG_DEFAULT_IMAGE_PATH, ogImagePathForStatement } from "./paths";

describe("OG_DEFAULT_IMAGE_PATH", () => {
	it("is the root-relative path of the static brand card", () => {
		expect(OG_DEFAULT_IMAGE_PATH).toBe("/og/default.png");
	});
});

describe("ogImagePathForStatement", () => {
	it("maps a statement slug to its per-statement card path", () => {
		expect(ogImagePathForStatement("2026-05-31-weekly")).toBe(
			"/og/statements/2026-05-31-weekly.png",
		);
	});

	it("tolerates a leading slash on the slug", () => {
		expect(ogImagePathForStatement("/2026-05-31-weekly")).toBe(
			"/og/statements/2026-05-31-weekly.png",
		);
	});
});
