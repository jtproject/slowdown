import { FILE_EXT } from "../config/constants.js";

export function fileNameRoot(fileName) {
	if (fileName.endsWith(FILE_EXT)) return fileName.slice(0, -FILE_EXT.length)
		return fileName
}