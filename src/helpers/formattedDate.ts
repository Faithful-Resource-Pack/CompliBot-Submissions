export type DateFormat = "ymd" | "dmy" | "mdy";
/**
 * Get today's date as a formatted string
 * @author Juknum, Evorp
 * @param format format to get date as
 * @returns formatted date
 */
export default function formattedDate(format: DateFormat = "ymd"): string {
	const today = new Date();
	const dd = String(today.getDate()).padStart(2, "0");
	// adding one since it starts at zero
	const mm = String(today.getMonth() + 1).padStart(2, "0");
	const yyyy = today.getFullYear();

	switch (format) {
		case "dmy":
			return `${dd}/${mm}/${yyyy}`;
		case "mdy":
			return `${mm}/${dd}/${yyyy}`;
		case "ymd":
			// https://en.wikipedia.org/wiki/ISO_8601
			return `${yyyy}-${mm}-${dd}`;
	}
}
