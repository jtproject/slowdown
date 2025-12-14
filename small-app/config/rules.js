export const API_RULES = {
	create: {
		ALLOWED_METHODS: ['POST'],
		ID: null,
		DATA: 'model',
		FAIL: {	all: {
			code: 401,
			message: 'Only God can create all.'
		}}
	},
	read: {
		ALLOWED_METHODS: ['GET'],
		ID: 'seq/id',
		DATA: 'all'
	},
	update: {
		ALLOWED_METHODS: ['PATCH'],
		ID: 'seq',
		DATA: 'force',
		ELSE: 'model'
	},
	delete: {
		ALLOWED_METHODS: ['DELETE'],
		ID: 'seq',
		DATA: null
	}
}