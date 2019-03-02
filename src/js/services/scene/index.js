'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// threejs
const THREE = require('three');
window.THREE = window.THREE || THREE;

// const colladaLoader = require('../../util/three/loader/collada.js');

const time = require('../../util/time.js');

const {obj, fn} = require('iblokz-data');

const _camera = require('./camera');

const addGround = scene => {
	let texture = new THREE.TextureLoader().load('assets/textures/floor_tile.jpg');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(4, 4);

	let material = new THREE.MeshPhongMaterial({
		map: texture,
		// bumpMap: textureNormal,
		// bumpScale: 0.7,
		reflectivity: 0,
		shininess: 0
	});
	let plane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material);
	plane.rotation.x = -Math.PI / 2;
	plane.position.y -= 20.5;
	plane.receiveShadow = true;
	scene.add(plane);
	return scene;
};

const init = ({canvas, state}) => {
	let width = canvas.offsetWidth;
	let height = canvas.offsetHeight;

	// let camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
	let camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
	camera.position.z = 100;
	camera.position.y = 50;

	const scene = new THREE.Scene();

	scene.add(new THREE.AmbientLight(0xcccccc, 0.1));
	// scene.add(new THREE.HemisphereLight(0x443333, 0x111122));
	// scene.add(new THREE.PointLight(0xffffff, 0.3));
	let dirLight = new THREE.DirectionalLight(0xffffff, 1);
	dirLight.color.setHSL(0.1, 0, 0.1);
	dirLight.position.set(0.5, 1.5, -1);
	dirLight.position.multiplyScalar(30);
	dirLight.castShadow = true;
	dirLight.shadowCameraVisible = true;
	// var d = 200;
	dirLight.castShadow = true;
	dirLight.shadow.mapSize.width = 1024;
	dirLight.shadow.mapSize.height = 1024;
	var d = 700;
	dirLight.shadow.camera.left = -d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = -d;
	dirLight.shadow.camera.far = 2000;
	dirLight.shadow.bias = -0.001;
	scene.add(dirLight);

	let plane = false;
	addGround(scene);

	let sphereGeometry = new THREE.SphereGeometry(1, 128, 128);
	let material = new THREE.MeshNormalMaterial();
	let sphere = new THREE.Mesh(sphereGeometry, material);
	scene.add(sphere);

	let renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(width, height);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	canvas.innerHTML = '';
	canvas.appendChild(renderer.domElement);

	return {scene, light: dirLight, renderer, camera, canvas: renderer.domElement, sphere};
};

function Grad(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
}

Grad.prototype.dot2 = function(x, y) {
	return this.x * x + this.y * y;
};

Grad.prototype.dot3 = function(x, y, z) {
	return this.x * x + this.y * y + this.z * z;
};

var grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
	new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
	new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];

var p = [151, 160, 137, 91, 90, 15,
	131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
	190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
	88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
	77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
	102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
	135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
	5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
	223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
	129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
	251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
	49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
	138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
const seed = seed => {
	let perm = new Array(512);
	let gradP = new Array(512);
	if (seed > 0 && seed < 1) {
		// Scale the seed out
		seed *= 65536;
	}

	seed = Math.floor(seed);
	if (seed < 256) {
		seed |= seed << 8;
	}

	for (var i = 0; i < 256; i++) {
		var v;
		if (i & 1) {
			v = p[i] ^ (seed & 255);
		} else {
			v = p[i] ^ ((seed >> 8) & 255);
		}

		perm[i] = perm[i + 256] = v;
		gradP[i] = gradP[i + 256] = grad3[v % 12];
	}
	return {gradP, perm};
};

const fade = t => t * t * t * (t * (t * 6 - 15) + 10);

const lerp = (a, b, t) => (1 - t) * a + t * b;

let {gradP, perm} = seed(0);

const perlin3 = (x, y, z) => {
	// Find unit grid cell containing point
	let X = Math.floor(x);
	let Y = Math.floor(y);
	let Z = Math.floor(z);
	// Get relative xyz coordinates of point within that cell
	x -= X;
	y -= Y;
	z -= Z;
	// Wrap the integer cells at 255 (smaller integer period can be introduced here)
	X &= 255;
	Y &= 255;
	Z &= 255;

	// Calculate noise contributions from each of the eight corners
	var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
	var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
	var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
	var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
	var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
	var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
	var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
	var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);

	// Compute the fade curve value for x, y, z
	var u = fade(x);
	var v = fade(y);
	var w = fade(z);

	// Interpolate
	return lerp(
		lerp(
			lerp(n000, n100, u),
			lerp(n001, n101, u), w),
		lerp(
			lerp(n010, n110, u),
			lerp(n011, n111, u), w),
	v);
};

const render = ({sphere, scene, camera, renderer, state, character, mixer, acts, guards}) => {
	// console.log(items);
	if (sphere) {
		// items[0].rotation.z += 0.01;
		// plane.rotation.z += 0.001;
		var time = performance.now() * 0.001;
		var k = 3;
		for (var i = 0; i < sphere.geometry.vertices.length; i++) {
			var p = sphere.geometry.vertices[i];

			// p.normalize().multiplyScalar(1 + 0.3 * perlin3(p.x * k, p.y * k, p.z * k));
			p.normalize().multiplyScalar(1 + 0.3 * perlin3(p.x * k + time, p.y * k, p.z * k));
		}
		sphere.geometry.computeVertexNormals();
		sphere.geometry.normalsNeedUpdate = true;
		sphere.geometry.verticesNeedUpdate = true; // must be set or vertices will not update
	}
	camera = _camera.refresh({camera, state});

	renderer.setSize(state.viewport.screen.width, state.viewport.screen.height);
	// renderer.setFaceCulling(0);
	renderer.render(scene, camera);
};

let unhook = () => {};
let hook = ({state$, actions}) => {
	let subs = [];

	const init$ = $.interval(100)
		.map(() => document.querySelector('#view3d'))
		.distinctUntilChanged(el => el)
		.filter(el => el)
		.withLatestFrom(state$, (canvas, state) => ({canvas, state}))
		.map(({canvas, state}) => () => init({canvas, state}));

	const sceneState$ = $.merge(
		init$
		// character$,
		// npcs$
	)
		.map(reducer => (console.log(reducer), reducer))
		.scan((sceneState, modify) => modify(sceneState), {});

	subs.push(
		time.frame()
			.filter((dt, i) => i % 2 === 0)
			.withLatestFrom(
				sceneState$,
				state$,
				(dt, sceneState, state) => ({...sceneState, state})
			)
			.subscribe(render)
	);

	subs.push(
		() => {
			console.log('cleaning up scene');
			let cleanupSub = $.just({}).withLatestFrom(sceneState$, (j, sceneState) => sceneState)
				.subscribe(({renderer}) => {
					renderer.dispose();
					cleanupSub.dispose();
				});
		}
	);

	unhook = () => {
		console.log(subs);

		subs.forEach(sub => sub.dispose ? sub.dispose() : sub());
	};
};

module.exports = {
	hook,
	unhook: () => unhook()
};
