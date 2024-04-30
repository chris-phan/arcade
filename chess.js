'use strict';

// Constants
const NUM_ROWS = 8;
const NUM_COLS = 8;
const EMPTY = 0;
const PAWN = 1;
const ROOK = 2;
const KNIGHT = 3;
const BISHOP = 4;
const QUEEN = 5;
const KING = 6;

// Ranks (i.e. rows in chess)
const RANK1 = 7;
const RANK2 = 6;
const RANK3 = 5;
const RANK4 = 4;
const RANK5 = 3;
const RANK6 = 2;
const RANK7 = 1;
const RANK8 = 0;

// Files (i.e. columns in chess)
const AFILE = 0;
const BFILE = 1;
const CFILE = 2;
const DFILE = 3;
const EFILE = 4;
const FFILE = 5;
const GFILE = 6;
const HFILE = 7;

// matrix is a 2D array and target is a 1D array
// Returns true if target is a row in matrix
function hasArray(matrix, target) {
	for (let i = 0; i < matrix.length; i++) {
		let idx = 0;
		let found = true;

		for (let j = 0; j < matrix[i].length; j++) {
			if (target.length != matrix[i].length) {
				break;
			}

			if (target[idx] != matrix[i][j]) {
				found = false;
				break;
			}

			idx++;
		}

		if (found) {
			return true;
		}
	}

	return false;
}

function isValidBoardIndex(row, col) {
	return row >= 0 && row < NUM_ROWS && col >= 0 && col < NUM_COLS;
}

function canMove(r, c, board, isWhite) {
	if (!isValidBoardIndex(r, c)) {
		return false;
	}

	if (board[r][c] === EMPTY) {
		return true;
	}

	// If moving piece and blocking piece are the same color,
	// the moving piece can't move there.
	// If the colors are different, the moving piece can
	// move there and capture the blocking piece.
	return board[r][c].isWhite !== isWhite;
}

function getVerticalMoves(curR, curC, board, isWhite) {
	const moves = [];

	// Check up
	for (let r = curR - 1; r >= 0; r--) {
		if (!canMove(r, curC, board, isWhite)) {
			break;
		}
		moves.push([r, curC]);

		if (board[r][curC] !== EMPTY) {
			break;
		}
	}

	// Check down
	for (let r = curR + 1; r < NUM_ROWS; r++) {
		if (!canMove(r, curC, board, isWhite)) {
			break;
		}
		moves.push([r, curC]);

		if (board[r][curC] !== EMPTY) {
			break;
		}
	}

	return moves;
}

function getHorizMoves(curR, curC, board, isWhite) {
	const moves = [];

	// Check left
	for (let c = curC - 1; c >= 0; c--) {
		if (!canMove(curR, c, board, isWhite)) {
			break;
		}
		moves.push([curR, c]);

		if (board[curR][c] !== EMPTY) {
			break;
		}
	}

	// Check right
	for (let c = curC + 1; c < NUM_COLS; c++) {
		if (!canMove(curR, c, board, isWhite)) {
			break;
		}
		moves.push([curR, c]);

		if (board[curR][c] !== EMPTY) {
			break;
		}
	}

	return moves;
}

// Positive (slope) diagonal: /
function getPosDiagonalMoves(curR, curC, board, isWhite) {
	const moves = [];

	// Check towards top right
	let r = curR - 1;
	let c = curC + 1;
	while (isValidBoardIndex(r, c)) {
		if (canMove(r, c, board, isWhite)) {
			moves.push([r, c]);

			if (board[r][c] !== EMPTY) {
				break;
			}

			r--;
			c++;
		} else {
			break;
		}
	}

	// Check towards bottom left
	r = curR + 1;
	c = curC - 1;
	while (isValidBoardIndex(r, c)) {
		if (canMove(r, c, board, isWhite)) {
			moves.push([r, c]);

			if (board[r][c] !== EMPTY) {
				break;
			}

			r++;
			c--;
		} else {
			break;
		}
	}

	return moves;
}

