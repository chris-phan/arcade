// Sudoku library: https://github.com/robatron/sudoku.js MIT License

'use strict';

(function (root) {
	let sudoku = (root.sudoku = {}); // Global reference to the sudoku library

	sudoku.DIGITS = '123456789'; // Allowed sudoku.DIGITS
	const ROWS = 'ABCDEFGHI'; // Row lables
	const COLS = sudoku.DIGITS; // Column lables
	let SQUARES = null; // Square IDs

	let UNITS = null; // All units (row, column, or box)
	let SQUARE_UNITS_MAP = null; // Squares -> units map
	let SQUARE_PEERS_MAP = null; // Squares -> peers map

	const MIN_GIVENS = 17; // Minimum number of givens
	const NR_SQUARES = 81; // Number of squares

	// Define difficulties by how many squares are given to the player in a new
	// puzzle.
	const DIFFICULTY = {
		easy: 62,
		medium: 53,
		hard: 44,
		'very-hard': 35,
		insane: 26,
		inhuman: 17,
	};

	// Blank character and board representation
	sudoku.BLANK_CHAR = '.';
	sudoku.BLANK_BOARD =
		'....................................................' +
		'.............................';

	// Init
	// -------------------------------------------------------------------------
	function initialize() {
		/* Initialize the Sudoku library (invoked after library load)
		 */
		SQUARES = sudoku._cross(ROWS, COLS);
		UNITS = sudoku._get_all_units(ROWS, COLS);
		SQUARE_UNITS_MAP = sudoku._get_square_units_map(SQUARES, UNITS);
		SQUARE_PEERS_MAP = sudoku._get_square_peers_map(
			SQUARES,
			SQUARE_UNITS_MAP
		);
	}

	// Generate
	// -------------------------------------------------------------------------
	sudoku.generate = function (difficulty, unique) {
		/* Generate a new Sudoku puzzle of a particular `difficulty`, e.g.,
        
            // Generate an "easy" sudoku puzzle
            sudoku.generate("easy");
            
        
        Difficulties are as follows, and represent the number of given squares:
        
                "easy":         61
                "medium":       52
                "hard":         43
                "very-hard":    34
                "insane":       25
                "inhuman":      17
            
            
        You may also enter a custom number of squares to be given, e.g.,
        
            // Generate a new Sudoku puzzle with 60 given squares
            sudoku.generate(60)
    
    
        `difficulty` must be a number between 17 and 81 inclusive. If it's
        outside of that range, `difficulty` will be set to the closest bound,
        e.g., 0 -> 17, and 100 -> 81.
        
        
        By default, the puzzles are unique, unless you set `unique` to false. 
        (Note: Puzzle uniqueness is not yet implemented, so puzzles are *not* 
        guaranteed to have unique solutions)
        
        TODO: Implement puzzle uniqueness
        */

		// If `difficulty` is a string or undefined, convert it to a number or
		// default it to "easy" if undefined.
		if (
			typeof difficulty === 'string' ||
			typeof difficulty === 'undefined'
		) {
			difficulty = DIFFICULTY[difficulty] || DIFFICULTY.easy;
		}

		// Force difficulty between 17 and 81 inclusive
		difficulty = sudoku._force_range(
			difficulty,
			NR_SQUARES + 1,
			MIN_GIVENS
		);

		// Default unique to true
		unique = true;

		// Get a set of squares and all possible candidates for each square
		let blank_board = '';
		for (let i = 0; i < NR_SQUARES; ++i) {
			blank_board += '.';
		}
		let candidates = sudoku._get_candidates_map(blank_board);

		// For each item in a shuffled list of squares
		let shuffled_squares = sudoku._shuffle(SQUARES);
		for (let si in shuffled_squares) {
			let square = shuffled_squares[si];

			// If an assignment of a random chioce causes a contradiction, give
			// up and try again
			let rand_candidate_idx = sudoku._rand_range(
				candidates[square].length
			);
			let rand_candidate = candidates[square][rand_candidate_idx];
			if (!sudoku._assign(candidates, square, rand_candidate)) {
				break;
			}

			// Make a list of all single candidates
			let single_candidates = [];
			for (let si in SQUARES) {
				let square = SQUARES[si];

				if (candidates[square].length == 1) {
					single_candidates.push(candidates[square]);
				}
			}

			// If we have at least difficulty, and the unique candidate count is
			// at least 8, return the puzzle!
			if (
				single_candidates.length >= difficulty &&
				sudoku._strip_dups(single_candidates).length >= 8
			) {
				let board = '';
				let givens_idxs = [];
				for (let i in SQUARES) {
					let square = SQUARES[i];
					if (candidates[square].length == 1) {
						board += candidates[square];
						givens_idxs.push(i);
					} else {
						board += sudoku.BLANK_CHAR;
					}
				}

				// If we have more than `difficulty` givens, remove some random
				// givens until we're down to exactly `difficulty`
				let nr_givens = givens_idxs.length;
				if (nr_givens > difficulty) {
					givens_idxs = sudoku._shuffle(givens_idxs);
					for (let i = 0; i < nr_givens - difficulty; ++i) {
						let target = parseInt(givens_idxs[i]);
						board =
							board.substring(0, target) +
							sudoku.BLANK_CHAR +
							board.substring(target + 1);
					}
				}

				// Double check board is solvable
				// TODO: Make a standalone board checker. Solve is expensive.
				if (sudoku.solve(board)) {
					return board;
				}
			}
		}

		// Give up and try a new puzzle
		return sudoku.generate(difficulty);
	};

	// Solve
	// -------------------------------------------------------------------------
	sudoku.solve = function (board, reverse) {
		/* Solve a sudoku puzzle given a sudoku `board`, i.e., an 81-character 
        string of sudoku.DIGITS, 1-9, and spaces identified by '.', representing the
        squares. There must be a minimum of 17 givens. If the given board has no
        solutions, return false.
        
        Optionally set `reverse` to solve "backwards", i.e., rotate through the
        possibilities in reverse. Useful for checking if there is more than one
        solution.
        */

		// Assure a valid board
		let report = sudoku.validate_board(board);
		if (report !== true) {
			throw report;
		}

		// Check number of givens is at least MIN_GIVENS
		let nr_givens = 0;
		for (let i in board) {
			if (
				board[i] !== sudoku.BLANK_CHAR &&
				sudoku._in(board[i], sudoku.DIGITS)
			) {
				++nr_givens;
			}
		}
		if (nr_givens < MIN_GIVENS) {
			throw 'Too few givens. Minimum givens is ' + MIN_GIVENS;
		}

		// Default reverse to false
		reverse = reverse || false;

		let candidates = sudoku._get_candidates_map(board);
		let result = sudoku._search(candidates, reverse);

		if (result) {
			let solution = '';
			for (let square in result) {
				solution += result[square];
			}
			return solution;
		}
		return false;
	};

	sudoku.get_candidates = function (board) {
		/* Return all possible candidatees for each square as a grid of 
        candidates, returnning `false` if a contradiction is encountered.
        
        Really just a wrapper for sudoku._get_candidates_map for programmer
        consumption.
        */

		// Assure a valid board
		let report = sudoku.validate_board(board);
		if (report !== true) {
			throw report;
		}

		// Get a candidates map
		let candidates_map = sudoku._get_candidates_map(board);

		// If there's an error, return false
		if (!candidates_map) {
			return false;
		}

		// Transform candidates map into grid
		let rows = [];
		let cur_row = [];
		let i = 0;
		for (let square in candidates_map) {
			let candidates = candidates_map[square];
			cur_row.push(candidates);
			if (i % 9 == 8) {
				rows.push(cur_row);
				cur_row = [];
			}
			++i;
		}
		return rows;
	};

	sudoku._get_candidates_map = function (board) {
		/* Get all possible candidates for each square as a map in the form
        {square: sudoku.DIGITS} using recursive constraint propagation. Return `false` 
        if a contradiction is encountered
        */

		// Assure a valid board
		let report = sudoku.validate_board(board);
		if (report !== true) {
			throw report;
		}

		let candidate_map = {};
		let squares_values_map = sudoku._get_square_vals_map(board);

		// Start by assigning every digit as a candidate to every square
		for (let si in SQUARES) {
			candidate_map[SQUARES[si]] = sudoku.DIGITS;
		}

		// For each non-blank square, assign its value in the candidate map and
		// propigate.
		for (let square in squares_values_map) {
			let val = squares_values_map[square];

			if (sudoku._in(val, sudoku.DIGITS)) {
				let new_candidates = sudoku._assign(candidate_map, square, val);

				// Fail if we can't assign val to square
				if (!new_candidates) {
					return false;
				}
			}
		}

		return candidate_map;
	};

	sudoku._search = function (candidates, reverse) {
		/* Given a map of squares -> candiates, using depth-first search, 
        recursively try all possible values until a solution is found, or false
        if no solution exists. 
        */

		// Return if error in previous iteration
		if (!candidates) {
			return false;
		}

		// Default reverse to false
		reverse = reverse || false;

		// If only one candidate for every square, we've a solved puzzle!
		// Return the candidates map.
		let max_nr_candidates = 0;
		let max_candidates_square = null;
		for (let si in SQUARES) {
			let square = SQUARES[si];

			let nr_candidates = candidates[square].length;

			if (nr_candidates > max_nr_candidates) {
				max_nr_candidates = nr_candidates;
				max_candidates_square = square;
			}
		}
		if (max_nr_candidates === 1) {
			return candidates;
		}

		// Choose the blank square with the fewest possibilities > 1
		let min_nr_candidates = 10;
		let min_candidates_square = null;
		for (const si in SQUARES) {
			let square = SQUARES[si];

			let nr_candidates = candidates[square].length;

			if (nr_candidates < min_nr_candidates && nr_candidates > 1) {
				min_nr_candidates = nr_candidates;
				min_candidates_square = square;
			}
		}

		// Recursively search through each of the candidates of the square
		// starting with the one with fewest candidates.

		// Rotate through the candidates forwards
		let min_candidates = candidates[min_candidates_square];
		if (!reverse) {
			for (let vi in min_candidates) {
				let val = min_candidates[vi];

				// TODO: Implement a non-rediculous deep copy function
				let candidates_copy = JSON.parse(JSON.stringify(candidates));
				let candidates_next = sudoku._search(
					sudoku._assign(candidates_copy, min_candidates_square, val)
				);

				if (candidates_next) {
					return candidates_next;
				}
			}

			// Rotate through the candidates backwards
		} else {
			for (let vi = min_candidates.length - 1; vi >= 0; --vi) {
				let val = min_candidates[vi];

				// TODO: Implement a non-rediculous deep copy function
				let candidates_copy = JSON.parse(JSON.stringify(candidates));
				let candidates_next = sudoku._search(
					sudoku._assign(candidates_copy, min_candidates_square, val),
					reverse
				);

				if (candidates_next) {
					return candidates_next;
				}
			}
		}

		// If we get through all combinations of the square with the fewest
		// candidates without finding an answer, there isn't one. Return false.
		return false;
	};

	sudoku._assign = function (candidates, square, val) {
		/* Eliminate all values, *except* for `val`, from `candidates` at 
        `square` (candidates[square]), and propagate. Return the candidates map
        when finished. If a contradiciton is found, return false.
        
        WARNING: This will modify the contents of `candidates` directly.
        */

		// Grab a list of canidates without 'val'
		let other_vals = candidates[square].replace(val, '');

		// Loop through all other values and eliminate them from the candidates
		// at the current square, and propagate. If at any point we get a
		// contradiction, return false.
		for (let ovi in other_vals) {
			let other_val = other_vals[ovi];

			let candidates_next = sudoku._eliminate(
				candidates,
				square,
				other_val
			);

			if (!candidates_next) {
				return false;
			}
		}

		return candidates;
	};

	sudoku._eliminate = function (candidates, square, val) {
		/* Eliminate `val` from `candidates` at `square`, (candidates[square]),
        and propagate when values or places <= 2. Return updated candidates,
        unless a contradiction is detected, in which case, return false.
        
        WARNING: This will modify the contents of `candidates` directly.
        */

		// If `val` has already been eliminated from candidates[square], return
		// with candidates.
		if (!sudoku._in(val, candidates[square])) {
			return candidates;
		}

		// Remove `val` from candidates[square]
		candidates[square] = candidates[square].replace(val, '');

		// If the square has only candidate left, eliminate that value from its
		// peers
		let nr_candidates = candidates[square].length;
		if (nr_candidates === 1) {
			let target_val = candidates[square];

			for (let pi in SQUARE_PEERS_MAP[square]) {
				let peer = SQUARE_PEERS_MAP[square][pi];

				let candidates_new = sudoku._eliminate(
					candidates,
					peer,
					target_val
				);

				if (!candidates_new) {
					return false;
				}
			}

			// Otherwise, if the square has no candidates, we have a contradiction.
			// Return false.
		}
		if (nr_candidates === 0) {
			return false;
		}

		// If a unit is reduced to only one place for a value, then assign it
		for (let ui in SQUARE_UNITS_MAP[square]) {
			let unit = SQUARE_UNITS_MAP[square][ui];

			let val_places = [];
			for (let si in unit) {
				let unit_square = unit[si];
				if (sudoku._in(val, candidates[unit_square])) {
					val_places.push(unit_square);
				}
			}

			// If there's no place for this value, we have a contradition!
			// return false
			if (val_places.length === 0) {
				return false;

				// Otherwise the value can only be in one place. Assign it there.
			} else if (val_places.length === 1) {
				let candidates_new = sudoku._assign(
					candidates,
					val_places[0],
					val
				);

				if (!candidates_new) {
					return false;
				}
			}
		}

		return candidates;
	};

	// Square relationships
	// -------------------------------------------------------------------------
	// Squares, and their relationships with values, units, and peers.

	sudoku._get_square_vals_map = function (board) {
		/* Return a map of squares -> values
		 */
		let squares_vals_map = {};

		// Make sure `board` is a string of length 81
		if (board.length != SQUARES.length) {
			throw 'Board/squares length mismatch.';
		} else {
			for (let i in SQUARES) {
				squares_vals_map[SQUARES[i]] = board[i];
			}
		}

		return squares_vals_map;
	};

	sudoku._get_square_units_map = function (squares, units) {
		/* Return a map of `squares` and their associated units (row, col, box)
		 */
		let square_unit_map = {};

		// For every square...
		for (let si in squares) {
			let cur_square = squares[si];

			// Maintain a list of the current square's units
			let cur_square_units = [];

			// Look through the units, and see if the current square is in it,
			// and if so, add it to the list of of the square's units.
			for (let ui in units) {
				let cur_unit = units[ui];

				if (cur_unit.indexOf(cur_square) !== -1) {
					cur_square_units.push(cur_unit);
				}
			}

			// Save the current square and its units to the map
			square_unit_map[cur_square] = cur_square_units;
		}

		return square_unit_map;
	};

	sudoku._get_square_peers_map = function (squares, units_map) {
		/* Return a map of `squares` and their associated peers, i.e., a set of
        other squares in the square's unit.
        */
		let square_peers_map = {};

		// For every square...
		for (let si in squares) {
			let cur_square = squares[si];
			let cur_square_units = units_map[cur_square];

			// Maintain list of the current square's peers
			let cur_square_peers = [];

			// Look through the current square's units map...
			for (let sui in cur_square_units) {
				let cur_unit = cur_square_units[sui];

				for (let ui in cur_unit) {
					let cur_unit_square = cur_unit[ui];

					if (
						cur_square_peers.indexOf(cur_unit_square) === -1 &&
						cur_unit_square !== cur_square
					) {
						cur_square_peers.push(cur_unit_square);
					}
				}
			}

			// Save the current square an its associated peers to the map
			square_peers_map[cur_square] = cur_square_peers;
		}

		return square_peers_map;
	};

	sudoku._get_all_units = function (rows, cols) {
		/* Return a list of all units (rows, cols, boxes)
		 */
		let units = [];

		// Rows
		for (let ri in rows) {
			units.push(sudoku._cross(rows[ri], cols));
		}

		// Columns
		for (let ci in cols) {
			units.push(sudoku._cross(rows, cols[ci]));
		}

		// Boxes
		let row_squares = ['ABC', 'DEF', 'GHI'];
		let col_squares = ['123', '456', '789'];
		for (let rsi in row_squares) {
			for (let csi in col_squares) {
				units.push(sudoku._cross(row_squares[rsi], col_squares[csi]));
			}
		}

		return units;
	};

	// Conversions
	// -------------------------------------------------------------------------
	sudoku.board_string_to_grid = function (board_string) {
		/* Convert a board string to a two-dimensional array
		 */
		let rows = [];
		let cur_row = [];
		for (let i in board_string) {
			cur_row.push(board_string[i]);
			if (i % 9 == 8) {
				rows.push(cur_row);
				cur_row = [];
			}
		}
		return rows;
	};

	sudoku.board_grid_to_string = function (board_grid) {
		/* Convert a board grid to a string
		 */
		let board_string = '';
		for (let r = 0; r < 9; ++r) {
			for (let c = 0; c < 9; ++c) {
				board_string += board_grid[r][c];
			}
		}
		return board_string;
	};

	// Utility
	// -------------------------------------------------------------------------
	sudoku.validate_board = function (board) {
		/* Return if the given `board` is valid or not. If it's valid, return
        true. If it's not, return a string of the reason why it's not.
        */

		// Check for empty board
		if (!board) {
			return 'Empty board';
		}

		// Invalid board length
		if (board.length !== NR_SQUARES) {
			return (
				'Invalid board size. Board must be exactly ' +
				NR_SQUARES +
				' squares.'
			);
		}

		// Check for invalid characters
		for (let i in board) {
			if (
				!sudoku._in(board[i], sudoku.DIGITS) &&
				board[i] !== sudoku.BLANK_CHAR
			) {
				return (
					'Invalid board character encountered at index ' +
					i +
					': ' +
					board[i]
				);
			}
		}

		// Otherwise, we're good. Return true.
		return true;
	};

	sudoku._cross = function (a, b) {
		/* Cross product of all elements in `a` and `b`, e.g.,
        sudoku._cross("abc", "123") ->
        ["a1", "a2", "a3", "b1", "b2", "b3", "c1", "c2", "c3"]
        */
		let result = [];
		for (let ai in a) {
			for (let bi in b) {
				result.push(a[ai] + b[bi]);
			}
		}
		return result;
	};

	sudoku._in = function (v, seq) {
		/* Return if a value `v` is in sequence `seq`.
		 */
		return seq.indexOf(v) !== -1;
	};

	sudoku._shuffle = function (seq) {
		/* Return a shuffled version of `seq`
		 */

		// Create an array of the same size as `seq` filled with false
		let shuffled = [];
		for (let i = 0; i < seq.length; ++i) {
			shuffled.push(false);
		}

		for (let i in seq) {
			let ti = sudoku._rand_range(seq.length);

			while (shuffled[ti]) {
				ti = ti + 1 > seq.length - 1 ? 0 : ti + 1;
			}

			shuffled[ti] = seq[i];
		}

		return shuffled;
	};

	sudoku._rand_range = function (max, min) {
		/* Get a random integer in the range of `min` to `max` (non inclusive).
        If `min` not defined, default to 0. If `max` not defined, throw an 
        error.
        */
		min = min || 0;
		if (max) {
			return Math.floor(Math.random() * (max - min)) + min;
		} else {
			throw 'Range undefined';
		}
	};

	sudoku._strip_dups = function (seq) {
		/* Strip duplicate values from `seq`
		 */
		let seq_set = [];
		let dup_map = {};
		for (let i in seq) {
			let e = seq[i];
			if (!dup_map[e]) {
				seq_set.push(e);
				dup_map[e] = true;
			}
		}
		return seq_set;
	};

	sudoku._force_range = function (nr, max, min) {
		/* Force `nr` to be within the range from `min` to, but not including, 
        `max`. `min` is optional, and will default to 0. If `nr` is undefined,
        treat it as zero.
        */
		min = min || 0;
		nr = nr || 0;
		if (nr < min) {
			return min;
		}
		if (nr > max) {
			return max;
		}
		return nr;
	};

	// Initialize library after load
	initialize();

	// Pass whatever the root object is, like 'window' in browsers
})(this);

