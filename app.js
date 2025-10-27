import Dropdown from "./src/dropdown.js"
import { getRoot, setRoot } from "./src/tools.js"

class App {

	constructor(name) {
		this.name = name
		this.appsMenu = new Dropdown(document.querySelector('#apps-menu'))
		this.appsMenu.app = this
		this.loader = getRoot().cloneNode(true).innerHTML
		this.setLoading()
	}

	setLoading() {
		setRoot(this.loader)
	}

	async loadPage(url) {
		const html = await fetch(url).then(res => res.text())
  	setRoot(html)
	}

}

const main = () => {
	const app = new App('app')
	app.loadPage('/pages/dashboard.html')
}

document.addEventListener('DOMContentLoaded', main)