// Negative (slope) diagonal: \
function getNegDiagonalMoves(curR, curC, board, isWhite) {
	const moves = [];

	// Check towards top left
	let r = curR - 1;
	let c = curC - 1;
	while (isValidBoardIndex(r, c)) {
		if (canMove(r, c, board, isWhite)) {
			moves.push([r, c]);

			if (board[r][c] !== EMPTY) {
				break;
			}

			r--;
			c--;
		} else {
			break;
		}
	}

	// Check towards bottom right
	r = curR + 1;
	c = curC + 1;
	while (isValidBoardIndex(r, c)) {
		if (canMove(r, c, board, isWhite)) {
			moves.push([r, c]);

			if (board[r][c] !== EMPTY) {
				break;
			}

			r++;
			c++;
		} else {
			break;
		}
	}

	return moves;
}

class Pawn {
	constructor(isWhite) {
		this.isWhite = isWhite;
		this.enPassant = null;
		this.enPassantCapture = null;
		this.typ = PAWN;
	}

	getValidMoves(curR, curC, board) {
		const moves = [];

		// Vertical motion
		if (this.isWhite) {
			if (canMove(curR - 1, curC, board, this.isWhite)) {
				const piece = board[curR - 1][curC];
				if (piece === EMPTY) {
					moves.push([curR - 1, curC]);
				}
			}

			if (curR === RANK2) {
				// White pawns can also move 2 spaces up if on starting rank
				const piece = board[curR - 2][curC];
				if (piece === EMPTY) {
					moves.push([curR - 2, curC]);
				}
			}
		} else {
			if (canMove(curR + 1, curC, board, this.isWhite)) {
				const piece = board[curR + 1][curC];
				if (piece === EMPTY) {
					moves.push([curR + 1, curC]);
				}
			}

			if (curR === RANK7) {
				// Black pawns can also move 2 spaces down if on starting rank
				const piece = board[curR + 2][curC];
				if (piece === EMPTY) {
					moves.push([curR + 2, curC]);
				}
			}
		}

		// Capturing
		if (this.isWhite) {
			// White: if there's a piece to the top left or top right of the pawn
			// the white pawn can move there and capture the piece
			if (canMove(curR - 1, curC - 1, board, this.isWhite)) {
				const piece = board[curR - 1][curC - 1];
				if (piece !== EMPTY && piece.isWhite !== this.isWhite) {
					moves.push([curR - 1, curC - 1]);
				}
			}
			if (canMove(curR - 1, curC + 1, board, this.isWhite)) {
				const piece = board[curR - 1][curC + 1];
				if (piece !== EMPTY && piece.isWhite !== this.isWhite) {
					moves.push([curR - 1, curC + 1]);
				}
			}
		} else {
			// Black: if there's a piece to the bottom left or bottom right of the pawn
			// the black pawn can move there and capture the piece
			if (canMove(curR + 1, curC - 1, board, this.isWhite)) {
				const piece = board[curR + 1][curC - 1];
				if (piece !== EMPTY && piece.isWhite !== this.isWhite) {
					moves.push([curR + 1, curC - 1]);
				}
			}
			if (canMove(curR + 1, curC + 1, board, this.isWhite)) {
				const piece = board[curR + 1][curC + 1];
				if (piece !== EMPTY && piece.isWhite !== this.isWhite) {
					moves.push([curR + 1, curC + 1]);
				}
			}
		}

		// En passant
		if (this.enPassant !== null) {
			moves.push(this.enPassant);
		}

		return moves;
	}

	move(curR, curC, newR, newC, board) {
		const moves = this.getValidMoves(curR, curC, board);
		if (hasArray(moves, [newR, newC])) {
			return true;
		}

		return false;
	}

	toString() {
		return 'pawn';
	}
}

class Rook {
	constructor(isWhite) {
		this.isWhite = isWhite;
		this.hasMoved = false;
		this.typ = ROOK;
	}

	getValidMoves(curR, curC, board) {
		// Rooks move in a straight line
		const verticalMoves = getVerticalMoves(curR, curC, board, this.isWhite);
		const horizMoves = getHorizMoves(curR, curC, board, this.isWhite);

		return verticalMoves.concat(horizMoves);
	}

	move(curR, curC, newR, newC, board) {
		const moves = this.getValidMoves(curR, curC, board);
		if (hasArray(moves, [newR, newC])) {
			return true;
		}

		return false;
	}

	toString() {
		return 'rook';
	}
}

class Knight {
	constructor(isWhite) {
		this.isWhite = isWhite;
		this.typ = KNIGHT;
	}