// Wrapper around the sudoku library
class SudokuGame {
	constructor(difficulty) {
		this.NUM_ROWS = 9;
		this.NUM_COLS = 9;
		this.difficulty = difficulty;

		this.boardString = null;
		this.board = null;
		this.generateBoard(difficulty);
	}

	generateBoard(difficulty) {
		this.boardString = sudoku.generate(difficulty);
		this.board = sudoku.board_string_to_grid(this.boardString);
	}

	move(row, col, moveChoice) {
		// Don't do anything if the board cell is already filled
		if (this.board[row][col] !== sudoku.BLANK_CHAR) {
			return true;
		}

		const candidates = sudoku.get_candidates(this.boardString);
		const possibleCandidates = candidates[row][col];
		if (possibleCandidates.indexOf(moveChoice) !== -1) {
			this.board[row][col] = moveChoice;
			this.boardString = sudoku.board_grid_to_string(this.board);
			return true;
		}

		return false;
	}

	win() {
		for (let i = 0; i < this.NUM_ROWS; i++) {
			for (let j = 0; j < this.NUM_COLS; j++) {
				if (this.board[i][j] === sudoku.BLANK_CHAR) {
					return false;
				}
			}
		}

		return true;
	}
}

class HTMLControl {
	constructor() {
		this.difficulty = 'easy';
		this.game = new SudokuGame(this.difficulty);
		this.selectedMove = '1';
		this.lives = 5;

		this.init();
	}

