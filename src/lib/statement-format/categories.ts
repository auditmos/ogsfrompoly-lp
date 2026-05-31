export type Category = "politics" | "macro-finance" | "crypto";

function titleCaseWord(word: string): string {
	if (word.length === 0) return word;
	return word[0]?.toUpperCase() + word.slice(1);
}

function titleCaseCategory(category: Category): string {
	return category.split("-").map(titleCaseWord).join("-");
}

export function formatCategoryList(categories: ReadonlyArray<Category>): string {
	return categories.map(titleCaseCategory).join(" · ");
}
