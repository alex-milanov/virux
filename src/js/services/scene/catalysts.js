'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// threejs
const THREE = require('three');
window.THREE = window.THREE || THREE;

const {obj, fn} = require('iblokz-data');
const {perlin3} = require('../../util/three/perlin.js');
const gridUtil = require('../../util/three/grid.js');
const svg2mesh = require('../../util/three/svg2mesh');

const loadMesh = url => svg2mesh.convert(url)
	.map(geometry => {
		let specularColor = new THREE.Color(0.8, 0.8, 0.8);
		let specularShininess = Math.pow(2, 1);
		let diffuseColor = new THREE.Color().setHSL(1,
			0,
			0.7
			// gamma * 0.5 + 0.1).multiplyScalar(1 - beta * 0.2
		);
		let material = new THREE.MeshToonMaterial({
			color: diffuseColor,
			specular: specularColor,
			reflectivity: 8,
			shininess: specularShininess,
			side: THREE.DoubleSide
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, 0.5, 0);
		mesh.scale.set(3.5, 3.5, 3.5);
		mesh.rotateX(Math.PI / 2);
		return mesh;
	});

const create = (scene, pos, cell, gridSize = 8, catalystMeshes) => {
	let origin = gridUtil.calcOrigin(gridSize) + 4;
	console.log(cell, catalystMeshes);
	let catalyst = obj.switch(cell.kind, catalystMeshes).clone();
	catalyst.position.y = 0.5;
	catalyst.position.x = origin + pos.x * 8;
	catalyst.position.z = origin + pos.y * 8;
	scene.add(catalyst);
};
const update = (catalyst, pos) => catalyst;
const remove = (catalyst, scene) => {
	scene.remove(catalyst);
	// virus.dispose();
	return {};
};

const refresh = ({state, scene, catalysts = [], catalystMeshes}) => {
	// remove garbage catalysts
	catalysts = gridUtil.traverse(catalysts, fn.pipe(
		(pos, catalyst) => catalyst instanceof THREE.Mesh
			&& state.game.grid[pos.y] && state.game.grid[pos.y][pos.x] && state.game.grid[pos.y][pos.x].type === 'catalyst'
				? catalyst
				: remove(catalyst, scene)
	));
	// reset stuff
	catalysts = gridUtil.traverse(state.game.grid, fn.pipe(
		(pos, cell) => (catalysts[pos.y] && catalysts[pos.y][pos.x])
			? {pos, catalyst: catalysts[pos.y][pos.x]}
			: {pos, catalyst: {}},
		({pos, catalyst}) => catalysts instanceof THREE.Mesh
			? state.game.grid[pos.y][pos.x].type === undefined
				? remove(catalyst, scene)
				: update(catalyst, pos, state.game.grid[pos.y][pos.x], state.game.grid.length, catalystMeshes)
			: state.game.grid[pos.y][pos.x].type === 'catalyst'
				? create(scene, pos, state.game.grid[pos.y][pos.x], state.game.grid.length, catalystMeshes)
				: catalyst
	));
	return catalysts;
};
const render = ({state, scene, catalysts}) => {};

module.exports = {
	loadMesh,
	refresh,
	render
};
