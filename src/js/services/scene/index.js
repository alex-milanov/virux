'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// threejs
const THREE = require('three');
window.THREE = window.THREE || THREE;
require('three/examples/js/effects/OutlineEffect.js');

// const colladaLoader = require('../../util/three/loader/collada.js');

const time = require('../../util/time.js');
const {perlin3} = require('../../util/perlin.js');

const {obj, fn} = require('iblokz-data');

const _camera = require('./camera');
const _grid = require('./grid');
const _viruses = require('./viruses');

const init = ({canvas, state}) => {
	let width = canvas.offsetWidth;
	let height = canvas.offsetHeight;

	// let camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
	let camera = _camera.init({state, width, height});

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x111111);

	scene.add(new THREE.AmbientLight(0xcccccc, 0.1));
	// scene.add(new THREE.HemisphereLight(0x443333, 0x111122));
	// scene.add(new THREE.PointLight(0xffffff, 0.3));
	let dirLight = new THREE.DirectionalLight(0xffffff, 1);
	dirLight.color.setHSL(0.1, 0, 0.7);
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
	// init grid
	let {grid, mirror} = _grid.init({scene, state, width, height});
	let viruses = _viruses.init({scene, state});

	let renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(width, height);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	let effect = new THREE.OutlineEffect(renderer);

	canvas.innerHTML = '';
	canvas.appendChild(renderer.domElement);

	return {scene, light: dirLight, renderer, camera, canvas: renderer.domElement, viruses, effect, grid, mirror};
};

const render = ({viruses, scene, camera, renderer, state, effect, grid, mirror}) => {
	if (!scene) return;
	// console.log(items);
	if (viruses) {
		viruses = _viruses.render({state, scene, viruses});
	}
	camera = _camera.refresh({camera, state});
	grid = _grid.refresh({grid, mirror, state, scene});

	renderer.setSize(state.viewport.screen.width, state.viewport.screen.height);
	// renderer.setFaceCulling(0);
	// renderer.render(scene, camera);
	effect.render(scene, camera);
	return {viruses, scene, camera, renderer, state, effect, grid, mirror};
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

	const viruses$ = state$.distinctUntilChanged(state => state.game.grid)
		.map(state => sceneState => {
			let {scene, viruses} = sceneState;
			console.log(viruses);
			if (viruses) {
				viruses = _viruses.refresh({state, scene, viruses});
			}
			return {
				...sceneState,
				viruses
			};
		});

	const sceneState$ = $.merge(
		init$,
		viruses$
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
