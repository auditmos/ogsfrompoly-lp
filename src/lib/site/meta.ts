export type OpenGraphType = "website" | "article";

export type PageMetaInput = {
	site: string | URL;
	path: string;
	title: string;
	description: string;
	type?: OpenGraphType;
};

export type PageMeta = {
	canonical: string;
	og: Record<string, string>;
	twitter: Record<string, string>;
};

export function buildPageMeta(input: PageMetaInput): PageMeta {
	const origin = String(input.site).replace(/\/+$/, "");
	const path = input.path.replace(/\/+$/, "");
	const canonical = path === "" ? `${origin}/` : `${origin}${path}`;
	const type = input.type ?? "website";

	return {
		canonical,
		og: {
			"og:title": input.title,
			"og:description": input.description,
			"og:type": type,
			"og:url": canonical,
		},
		twitter: {
			"twitter:card": "summary",
			"twitter:title": input.title,
			"twitter:description": input.description,
		},
	};
}
