'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// threejs
const THREE = require('three');
window.THREE = window.THREE || THREE;

const {obj, fn} = require('iblokz-data');
const {perlin3} = require('../../util/perlin.js');

const create = (scene, pos, cell) => {
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
	virus.position.x = (-4 - 3 * 8) + pos.x * 8;
	virus.position.z = (-4 - 3 * 8) + pos.y * 8;
	// virus.castShadow = true;
	// virus.receiveShadow = true;
	scene.add(virus);
	return virus;
};

const update = (virus, pos, cell) => {
	return virus;
};

const traverse = (mtrx, cb) => mtrx.map((row, y) =>
	row.map((cell, x) => cb({x, y}, cell))
);

const init = ({state, scene}) => {
	let viruses = traverse(state.game.grid,
		(pos, cell) => cell.side !== undefined ? create(scene, pos, cell) : cell
	);
	return viruses;
};

const refresh = ({state, scene, viruses}) => {
	viruses = traverse(viruses, fn.pipe(
		(pos, virus) => virus instanceof THREE.Mesh
			? update(virus, pos, state.game.grid[pos.y][pos.x])
			: state.game.grid[pos.y][pos.x].side !== undefined
				? create(scene, pos, state.game.grid[pos.y][pos.x])
				: virus
	));
	return viruses;
};

const render = ({state, scene, viruses}) => {
	viruses = traverse(viruses,
		(pos, virus) => {
			const cell = state.game.grid[pos.y][pos.x];
			if (virus instanceof THREE.Mesh) {
				var time = performance.now() * 0.0014;
				var k = 3;
				for (var i = 0; i < virus.geometry.vertices.length; i++) {
					var p = virus.geometry.vertices[i];

					// p.normalize().multiplyScalar(1 + 0.3 * perlin3(p.x * k, p.y * k, p.z * k));
					p.normalize().multiplyScalar(2 + cell.level * 0.4 + 0.8 * perlin3(p.x * k + time, p.y * k, p.z * k));
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
