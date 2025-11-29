export function referenceError(message) {
	throw ReferenceError(visibleError(message))
}

export function generalError(message) {
	throw Error(visibleError(message))
}

function visibleError(message) {
	return `\n\n\x1b[34m${ message }\x1b[33m\n\n`
}

// === JSON Response Errors

function error (type, message) {
	return { type, message, tips: [] }
}

// General

export function valueError (message) {
	return error('ValueError', message)
}

export function syntaxError (message) {
	return error('SyntaxError', message)
}

export function queryError (message) {
	return error('QueryError', message)
}

export function locationError (message) {
	return error('LocationError', message)
}

// Specific

export function noIdError () {
	return valueError('Proper sequence ID(s) not provided.')
}

export function noRouteError (route) {
	return locationError(`/${ route } is not a valid route location.`)
}