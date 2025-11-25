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
		if (MODEL_BUILTIN_IDENTIFIERS.includes(key) && object[key]) identifiers[key] = object[key]
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