	init() {
		this.initDifficultyBtns();
		this.initBoard();
		this.initMoveBtns();
		this.initResetBtn();
		this.initMinionBtn();
	}

	initMinionBtn() {
		const minionBtn = document.querySelector('#minion-btn');
		minionBtn.addEventListener('click', () => {
			const body = document.querySelector('body');
			body.classList.toggle('minion-bg');
		});
	}

	initDifficultyBtns() {
		const diffBtns = document.querySelectorAll('.difficulty-btn');
		diffBtns.forEach((btn) => {
			const difficulty = btn.getAttribute('data-difficulty');
			btn.addEventListener('click', () => {
				this.difficulty = difficulty;

				// Highlighting
				const prevDifficulty = document.querySelector(
					'.difficulty-btn.highlighted'
				);
				prevDifficulty.classList.remove('highlighted');

				this.difficulty = btn.getAttribute('data-difficulty');
				btn.classList.add('highlighted');

				this.reset();
			});
		});
	}

	initBoard() {
		const boardElement = document.querySelector('#sudoku-board');

		for (let i = 0; i < this.game.NUM_ROWS; i++) {
			for (let j = 0; j < this.game.NUM_COLS; j++) {
				const sudokuCell = document.createElement('button');
				sudokuCell.setAttribute('data-row', String(i));
				sudokuCell.setAttribute('data-col', String(j));
				sudokuCell.classList.add('board-cell');

				if ((j + 1) % 3 === 0 && j + 1 !== 9) {
					sudokuCell.classList.add('bold-right-border');
				}
				if ((j + 1) % 3 === 1 && j + 1 !== 1) {
					sudokuCell.classList.add('bold-left-border');
				}
				if ((i + 1) % 3 === 0 && i + 1 !== 9) {
					sudokuCell.classList.add('bold-bottom-border');
				}
				if ((i + 1) % 3 === 1 && i + 1 !== 1) {
					sudokuCell.classList.add('bold-top-border');
				}

				sudokuCell.addEventListener('click', () => {
					const validMove = this.game.move(i, j, this.selectedMove);
					if (!validMove) {
						this.lives--;
					}
					if (this.lives <= 0) {
						this.lose();
					}

					this.display();

					if (this.game.win()) {
						this.win();
					}
				});

				boardElement.appendChild(sudokuCell);
			}
		}
	}

