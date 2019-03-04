'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

const loadSvg = require('load-svg');
const parsePath = require('extract-svg-path').parse;
const svgMesh3d = require('svg-mesh-3d');

// threejs
const THREE = require('three');
window.THREE = window.THREE || THREE;
const createGeom = require('three-simplicial-complex')(THREE);

const convert = url => $.create(observer => loadSvg(url, function(err, svg) {
	if (err) throw err;

	let svgPath = parsePath(svg);
	let complex = svgMesh3d(svgPath, {
		scale: 40,
		simplify: 1
	});
	let geometry = createGeom(complex);
	observer.onNext(geometry);
	observer.onCompleted();
}));

module.exports = {
	convert
};
