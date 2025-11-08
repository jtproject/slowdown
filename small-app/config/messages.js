export function dbLoadedMessage(name) {
	console.log(`\x1b[36mLoaded database models from >> \x1b[0m${ name }`)
}

export function startupMessage() {
	console.log('\x1b[33mStarting up jSys small-app...\x1b[0m')
}

export function connecionMessage(port) {
	console.log(`\x1b[35mjSys connection live on >>\x1b[0m :${ port }`)
}