	initMoveBtns() {
		const moveBtns = document.querySelectorAll('.move-btn');
		moveBtns.forEach((btn) => {
			btn.addEventListener('click', () => {
				const prevMove = document.querySelector(
					'.move-btn.highlighted'
				);
				prevMove.classList.remove('highlighted');

				this.selectedMove = btn.getAttribute('data-move');
				btn.classList.add('highlighted');
			});
		});
	}

	initResetBtn() {
		const resetBtn = document.querySelector('#reset-btn');
		resetBtn.addEventListener('click', () => {
			this.reset();
		});
	}

	display() {
		const sudokuCells = document.querySelectorAll('.board-cell');
		sudokuCells.forEach((cell) => {
			const r = Number(cell.getAttribute('data-row'));
			const c = Number(cell.getAttribute('data-col'));
			const curNum = this.game.board[r][c];
			if (curNum !== sudoku.BLANK_CHAR) {
				cell.textContent = Number(curNum);
			} else {
				cell.textContent = '';
			}
		});

		const lives = document.querySelector('#lives');
		lives.textContent = `Lives: ${this.lives}`;
	}

	lose() {
		const result = document.querySelector('#result');
		result.textContent = 'You ran out of lives!';

		const moveBtns = document.querySelectorAll('.board-cell');
		moveBtns.forEach((btn) => {
			btn.disabled = true;
		});
	}

	win() {
		const result = document.querySelector('#result');
		result.textContent = 'You win!';

		const moveBtns = document.querySelectorAll('.board-cell');
		moveBtns.forEach((btn) => {
			btn.disabled = true;
		});
	}

	reset() {
		this.game = new SudokuGame(this.difficulty);

		const result = document.querySelector('#result');
		result.textContent = '';

		this.lives = 5;
		const moveBtns = document.querySelectorAll('.board-cell');
		moveBtns.forEach((btn) => {
			btn.disabled = false;
		});

		this.display();
	}
}

const h = new HTMLControl();
h.display();
