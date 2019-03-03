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
	playing: false,
	grid: [
		[{
			side: 0,
			level: 1,
			status: 'idle',
			frame: 0,
			speed: 0.0001,
			direction: 1
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
			frame: 0,
			speed: 0.0002,
			direction: 1
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

const reset = () => state => obj.patch(state, ['game', 'grid'], fn.pipe(
	() => (new Array(state.gameSettings.gridSize)
		.fill({}).map(() => new Array(state.gameSettings.gridSize).fill({}))),
	grid => {
		grid[0][0] = {
			side: 0,
			level: 1,
			status: 'idle',
			frame: 0,
			speed: 0.0001,
			direction: 1
		};
		grid[state.gameSettings.gridSize - 1][state.gameSettings.gridSize - 1] = {
			side: 1,
			level: 1,
			status: 'idle',
			frame: 0,
			speed: 0.0001,
			direction: 1
		};
		console.log(grid);
		return grid;
	}
)());

const actions = {
	initial,
	reset
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
const frameCount = 16;

const updateStatus = (cell, pos, area, targets) => {
	let status = cell.status;
	let target = false;
	let level = cell.level;
	let frame = cell.frame;
	let emptyCells = filter(area, (p, c) => c !== false && c.side === undefined
		&& !targets.find(({pos}) => pos.x === p.x && pos.y === p.y)
	);
	let enemyCells = filter(area, (p, c) => c && c.side !== undefined && c.side !== cell.side
		&& !targets.find(({pos}) => pos.x === p.x && pos.y === p.y)
	);
	// console.log(area, emptyCells, enemyCells, targets);
	switch (cell.status) {
		case 'grow':
			if (frame === frameCount - 1 && level < maxLevel) level++;
			break;
		case 'idle':
			// if odd grow
			if (level < maxLevel) {
				if ((cell.level % 2) === 1 || emptyCells.length === 0 || Math.floor(Math.random() * 10) > 6) {
					status = 'grow';
				} else {
					status = 'split';
					level = cell.level / 2;
					target = random(emptyCells).pos;
					target.x += pos.x - (area.length - 1) / 2;
					target.y += pos.y - (area.length - 1) / 2;
				}
			}
			break;
		default:
			// status = 'idle';
			break;
	}
	return Object.assign({}, cell, {
		status: (frame === frameCount - 1) ? 'idle' : status,
		level,
		target,
		frame: status !== 'idle' && frame < (frameCount - 1) ? frame + 1 : 0
	});
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

const loop = ({state}) => {
	const {grid, sides, side} = state.game;
	let targets = [];
	let newGrid = traverse(grid, (pos, cell) => {
		if (cell.side !== undefined && cell.side === side) {
			let newCell = updateStatus(cell, pos, getArea(grid, pos), targets);
			// console.log(cell, newCell);
			if (newCell.target) targets.push({pos: newCell.target, cell: newCell, origin: pos});
			return newCell;
		}
		return cell;
	});
	// process targets
	targets.forEach(({pos, cell, origin}) => {
		if (cell.status === 'split') {
			newGrid[pos.y][pos.x] = Object.assign({}, cell, {
				status: 'new',
				origin,
				speed: Math.floor((Math.random() * 7) + 1) * 0.0001,
				direction: Math.floor(Math.random() * 2)
			});
		}
	});

	return {grid: newGrid, side: side === 0 ? 1 : 0, sides};
};

let unhook = () => {};
let hook = ({state$, actions}) => {
	let subs = [];

	subs.push(
		time.frame()
			.withLatestFrom(
				state$,
				(dt, state) => ({dt, state})
			)
			.filter(({state}) => state.game.playing)
			.filter(({dt, state}, i) => i % (state.gameSettings.speed < 8 ? 8 - state.gameSettings.speed : 2) === 0)
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
