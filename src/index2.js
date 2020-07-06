const Matrix = require('node-matrix')
const draw = require('./utils/draw')

Matrix.prototype.flat = function(fn) {
	const result = []

	for (let i = 0; i < this.numRows; i++) {
		for (let j = 0; j < this.numCols; j++) {
			result.push(this[i][j])

			if (typeof fn === 'function') {
				fn(this[i][j])
			}
		}
	}

	return result
}

class Layer {
	/*
		outputs: Number of outputs
	*/
	constructor(args = {}) {
		const { outputs } = args

		if (!outputs || outputs < 1) {
			throw new Error('outputs must be at least 1')
		}

		this.outputs = outputs
	}

	_randomValue() {
		const spread = Math.pow(this.outputs, -.5)
		return Math.random() * 3 * spread - spread
	}
}


class Conv extends Layer {
	/*
		size: Width and Height
	*/
	constructor(args = {}) {
		super(args)
		const { size } = args

		if (!size || size < 3) {
			throw new Error('size has to be at least 3')
		}

		this.size = size
		this.weights = []

		this.randomWeights()
	}

	randomWeights() {
		for (let i = 0; i < this.outputs; i++) {
			const values = () => this._randomValue()
			this.weights.push(
				Matrix({
					rows: this.size,
					columns: this.size,
					values
				})
			)
		}
	}

	/*
		layer: Next Layer
	*/
	back(args = {}) {
		const { layer } = args

		if (!(layer instanceof Layer)) {
			throw new Error('layer is required')
		}


	}
}

let conv = [
	Matrix([
		[1, -1, -1],
		[-1, 1, -1],
		[-1, -1, 1]
	]),
	Matrix([
		[1, -1, 1],
		[-1, 1, -1],
		[1, -1, 1]
	]),
	Matrix([
		[-1, -1, 1],
		[-1, 1, -1],
		[1, -1, -1]
	])
]

let outputWeights = [

]

const X1 = Matrix([
	[-1, -1, -1, -1, -1, -1, -1, -1, -1],
	[-1, 1, -1, -1, -1, -1, -1, 1, -1],
	[-1, -1, 1, -1, -1, -1, 1, -1, -1],
	[-1, -1, -1, 1, -1, 1, -1, -1, -1],
	[-1, -1, -1, -1, 1, -1, -1, -1, -1],
	[-1, -1, -1, 1, -1, 1, -1, -1, -1],
	[-1, -1, 1, -1, -1, -1, 1, -1, -1],
	[-1, 1, -1, -1, -1, -1, -1, 1, -1],
	[-1, -1, -1, -1, -1, -1, -1, -1, -1]
])

const X2 = Matrix([
	[-1, -1, -1, -1, -1, -1, -1, -1, -1],
	[-1, -1, -1, -1, -1, -1, 1, -1, -1],
	[-1, 1, -1, -1, -1, 1, -1, -1, -1],
	[-1, -1, 1, 1, -1, 1, -1, -1, -1],
	[-1, -1, -1, -1, 1, -1, -1, -1, -1],
	[-1, -1, -1, 1, -1, 1, 1, -1, -1],
	[-1, -1, -1, 1, -1, -1, -1, 1, -1],
	[-1, -1, 1, -1, -1, -1, -1, -1, -1],
	[-1, -1, -1, -1, -1, -1, -1, -1, -1],
])

const O1 = Matrix([
	[-1, -1, -1, -1, -1, -1, -1, -1, -1],
	[-1, -1, -1, 1, 1, 1, -1, -1, -1],
	[-1, -1, 1, -1, -1, -1, 1, -1, -1],
	[-1, 1, -1, -1, -1, -1, -1, 1, -1],
	[-1, 1, -1, -1, -1, -1, -1, 1, -1],
	[-1, 1, -1, -1, -1, -1, -1, 1, -1],
	[-1, -1, 1, -1, -1, -1, 1, -1, -1],
	[-1, -1, -1, 1, 1, 1, -1, -1, -1],
	[-1, -1, -1, -1, -1, -1, -1, -1, -1],
])

function convolution(X, W) {
	let Y = []
	const d = (W.numRows - 1) / 2
	const I = X.numRows - (d * 2)
	const J = X.numCols - (d * 2)
	const A = W.numRows
	const B = W.numRows

	for (let i = 0; i < I; i++) {
		if (!Y[i]) {
			Y[i] = []
		}

		for (let j = 0; j < J; j++) {
			for (let a = 0; a < A; a++) {
				for (let b = 0; b < B; b++) {
					Y[i][j] = (Y[i][j] || 0) + W[a][b] * X[i + a][j + b]
				}
			}

			Y[i][j] = Y[i][j] / (A * B)
		}
	}

	return Y
}

function relu(input) {
	let result = [
		Matrix({ rows: 7, columns: 7 }),
		Matrix({ rows: 7, columns: 7 }),
		Matrix({ rows: 7, columns: 7 })
	]

	for (let i = 0; i < result.length; i++) {
		result[i] = input[i].transform(num => Math.max(0, num))
	}

	return result
}

function max(input, stride = 2) {
	let result = [
		Matrix({ rows: 4, columns: 4 }),
		Matrix({ rows: 4, columns: 4 }),
		Matrix({ rows: 4, columns: 4 })
	]

	for (let i = 0; i < result.length; i++) {
		for (let j = 0; j < result[i].numCols; j++) {
			for (let k = 0; k < result[i].numRows; k++) {
				const inputMatrix = Matrix([
					[
						input[i][stride * j + 0][stride * k + 0],
						input[i][stride * j + 1] ? input[i][stride * j + 1][stride * k + 0] : -1
					],
					[
						input[i][stride * j + 0][stride * k + 1] ? input[i][stride * j + 0][stride * k + 1] : -1,
						input[i][stride * j + 1] ? (input[i][stride * j + 1][stride * k + 1] ? input[i][stride * j + 1][stride * k + 1] : -1) : -1
					]
				])

				let maxVal = 0
				inputMatrix.flat(num => {
					maxVal = Math.max(maxVal, num)
				})

				result[i][j][k] = maxVal
			}
		}
	}

	return result
}

function net(input, weights) {

}

async function init() {
	const colors = [212, 39, 316]
	console.log(draw(X1, true))

	const result = Matrix(convolution(X1, conv[0]))
	console.log(draw(result, true, colors[0]))

	return

	result.map((res, i) => {
		console.log(draw(conv[i], true, colors[i]))
		console.log(draw(res, true, colors[i]))
	})

	result = relu(result)

	result.map((res, i) => {
		console.log(draw(res, true, colors[i]))
	})

	result = max(result)

	result.map((res, i) => {
		console.log(draw(res, true, colors[i]))
	})
}

init()

const x = Matrix([
	[1, 2, 3, 4, 5],
	[1, 2, 3, 4, 5],
	[1, 2, 3, 4, 5],
	[1, 2, 3, 4, 5],
	[1, 2, 3, 4, 5]
])

const s = Matrix([
	[1, 2, 3],
	[1, 2, 3],
	[1, 2, 3]
])

const result = Matrix.multiplyScalar(x, s)

// console.log(result)