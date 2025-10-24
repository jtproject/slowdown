function setRoot(content) {
	getRoot().innerHTML = content
}

function getRoot() {
	return document.querySelector('#root')
}

export {
	setRoot,
	getRoot
}