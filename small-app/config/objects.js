export function BLANK_DB (name) {
	return {
		name,
		models: {},
		modelCount: null
	}
}

export function BLANK_MODEL (name) {
	return {
		name,
		index: 0,
		data: []
	}
}

export function BLANK_API_RESPONSE () {
	return {
		ok: false,
		code: null,
		status: null,
		error: null,
		data: null
	}
}