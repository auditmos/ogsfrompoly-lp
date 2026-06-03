import { bucketUsdToNearest, formatBucketedUsd } from "./bucketed-usd";

describe("bucketUsdToNearest", () => {
	it.each<[number, number, number]>([
		[0, 25, 0],
		[12, 25, 0],
		[13, 25, 25],
		[37, 25, 25],
		[38, 25, 50],
		[63, 25, 75],
		[-12, 25, -0],
		[-13, 25, -25],
		[100, 10, 100],
		[7, 10, 10],
		[4, 10, 0],
	])("rounds %s to nearest $%s = %s", (amount, bucket, expected) => {
		expect(bucketUsdToNearest(amount, bucket)).toBe(expected);
	});

	it("throws when bucket is zero or negative (no division by zero, no flipped sign)", () => {
		expect(() => bucketUsdToNearest(50, 0)).toThrow();
		expect(() => bucketUsdToNearest(50, -25)).toThrow();
	});
});

describe("formatBucketedUsd", () => {
	it.each<[number, number, string]>([
		[0, 25, "~$0"],
		[12, 25, "~$0"],
		[13, 25, "~+$25"],
		[58, 25, "~+$50"],
		[146, 25, "~+$150"],
		[-58, 25, "~−$50"],
		[1234, 25, "~+$1,225"],
	])("formats %s bucketed by $%s as %s", (amount, bucket, expected) => {
		expect(formatBucketedUsd(amount, bucket)).toBe(expected);
	});
});
