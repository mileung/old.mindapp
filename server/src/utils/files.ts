import os from 'os';
import fs from 'fs';
import path from 'path';
import { day } from './time';

const homeDir = os.homedir();
export const mindappRootPath = path.join(homeDir, '.mindapp');
export const timelinePath = path.join(mindappRootPath, 'timeline');
export const settingsPath = path.join(mindappRootPath, 'settings.json');
export const tagsPath = path.join(mindappRootPath, 'tags.json');
export const indicesPath = path.join(mindappRootPath, 'indices.json');

export const writeFile = (filePath: string, json: string) => {
	fs.writeFileSync(filePath, json);
};

export const writeObjectFile = (filePath: string, obj: object, format = false) => {
	writeFile(filePath, JSON.stringify(obj, null, format ? 2 : 0));
};

export const parseFile = <T>(filePath: string) => {
	return JSON.parse(fs.readFileSync(filePath).toString()) as T;
};

export const mkdirIfDne = (dirPath: string) => {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		return true;
	}
	return false;
};

export const touchIfDne = (filePath: string, fileContent: string) => {
	const dirPath = path.dirname(filePath);
	mkdirIfDne(dirPath);
	if (!fs.existsSync(filePath)) {
		writeFile(filePath, fileContent);
		return true;
	}
	return false;
};

export function isFile(path: string) {
	return fs.statSync(path).isFile();
}

export function isDirectory(path: string) {
	return fs.statSync(path).isDirectory();
}

export function getFilePath(fileName: string) {
	const [createDate, authorId, spaceId] = fileName.split('.');
	const thirdDotIndex = fileName.indexOf(
		'.',
		createDate.length + authorId.length + spaceId.length + 2,
	);
	const fileNameAfterThirdDot =
		thirdDotIndex === -1 ? undefined : fileName.substring(1 + thirdDotIndex);
	return calcFilePath(+createDate, +authorId || null, +spaceId || null, fileNameAfterThirdDot);
}

export function calcFilePath(
	createDate: number,
	authorId: null | number,
	spaceId: null | number,
	fileNameSuffix: string = 'json',
) {
	const daysSince1970 = +createDate / day;
	const period = Math.floor(daysSince1970 / 100) * 100 + '';

	return path.join(
		timelinePath,
		period,
		Math.floor(daysSince1970) + '',
		`${createDate}.${authorId}.${spaceId}.${fileNameSuffix}`,
	);
}

export const deletePath = (path: string) => {
	try {
		if (fs.existsSync(path)) {
			const stats = fs.statSync(path);
			if (stats.isFile()) {
				fs.unlinkSync(path);
			} else if (stats.isDirectory()) {
				fs.rmdirSync(path, { recursive: true });
			}
		} else {
			console.error(`Path does not exist: ${path}`);
		}
	} catch (error) {
		console.error(`Error deleting path: ${path}`, error);
	}
};
