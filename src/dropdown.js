import { unHideElement } from "./tools.js"
import navbar from "../config/navbar.js"

export default class Dropdown {

	constructor(element) {
		if (!element || !element instanceof(HTMLElement)) throw TypeError(`Expected HTML Element, but got ${ typeof(element) }.`)
		this.element = element
		this.container = element.children[0]
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
			this.app.setLoading()
			window.history.pushState({}, '', e.target.href)
			this.resetOptionStack(e.target)
			this.options.forEach((option) => {
				option.style.top = 0
			})
			this.container.style.height = '100%'
			this.status = 'up'
			this.app.loadPage(this.pagePathUrl(e.target.href))
		}	
	}

	pagePathUrl(href) {
		return '/pages' + new URL(href).pathname + '.html'
	}
	
	resetOptionStack(target) {
		this.options.forEach((option) => {
			option.classList.remove('on-top')
		})
		target.classList.add('on-top')
	}

	getCellTopPosition(value) {
		return this.rowHeight * value + 'px'
	}

	captureOptions() {
		this.options = []
		navbar.forEach((option, index) => {
			const element = document.createElement('a')
			element.href = option.href
			element.innerText = option.label
			element.classList.add('--apps-menu__link')
			if (index === 0) element.classList.add('on-top')
			this.container.appendChild(element)
			this.options.push(element)
		})
		// Array.from(this.container.children).forEach((child) => {
		// })
	}

	showMenu() {
		unHideElement(this.element)
	}

}