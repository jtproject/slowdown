import { getRoot, setRoot } from "./src/tools.js"

const loaderHtml = getRoot().cloneNode(true).innerHTML

class Dropdown {

	constructor(element) {
		if (!element || !element instanceof(HTMLElement)) throw TypeError(`Expected HTML Element, but got ${ typeof(element) }.`)
		this.element = element
		this.options = []
		this.captureOptions()
		console.log(this.options)
		this.status = 'up'
		this.rowHeight = 16
		this.colWidth = 100
		this.element.onclick = this.toggleStatus
		this.showMenu()		
	}
	
	toggleStatus() {
		console.log('click')
		if (this.status === 'up') {
			this.options.forEach((option, i) => {
				option.top = this.rowHeight * i + 'px'
			})
			this.status = 'down'
		}
		else if (this.status === 'down') {
			this.status = 'up'
		}	
	}

	captureOptions() {
		console.log(this.element.children)
		Array.from(this.element.children).forEach((child) => {
			console.log(child)
			this.options.push(child)
		})
	}

	showMenu() {
		unHideElement(this.element)
	}

}

const appsMenu = new Dropdown(document.querySelector('#apps-menu'))

const main = () => {

	console.log(appsMenu.element.children)
}

document.addEventListener('DOMContentLoaded', main)

function setLoading() {
	setRoot(loaderHtml)
}

function unHideElement(element) {
	if (!element) return
	element.classList.remove('await')
}