	getValidMoves(curR, curC, board) {
		// Knights move in an L shape
		const possibleMoves = [
			[curR - 1, curC - 2],
			[curR - 2, curC - 1],
			[curR - 1, curC + 2],
			[curR - 2, curC + 1],
			[curR + 1, curC + 2],
			[curR + 2, curC + 1],
			[curR + 1, curC - 2],
			[curR + 2, curC - 1],
		];

		const moves = [];
		for (let i = 0; i < possibleMoves.length; i++) {
			const r = possibleMoves[i][0];
			const c = possibleMoves[i][1];
			if (canMove(r, c, board, this.isWhite)) {
				moves.push([r, c]);
			}
		}

		return moves;
	}

	move(curR, curC, newR, newC, board) {
		const moves = this.getValidMoves(curR, curC, board);
		if (hasArray(moves, [newR, newC])) {
			return true;
		}

		return false;
	}

	toString() {
		return 'knight';
	}
}

class Bishop {
	constructor(isWhite) {
		this.isWhite = isWhite;
		this.typ = BISHOP;
	}

	getValidMoves(curR, curC, board) {
		// Bishops move diagonally
		const posDiag = getPosDiagonalMoves(curR, curC, board, this.isWhite);
		const negDiag = getNegDiagonalMoves(curR, curC, board, this.isWhite);

		return posDiag.concat(negDiag);
	}

	move(curR, curC, newR, newC, board) {
		const moves = this.getValidMoves(curR, curC, board);
		if (hasArray(moves, [newR, newC])) {
			return true;
		}

		return false;
	}

	toString() {
		return 'bishop';
	}
}

class Queen {
	constructor(isWhite) {
		this.isWhite = isWhite;
		this.typ = QUEEN;
	}

	getValidMoves(curR, curC, board) {
		// Queens move in a striaght line or diagonally
		const verticalMoves = getVerticalMoves(curR, curC, board, this.isWhite);
		const horizMoves = getHorizMoves(curR, curC, board, this.isWhite);

		const posDiag = getPosDiagonalMoves(curR, curC, board, this.isWhite);
		const negDiag = getNegDiagonalMoves(curR, curC, board, this.isWhite);

		const straight = verticalMoves.concat(horizMoves);
		const diag = posDiag.concat(negDiag);

		return straight.concat(diag);
	}

	move(curR, curC, newR, newC, board) {
		const moves = this.getValidMoves(curR, curC, board);
		if (hasArray(moves, [newR, newC])) {
			return true;
		}

		return false;
	}

	toString() {
		return 'queen';
	}
}

class King {
	constructor(isWhite) {
		this.isWhite = isWhite;
		this.hasMoved = false;
		this.typ = KING;
		this.canCastleLeft = false;
		this.canCastleRight = false;
	}

	getValidMoves(curR, curC, board) {
		const moves = [];

		// Common short hand to get adjacent tiles
		const d = [-1, 0, 1];

		for (let i = 0; i < d.length; i++) {
			for (let j = 0; j < d.length; j++) {
				if (d[i] == 0 && d[j] == 0) {
					continue;
				}

				const r = curR + d[i];
				const c = curC + d[j];

				if (canMove(r, c, board, this.isWhite)) {
					moves.push([r, c]);
				}
			}
		}

		if (this.canCastleLeft) {
			moves.push([curR, CFILE]);
		}
		if (this.canCastleRight) {
			moves.push([curR, GFILE]);
		}

		return moves;
	}

	move(curR, curC, newR, newC, board) {
		const moves = this.getValidMoves(curR, curC, board);
		if (hasArray(moves, [newR, newC])) {
			return true;
		}

		return false;
	}

	toString() {
		return 'king';
	}
}

class Board {
	constructor() {
		this.board = this.initBoard();
		this.isWhiteTurn = true;
	}

	getPieceRow(isWhite) {
		return [
			new Rook(isWhite),
			new Knight(isWhite),
			new Bishop(isWhite),
			new Queen(isWhite),
			new King(isWhite),
			new Bishop(isWhite),
			new Knight(isWhite),
			new Rook(isWhite),
		];
	}

