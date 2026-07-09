import { isPreviewEnabled } from "./preview-gate";

describe("isPreviewEnabled", () => {
	it("enables the preview only in the local dev environment", () => {
		expect(isPreviewEnabled("dev")).toBe(true);
	});

	it("disables the preview on production so fake fixture numbers never ship to the credibility domain", () => {
		expect(isPreviewEnabled("production")).toBe(false);
	});

	it("disables the preview on staging (dev-only decision — staging mirrors production)", () => {
		expect(isPreviewEnabled("staging")).toBe(false);
	});

	it("disables the preview when the environment var is unset (fail closed)", () => {
		expect(isPreviewEnabled(undefined)).toBe(false);
	});

	it("matches the env name case-sensitively so an uppercased value never enables the preview", () => {
		expect(isPreviewEnabled("DEV")).toBe(false);
		expect(isPreviewEnabled("PRODUCTION")).toBe(false);
	});
});
