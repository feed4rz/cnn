const chalk = require('chalk')

function draw(inputs, values = false, h = 212, s = 90) {
	let result = ''

	for (let i = 0; i < inputs.numRows; i++) {
		if (values) {
			for (let j = 0; j < inputs[i].length; j++) {
				const input = inputs[i][j]
				result += color(input, true, h, s)
			}

			result += '\n'
		}

		for (let j = 0; j < inputs[i].length; j++) {
			const input = inputs[i][j]
			if (!values) {
				const char = getChar(input)

				result += char + char
			} else {
				result += color(input, false, h, s)
			}
		}

		result += '\n'

		if (values) {
			for (let j = 0; j < inputs[i].length; j++) {
				const input = inputs[i][j]
				result += color(input, true, h, s)
			}

			result += '\n'
		}
	}

	return result
}

function color(input, empty = false, h = 212, s = 90) {
	let result = '        '
	if (!empty) {
		result = (input >= 0 ? ' ' : '') + ' ' + input.toFixed(2) + '  '
	}

	return chalk.bgHsl(h, s, (input + 1) * 50).hex(input > 0 ? '#000' : '#fff')(result)
}

function getChar(input) {
	const chars = '█▓▒░ '

	if (input <= -1) {
		return chars[4]
	}
	if (input < -.5) {
		return chars[3]
	}
	if (input < 0) {
		return chars[2]
	}
	if (input < .5) {
		return chars[1]
	}
	if (input <= 1) {
		return chars[0]
	}
}

module.exports = draw