'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const {fn, obj} = require('iblokz-data');
const time = require('../../util/time.js');
const gridUtil = require('../../util/three/grid.js');

// initial
const initial = {
	sides: [0, 1],
	side: 0,
	playing: false,
	catalyst: false,
	grid: [
		[{
			type: 'virus',
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
			type: 'virus',
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

const random = arr => arr[Math.floor(Math.random() * arr.length)];

const basicCell = {
	type: 'virus',
	side: 0,
	level: 1,
	status: 'idle',
	frame: 0,
	speed: 0.0001,
	direction: 1
};

const gridSet = (grid, pos, val) => {
	grid[pos.y][pos.x] = val;
	return grid;
};

const toggleCatalyst = (pos, kind) => state => fn.pipe(
	() => state.game.grid[pos.y][pos.x],
	cell => obj.patch(state, ['game', 'grid'], gridSet(state.game.grid, pos,
		(!cell.type)
			? {type: 'catalyst', kind}
			: cell.type === 'catalyst'
				? cell.kind === kind
					? {}
					: {type: 'catalyst', kind}
				: cell
	))
)();

const fillGrid = (data, grid, center, radius = 1) => {
	let emptyCells = gridUtil.filter(grid, (pos, cell) =>
		(pos.x >= center - radius && pos.x <= center + radius)
		&& (pos.y >= center - radius && pos.y <= center + radius)
		&& cell && !cell.side);
	console.log(emptyCells);
	let fp = random(emptyCells).pos;
	grid[fp.y][fp.x] = data;
};

const reset = () => state => obj.patch(state, ['game', 'grid'], fn.pipe(
	() => gridUtil.generate(state.gameSettings.gridSize),
	grid => {
		let maxRange = state.gameSettings.gridSize - 1;
		if (state.gameSettings.scatter) {
			// scattered cells
			let {scatterRadius, startingCells} = state.gameSettings;
			let whiteCells = new Array(startingCells).fill({}).map(() => Object.assign({}, basicCell, {
				side: 0
			}));
			let blackCells = new Array(startingCells).fill({}).map(() => Object.assign({}, basicCell, {
				side: 1
			}));
			// fill the grid in area
			whiteCells.forEach(cell => fillGrid(cell, grid, scatterRadius, scatterRadius));
			blackCells.forEach(cell => fillGrid(cell, grid, maxRange - scatterRadius, scatterRadius));
		} else {
			// default case
			grid[0][0] = Object.assign({}, basicCell, {
				side: 0
			});
			grid[maxRange][maxRange] = Object.assign({}, basicCell, {
				side: 1
			});
		}

		console.log(grid);
		return grid;
	}
)());

const actions = {
	initial,
	reset,
	toggleCatalyst
};

const maxLevel = 8;
const defaultFrameCount = 16;

const updateStatus = (cell, pos, area, targets) => {
	let {status, level, frame} = cell;
	let target = false;
	let emptyCells = gridUtil.filter(area, (p, c) => c !== false && c.type === undefined
		&& !targets.find(({pos}) => pos.x === p.x && pos.y === p.y)
	);
	let enemyCells = gridUtil.filter(area, (p, c) => c && c.type === 'virus' && c.side !== cell.side
		&& !targets.find(({pos}) => pos.x === p.x && pos.y === p.y)
	);
	let catalysts = gridUtil.filter(area, (p, c) => c && c.type === 'catalyst');
	// frameCount
	let frameCount = defaultFrameCount;
	// grow
	if (catalysts.find(({cell}) => cell.kind === 'grow') && status === 'grow') {
		frameCount = defaultFrameCount / 2;
	} else if (catalysts.find(({cell}) => cell.kind === 'split') && status === 'split') {
		frameCount = defaultFrameCount / 2;
	}
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
	let newGrid = gridUtil.traverse(grid, (pos, cell) => {
		if (cell.side !== undefined && cell.side === side) {
			let newCell = updateStatus(cell, pos, gridUtil.getArea(grid, pos), targets);
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
