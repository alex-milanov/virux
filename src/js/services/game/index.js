'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const {fn, obj} = require('iblokz-data');
const time = require('../../util/time.js');

// initial
const initial = {
	sides: [0, 1],
	side: 0,
	grid: [
		[{
			side: 0,
			level: 1,
			status: 'idle',
			frame: 0
		}, {}, {}, {}, {}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {}, {
			side: 1,
			level: 1,
			status: 'idle',
			frame: 0
		}]
	]
};

// let area = [
// 	[false, false, false],
// 	[false, {
// 		side: 1,
// 		level: 1,
// 		status: 'idle',
// 		frame: 0
// 	}, {}],
// 	[false, {}, {}]
// ];

const actions = {
	initial
};

const traverse = (mtrx, cb) => mtrx.map((row, y) =>
	row.map((cell, x) => cb({x, y}, cell))
);

const filter = (mtrx, f) => {
	let arr = [];
	traverse(mtrx, (pos, cell) => f(pos, cell) ? arr.push({pos, cell}) : false);
	return arr;
};

const random = arr => arr[Math.floor(Math.random() * arr.length)];

const getArea = (grid, pos, radius = 1) => fn.pipe(
	() => new Array(radius * 2 + 1).fill(new Array(radius * 2 + 1).fill({})),
	area => traverse(area, ({x, y}) =>
		grid[pos.y - radius + y] && grid[pos.y - radius + y][pos.x - radius + x] || false)
)();

const maxLevel = 8;

const updateStatus = (cell, pos, area, targets) => {
	let status = 'idle';
	let target = false;
	let level = cell.level;
	let frame = 0;
	let emptyCells = filter(area, (p, c) => c !== false && c.side === undefined
		&& !targets.find(({pos}) => pos.x === p.x && pos.y === p.y)
	);
	let enemyCells = filter(area, (p, c) => c && c.side !== undefined && c.side !== cell.side
		&& !targets.find(({pos}) => pos.x === p.x && pos.y === p.y)
	);
	// console.log(area, emptyCells, enemyCells, targets);
	switch (cell.status) {
		case 'grow':
			level++;
			break;
		case 'idle':
			// if odd grow
			if ((cell.level % 2) === 1) {
				status = 'grow';
			} else {
				if (emptyCells.length > 0) {
					status = 'split';
					level = cell.level / 2;
					target = random(emptyCells).pos;
					target.x += pos.x - (area.length - 1) / 2;
					target.y += pos.y - (area.length - 1) / 2;
				} else {
					status = 'idle';
				}
			}
			break;
		default:
			// status = 'idle';
			break;
	}
	return {
		side: cell.side,
		status,
		level,
		target,
		frame
	};
};

// const loop = grid => {
//
// }

// function loop(grid, side) {
// 	for (y = 0; y < grid.length; y++) {
// 		for (x = 0; x < grid[y].length; x++) {
// 			if (grid[y][x].side !== undefined) {
// 				let cell = grid[y][x];
// 				updateStatus(grid[y][x], extractMatrix(grid, x, y))
// 			}
// 		}
// 	}
// 	return {grid, side: side === 0 ? 1 : 0}
// }

const loop = state => {
	const {grid, sides, side} = state.game;
	let targets = [];
	let newGrid = traverse(grid, (pos, cell) => {
		if (cell.side !== undefined && cell.side === side) {
			let newCell = updateStatus(cell, pos, getArea(grid, pos), targets);
			// console.log(cell, newCell);
			if (newCell.target) targets.push({pos: newCell.target, cell: newCell});
			return newCell;
		}
		return cell;
	});
	// process targets
	targets.forEach(({pos, cell}) => {
		if (cell.status === 'split') {
			newGrid[pos.y][pos.x] = Object.assign({}, cell);
		}
	});

	return {grid: newGrid, side: side === 0 ? 1 : 0, sides};
};

let unhook = () => {};
let hook = ({state$, actions}) => {
	let subs = [];

	subs.push(
		time.frame()
			.filter((dt, i) => i % 32 === 0)
			.withLatestFrom(
				state$,
				(dt, state) => state
			)
			.map(loop)
			.subscribe(game => actions.set('game', game))
	);

	unhook = () => {
		console.log(subs);

		subs.forEach(sub => sub.dispose ? sub.dispose() : sub());
	};
};

module.exports = {
	actions,
	hook,
	unhook: () => unhook()
};
