'use strict';

// lib
const Rx = require('rx');
const $ = Rx.Observable;

// iblokz
const vdom = require('iblokz-snabbdom-helpers');
const {obj, arr} = require('iblokz-data');

// app
const app = require('./util/app');
let actions = app.adapt(require('./actions'));
let ui = require('./ui');
let actions$;
const state$ = new Rx.BehaviorSubject();
// services
let scene = require('./services/scene');
let viewport = require('./services/viewport.js');
// game
let game = require('./services/game');
actions = app.attach(actions, 'game', game.actions);

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(require('./actions'));
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.stream.onNext(state => state);
	});
	// services
	module.hot.accept("./services/scene", function() {
		// console.log(scene.unhook);
		scene.unhook();
		scene = require('./services/scene');
		scene.hook({state$, actions});
		actions.stream.onNext(state => state);
	});
	module.hot.accept("./services/viewport.js", function() {
		viewport.unhook();
		setTimeout(() => {
			viewport = require('./services/viewport.js');
			viewport.hook({state$, actions});
			actions.stream.onNext(state => state);
		});
	});
	// game
	module.hot.accept("./services/game", function() {
		game.unhook();
		game = require('./services/game');
		actions = app.attach(actions, 'game', game.actions);
		game.hook({state$, actions});
		actions.ping();
	});
} else {
	actions$ = actions.stream;
}

// actions -> state
actions$
	.map(action => (
		action.path && (
			action.path[0] !== 'viewport'
			&& !(action.path.join('.') === 'set' && action.payload[0][0] === 'viewport')
		) && console.log(action.path.join('.'), action.payload, action),
		action
	))
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	// .map(state => (console.log(state), state))
	.subscribe(state => state$.onNext(state));

// log only game state
state$.distinctUntilChanged(state => state.game)
	.subscribe(state => console.log(state));

// services
scene.hook({state$, actions});
viewport.hook({state$, actions});
game.hook({state$, actions});

// state -> ui
const ui$ = state$.map(state => ui({state, actions}));
vdom.patchStream(ui$, '#ui');

// livereload impl.
if (module.hot) {
	document.write(`<script src="http://${(location.host || 'localhost').split(':')[0]}` +
	`:35729/livereload.js?snipver=1"></script>`);
}
