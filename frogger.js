'use strict';

class Canvas {
	constructor() {
		this.canvas = document.querySelector('#frogger');
		this.ctx = this.canvas.getContext('2d');

		this.playerX = this.canvas.width / 2 - 15;
		this.playerY = this.canvas.height - 30;
		this.playerWidth = 30;
		this.playerHeight = 30;
		this.reachedGoal = false;
		this.player = this.initPlayer();

		this.lanes = [
			{ speed: 3, numCars: 3, y: 545, apart: 200 },
			{ speed: -7, numCars: 1, y: 515, apart: 0 },
			{ speed: 5, numCars: 1, y: 485, apart: 0 },
			{ speed: 3, numCars: 2, y: 455, apart: 300 },
			{ speed: -5, numCars: 1, y: 425, apart: 0 },
			{ speed: 6, numCars: 1, y: 395, apart: 0 },
			{ speed: -7, numCars: 3, y: 365, apart: 250 },
			{ speed: 4, numCars: 5, y: 335, apart: 75 },
			{ speed: 0, numCars: 0, y: 305, apart: 0 }, // safe lane
			{ speed: -4, numCars: 2, y: 275, apart: 150 },
			{ speed: -3, numCars: 2, y: 245, apart: 75 },
			{ speed: 5, numCars: 2, y: 215, apart: 100 },
			{ speed: 6, numCars: 2, y: 185, apart: 100 },
			{ speed: 2, numCars: 2, y: 155, apart: 100 },
			{ speed: -5, numCars: 1, y: 125, apart: 0 },
			{ speed: -10, numCars: 1, y: 95, apart: 0 },
			{ speed: 3, numCars: 3, y: 65, apart: 60 },
		];

		this.carWidth = 62;
		this.carHeight = 20;
		this.cars = this.initCars();

		this.numLives = 3;
		this.score = 0;
		this.intervalId = null;
		this.disableInput = false;

		this.rightPressed = false;
		this.leftPressed = false;
		this.upPressed = false;
		this.downPressed = false;

		this.initMinionBtn();
		this.initStartBtn();
		this.initResetBtn();
	}

	initMinionBtn() {
		const minionBtn = document.querySelector('#minion-btn');
		minionBtn.addEventListener('click', () => {
			const body = document.querySelector('body');
			body.classList.toggle('minion-bg');
		});
	}

	initInput() {
		const inputKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'];
		document.addEventListener('keydown', (e) => {
			if (inputKeys.includes(e.key)) {
				e.preventDefault();
			}

			if (this.disableInput) {
				return;
			}

			if (e.key == 'ArrowRight') {
				this.rightPressed = true;
			} else if (e.key == 'ArrowLeft') {
				this.leftPressed = true;
			} else if (e.key == 'ArrowUp') {
				this.upPressed = true;
			} else if (e.key == 'ArrowDown') {
				this.downPressed = true;
			}
		});
	}

	initPlayer() {
		const playerImg = document.createElement('img');
		playerImg.src = './images/minion.png';
		playerImg.alt = 'player';
		playerImg.title = 'player';
		playerImg.style.opacity = 1;
		playerImg.onload = () => {
			this.ctx.drawImage(
				playerImg,
				this.playerX,
				this.playerY,
				this.playerWidth,
				this.playerHeight
			);
		};

		this.initInput();

		return playerImg;
	}

	drawPlayer() {
		this.ctx.drawImage(
			this.player,
			this.playerX,
			this.playerY,
			this.playerWidth,
			this.playerHeight
		);
	}

	createCar(goingLeft, x, y) {
		const carImg = document.createElement('img');
		let src = './images/car_right.png';
		let alt = 'car going right';
		if (goingLeft) {
			src = './images/car_left.png';
			alt = 'car going left';
		}
		carImg.src = src;
		carImg.alt = alt;
		carImg.title = alt;

		carImg.onload = () => {
			this.ctx.drawImage(carImg, x, y, this.carWidth, this.carHeight);
		};

		return carImg;
	}

	initCars() {
		const cars = [];

		for (let i = 0; i < this.lanes.length; i++) {
			const speed = this.lanes[i].speed;
			const numCars = this.lanes[i].numCars;
			const apart = this.lanes[i].apart;
			const y = this.lanes[i].y;

			let x = -100;
			const goingLeft = speed < 0;
			if (goingLeft) {
				x = 100;
			}

			cars.push([]);
			for (let j = 0; j < numCars; j++) {
				const carImg = this.createCar(goingLeft, x, y);
				cars[cars.length - 1].push({ carImg, x, y });
				x += apart;
			}
		}

		return cars;
	}

	drawCars() {
		for (let i = 0; i < this.cars.length; i++) {
			for (let j = 0; j < this.cars[i].length; j++) {
				const carImg = this.cars[i][j].carImg;
				const x = this.cars[i][j].x;
				const y = this.cars[i][j].y;
				this.ctx.drawImage(carImg, x, y, this.carWidth, this.carHeight);
			}
		}
	}

	resetPlayer() {
		this.playerX = this.canvas.width / 2 - 15;
		this.playerY = this.canvas.height - 30;
		this.player.style.opacity = 1;
		this.reachedGoal = false;
	}

