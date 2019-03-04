'use strict';

// dom
const {
	h1, h2, a, div, p,
	section, button, span,
	canvas, header, footer, audio
} = require('iblokz-snabbdom-helpers');
// components
const controls = require('./controls');

module.exports = ({state, actions}) => section('#ui', [].concat(
	header([
		h1(['Vir', span('ux')])
	]),
	section('#view3d', {
		on: {
			click: () => state.game.catalyst !== false && state.viewport.mouse.coords.length > 0
				&& actions.game.toggleCatalyst({
					x: state.viewport.mouse.coords[0],
					y: state.viewport.mouse.coords[1]
				}, state.game.catalyst)
		}
	}),
	footer([
		p('Click and drag to Rotate. Scroll to Zoom.')
	]),
	controls({state, actions})
	// audio(`[src="assets/samples/ambient.ogg"][autoplay="true"][controls="true"][loop="true"]`)
));
