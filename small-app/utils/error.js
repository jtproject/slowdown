export function referenceError(message) {
	throw ReferenceError(visibleError(message))
}

export function generalError(message) {
	throw Error(visibleError(message))
}

function visibleError(message) {
	return `\n\n\x1b[34m${ message }\x1b[33m\n\n`
}