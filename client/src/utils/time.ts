import dayjs from 'dayjs';

export const second = 1000;
export const minute = 60 * second;
export const hour = 60 * minute;
export const day = 24 * hour;
export const week = 7 * day;
export const month = 30 * day;
export const year = 365 * day;

export function formatTimestamp(timestamp: number): string {
	// const now = dayjs();
	// const timeDiff = now.diff(timestamp);
	// if (timeDiff < minute) {
	// 	return timeDiff.toString();
	// } else if (timeDiff < hour) {
	// 	const minutesAgo = Math.floor(timeDiff / minute);
	// 	return `${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;
	// } else if (timeDiff < day) {
	// 	const hoursAgo = Math.floor(timeDiff / hour);
	// 	return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
	// } else if (timeDiff <= week) {
	// 	const daysAgo = Math.floor(timeDiff / day);
	// 	return `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
	// }
	return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
}