	getPawnRow(isWhite) {
		const pawnRow = [];
		for (let i = 0; i < NUM_COLS; i++) {
			pawnRow.push(new Pawn(isWhite));
		}

		return pawnRow;
	}

	getEmptyRow() {
		const emptyRow = [];
		for (let i = 0; i < NUM_COLS; i++) {
			emptyRow.push(EMPTY);
		}

		return emptyRow;
	}

	initBoard() {
		return [
			this.getPieceRow(false),
			this.getPawnRow(false),
			this.getEmptyRow(),
			this.getEmptyRow(),
			this.getEmptyRow(),
			this.getEmptyRow(),
			this.getPawnRow(true),
			this.getPieceRow(true),
		];
	}

	updateEnPassant(piece, newR, newC) {
		// Reset all pawn's en passant
		for (let i = 0; i < NUM_ROWS; i++) {
			for (let j = 0; j < NUM_COLS; j++) {
				const piece = this.board[i][j];
				if (piece !== EMPTY && piece.typ == PAWN) {
					piece.enPassant = null;
					piece.enPassantCapture = null;
				}
			}
		}

		// Compute en passant
		const adjPieces = [];
		if (isValidBoardIndex(newR, newC - 1)) {
			if (this.board[newR][newC - 1] !== EMPTY) {
				adjPieces.push(this.board[newR][newC - 1]);
			}
		}
		if (isValidBoardIndex(newR, newC + 1)) {
			if (this.board[newR][newC + 1] !== EMPTY) {
				adjPieces.push(this.board[newR][newC + 1]);
			}
		}

		for (let i = 0; i < adjPieces.length; i++) {
			const adjPiece = adjPieces[i];
			if (adjPiece.typ === PAWN && adjPiece.isWhite !== piece.isWhite) {
				if (piece.isWhite) {
					adjPiece.enPassant = [newR + 1, newC];
					adjPiece.enPassantCapture = [newR, newC];
				} else {
					adjPiece.enPassant = [newR - 1, newC];
					adjPiece.enPassantCapture = [newR, newC];
				}
			}
		}
	}

	setPromotion(e) {
		const [color, pieceType] = e.target.title.split(' ');
		let isWhite = false;
		if (color === 'white') {
			isWhite = true;
		}
		const newR = Number(e.target.getAttribute('data-newR'));
		const newC = Number(e.target.getAttribute('data-newC'));

		let piece;
		switch (pieceType) {
			case 'rook':
				piece = new Rook(isWhite);
				break;
			case 'knight':
				piece = new Knight(isWhite);
				break;
			case 'bishop':
				piece = new Bishop(isWhite);
				break;
			case 'queen':
				piece = new Queen(isWhite);
				break;
			default:
				piece = new Queen(isWhite);
				break;
		}

		const dialog = document.querySelector('#promotion');
		dialog.close();
		this.board[newR][newC] = piece;

		const gameBoard = document.querySelector('#board');
		gameBoard.dispatchEvent(new CustomEvent('update'));
	}

	handlePromotion(isWhite, newR, newC) {
		// Get the user's input
		const dialog = document.querySelector('#promotion');
		dialog.innerHTML = '';

		const promoPieces = ['queen', 'rook', 'bishop', 'knight'];
		let color = 'black';
		if (isWhite) {
			color = 'white';
		}
		for (let i = 0; i < promoPieces.length; i++) {
			const pieceImg = document.createElement('img');
			pieceImg.src = `./images/${promoPieces[i]}_${color}.svg`;
			pieceImg.alt = `${color} ${promoPieces[i]}`;
			pieceImg.title = `${color} ${promoPieces[i]}`;
			pieceImg.width = 100;
			pieceImg.height = 100;
			pieceImg.setAttribute('data-newR', newR);
			pieceImg.setAttribute('data-newC', newC);
			pieceImg.addEventListener('click', (e) => {
				this.setPromotion(e);
			});
			dialog.appendChild(pieceImg);
		}

		dialog.showModal();
	}

