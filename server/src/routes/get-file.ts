import { RequestHandler } from 'express';
import { Thought } from '../types/Thought';

export const getFile: RequestHandler = (req, res, next) => {
	const fileName = req.params.fileName;
	const [createDate, authorId, spaceId] = fileName.slice(0, fileName.length - 5).split('_');
	// const thirdDotIndex = fileName.indexOf(
	// 	'.',
	// 	createDate.length + authorId.length + spaceId.length + 2,
	// );
	// const fileNameAfterThirdDot =
	// 	thirdDotIndex === -1 ? undefined : fileName.substring(1 + thirdDotIndex);
	// TODO: parse other files other than thoughts
	const filePath = Thought.calcPath(+createDate, authorId, spaceId);
	res.sendFile(filePath, (err) => next(err));
};
