'use strict';

const {obj, arr} = require('iblokz-data');

// namespaces=

// initial
const initial = {
	camera: {
		distance: 70,
		range: {
			h: 360,
			hOffset: -180,
			v: 90,
			vOffset: -80
		},
		followPlayer: false
	},
	viewport: {
		screen: {
			width: 800,
			height: 600
		},
		mouse: {
			x: 0,
			y: 0,
			down: false
		}
	},
	controls: {
		on: true,
		camera: false
	}
};

// actions
const set = (key, value) => state => obj.patch(state, key, value);
const toggle = key => state => obj.patch(state, key, !obj.sub(state, key));
const arrToggle = (key, value) => state =>
	obj.patch(state, key,
		arr.toggle(obj.sub(state, key), value)
	);

const zoom = amount => state => obj.patch(state, 'camera', {
	distance: state.camera.distance + amount
});
const ping = () => state => state;

module.exports = {
	initial,
	set,
	toggle,
	arrToggle,
	ping,
	zoom
};
