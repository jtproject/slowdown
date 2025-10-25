import Dropdown from "./src/dropdown.js"
import { getRoot, setRoot } from "./src/tools.js"

class App {

	constructor(name) {
		this.name = name
		this.appsMenu = new Dropdown(document.querySelector('#apps-menu'))
		this.appsMenu.app = this
		this.loader = getRoot().cloneNode(true).innerHTML
	}

	setLoading() {
		setRoot(this.loader)
	}

}

const main = () => {
	new App('app')
	setRoot('hi')
}

document.addEventListener('DOMContentLoaded', main)
