export function titleCase(text) {
	const words = text.split(' ')
	words.forEach((word, index) => {
		words[index] = capitalizeFirstLetter(word)
	})
	return words.join(' ')
}

export function capitalizeFirstLetter(text) {
		return text.slice(0, 1).toUpperCase() + text.slice(1)
}

export function capitalFirstLetterOnly(text) {
		return text.slice(0, 1).toUpperCase() + text.slice(1).toLowerCase()
}