import { RequestHandler } from 'express';
import TagTree from '../types/TagTree';
import { parseFile, tagTreePath, writeObjectFile } from '../utils/files';
import { debouncedSnapshot } from '../utils/git';
import { shouldBeLoner, sortUniArr } from '../utils/tags';

const removeTag: RequestHandler = (req, res) => {
	const tagTree = parseFile<TagTree>(tagTreePath);
	const { tag, parentTag } = req.body as { tag: string; parentTag: string };

	if (tag) {
		if (parentTag) {
			if (!tagTree.parents[parentTag]) throw new Error(`parentTag "${parentTag}" dne`);
			const tagIndex = tagTree.parents[parentTag].findIndex((l) => l === tag);
			if (tagIndex === -1) throw new Error(`tag "${tag}" isn't a subtag of "${parentTag}"`);
			tagTree.parents[parentTag].splice(tagIndex, 1);
			if (!tagTree.parents[parentTag].length) {
				delete tagTree.parents[parentTag];
			}
			const parentTagShouldBeLoner = shouldBeLoner(tagTree, parentTag);
			const tagShouldBeLoner = shouldBeLoner(tagTree, tag);
			if (parentTagShouldBeLoner || tagShouldBeLoner) {
				parentTagShouldBeLoner && tagTree.loners.push(parentTag);
				tagShouldBeLoner && tagTree.loners.push(tag);
				tagTree.loners = sortUniArr(tagTree.loners);
			}
		} else {
			if (tagTree.parents[tag]) {
				const subTags = [...tagTree.parents[tag]];
				delete tagTree.parents[tag];
				tagTree.loners = sortUniArr(
					tagTree.loners.concat(subTags.filter((tag) => shouldBeLoner(tagTree, tag))),
				);
			} else {
				const tagIndex = tagTree.loners.indexOf(tag);
				tagTree.loners.splice(tagIndex, 1);
			}
			Object.entries(tagTree.parents).forEach(([otherParentTag, subtags]) => {
				const tagIndex = subtags.indexOf(tag);
				if (tagIndex !== -1) subtags.splice(tagIndex, 1);
				if (!subtags.length) {
					delete tagTree.parents[otherParentTag];
					if (shouldBeLoner(tagTree, otherParentTag)) {
						tagTree.loners = sortUniArr(tagTree.loners.concat(otherParentTag));
					}
				}
			});
			// When you remove a root tag from the tags page, it does and should not remove the tag from
			// every thought that has that tag.
			// Don not do `delete index.thoughtPathsByTag[tag];` here!
		}
	}

	writeObjectFile(tagTreePath, tagTree);
	res.send({});
	debouncedSnapshot();
};

export default removeTag;
