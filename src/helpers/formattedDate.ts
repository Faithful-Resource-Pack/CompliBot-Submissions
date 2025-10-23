export enum DateFormat {
	YMD,
	DMY,
	MDY,
}

/**
 * Get today's date as a formatted string
 * @author Juknum, Evorp
 * @param format format to get date as
 * @returns formatted date
 */
export default function formattedDate(format = DateFormat.YMD): string {
	const today = new Date();
	const dd = String(today.getDate()).padStart(2, "0");
	// adding one since it starts at zero
	const mm = String(today.getMonth() + 1).padStart(2, "0");
	const yyyy = today.getFullYear();

	switch (format) {
		case DateFormat.MDY:
			return `${dd}/${mm}/${yyyy}`;
		case DateFormat.DMY:
			return `${mm}/${dd}/${yyyy}`;
		case DateFormat.YMD:
			// https://en.wikipedia.org/wiki/ISO_8601
			return `${yyyy}-${mm}-${dd}`;
	}
}
