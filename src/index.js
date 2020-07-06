const Matrix = require('node-matrix')
const CNN = require('./CNN')
const draw = require('./utils/draw')

async function init() {
	const cnn = new CNN({
		epochs: 1000
	})

	const X = [
		Matrix([
			[1, 0, 0, 0, 1],
			[0, 1, 0, 1, 0],
			[0, 0, 1, 0, 0],
			[0, 1, 0, 1, 0],
			[1, 0, 0, 0, 1]
		]),
		Matrix([
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[1, 0, 0, 0, 1],
			[1, 0, 0, 0, 1],
			[0, 1, 1, 1, 0]
		])
	]
	const T = [
		Matrix([
			[1],
			[0]
		]),
		Matrix([
			[0],
			[1]
		]),
	]

	cnn.train(X, T)

	console.log(draw(X[0], true, 212))
	console.log(draw(cnn.forward(X[0])[4], true, 169))
	console.log(draw(X[1], true, 212))
	console.log(draw(cnn.forward(X[1])[4], true, 169))
	console.log(draw(cnn.weights[0], true, 39))
	console.log(draw(cnn.weights[1], true, 316))
}

init()

