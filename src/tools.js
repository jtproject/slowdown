function setRoot(content) {
	getRoot().innerHTML = content
}

function getRoot() {
	return document.querySelector('#root')
}

function unHideElement(element) {
	if (!element) return
	element.classList.remove('await')
}

export {
	setRoot,
	getRoot,
	unHideElement
}