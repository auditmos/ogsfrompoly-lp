import { buildLlmsTxtSnippet } from "./snippet";

describe("buildLlmsTxtSnippet", () => {
	it("produces a curl invocation targeting the site's /llms.txt", () => {
		const snippet = buildLlmsTxtSnippet("https://ogsfrompoly.com");

		expect(snippet.command).toBe("curl -s https://ogsfrompoly.com/llms.txt");
	});

	it("strips a trailing slash from the site URL so the snippet is canonical", () => {
		const snippet = buildLlmsTxtSnippet("https://ogsfrompoly.com/");

		expect(snippet.command).toBe("curl -s https://ogsfrompoly.com/llms.txt");
	});

	it("exposes the displayed prompt separately from the command so the component can style it without breaking copy-paste", () => {
		const snippet = buildLlmsTxtSnippet("https://ogsfrompoly.com");

		expect(snippet.prompt).toBe("$");
		expect(snippet.command.startsWith(snippet.prompt)).toBe(false);
	});
});
