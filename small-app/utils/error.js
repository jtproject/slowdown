export function referenceError(message) {
	throw ReferenceError(visibleError(message))
}

export function generalError(message) {
	throw Error(visibleError(message))
}

export function generalErrorJson(message) {
	throw Error(message)
}

function visibleError(message) {
	return `\n\n\x1b[34m${ message }\x1b[33m\n\n`
}




// new stuff

export function valueError (message) {
	return {type: 'ValueError', message	}
}

export function queryError (message) {
	return { type: 'QueryError', message }
}

export function locationError (message) {
	return { type: 'LocationError', message }
}

export function noIdError () {
	return valueError('Proper sequence ID(s) not provided.')
}

export function noRouteError (route) {
	return locationError(`/${ route } is not a valid route location.`)
}