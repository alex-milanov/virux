'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const {obj, fn} = require('iblokz-data');

// threejs
const THREE = require('three');
window.THREE = window.THREE || THREE;
require('three/examples/js/effects/OutlineEffect.js');

const svg2mesh = require('../../util/three/svg2mesh');
const {perlin3} = require('../../util/three/perlin.js');
const gridUtil = require('../../util/three/grid.js');

// const colladaLoader = require('../../util/three/loader/collada.js');

const time = require('../../util/time.js');

const _camera = require('./camera');
const _grid = require('./grid');
const _viruses = require('./viruses');
const _catalysts = require('./catalysts');

const init = ({canvas, state}) => {
	let width = canvas.offsetWidth;
	let height = canvas.offsetHeight;

	// let camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
	let camera = _camera.init({state, width, height});

	const scene = new THREE.Scene();
	// scene.background = new THREE.Color(0x333333);

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

	let raycaster = new THREE.Raycaster();

	let renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(width, height);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	let effect = new THREE.OutlineEffect(renderer);

	canvas.innerHTML = '';
	canvas.appendChild(renderer.domElement);

	let catalysts = [];

	return {
		scene, light: dirLight, renderer,
		camera, raycaster, canvas: renderer.domElement,
		viruses, catalysts, effect, grid, mirror
	};
};

const render = ({state, actions, scene, viruses, catalysts, camera, renderer, raycaster, effect, grid, mirror}) => {
	if (!scene) return;
	// console.log(items);
	if (viruses) {
		viruses = _viruses.render({state, scene, viruses});
	}
	camera = _camera.refresh({camera, state});
	grid = _grid.render({grid, mirror, state, scene});

	// raycaster
	raycaster.setFromCamera(new THREE.Vector2().copy({
		x: (state.viewport.mouse.x / state.viewport.screen.width) * 2 - 1,
		y: -(state.viewport.mouse.y / state.viewport.screen.height) * 2 + 1
	}), camera);
	let intersection = raycaster.intersectObject(grid);
	if (intersection[0] && intersection[0].point) {
		const origin = gridUtil.calcOrigin(state.game.grid.length);
		actions.set(['viewport', 'mouse', 'coords'], [
			parseInt((intersection[0].point.x - origin) / 8, 10),
			parseInt((intersection[0].point.z - origin) / 8, 10)
		]);
	} else {
		actions.set(['viewport', 'mouse', 'coords'], []);
	}

	// console.log(new THREE.Vector2().copy(state.viewport.mouse), {intersection});

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

	const assetUpdates$ = state$.distinctUntilChanged(state => state.game.grid)
		.map(state => sceneState => {
			let {scene, viruses, catalystMeshes, catalysts} = sceneState;
			// console.log(viruses);
			if (viruses) {
				viruses = _viruses.refresh({state, scene, viruses});
			}
			if (catalysts && catalystMeshes) {
				console.log(catalystMeshes);
				catalysts = _catalysts.refresh({state, scene, catalysts, catalystMeshes});
			}
			return {
				...sceneState,
				viruses
			};
		});

	const catalystMeshes$ = $.fromArray(['attack', 'grow', 'split'])
		.concatMap(catalyst => _catalysts.loadMesh(`assets/icons/virus-${catalyst}.svg`)
			.map(mesh => ({[catalyst]: mesh})))
		.reduce((o, c) => ({...o, ...c}), {})
		.map(catalystMeshes => sceneState => Object.assign({}, sceneState, {catalystMeshes}));

	const gridUpdates$ = state$.distinctUntilChanged(state => state.game.grid.length)
		.map(state => sceneState => {
			let {scene, grid, mirror} = sceneState;
			// console.log(viruses);
			let newGridMirror = (grid && mirror) ? _grid.refresh({state, scene, grid, mirror}) : {};
			return {
				...sceneState,
				...newGridMirror
			};
		});

	const sceneState$ = init$
		.flatMap(initSceneReducer =>
			$.merge(
				$.just(initSceneReducer),
				catalystMeshes$,
				assetUpdates$,
				gridUpdates$
				// character$,
				// npcs$
			)
		)
		.map(reducer => (console.log(reducer), reducer))
		.scan((sceneState, modify) => modify(sceneState), {});

	subs.push(
		time.frame()
			.filter((dt, i) => i % 4 === 0)
			.withLatestFrom(
				sceneState$,
				state$,
				(dt, sceneState, state) => ({...sceneState, state})
			)
			.subscribe(data => render({...data, actions}))
	);

	subs.push(
		() => {
			console.log('cleaning up scene');
			let cleanupSub = $.just({}).withLatestFrom(sceneState$, (j, sceneState) => sceneState)
				.subscribe(sceneState => {
					console.log('disposing ...', sceneState);

					sceneState.renderer.dispose();
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