	// Note: we still say that a piece is attacking a square if it's pinned
	isAttacked(r, c, isWhite) {
		// Get opponent's pieces
		const oppPieces = [];
		for (let i = 0; i < NUM_ROWS; i++) {
			for (let j = 0; j < NUM_COLS; j++) {
				const piece = this.board[i][j];
				if (piece !== EMPTY && piece.isWhite !== isWhite) {
					oppPieces.push([piece, i, j]);
				}
			}
		}

		const attackedSquares = [];
		for (let i = 0; i < oppPieces.length; i++) {
			const [piece, pRow, pCol] = oppPieces[i];
			const hitSquares = piece.getValidMoves(pRow, pCol, this.board);

			for (let j = 0; j < hitSquares.length; j++) {
				attackedSquares.push(hitSquares[j]);
			}
		}

		return hasArray(attackedSquares, [r, c]);
	}

	updateCanCastle(isWhite) {
		let canCastleLeft = true;
		let canCastleRight = true;

		let kingRank = RANK1;
		let king = this.board[RANK1][EFILE];
		let rookLeft = this.board[RANK1][AFILE];
		let rookRight = this.board[RANK1][HFILE];
		if (!isWhite) {
			kingRank = RANK8;
			king = this.board[RANK8][EFILE];
			rookLeft = this.board[RANK8][AFILE];
			rookRight = this.board[RANK8][HFILE];
		}
		if (king === EMPTY || king.typ !== KING) {
			return false;
		}
		if (rookLeft === EMPTY || rookLeft.typ !== ROOK) {
			return false;
		}
		if (rookRight === EMPTY || rookRight.typ !== ROOK) {
			return false;
		}

		// 4 rules for castling:
		// Rule 1: king and rook have not moved
		if (king.hasMoved) {
			canCastleLeft = false;
			canCastleRight = false;
			return;
		} else {
			canCastleLeft = !rookLeft.hasMoved;
			canCastleRight = !rookRight.hasMoved;
		}

		// Rule 2: there are no pieces between the king and rook
		for (let i = DFILE; i > AFILE; i--) {
			if (this.board[kingRank][i] !== EMPTY) {
				canCastleLeft = false;
				break;
			}
		}

		for (let i = FFILE; i < HFILE; i++) {
			if (this.board[kingRank][i] !== EMPTY) {
				canCastleRight = false;
				break;
			}
		}

		// Rule 3: king is not in check
		if (this.isAttacked(kingRank, EFILE, isWhite)) {
			canCastleLeft = false;
			canCastleRight = false;
		}

		// Rule 4: Castling doesn't go through or land on an attacked square
		for (let i = DFILE; i > BFILE; i--) {
			if (this.isAttacked(kingRank, i, isWhite)) {
				canCastleLeft = false;
				canCastleRight = false;
			}
		}

		for (let i = FFILE; i < HFILE; i++) {
			if (this.isAttacked(kingRank, i, isWhite)) {
				canCastleLeft = false;
				canCastleRight = false;
			}
		}

		king.canCastleLeft = canCastleLeft;
		king.canCastleRight = canCastleRight;
	}

	getKingPos(isWhite) {
		for (let i = 0; i < NUM_ROWS; i++) {
			for (let j = 0; j < NUM_COLS; j++) {
				const piece = this.board[i][j];
				if (piece !== EMPTY && piece.typ == KING) {
					if (piece.isWhite == isWhite) {
						return [i, j];
					}
				}
			}
		}

		return null;
	}

	copyBoard() {
		const boardCpy = [];
		for (let i = 0; i < NUM_ROWS; i++) {
			boardCpy.push([]);
			for (let j = 0; j < NUM_COLS; j++) {
				const piece = this.board[i][j];
				boardCpy[boardCpy.length - 1].push(piece);
			}
		}

		return boardCpy;
	}