	incrementScore() {
		this.score++;
		this.resetPlayer();
	}

	movePlayer() {
		if (this.rightPressed) {
			const rightEdge = this.canvas.width - this.playerWidth;
			this.playerX = Math.min(rightEdge, this.playerX + 30);
		} else if (this.leftPressed) {
			this.playerX = Math.max(0, this.playerX - 30);
		} else if (this.upPressed) {
			this.playerY = Math.max(0, this.playerY - 30);
		} else if (this.downPressed) {
			const topEdge = this.canvas.height - this.playerHeight;
			this.playerY = Math.min(topEdge, this.playerY + 30);
		}

		if (this.reachedGoal) {
			return;
		}

		if (this.playerY <= 30) {
			this.reachedGoal = true;
			setTimeout(() => {
				this.incrementScore();
			}, 250);
		}
	}

	moveCars() {
		for (let i = 0; i < this.cars.length; i++) {
			const speed = this.lanes[i].speed;
			for (let j = 0; j < this.cars[i].length; j++) {
				let x = this.cars[i][j].x;
				if (speed < 0) {
					x += speed;
					if (x < -100) {
						x = this.canvas.width + 100;
					}
				} else if (speed > 0) {
					x += speed;
					if (x > this.canvas.width + 100) {
						x = -100;
					}
				}
				this.cars[i][j].x = x;
			}
		}
	}

	stop() {
		clearInterval(this.intervalId);
		this.intervalId = null;
	}

	loseLife() {
		this.numLives--;
		if (this.numLives <= 0) {
			this.stop();
			return true;
		}

		this.disableInput = true;
		setTimeout(() => {
			this.disableInput = false;
		}, 1000);

		return false;
	}

	collisionDetection() {
		const playerLeftEdgeX = this.playerX + 6;
		const playerRightEdgeX = this.playerX + this.playerWidth - 6;
		const playerEdgeY = this.playerY + this.playerHeight / 2;

		for (let i = 0; i < this.cars.length; i++) {
			for (let j = 0; j < this.cars[i].length; j++) {
				const car = this.cars[i][j];
				const carLeftEdgeX = car.x + 10;
				const carRightEdgeX = car.x + this.carWidth - 10;

				if (
					playerEdgeY <= car.y + this.carHeight &&
					playerEdgeY >= car.y
				) {
					if (
						(playerLeftEdgeX >= carLeftEdgeX &&
							playerLeftEdgeX <= carRightEdgeX) ||
						(playerRightEdgeX >= carLeftEdgeX &&
							playerRightEdgeX <= carRightEdgeX)
					) {
						const playerLost = this.loseLife();
						if (!playerLost) {
							this.resetPlayer();
						}
					}
				}
			}
		}
	}

	resetInput() {
		this.rightPressed = false;
		this.leftPressed = false;
		this.upPressed = false;
		this.downPressed = false;
	}

	updateStats() {
		const lives = document.querySelector('#lives');
		lives.textContent = `Lives: ${this.numLives}`;

		const score = document.querySelector('#score');
		score.textContent = `Score: ${this.score}`;
	}

	drawRoad() {
		// Default road
		this.ctx.fillStyle = 'gray';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw lane markings
		this.ctx.fillStyle = 'yellow';
		for (let x = 0; x < this.canvas.width; x += 40) {
			for (let y = 90; y < this.canvas.height; y += 30) {
				if (y === 330) {
					// Skip drawing under the safe lane
					continue;
				}

				this.ctx.fillRect(x, y, 20, 2);
			}
		}

		// Starting lane
		this.ctx.fillStyle = 'lightgreen';
		this.ctx.fillRect(
			0,
			this.canvas.height - this.playerHeight,
			this.canvas.width,
			this.playerHeight
		);

		// // Safe lane
		this.ctx.fillStyle = 'lightgray';
		this.ctx.fillRect(0, 300, this.canvas.width, this.playerHeight);

		// // Goal lanes
		this.ctx.fillStyle = 'lightgreen';
		this.ctx.fillRect(0, 0, this.canvas.width, this.playerHeight * 2);
	}

	draw() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawRoad();
		this.movePlayer();
		this.moveCars();
		this.resetInput();
		this.collisionDetection();

		this.drawPlayer();
		this.drawCars();
		this.updateStats();
	}

	start() {
		if (this.numLives <= 0 || this.intervalId !== null) {
			return;
		}

		// 30 FPS
		this.intervalId = setInterval(() => {
			this.draw();
		}, 33);
	}

	reset() {
		this.stop();
		this.resetPlayer();
		this.resetInput();
		this.numLives = 3;
		this.score = 0;
		this.disableInput = false;
		this.cars = this.initCars();
		this.drawRoad();
		this.drawPlayer();
	}

	initStartBtn() {
		const startBtn = document.querySelector('#start-btn');
		startBtn.addEventListener('click', () => {
			this.start();
		});
	}

	initResetBtn() {
		const resetBtn = document.querySelector('#reset-btn');
		resetBtn.addEventListener('click', () => {
			this.reset();
		});
	}
}

const c = new Canvas();
c.draw();
