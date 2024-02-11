import os from 'os';
import fs from 'fs';
import path from 'path';
import { Settings } from '../types/Settings';

const homeDir = os.homedir();
export const mindappRootPath = path.join(homeDir, '.mindapp');
export const settingsPath = path.join(mindappRootPath, 'settings.json');
export const timelinePath = path.join(mindappRootPath, 'timeline');
export const tagsPath = path.join(mindappRootPath, 'tags.json');

export const writeFile = (filePath: string, json: string) => {
	return fs.writeFileSync(filePath, json);
};

export const parseFile = <T>(filePath: string) => {
	return JSON.parse(fs.readFileSync(filePath).toString()) as T;
};

export const getSettings = () => {
	return parseFile<Settings>(settingsPath);
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