	checkWin(isWhite) {
		const [kingR, kingC] = this.getKingPos(!isWhite);
		const king = this.board[kingR][kingC];

		// Check if opponent king is in check
		if (!this.isAttacked(kingR, kingC, !isWhite)) {
			// Not in check, no win
			return false;
		}

		// Check if opponent king can move to any adjacent square
		const validMoves = king.getValidMoves(kingR, kingC, this.board);
		for (let i = 0; i < validMoves.length; i++) {
			const boardCpy = this.copyBoard();
			// Make the move
			const [newR, newC] = validMoves[i];
			this.board[newR][newC] = king;
			this.board[kingR][kingC] = EMPTY;

			// Move is invalid if it puts your own king in check
			const inCheck = this.isAttacked(newR, newC, !isWhite);

			// Undo the move
			this.board = boardCpy;

			if (!inCheck) {
				// Opponent has a valid king move, no win
				return false;
			}
		}

		// Check if opponent can make any move (not a king move) to get out of check
		const oppPieces = [];
		for (let i = 0; i < NUM_ROWS; i++) {
			for (let j = 0; j < NUM_COLS; j++) {
				const piece = this.board[i][j];
				if (piece !== EMPTY && piece.isWhite !== isWhite) {
					if (piece.typ !== KING) {
						oppPieces.push([piece, i, j]);
					}
				}
			}
		}

		for (let i = 0; i < oppPieces.length; i++) {
			const [piece, r, c] = oppPieces[i];
			const moves = piece.getValidMoves(r, c, this.board);
			for (let j = 0; j < moves.length; j++) {
				const boardCpy = this.copyBoard();

				// Make the move
				const [newR, newC] = moves[j];
				this.board[newR][newC] = piece;
				this.board[r][c] = EMPTY;

				// Move is invalid if it puts your own king in check
				const inCheck = this.isAttacked(kingR, kingC, !isWhite);

				// Undo the move
				this.board = boardCpy;

				if (!inCheck) {
					// Opponent has a valid move, no win
					return false;
				}
			}
		}

		const winner = document.querySelector('#winner');
		let winnerText = 'Black wins!';
		if (isWhite) {
			winnerText = 'White wins!';
		}
		winner.textContent = winnerText;

		return true;
	}

	move(curR, curC, newR, newC) {
		const piece = this.board[curR][curC];

		if (
			!isValidBoardIndex(curR, curC) ||
			!isValidBoardIndex(newR, newC) ||
			piece === EMPTY ||
			piece.isWhite !== this.isWhiteTurn
		) {
			return false;
		}

		const boardCpy = this.copyBoard();
		const validMove = piece.move(curR, curC, newR, newC, this.board);

		if (!validMove) {
			return false;
		}

		// Make the move and verify that it doesn't put your own king in check
		// If so, undo the move
		this.board[newR][newC] = this.board[curR][curC];
		this.board[curR][curC] = EMPTY;

		// Move is invalid if it puts your own king in check
		const [kingRank, kingFile] = this.getKingPos(this.isWhiteTurn);
		const inCheck = this.isAttacked(kingRank, kingFile, this.isWhiteTurn);

		if (inCheck) {
			// Undo the move
			this.board = boardCpy;
			return false;
		}

		// Specific behaviors
		if (piece.typ == PAWN) {
			// Check if move played was an en passant
			if (curC !== newC && boardCpy[newR][newC] === EMPTY) {
				// Diagonal capture on empty square
				if (piece.enPassantCapture !== null) {
					const [capR, capC] = piece.enPassantCapture;
					this.board[capR][capC] = EMPTY;

					// Check that this doesn't put your own king in check
					if (this.isAttacked(kingRank, kingFile, this.isWhiteTurn)) {
						// Undo the move
						this.board = boardCpy;
						return false;
					}
				}
			}

			// Check if can promote
			if (
				(!this.isWhiteTurn && newR === RANK1) ||
				(this.isWhiteTurn && newR === RANK8)
			) {
				this.handlePromotion(this.isWhiteTurn, newR, newC);
			}
		} else if (piece.typ === ROOK || piece.typ === KING) {
			// Handling castling condition
			piece.hasMoved = true;

			// Check if move was castle
			if (piece.typ === KING) {
				if (curC === EFILE && newC === CFILE) {
					// Castle left: move rook from A file to D file
					this.board[curR][DFILE] = this.board[curR][AFILE];
					this.board[curR][AFILE] = EMPTY;
				} else if (curC === EFILE && newC === GFILE) {
					// Castle right: move rook from H file to F file
					this.board[curR][FFILE] = this.board[curR][HFILE];
					this.board[curR][HFILE] = EMPTY;
				}
			}
		}

		// Check if castling is possible
		this.updateCanCastle(!this.isWhiteTurn);
		this.updateCanCastle(this.isWhiteTurn);

		// Check if en passant is possible
		this.updateEnPassant(piece, newR, newC);

		// Check if someone won
		this.checkWin(this.isWhiteTurn);

		this.isWhiteTurn = !this.isWhiteTurn;

		return true;
	}
}

