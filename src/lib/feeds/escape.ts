export function escapeXml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// CDATA payloads cannot contain the literal terminator "]]>".
// The canonical workaround splits the sequence across two CDATA sections.
export function escapeCdata(value: string): string {
	return value.replace(/]]>/g, "]]]]><![CDATA[>");
}
