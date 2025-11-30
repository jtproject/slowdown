import { MODEL_BUILTIN_ARGS, MODEL_BUILTIN_IDENTIFIERS } from "../config/options.js"

export function parseSeqNumbers (array) {
	array.forEach((value, index) => {
		array[index] = value._seq || false
	})
	return array
}

export function getIdentifiers (object) {
	const identifiers = {}
	Object.keys(object).forEach(key => {
		const cleanKey = key.startsWith('_') ? key.slice(1) : key
		if (MODEL_BUILTIN_IDENTIFIERS.includes(cleanKey)) identifiers[key] = object[key]
	})
	return identifiers
}

export function serializeForDatabase (object) {
	Object.keys(object).forEach((k) => {
		if (MODEL_BUILTIN_ARGS.includes(k)) {
			object[`_${ k }`] = object[k]
			delete object[k]
		}
	})
}