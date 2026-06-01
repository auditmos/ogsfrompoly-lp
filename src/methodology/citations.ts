export type Citation = {
	authors: readonly string[];
	year: number;
	title: string;
};

export const SOURCE_PAPERS: readonly Citation[] = [
	{
		authors: ["Gomez-Cram", "Guo", "Jensen", "Kung"],
		year: 2026,
		title: "Prediction Market Accuracy: Crowd Wisdom or Informed Minority?",
	},
	{
		authors: ["Akey", "Grégoire", "Harvie", "Martineau"],
		year: 2026,
		title: "Who Wins and Who Loses In Prediction Markets",
	},
];
