import os from 'os';
import fs from 'fs';
import path from 'path';
import { Settings } from '../types/Settings';
import { day } from './time';

const homeDir = os.homedir();
export const mindappRootPath = path.join(homeDir, '.mindapp');
export const spacesPath = path.join(mindappRootPath, 'spaces');

export const writeFile = (filePath: string, json: string) => {
	return fs.writeFileSync(filePath, json);
};

export const parseFile = <T>(filePath: string) => {
	return JSON.parse(fs.readFileSync(filePath).toString()) as T;
};

export const getSettings = () => {
	return parseFile<Settings>(path.join(mindappRootPath, 'settings.json'));
};

export const mkdirIfDne = (dirPath: string) => {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		return true;
	}
	return false;
};

export const writeIfDne = (filePath: string, fileContent: string) => {
	const dirPath = path.dirname(filePath);
	mkdirIfDne(dirPath);
	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, fileContent);
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

export function getNotePath(spaceId: string, createDate: number, authorId: number) {
	const daysSince1970 = +createDate / day;
	const period = Math.floor(daysSince1970 / 100) * 100 + '';

	const filePath = path.join(
		spacesPath,
		spaceId,
		period,
		Math.floor(daysSince1970) + '',
		`${createDate}.${authorId}.json`
	);

	return filePath;
}
