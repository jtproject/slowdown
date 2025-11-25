export const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
}

export const ALLOWED_METHODS = {
	'create': ['POST'],
	'read': ['GET'],
	'update': ['PATCH'],
	'delete': ['DELETE']
}

export const API_ACTIONS = Object.keys(ALLOWED_METHODS)

export const API_ACTION_GROUPS = [
	'one',
	'many',
	'all'
]

export const MODEL_BUILTIN_IDENTIFIERS = [
	'id',
	'seq',
	'ids',
	'seqs'
]

export const MODEL_BUILTIN_ARGS = [
	...MODEL_BUILTIN_IDENTIFIERS,
	'created',
	'updated'
]