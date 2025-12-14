import { MODEL_BUILTIN_IDENTIFIERS } from "../config/options.js"

export function extractIdentifiers(data, identifiers) {
	if (identifiers === null) return {}

	const filteredData = filterBuiltinIdentifiers(data)

	const result = {
		seq: null,
		seqs: [],
		id: null,
		ids: [],
		...filteredData,
		keys: identifiers
	}

	normalizeIdentifierPair(result, 'seq')
	normalizeIdentifierPair(result, 'id')

	delete result.keys
	return result
}

/* ---------------- helpers ---------------- */

function filterBuiltinIdentifiers(data) {
	return Object.fromEntries(
		Object.entries(data)
			.filter(([key]) => MODEL_BUILTIN_IDENTIFIERS.includes(key))
	)
}

function normalizeIdentifierPair(target, single) {
	const plural = `${single}s`
	const keys = target.keys

	if (keys.includes(single)) {
		resolveSingle(target, single, plural)
		delete target[plural]
		return
	}

	if (keys.includes(plural)) {
		resolvePlural(target, single, plural)
		delete target[single]
		return
	}

	delete target[single]
	delete target[plural]
}

/* ---------------- resolution logic ---------------- */

function resolveSingle(target, single, plural) {
	if (target[single] != null) {
		if (Array.isArray(target[single])) {
			target[single] = target[single][0]
		}
		return
	}

	if (isArrayWithContent(target[plural])) {
		target[single] = target[plural][0]
		return
	}

	if (isScalar(target[plural])) {
		target[single] = target[plural]
		return
	}

	delete target[single]
}

function resolvePlural(target, single, plural) {
	if (isArrayWithContent(target[plural])) return

	if (isArrayWithContent(target[single])) {
		target[plural] = target[single]
		return
	}

	if (isScalar(target[single])) {
		target[plural] = [target[single]]
		return
	}

	delete target[plural]
}

/* ---------------- guards ---------------- */

function isArrayWithContent(value) {
	return Array.isArray(value) && value.length > 0
}

function isScalar(value) {
	return typeof value === 'number' || typeof value === 'string'
}