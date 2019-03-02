'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// threejs
const THREE = require('three');
window.THREE = window.THREE || THREE;

const {obj, fn} = require('iblokz-data');

const init = ({scene, state}) => {
	let texture = new THREE.TextureLoader().load('assets/textures/floor_tile.jpg');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(2, 2);
	texture.offset.set(0.005, 0.07);

	let material = new THREE.MeshPhongMaterial({
		map: texture,
		// bumpMap: textureNormal,
		// bumpScale: 0.7,
		reflectivity: 0,
		shininess: 0
	});
	let grid = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), material);
	grid.rotation.x = -Math.PI / 2;
	grid.position.y = 0;
	grid.receiveShadow = true;
	scene.add(grid);
	return grid;
};

module.exports = {
	init
};
