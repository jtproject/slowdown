import { getRoot, setRoot } from "./src/tools.js"

const loaderHtml = getRoot().cloneNode(true).innerHTML

const main = () => {
	setRoot("<h1>Goat</h1>")
	setLoading()
}

document.addEventListener('DOMContentLoaded', main)

function setLoading() {
	setRoot(loaderHtml)
}