import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/site/meta";
import type { CardModel, CardStat, CardStatTone } from "./card-model";

/**
 * A minimal satori-compatible element tree: `{ type, props: { style, children } }`.
 * Building it as plain data (rather than JSX) keeps the layout a pure, testable
 * function and lets `render.ts` own the satori/font/wasm boundary alone.
 */
export interface ImageNode {
	type: string;
	props: {
		style: Record<string, string | number>;
		children?: ImageNode | string | (ImageNode | string)[];
	};
}

const SANS = "Inter";
const MONO = "JetBrains Mono";

// Concrete hex approximations of the CSS theme tokens — satori cannot parse the
// `oklch(...)` values from globals.css, so the card palette is pinned here.
const BG = "#0a0a0a"; // --color-ink-0
const TITLE = "#f2f2f2"; // --color-ink-8
const MUTED = "#b3b3b3"; // --color-ink-6
const FAINT = "#808080"; // --color-ink-5
const BORDER = "#383838"; // --color-ink-3
const ACCENT = "#35d07a"; // --color-accent
const LOSS = "#f5623d"; // --color-loss

const TONE_COLOR: Record<CardStatTone, string> = {
	default: TITLE,
	accent: ACCENT,
	loss: LOSS,
};

function el(
	type: string,
	style: ImageNode["props"]["style"],
	children?: ImageNode["props"]["children"],
): ImageNode {
	return { type, props: { style, children } };
}

function statBlock(stat: CardStat): ImageNode {
	return el("div", { display: "flex", flexDirection: "column", gap: 8 }, [
		el(
			"div",
			{
				fontFamily: MONO,
				fontSize: 20,
				letterSpacing: 2,
				textTransform: "uppercase",
				color: FAINT,
			},
			stat.label,
		),
		el(
			"div",
			{ fontFamily: MONO, fontSize: 48, fontWeight: 500, color: TONE_COLOR[stat.tone] },
			stat.value,
		),
	]);
}

function body(model: CardModel): ImageNode {
	const isBrand = model.variant === "brand";
	const title = el(
		"div",
		{
			fontFamily: SANS,
			fontSize: isBrand ? 96 : 60,
			fontWeight: 700,
			lineHeight: 1.02,
			letterSpacing: -1.5,
			color: TITLE,
			maxWidth: 1040,
		},
		model.title,
	);

	const detail =
		isBrand && model.tagline
			? el(
					"div",
					{
						fontFamily: SANS,
						fontSize: 32,
						lineHeight: 1.3,
						color: MUTED,
						marginTop: 28,
						maxWidth: 900,
					},
					model.tagline,
				)
			: el(
					"div",
					{ display: "flex", flexDirection: "row", gap: 56, marginTop: 44 },
					model.stats.map(statBlock),
				);

	return el("div", { display: "flex", flexDirection: "column" }, [title, detail]);
}

/** Builds the 1200×630 social card element tree for a card model. */
export function cardToImageTree(model: CardModel): ImageNode {
	return el(
		"div",
		{
			width: OG_IMAGE_WIDTH,
			height: OG_IMAGE_HEIGHT,
			display: "flex",
			flexDirection: "column",
			justifyContent: "space-between",
			padding: "72px 80px",
			backgroundColor: BG,
			color: TITLE,
			fontFamily: SANS,
		},
		[
			el(
				"div",
				{
					display: "flex",
					fontFamily: MONO,
					fontSize: 24,
					letterSpacing: 3,
					textTransform: "uppercase",
					color: ACCENT,
				},
				model.eyebrow,
			),
			body(model),
			el(
				"div",
				{
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					borderTop: `1px solid ${BORDER}`,
					paddingTop: 28,
					fontFamily: MONO,
					fontSize: 22,
					color: FAINT,
				},
				[
					el("div", { display: "flex" }, model.footer),
					el("div", {
						display: "flex",
						width: 16,
						height: 16,
						backgroundColor: ACCENT,
						borderRadius: 3,
					}),
				],
			),
		],
	);
}
