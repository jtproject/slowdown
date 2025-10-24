import { getRoot, setRoot } from "./src/tools.js"

const loaderHtml = getRoot().cloneNode(true).innerHTML

class Dropdown {

	constructor(element) {
		if (!element || !element instanceof(HTMLElement)) throw TypeError(`Expected HTML Element, but got ${ typeof(element) }.`)
		this.element = element
		this.container = element.children[0]
		this.options = []
		this.captureOptions()
		this.status = 'up'
		this.rowHeight = 24
		this.colWidth = 100
		this.element.onclick = (e) => this.toggleStatus(e)
		this.showMenu()		
	}

	getOptions() {
		return this.options
	}
	
	toggleStatus(e) {
		if (this.status === 'up') {
			e.preventDefault()
			let height = 0
			this.options.forEach((option, i) => {
				option.style.top = this.getCellTopPosition(i)
				height = (i + 1) * this.rowHeight
			})
			this.container.style.height = height + 'px'
			this.status = 'down'
		}
		else if (this.status === 'down') {
			e.preventDefault()
			window.history.pushState({}, '', e.target.href)
			this.options.forEach((option) => {
				option.style.top = 0
			})
			this.container.style.height = '100%'
			this.status = 'up'
		}	
	}

	getCellTopPosition(value) {
		return this.rowHeight * value + 'px'
	}

	captureOptions() {
		Array.from(this.container.children).forEach((child) => {
			console.log(child)	
			this.options.push(child)
		})
	}

	showMenu() {
		unHideElement(this.element)
	}

}


const main = () => {
	new Dropdown(document.querySelector('#apps-menu'))
	setRoot('hi')
}

document.addEventListener('DOMContentLoaded', main)

function setLoading() {
	setRoot(loaderHtml)
}

function unHideElement(element) {
	if (!element) return
	element.classList.remove('await')
}