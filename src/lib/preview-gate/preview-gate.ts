export function isPreviewEnabled(cloudflareEnv: string | undefined): boolean {
	return cloudflareEnv === "dev";
}
