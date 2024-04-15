import os from 'os';
import fs from 'fs';
import path from 'path';

const homeDir = os.homedir();
export const mindappRootPath = path.join(homeDir, '.mindapp');
export const rootSettingsPath = path.join(mindappRootPath, 'root-settings.json');
export const defaultWorkingDirectoryPath = path.join(mindappRootPath, 'default-working-directory');
export const testWorkingDirectoryPath = path.join(mindappRootPath, 'test-working-directory');

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
