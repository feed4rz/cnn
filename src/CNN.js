const Matrix = require('node-matrix')

class CNN {
	constructor(args = {}) {
		const { weights, debug = false, epochs = 1, rate = 0.3 } = args

		if (weights) {
			this.weights = weights
		} else {
			this.weights = [
				Matrix({
					rows: 2,
					columns: 2,
					values: () => this._randomValue(2)
				}),
				Matrix({
					rows: 2,
					columns: 4,
					values: () => this._randomValue(4)
				})
			]
		}
		this.poolingStride = 2
		this.poolingWindow = 2
		this.rate = rate
		this.debug = debug
		this.epochs = epochs
	}

	// Used to initialize a weight
	_randomValue(neurons) {
		const spread = Math.pow(neurons, -.5)
		return Math.random() * 3 * spread - spread
	}

	static sigmoid(x) {
		return 1 / (1 + Math.pow(Math.E, -x))
	}

	// Sigmoid for activation
	_activate(x) {
		return CNN.sigmoid(x)
	}

	convolution(X) {
		const W = this.weights[0]
		let Y = []
		const d = W.numRows
		const I = X.numRows - d + 1
		const J = X.numCols - d + 1
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
			}
		}

		return Matrix(Y)
	}

	pooling(X) {
		let Y = []
		const d = this.poolingStride
		const I = X.numRows - d
		const J = X.numCols - d
		const A = this.poolingWindow
		const B = this.poolingWindow

		for (let i = 0; i < I; i++) {
			if (!Y[i]) {
				Y[i] = []
			}

			for (let j = 0; j < J; j++) {
				let max = -Infinity

				for (let a = 0; a < A; a++) {
					for (let b = 0; b < B; b++) {
						max = Math.max(max, X[i * d + a][j * d + b])
					}
				}

				Y[i][j] = max
			}
		}

		return Matrix(Y)
	}

	sigmoidActivate(X) {
		let Y = []
		const I = X.numRows
		const J = X.numCols

		for (let i = 0; i < I; i++) {
			for (let j = 0; j < J; j++) {
				Y.push([this._activate(X[i][j])])
			}
		}

		return Matrix(Y)
	}

	dense(X) {
		return Matrix.multiply(this.weights[1], X).transform(this._activate)
	}

	forward(X) {
		const convolutionY = this.convolution(X)
		const poolingY = this.pooling(convolutionY)
		const sigmoidActivationY = this.sigmoidActivate(poolingY)
		const denseY = this.dense(sigmoidActivationY)

		return [X, convolutionY, poolingY, sigmoidActivationY, denseY]
	}

	denseWeightsError(X, Y, E) {
		const denseE = Matrix.multiply(
			Matrix.multiplyElements(E, Y.transform(num => num * (1 - num))),
			X.transpose()
		)

		return denseE
	}

	sigmoidError(X, Y, E) {
		return Matrix.multiplyElements(
			Y.transform(num => num * (1 - num)),
			Matrix.multiply(this.weights[1].transpose(), E)
		)
	}

	poolingError(X, Y, E) {
		const d = this.poolingStride
		const I = X.numRows - d
		const J = X.numCols - d
		const A = this.poolingWindow
		const B = this.poolingWindow
		let poolingE = Matrix({
			rows: X.numRows,
			columns: X.numCols,
			values: 0
		})

		let index = 0
		for (let i = 0; i < I; i++) {
			for (let j = 0; j < J; j++) {
				let max = -Infinity
				let maxCoords = [0, 0]

				for (let a = 0; a < A; a++) {
					for (let b = 0; b < B; b++) {
						if (max < X[i * d + a][j * d + b]) {
							max = X[i * d + a][j * d + b]
							maxCoords = [i * d + a, j * d + b]
						}
					}
				}

				poolingE[maxCoords[0]][maxCoords[1]] = E[index][0]
				index++
			}
		}

		return poolingE
	}

	convolutionError(X, Y, E) {
		const W = this.weights[0]
		const d = W.numRows
		const I = X.numRows - d + 1
		const J = X.numCols - d + 1
		let convolutionE = Matrix({
			rows: d,
			columns: d,
			values: 0
		})

		for (let a = 0; a < d; a++) {
			for (let b = 0; b < d; b++) {
				convolutionE[a][b] = 0
				for (let i = 0; i < I; i++) {
					for (let j = 0; j < J; j++) {
						convolutionE[a][b] = convolutionE[a][b] + E[i][j] * X[i + a][j + b]
					}
				}
			}
		}

		return convolutionE
	}

	backward(Y, T) {
		const E = Matrix.subtract(T, Y[4])
		const denseWeightsE = this.denseWeightsError(Y[3], Y[4], E)
		const sigmoidE = this.sigmoidError(Y[2], Y[3], E)
		const poolingE = this.poolingError(Y[1], Y[2], sigmoidE)
		const convolutionE = this.convolutionError(Y[0], Y[1], poolingE)

		return [convolutionE, denseWeightsE]
	}

	updateWeights(E) {
		for (let i = 0; i < this.weights.length; i++) {
			// Wi = Wi + a * deltaWi
			// a - learning rate
			this.weights[i] = Matrix.add(
				this.weights[i],
				Matrix.multiplyScalar(
					E[i],
					this.rate
				)
			)
		}
	}

	it(X, T) {
		const Y = this.forward(X)
		const E = this.backward(Y, T)
		this.updateWeights(E)
	}

	train(X, T) {
		for (let i = 0; i < this.epochs; i++) {
			for (let j = 0; j < X.length; j++) {
				this.it(X[j], T[j])
			}
		}
	}
}

module.exports = CNN