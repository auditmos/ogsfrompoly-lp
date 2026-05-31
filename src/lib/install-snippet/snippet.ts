export type InstallSnippet = {
	prompt: string;
	command: string;
};

export function buildLlmsTxtSnippet(siteUrl: string): InstallSnippet {
	const origin = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
	return {
		prompt: "$",
		command: `curl -s ${origin}/llms.txt`,
	};
}
