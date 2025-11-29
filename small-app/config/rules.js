export const API_RULES = {
	create: {
		one: {},
		many: {},
		all: {
			_rules: {
				FAIL: {
					code: 401,
					message: 'Only God can create all.'
				}
			}
		},
		_rules: {
			ALLOWED_METHODS: ['POST']
		}
	},
	read: {
		one: {},
		many: {},
		all: {},
		_rules: {
			ALLOWED_METHODS: ['GET']
		}
	},
	update: {
		one: {},
		many: {},
		all: {},
		_rules: {
			ALLOWED_METHODS: ['PATCH']
		}
	},
	delete: {
		one: {
			ID: 'seq',
			DATA: 'none'
		},
		many: {
			ID: 'seqs',
			DATA: 'model'
		},
		all: {
			ID: null,
			DATA: null
		},
		_rules: {
			ALLOWED_METHODS: ['DELETE']
		}
	}
}