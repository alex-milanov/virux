'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// threejs
const THREE = require('three');
window.THREE = window.THREE || THREE;
require('three/examples/js/objects/Reflector.js');

const {obj, fn} = require('iblokz-data');

const init = ({scene, state, width, height}) => {
	let texture = new THREE.TextureLoader().load('assets/textures/new_floor.png');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1, 1);
	// texture.offset.set(0.005, 0.07);

	let material = new THREE.MeshPhongMaterial({
		map: texture,
		// bumpMap: textureNormal,
		// bumpScale: 0.7,
		// flatShading: true,
		reflectivity: 0,
		transparent: true,
		opacity: 0.8,
		shininess: 0
	});
	let grid = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), material);
	grid.rotation.x = -Math.PI / 2;
	grid.position.y = 0;
	grid.receiveShadow = true;
	scene.add(grid);
	var mirror = new THREE.Reflector(new THREE.PlaneGeometry(64, 64), {
		clipBias: 0.003,
		textureWidth: width * window.devicePixelRatio,
		textureHeight: height * window.devicePixelRatio,
		color: 0xffffff,
		recursion: 1
	});
	mirror.position.y = -0.001;
	mirror.rotateX(-Math.PI / 2);
	scene.add(mirror);
	return {grid, mirror};
};

const refresh = ({grid, mirror, scene, state}) => {
	// grid.geometry.normalsNeedUpdate = true;
	// grid.geometry.computeFaceNormals();
	// grid.geometry.computeFlatVertexNormals();
	mirror.geometry.normalsNeedUpdate = true;
	mirror.geometry.computeFaceNormals();

	return grid;
};

module.exports = {
	init,
	refresh
};