class HTMLControl {
	constructor() {
		this.game = new Board();
		this.selectedSquare = null;
		this.minionMode = false;

		this.initDisplay();
	}

	handleMove(e) {
		e.stopPropagation();
		const square = e.target;
		const newR = Number(square.getAttribute('data-row'));
		const newC = Number(square.getAttribute('data-col'));

		const piece = this.game.board[newR][newC];
		if (this.selectedSquare === null) {
			if (piece !== EMPTY && piece.isWhite === this.game.isWhiteTurn) {
				this.selectedSquare = [newR, newC];

				const selCell = document.querySelector(
					`[data-row="${newR}"][data-col="${newC}"]`
				);

				selCell.classList.add('selected');
			}
			return;
		} else {
			if (piece !== EMPTY && piece.isWhite === this.game.isWhiteTurn) {
				const [selR, selC] = this.selectedSquare;

				const prevSelCell = document.querySelector(
					`[data-row="${selR}"][data-col="${selC}"]`
				);
				prevSelCell.classList.remove('selected');

				this.selectedSquare = [newR, newC];

				const selCell = document.querySelector(
					`[data-row="${newR}"][data-col="${newC}"]`
				);

				selCell.classList.add('selected');
				return;
			}
		}

		const [selR, selC] = this.selectedSquare;
		const validMove = this.game.move(selR, selC, newR, newC);
		if (validMove) {
			const selCell = document.querySelector(
				`[data-row="${selR}"][data-col="${selC}"]`
			);
			selCell.classList.remove('selected');

			this.selectedSquare = null;
		}
		this.displayBoard();
	}

	reset() {
		const winner = document.querySelector('#winner');
		winner.textContent = '';

		this.game = new Board();
		this.prevSquare = null;
		this.displayBoard();
	}

	initDisplay() {
		const winner = document.querySelector('#winner');
		winner.textContent = '';

		const board = document.querySelector('#board');
		board.addEventListener('update', () => {
			this.displayBoard();
		});

		let isLight = true;

		for (let i = 0; i < NUM_ROWS; i++) {
			for (let j = 0; j < NUM_COLS; j++) {
				const boardCell = document.createElement('button');
				boardCell.classList.add('board-cell');
				boardCell.setAttribute('data-row', i);
				boardCell.setAttribute('data-col', j);
				boardCell.addEventListener('click', (e) => {
					this.handleMove(e);
				});

				if (isLight) {
					boardCell.classList.add('light');
				}

				isLight = !isLight;

				board.appendChild(boardCell);
			}

			isLight = !isLight;
		}

		const resetBtn = document.querySelector('#reset');
		resetBtn.addEventListener('click', () => {
			this.reset();
		});

		const minionBtn = document.querySelector('#minion-btn');
		minionBtn.addEventListener('click', () => {
			this.minionMode = !this.minionMode;
			this.displayBoard();

			const body = document.querySelector('body');
			body.classList.toggle('minion-bg');
		});
	}

	displayBoard() {
		for (let i = 0; i < NUM_ROWS; i++) {
			for (let j = 0; j < NUM_COLS; j++) {
				const piece = this.game.board[i][j];

				const boardCell = document.querySelector(
					`[data-row="${i}"][data-col="${j}"]`
				);

				boardCell.innerHTML = '';

				if (piece !== EMPTY) {
					const pieceImg = document.createElement('img');
					let color = 'black';
					if (piece.isWhite) {
						color = 'white';
					}

					if (this.minionMode && piece.toString() === 'pawn') {
						pieceImg.src = `./images/${piece.toString()}_${color}_minion.svg`;
					} else {
						pieceImg.src = `./images/${piece.toString()}_${color}.svg`;
					}
					pieceImg.alt = `${color} ${piece.toString()}`;
					pieceImg.title = `${color} ${piece.toString()}`;
					pieceImg.classList.add('piece-img');

					// Trick that let's you trigger the click event just for
					// the boardCell since the image and cell are layered on top
					// of each other
					pieceImg.addEventListener('click', (e) => {
						e.stopPropagation();
						boardCell.dispatchEvent(new Event('click'));
					});
					boardCell.appendChild(pieceImg);
				}
			}
		}
	}
}

const h = new HTMLControl();
h.displayBoard();
