'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// threejs
const THREE = require('three');
window.THREE = window.THREE || THREE;

const {obj, fn} = require('iblokz-data');
const {perlin3} = require('../../util/perlin.js');

const inBetween = (a, b, percentage) => {
	let pointA = new THREE.Vector3().copy(a);
	let pointB = new THREE.Vector3().copy(b);
	var dir = pointB.clone().sub(pointA);
	var len = dir.length();
	console.log(a, b, len);
	dir = dir.normalize().multiplyScalar(len * percentage);
	return pointA.clone().add(dir);
};

const moveTo = (a, b, step) => {
	let pointA = new THREE.Vector3().copy(a);
	let pointB = new THREE.Vector3().copy(b);
	if (step >= pointB.clone().sub(pointA).length) return pointB.clone();
	var dir = pointB.clone().sub(pointA).normalize().multiplyScalar(step);
	console.log(a, b, dir, step);
	return pointA.clone().add(dir);
};

const calcOrigin = gridSize => (-4 - (gridSize / 2 - 1) * 8);

const create = (scene, pos, cell, gridSize = 8) => {
	let origin = calcOrigin(gridSize);
	console.log('creating', pos, cell);
	let sphereGeometry = new THREE.SphereGeometry(8, 32, 32);
	const alpha = 0.3; // cell.side === 0 ? 0 : 1;
	const beta = 0.3;
	const gamma = 1;
	let specularColor = new THREE.Color(beta * 0.2, beta * 0.2, beta * 0.2);
	let specularShininess = Math.pow(2, alpha * 10);
	let diffuseColor = new THREE.Color().setHSL(alpha,
		0,
		cell.side === 0 ? 0.1 : 0.7
		// gamma * 0.5 + 0.1).multiplyScalar(1 - beta * 0.2
	);
	let material = new THREE.MeshToonMaterial({
		color: diffuseColor,
		specular: specularColor,
		reflectivity: beta,
		shininess: specularShininess
	});
	// let material = new THREE.MeshNormalMaterial();
	let virus = new THREE.Mesh(sphereGeometry, material);
	virus.position.y = 4;
	if (cell.status === 'new') {
		virus.position.x = origin + cell.origin.x * 8;
		virus.position.z = origin + cell.origin.y * 8;
	} else {
		virus.position.x = origin + pos.x * 8;
		virus.position.z = origin + pos.y * 8;
	}
	// virus.castShadow = true;
	// virus.receiveShadow = true;
	scene.add(virus);
	return virus;
};

const update = (virus, pos, cell, gridSize = 8) => {
	let origin = calcOrigin(gridSize);
	if (cell.status === 'new') {
		console.log(virus.position);
		virus.position.copy(inBetween({
			y: 4,
			x: origin + cell.origin.x * 8,
			z: origin + cell.origin.y * 8
		}, {
			y: 4,
			x: origin + pos.x * 8,
			z: origin + pos.y * 8
		}, cell.frame / 15));
	} else {
		virus.position.copy({
			y: 4,
			x: origin + pos.x * 8,
			z: origin + pos.y * 8
		});
	}
	return virus;
};

const remove = (virus, scene) => {
	scene.remove(virus);
	// virus.dispose();
	return {};
};

const traverse = (mtrx, cb) => mtrx.map((row, y) =>
	row.map((cell, x) => cb({x, y}, cell))
);

const init = ({state, scene}) => {
	let viruses = traverse(state.game.grid,
		(pos, cell) => cell.side !== undefined ? create(scene, pos, cell, state.game.grid.length) : cell
	);
	return viruses;
};

const refresh = ({state, scene, viruses}) => {
	// remove unneeded
	viruses = traverse(viruses, fn.pipe(
		(pos, virus) => virus instanceof THREE.Mesh
			&& state.game.grid[pos.y][pos.x].side !== undefined
				? virus
				: remove(virus, scene)
	));
	// reset stuff
	viruses = traverse(state.game.grid, fn.pipe(
		(pos, cell) => (viruses[pos.y] && viruses[pos.y][pos.x])
			? {pos, virus: viruses[pos.y][pos.x]}
			: {pos, virus: {}},
		({pos, virus}) => virus instanceof THREE.Mesh
			? state.game.grid[pos.y][pos.x].side === undefined
				? remove(virus, scene)
				: update(virus, pos, state.game.grid[pos.y][pos.x], state.game.grid.length)
			: state.game.grid[pos.y][pos.x].side !== undefined
				? create(scene, pos, state.game.grid[pos.y][pos.x], state.game.grid.length)
				: virus
	));
	return viruses;
};

const render = ({state, scene, viruses}) => {
	viruses = traverse(viruses,
		(pos, virus) => {
			const cell = state.game.grid[pos.y][pos.x];
			if (virus instanceof THREE.Mesh) {
				var time = performance.now() * (0.0014 + cell.speed);
				var k = 5;
				const levelMod = cell.level * 0.2 + ((cell.status === 'grow')
					? cell.frame * 0.0125 - ((cell.frame + 1) % 2) * 0.005
					: 0);
				for (var i = 0; i < virus.geometry.vertices.length; i++) {
					var p = virus.geometry.vertices[i];

					// p.normalize().multiplyScalar(1 + 0.3 * perlin3(p.x * k, p.y * k, p.z * k));
					p.normalize().multiplyScalar(1 + levelMod + 0.8 *
						perlin3(p.x * k + time * (cell.direction === 1 ? 1 : -1), p.y * k, p.z * k));
				}
				virus.geometry.computeVertexNormals();
				virus.geometry.normalsNeedUpdate = true;
				virus.geometry.verticesNeedUpdate = true; // must be set or vertices will not update
			}
			return virus;
		});
	return viruses;
};

module.exports = {
	init,
	refresh,
	render
};
