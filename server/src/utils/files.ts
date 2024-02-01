import os from 'os';
import fs from 'fs';
import path from 'path';
import { Settings } from '../types/Settings';

const homeDir = os.homedir();
export const mindappRootPath = path.join(homeDir, '.mindapp');
export const spacesPath = path.join(mindappRootPath, 'spaces');

export const getSettings = () => {
	return JSON.parse(
		fs.readFileSync(path.join(mindappRootPath, 'settings.json')).toString()
	) as Settings;
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
