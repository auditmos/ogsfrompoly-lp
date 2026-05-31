const SHORT_MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

const LONG_MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const;

type Parts = { year: number; monthIdx: number; day: number };

function parseIsoDate(iso: string): Parts {
	const [y, m, d] = iso.split("-");
	return { year: Number(y), monthIdx: Number(m) - 1, day: Number(d) };
}

export function formatPeriodLabel(
	periodStart: string,
	periodEnd: string,
	type: "weekly" | "monthly",
): string {
	const start = parseIsoDate(periodStart);
	const end = parseIsoDate(periodEnd);

	if (type === "monthly") {
		return `${LONG_MONTHS[start.monthIdx]} ${start.year}`;
	}

	const startMonth = SHORT_MONTHS[start.monthIdx];
	const endMonth = SHORT_MONTHS[end.monthIdx];

	if (start.year !== end.year) {
		return `${startMonth} ${start.day}, ${start.year} – ${endMonth} ${end.day}, ${end.year}`;
	}

	return `${startMonth} ${start.day} – ${endMonth} ${end.day}, ${end.year}`;
}
