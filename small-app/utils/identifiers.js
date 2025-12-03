export function extractIdentifiers (filterString, body) {
	if (!filterString) return {}
	const identifiers = buildIdentifierList(body)
	const filterKeys = filterString.split('/').filter(Boolean)

	const filtered = {}
	filterKeys.forEach(key => {
		if (key in identifiers) filtered[key] = identifiers[key]
	})

	return filtered
}

function buildIdentifierList (body) {
	const [seqs, ids] = getSeqsAndIds(body)

	const seq = body.seq !== undefined
		? body.seq
		: (seqs[0] ?? null)

	const id = body.id !== undefined
		? body.id
		: (ids[0] ?? null)

	return {
		seq,
		id,
		seqs: seq !== null ? [...new Set([seq, ...seqs])] : seqs,
		ids: id !== null ? [...new Set([id, ...ids])] : ids
	}
}

function getSeqsAndIds (body) {
	const seqs = Array.isArray(body.seqs) ? [...body.seqs] : []
	const ids = Array.isArray(body.ids) ? [...body.ids] : []
	return [seqs, ids]
}