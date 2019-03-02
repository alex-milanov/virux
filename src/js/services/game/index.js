'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// initial
const initial = {
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
		[{}, {}, {}, {}, {
			side: 1,
			level: 1,
			status: 'idle',
			frame: 0
		}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {}, {}],
		[{}, {}, {}, {}, {}, {}, {
			side: 0,
			level: 1,
			status: 'idle',
			frame: 0
		}, {
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
// 	[false, {
// 		side: 0,
// 		level: 1,
// 		status: 'idle',
// 		frame: 0
// 	}]
// ];

const actions = {
	initial
};

const extractArea = (grid, pos) => {};

const updateStatus = (cell, area) => {
	let newCell = cell;
	newCell.status = 'atacking';
	return newCell;
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

let unhook = () => {};
let hook = ({state$, actions}) => {
	let subs = [];

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
