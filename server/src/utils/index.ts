import fs from 'fs';
import path from 'path';
import { Thought } from '../types/Thought';
import { isDirectory, isFile } from './files';
import { WorkingDirectory } from '../types/WorkingDirectory';

type Index = {
	allThoughtIds: string[];
	thoughtIdsByTag: Record<string, undefined | string[]>;
};

export const index: Index = {
	allThoughtIds: [],
	thoughtIdsByTag: {},
};

export function addPathsByTag(tag: string, thought: Thought) {
	index.thoughtIdsByTag[tag] = addToSortedIndex(index.thoughtIdsByTag[tag] || [], thought);
}

export function addToAllPaths(thought: Thought) {
	addToSortedIndex(index.allThoughtIds, thought);
}

function addToSortedIndex(arr: string[], thought: Thought) {
	const latestCreateDate = !arr.length ? 0 : Thought.parse(arr[arr.length - 1]).createDate;
	if (thought.createDate > latestCreateDate) {
		arr.push(thought.id);
	} else {
		const i = findClosestIndex(arr, thought.createDate);
		if (arr[i] !== thought.id) arr.splice(i, 0, thought.id);
	}
	return arr;
}

// export function closestIndexInPathsByTag(tag: string, targetCreateDate: number) {
// 	return findClosestIndex(index.thoughtIdsByTag[tag], targetCreateDate);
// }

export function closestIndexInAllPaths(targetCreateDate: number) {
	return findClosestIndex(index.allThoughtIds, targetCreateDate);
}

export function removeFromAllPaths(thought: Thought) {
	removeFromArr(index.allThoughtIds, thought);
}

export function removePathsByTag(tag: string, thought: Thought) {
	const arr = index.thoughtIdsByTag[tag];
	arr && removeFromArr(arr, thought);
}

function removeFromArr(arr: string[], thought: Thought) {
	const i = findIndex(arr, thought.createDate);
	if (i !== -1) arr.splice(i, 1);
}

function findIndex(arr: string[], targetCreateDate: number) {
	const i = findClosestIndex(arr, targetCreateDate);
	return Thought.parse(arr[i]).createDate === targetCreateDate ? i : -1;
}

function findClosestIndex(arr: string[], targetCreateDate: number) {
	let low = 0;
	let high = arr.length - 1;
	let closestIndex = 0;
	let currentCreateDate = 0;
	while (low <= high) {
		closestIndex = Math.floor((low + high) / 2);
		if (!arr[closestIndex]) {
			console.log('targetCreateDate:', targetCreateDate);
		}
		currentCreateDate = Thought.parse(arr[closestIndex]).createDate;
		if (currentCreateDate === targetCreateDate) return closestIndex;
		if (currentCreateDate < targetCreateDate) {
			low = closestIndex + 1;
		} else {
			high = closestIndex - 1;
		}
	}

	// TODO: write tests. Idk if the high/ow index will always be
	//  the position to splice in for a sorted array like in `addToSortedIndex`
	return Math.min(arr.length - 1, Math.max(0, low)); // should be the same as high
}

export function setUpIndex() {
	index.allThoughtIds = [];
	index.thoughtIdsByTag = {};
	const l0DirPath = WorkingDirectory.current.timelinePath;
	const l1Dirs = fs.readdirSync(l0DirPath).sort((a, b) => +a - +b);
	for (let i = 0; i < l1Dirs.length; i++) {
		const l1Dir = l1Dirs[i];
		const l1DirPath = path.join(l0DirPath, l1Dir);
		if (!isDirectory(l1DirPath)) continue;
		const l2Dirs = fs.readdirSync(l1DirPath).sort((a, b) => +a - +b);
		for (let i = 0; i < l2Dirs.length; i++) {
			const l2Dir = l2Dirs[i];
			const l2DirPath = path.join(l1DirPath, l2Dir);
			if (!isDirectory(l2DirPath)) continue;
			const l3Dirs = fs.readdirSync(l2DirPath).sort((a, b) => +a - +b);
			for (let i = 0; i < l3Dirs.length; i++) {
				const l3Dir = l3Dirs[i];
				const l3DirPath = path.join(l2DirPath, l3Dir);
				if (!isDirectory(l3DirPath)) continue;
				const l4Dirs = fs.readdirSync(l3DirPath).sort((a, b) => +a - +b);
				for (let i = 0; i < l4Dirs.length; i++) {
					const l4Dir = l4Dirs[i];
					const l4DirPath = path.join(l3DirPath, l4Dir);
					if (!isDirectory(l4DirPath)) continue;
					const l5Dirs = fs.readdirSync(l4DirPath).sort((a, b) => +a - +b);
					for (let i = 0; i < l5Dirs.length; i++) {
						const l5Dir = l5Dirs[i];
						const l5DirPath = path.join(l4DirPath, l5Dir);
						if (!isDirectory(l5DirPath)) continue;
						const jsonFiles = fs.readdirSync(l5DirPath).sort((a, b) => {
							a = a.split('_', 1)[0];
							b = b.split('_', 1)[0];
							return +a - +b;
						});
						for (let i = 0; i < jsonFiles.length; i++) {
							const fileName = jsonFiles[i];
							const createDate = Number(fileName.split('_', 1)[0]);
							if (isNaN(createDate)) continue;
							const filePath = path.join(l5DirPath, fileName);
							if (isFile(filePath) && fileName.endsWith('.json')) {
								const thought = Thought.read(filePath);
								index.allThoughtIds.push(thought.id);
								thought.tags.forEach((tag) => {
									index.thoughtIdsByTag[tag] = (index.thoughtIdsByTag[tag] || []).concat(
										thought.id,
									);
								});
							}
						}
					}
				}
			}
		}
	}
	// console.log('index:', index);
}

/*
// just had this in a draft file and nested it in itself
for (let i = 0; i < l5Dirs.length; i++) {
	const l5Dir = l5Dirs[i];
	if (roots.length === rootsPerLoad) break;
	if (oldToNew ? startingDay > +l5Dir + 10000 : startingDay < +l5Dir) continue;
	const l5DirPath = path.join(l4DirPath, l5Dir);
	if (!isDirectory(l5DirPath)) continue;
	const l6Dirs = fs.readdirSync(l5DirPath).sort((a, b) => (oldToNew ? +a - +b :  +a-+b));
	console.log('l6Dirs:', l6Dirs); // replace this line with this block but all the levels incremented by 1
}
*/
