const EVM_ADDRESS = /0x[0-9a-f]{40}/gi;

export function findFullWalletAddresses(body: string): string[] {
	return body.match(EVM_ADDRESS) ?? [];
}
