/*
	Ω500 Game library v0.2.1
	by Mr Speaker
*/
var Ω = (function() {

	"use strict";

	var preloading = true,
		pageLoaded = false,
		assetsToLoad = 0,
		maxAssets = 0,
		timers = [];

	return {

		evt: {
			onloads: [],
			progress: [],
			onload: function(func) {
				if (!pageLoaded) {
					this.onloads.push(func);
				} else {
					// Page already loaded... so call it up.
					func();
				}
			}
		},

		env: {
			w: 0,
			h: 0
		},

		preload: function (name) {

			if (!preloading) {
				return function () {
					// console.log("preloading finished!", name);
				};
			}

			maxAssets = Math.max(++assetsToLoad, maxAssets);

			return function () {

				assetsToLoad -= 1;

				Ω.evt.progress.map(function (p) {
					return p(assetsToLoad, maxAssets);
				});

				if (assetsToLoad === 0 && pageLoaded) {
					if (!preloading) {
						console.error("Preloading finished (onload called) multiple times!");
					}

					preloading = false;
					Ω.evt.onloads.map(function (o) {
						o();
					});
				}

			}
		},

		pageLoad: function () {

			pageLoaded = true;

			if (maxAssets === 0 || assetsToLoad === 0) {
				// No assets to load, so fire onload
				preloading = false;
				Ω.evt.onloads.map(function (o) {
					o();
				});
			}

		},

		timers: {

			add: function (timer) {

				timers.push(timer);

			},

			tick: function () {

				timers = timers.filter(function (t) {

					return t.tick();

				});

			}

		},

		urlParams: (function () {
			var params = {},
				match,
				pl = /\+/g,  // Regex for replacing addition symbol with a space
				search = /([^&=]+)=?([^&]*)/g,
				decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
				query = window.location.search.substring(1);

			while (match = search.exec(query)) {
			   params[decode(match[1])] = decode(match[2]);
			}

			return params;
		}())

	};

}());

// Polyfills
Array.isArray || (Array.isArray = function (a){ return '' + a !== a && {}.toString.call(a) == '[object Array]' });
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(Ω){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  Ω.Class = function(){};

  // Create a new Class that inherits from this class
  Ω.Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init ) {
        this.init.apply(this, arguments);
      }
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
}(Ω));
(function (Ω) {

	"use strict";

	var rays = {

		cast: function (angle, originX, originY, map) {

			angle %= Math.PI * 2;
			if (angle < 0) angle += Math.PI * 2;

			var twoPi = Math.PI * 2,
				ox = originX / map.sheet.w,
				oy = originY / map.sheet.h,
				right = angle > twoPi * 0.75 || angle < twoPi * 0.25,
				up = angle > Math.PI,
				sin = Math.sin(angle),
				cos = Math.cos(angle),
				dist = null,
				distVertical = 0,
				distX,
				distY,
				xHit = 0,
				yHit = 0,
				cell = 0,
				wallX,
				wallY,

				slope = sin / cos,
				dx = right ? 1 :  -1,
				dy = dx * slope,

				x = right ? Math.ceil(ox) : Math.floor(ox),
				y = oy + (x - ox) * slope;

			while (x >= 0 && x < map.cellW && y >=0 && y < map.cellH) {

				wallX = Math.floor(x + (right ? 0 : -1));
				wallY = Math.floor(y);

				cell = map.cells[wallY][wallX];
				if (cell > 0) {
					distX = x - ox;
					distY = y - oy;
					dist = Math.sqrt(distX * distX + distY * distY);

					xHit = x;
					yHit = y;
					break;
				}
				x += dx;
				y += dy;
			}

			// Check vertical walls
			slope = cos / sin;
			dy = up ? -1 : 1;
			dx = dy * slope;
			y = up ? Math.floor(oy) : Math.ceil(oy);
			x = ox + (y - oy) * slope;

			while (x >= 0 && x < map.cellW && y >=0 && y < map.cellH) {

				wallY = Math.floor(y + (up ? -1 : 0));
				wallX = Math.floor(x);

				cell = wallY < 0 ? null : map.cells[wallY][wallX];
				if (cell) {
					distX = x - ox;
					distY = y - oy;
					distVertical = Math.sqrt(distX * distX + distY * distY);
					if (dist === null || distVertical < dist) {
						dist = distVertical;
						xHit = x;
						yHit = y;
					}
					break;
				}
				x += dx;
				y += dy;
			}

			if (dist) {
				return {
					x: xHit,
					y: yHit
				}
			} else {
				return null;
			}

		},

		draw: function (gfx, ox, oy, rayX, rayY, map) {

			var c = gfx.ctx;

			c.strokeStyle = "rgba(100,0,0,0.2)";
			c.lineWidth = 0.5;

			c.beginPath();
			c.moveTo(ox, oy);
			c.lineTo(rayX * map.sheet.w, rayY * map.sheet.h);
			c.closePath();
			c.stroke();

		}

	}

	Ω.rays = rays;

}(Ω));
(function (Ω) {

	"use strict";

	var Timer = Ω.Class.extend({

		init: function (time, cb, done) {

			Ω.timers.add(this);

			this.time = time;
			if (!done) {
				done = cb;
				cb = null
			}
			this.max = time;
			this.cb = cb;
			this.done = done;

		},

		tick: function () {

			this.time -= 1;

			if (this.time < 0) {
				this.done && this.done();
				return false;
			}
			this.cb && this.cb(1 - (this.time / this.max));

			return true;
		}

	});

	Ω.timer = function (time, cb, done) {
		return new Timer(time, cb, done);
	};

}(Ω));
(function (Ω) {

	"use strict";

	Ω.utils = {

		rand: function (max, min) {

			max = max || 1;
			min = min || 0;

			return Math.floor(Math.random() * (max - min)) + min;

		},

		oneIn: function (max) {

			return this.rand(max) === 1;

		},

		rnd: {

			seed: 42,

			rand: function(max, min) {

				max = max || 1;
				min = min || 0;

				this.seed = (this.seed * 9301 + 49297) % 233280;

				return (this.seed / 233280) * (max - min) + min;
			}
		},

		// This gets overwritten by game.now
		// To use game time, not real-world time
		now: function () {

			return Date.now();

		},

		since: function (time) {

			return this.now() - time;

		},

		toggle: function (time, steps, offset) {

			return ((this.now() + (offset || 0)) / time) % steps >> 0;

		},

		dist: function (a, b) {

			var dx = a.x ? a.x - b.x : a[0] - b[0],
				dy = a.y ? a.y - b.y : a[1] - b[1];

			return Math.sqrt(dx * dx + dy * dy);

		},

		center: function (e, zoom) {

			zoom = zoom || 1;

			return {
				x: e.x + e.w / zoom / 2,
				y: e.y + e.h / zoom / 2
			};

		},

		angleBetween: function (a, b) {

			var dx = a.x - b.x,
				dy = a.y - b.y,
				angle = Math.atan2(dy, dx);

			return angle;// % Math.PI;

		},

		snap: function(value, snapSize) {

			return Math.floor(value / snapSize) * snapSize;

		},

		snapRound: function(value, snapSize) {

			var steps = value / snapSize | 0,
				remain = value - (steps * snapSize),
				rounder = remain > (snapSize / 2) ? Math.ceil : Math.floor;

			return rounder(value / snapSize) * snapSize;

		},

		clamp: function(val, min, max) {

			if (val < min) {
				return min;
			}
			if (val > max) {
				return max;
			}
			return val;

		},

		ratio: function (start, finish, amount) {

			return this.clamp((amount - start) / (finish - start), 0, 1);

		},

		lerp: function (start, finish, amount) {

			return amount * this.ratio(start, finish, amount);

		},

		smoothstep: function (start, finish, amount) {

			var x = this.ratio(start, finish, amount);

			return amount * (x * x * x * (x * (x * 6 - 15) + 10)); //(x*x*(3 - 2*x));
		},

		neighbours: function (radius, cb, onlyOuterRing) {

			var j, i;

			for(j = -radius; j <= radius; j++) {
				for(i = -radius; i <= radius; i++) {
					if(onlyOuterRing && (Math.abs(i) !== radius && Math.abs(j) !== radius)){
						continue;
					}
					cb && cb(i, j);
				}
			}

		},

		constrain: function (pos, bounds) {

			var xo = pos[0],
				yo = pos[1];
			if (xo < 0) { xo = 0; }
			if (yo < 0) { yo = 0; }
			if (xo > bounds.w) { xo = bounds.w; }
			if (yo > bounds.h) { yo = bounds.h; }

			return [xo, yo];

		},

		formatTime: function (t) {

			t /= 1000;
			var mins = ~~(t / 60),
				secs = ~~(t - (mins * 60));

			mins = mins.toString().length === 1 ? "" + mins : mins;
			secs = secs.toString().length === 1 ? "0" + secs : secs;
			return mins + ":" + secs;

		},

		formatScore: function (score, digits) {

			return ((score + Math.pow(10, digits)) + "").slice(1);

		},

		loadScripts: function (scripts, cb) {

			var loaded = 0;

			scripts.forEach(function (path) {

				var script = document.createElement('script'),
					qs = env.desktop ? "?" + new Date().getTime() : "";

				script.src = "scripts/" + path + ".js" + qs;
				script.onload = function () {
					resources.toLoadLoaded++;
					if (loaded++ === scripts.length - 1) {
						cb && cb();
					}
				};

				document.body.appendChild(script);

			});

		},

		getByKeyValue: function (arrayOfObj, key, value) {

			return this.getAllByKeyValue(arrayOfObj, key, value)[0];

		},

		getAllByKeyValue: function (arrayOfObj, key, value) {

			return arrayOfObj.filter(function (o) {
				if (o[key] && o[key] === value) {
					return true;
				}
			});

		},

		ajax: function (url, callback) {

			var xhr = new XMLHttpRequest();
			xhr.addEventListener("readystatechange", function() {
				if (this.readyState < 4) {
					return;
				}

				if (xhr.readyState == 4) {
					callback(xhr);
				}

			}, false);
			xhr.open("GET", url, true);
			xhr.send("");

		},

		fullscreen: {

			toggle: function (dom) {

				if (!document.fullscreenElement &&
					!document.mozFullScreenElement &&
					!document.webkitFullscreenElement) {
					this.request(dom);
				} else {
					this.cancel();
				}
			},

			request: function (dom) {

				if (typeof dom === "string") {
					dom = document.querySelector(dom);
				}

				if (dom.requestFullscreen) {
					dom.requestFullscreen();
				} else if (dom.mozRequestFullScreen) {
					dom.mozRequestFullScreen();
				} else if (dom.webkitRequestFullscreen) {
					dom.webkitRequestFullscreen();
				}

			},

			cancel: function () {

				if (document.cancelFullScreen) {
					document.cancelFullScreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if (document.webkitCancelFullScreen) {
					document.webkitCancelFullScreen();
				}

			}

		},

	};

}(Ω));
(function(Ω) {

	"use strict";

	var State = function (state) {

		this.state = state;
		this.last = "";
		this.count = -1;
		this.locked = false;

	};

	State.prototype = {

		set: function (state) {

			if (this.locked) {
				return;
			}

			this.last = this.state;
			this.state = state;
			this.count = -1;

		},

		get: function () { return this.state; },

		tick: function () { this.count++; },

		first: function () { return this.count === 0; },

		is: function (state) { return state === this.state; },

		isNot: function (state) { return !this.is(state); },

		isIn: function () {

			var state = this.state,
				args = Array.prototype.slice.call(arguments);

			return args.some(function (s) {

				return s === state;

			});

		},

		isNotIn: function () {

			return !(this.isIn.apply(this, arguments));

		}

	};

	Ω.utils = Ω.utils || {};
	Ω.utils.State = State;

}(Ω));
(function (Ω) {

	"use strict";

	var Stats = function () {

		var startTime = Date.now(),
			previous = startTime,
			fpsCur = 0,
			fpsMin = 100,
			fpsMax = 0,
			ticks = 0;

		return {

			pos: [Ω.env.w - 53, 3],

			start: function () {

				startTime = Date.now();

			},

			fps: function () {

				return [fpsCur, fpsMin, fpsMax];

			},

			stop: function () {

				var now = Date.now();

				ticks++;

				if (now > previous + 1000) {
					fpsCur = Math.round((ticks * 1000) / (now - previous));
					fpsMin = Math.min(fpsMin, fpsCur);
					fpsMax = Math.max(fpsMax, fpsCur);

					previous = now;
					ticks = 0;
				}

			}
		}

	};

	Ω.utils = Ω.utils || {};
	Ω.utils.Stats = Stats;

}(Ω));
(function (Ω) {

	"use strict";

	var images = {};

	var gfx = {

		init: function (ctx) {

			this.ctx = ctx;
			this.canvas = ctx.canvas;

			this.w = this.canvas.width;
			this.h = this.canvas.height;

		},

		loadImage: function (path, cb, flipFlags) {

			// TODO: don't need to reload if non-flipped image exists
			var cachedImage = images[path + (flipFlags ? ":" + flipFlags : "")];

			if (cachedImage) {
				if (!cachedImage._loaded) {
					cachedImage.addEventListener("load", function() {
						cb && cb(cachedImage);
					}, false);
					cachedImage.addEventListener("load", function() {
						cb && cb(cachedImage);
					}, false);
				} else {
					cb && cb(cachedImage);
				}
				return;
			}

			var resolve = Ω.preload(path),
				image = new Image(),
				self = this,
				onload = function () {

					var procImage;

					if (flipFlags >= 0) {
						procImage = self.flipImage(image, flipFlags);
					}

					this._loaded = true;
					cb && cb(procImage || image);
					resolve();

				}

			image._loaded = false;
			image.src = path;
			image.addEventListener("load", onload, false);
			image.addEventListener("error", function() {

				console.error("Error loading image", path);
				onload.call(this);

			}, false);
			images[path + (flipFlags ? ":" + flipFlags : "")] = image;

		},

		dspImage: function (img, dspFunc) {

			// TODO: run func once per pixel
			return img;

		},

		drawImage: function (img, x, y, scaleX, scaleY) {

			this.ctx.drawImage(
				img,
				x,
				y,
				img.width * scaleX ? scaleX : 1,
				img.height * scaleY ? scaleY : 1);
		},

		flipImage: function (img, flags) {

			var ctx = this.createCanvas(img.width, img.height);

			// flip x = 1, y = 2, both = 3, none = 0
			ctx.save();
			ctx.translate(flags & 1 ? img.width : 0, flags & 2 ? img.height : 0);
			ctx.scale(flags & 1 ? -1 : 1, flags & 2 ? -1 : 1);
			ctx.drawImage(img, 0, 0);
			ctx.restore();

			return ctx.canvas;

		},

		createCanvas: function (w, h) {

			var cn = document.createElement("canvas"),
				ctx = cn.getContext("2d");

			cn.setAttribute("width", w);
			cn.setAttribute("height", h);

			ctx.imageSmoothingEnabled = false;
			ctx.mozImageSmoothingEnabled = false;
			ctx.webkitImageSmoothingEnabled = false;

			return ctx;

		},

		text: {

			drawShadowed: function (msg, x, y, shadow, font) {

				var c = gfx.ctx;

				shadow = shadow || 2;
				if (font) {
					c.font = font;
				}
				c.fillStyle = "#000";
				c.fillText(msg, x + shadow, y + shadow);
				c.fillStyle = "#fff";
				c.fillText(msg, x, y);

			},


			getWidth: function (msg) {

				return gfx.ctx.measureText(msg).width;

			},

			getHalfWidth: function (msg) {

				return this.getWidth(msg) / 2;

			},

			getHeight: function (msg) {

				return gfx.ctx.measureText(msg).height;

			},

			getHalfHeight: function (msg) {

				return this.getHeight(msg) / 2;

			}

		}

	};

	Ω.gfx = gfx;

}(Ω));
(function (Ω) {

	"use strict";

	var keys = {},
		mouse = {
			x: null,
			y: null
		},
		touch = {
			x: null,
			y: null
		},
		actions = {},
		input,
		el;

	input = {

		KEYS: {
			enter: 13,
			space: 32,
			escape: 27,
			up: 38,
			down: 40,
			left: 37,
			right: 39,

			w: 87,
			a: 65,
			s: 83,
			d: 68,

			az_w: 90,
			az_a: 81,
			az_s: 83,
			az_d: 68,

			mouse1: -1,
			mouse2: -2,
			mouse3: -3,
			wheelUp: -4,
			wheelDown: -5,

			touch: -6,
			touchMove: -7
		},

		mouse: mouse,
		touch: touch,

		init: function (dom, icade) {

			el = dom;

			icade = icade || Ω.urlParams.icade;

			bindKeys(!icade ? keyed : keyedIcade);
			bindMouse();
			bindTouch();

		},

		reset: function () {

		},

		tick: function () {

			var key;

			for(key in keys) {
				keys[key].wasDown = keys[key].isDown;
			}
			if (keys[input.KEYS.wheelUp]) keyed(input.KEYS.wheelUp, false);
			if (keys[input.KEYS.wheelDown]) keyed(input.KEYS.wheelDown, false);
		},

		bind: function (code, action) {

			var self = this;

			if (Array.isArray(code)) {
				code.forEach(function (k) {

					self.bind(k[0], k[1]);

				});
				return;
			}

			if (typeof code !== "number") {
				code = this.KEYS[code];
				if (!code) {
					console.error("Could not bind input: ", code);
					return;
				}
			}

			keys[code] = {
				action: action,
				isDown: false,
				wasDown: false
			};
			if (!actions[action]) {
				actions[action] = [];
			}
			actions[action].push(code);

		},

		pressed: function (action) {

			return this.isDown(action) && !(this.wasDown(action));

		},

		released: function (action) {

			return this.wasDown(action) && !(this.isDown(action));

		},

		isDown: function (action) {
			var actionCodes = actions[action] || [];
			var back = actionCodes.some(function (code) {
				return keys[code].isDown;
			});
			return back;

		},

		wasDown: function (action) {
			var actionCodes = actions[action] || [];
			return actionCodes.some(function (k) {
				return keys[k].wasDown;
			});
		},

		release: function (action) {
			var actionCodes = actions[action] || [];
			actionCodes.forEach(function (code) {
				keyed(code, false);
			});
		}
	}

	function keyed(code, isDown) {

		if (keys[code]) {
			keys[code].wasDown = keys[code].isDown;
			keys[code].isDown = isDown;
		}

	}

	function keyedIcade(code, isDown) {

		var icadeCodes = [87, 69, 88, 90, 68, 67, 65, 81, 89, 84],
			KEYS = input.KEYS;

		if (icadeCodes.indexOf(code) > -1) {

			if (!isDown) {
				// Don't handle key up with iCade!
				return;
			}

			switch (code) {
			case 87:
				// Up
				code = KEYS.up;
				isDown = true;
				break;
			case 69:
				code = KEYS.up;
				isDown = false;
				break;
				// Down
			case 88:
				code = KEYS.down;
				isDown = true;
				break;
			case 90:
				code = KEYS.down;
				isDown = false;
				break;
				// Right
			case 68:
				code = KEYS.right;
				isDown = true;
				break;
			case 67:
				code = KEYS.right;
				isDown = false;
				break;
				// Left
			case 65:
				code = KEYS.left;
				isDown = true;
				break;
			case 81:
				code = KEYS.left;
				isDown = false;
				break;

			// Fire
			case 89:
				code = KEYS.space;
				isDown = true;
				break;
			case 84:
				code = KEYS.space;
				isDown = false;
				break;
			}
		}

		keyed(code, isDown);

	}

	function bindKeys(keyHandler) {

		document.addEventListener('keydown', function(e){
			keyHandler(e.keyCode, true);
		}, false );

		document.addEventListener('keyup', function(e){
			keyHandler(e.keyCode, false);
		}, false );

	}

	function bindMouse() {

		function setPos(e) {

			var relX = e.clientX - el.offsetLeft,
				relY = e.clientY - el.offsetTop;

			mouse.diff = {
				x: mouse.x - relX,
				y: mouse.y - relY
			};
			mouse.prev = {
				x: mouse.x,
				y: mouse.y
			};
			mouse.x = relX;
			mouse.y = relY;
		}

		document.addEventListener('mousedown', function(e){

			if (e.which === 1) {
				setPos(e);
				keyed(-1, true);
			}

		});

		document.addEventListener('mousemove', function(e){

			setPos(e);

		});

		document.addEventListener('mouseup', function(e){

			if (e.which === 1) {
				setPos(e);
				keyed(-1, false);
			}

		});

		function mousewheel(e) {

			var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

			if (delta === -1) keyed(input.KEYS.wheelUp, true);
			if (delta === 1) keyed(input.KEYS.wheelDown, true);
		}
		document.addEventListener("mousewheel", mousewheel, false);
		document.addEventListener("DOMMouseScroll", mousewheel, false);

	}

	function bindTouch() {

		function setPos(e) {

			var epos;

			// TODO: handle multitouch
			if (e.type === "touchend") {
				epos = e.changedTouches ? e.changedTouches[0] : e;
			} else {
				epos = e.touches ? e.touches[0] : e;
			}

			var relX = epos.clientX - el.offsetLeft,
				relY = epos.clientY - el.offsetTop;

			touch.diff = {
				x: touch.x - relX,
				y: touch.y - relY
			};
			touch.prev = {
				x: touch.x,
				y: touch.y
			};
			touch.x = relX;
			touch.y = relY;
		}

		document.addEventListener('touchstart', function (e) {
			setPos(e);
			keyed(input.KEYS.touch, true);
		}, false);
		document.addEventListener('touchmove', function (e) {
			e.preventDefault();
			setPos(e);
			keyed(input.KEYS.touchMove, true);
		}, false);
		document.addEventListener('touchend', function (e) {
			setPos(e);
			keyed(input.KEYS.touch, false);
			keyed(input.KEYS.touchMove, false);
		}, false);
	}

	Ω.input = input;

}(Ω));
(function (Ω) {

	"use strict";

	var Image = Ω.Class.extend({

		init: function (path, flipFlags, scale) {

			var self = this;

			this.path = path;

			Ω.gfx.loadImage(path, function (img){

				self.img = img;

			}, flipFlags);

			this.scale = scale || 1;

		},

		render: function (gfx, x, y) {

			gfx.ctx.drawImage(
				this.img,
				x,
				y,
				this.img.width * this.scale,
				this.img.height * this.scale
			);

		}

	});

	Ω.Image = Image;

}(Ω));
(function (Ω) {

	"use strict";

	var sounds = {},
		Sound;

	Sound = Ω.Class.extend({

		ext: document.createElement('audio').canPlayType('audio/mpeg;') === "" ? ".ogg" : ".mp3",

		init: function (path, volume, loop) {

			var audio,
				resolve,
				onload;

			if (!sounds[path]) {
				audio = new window.Audio();
				resolve = Ω.preload(path);
				onload = function () {
					// Check if already loaded, 'cause Firefox fires twice
					if (this._loaded) {
						return;
					}
					this._loaded = true;
					resolve();
				};

				audio.src = path.slice(-4).slice(0, 1) === "." ? path : path + this.ext;

				audio._loaded = false;

				// Fixme: crazyies in firefox... fires twice?
				audio.addEventListener("canplaythrough", onload, false);
				audio.addEventListener("progress", function() {
					// FIXME: no canplaythrough on mobile safari...
					// Does it even play audio? Don't do sounds, or only handle
					// progress event for this.
					onload.call(this);
					audio.removeEventListener("progress");
				}, false);

				audio.addEventListener("error", function () {
					console.error("Error loading audio resource:", audio.src);
					onload.call(this);
				});
				audio.load();

				sounds[path] = audio;
			}

			audio = sounds[path];
			audio.volume = volume || 1;
			audio._volume = audio.volume;
			audio.loop = loop;

			this.audio = audio;

		},

		rewind: function () {
			this.audio.pause();
			try{
	        	this.audio.currentTime = 0;
	    	} catch(err){
	        	//console.log(err);
	    	}

		},

		play: function () {

			this.rewind();
			this.audio.play();
		},

		stop: function () {

			this.audio.pause();

		}

	});

	Sound._reset = function () {

		var path,
			sound;

		// Should check for canplaythrough before doing anything...
		for (path in sounds) {
			sound = sounds[path];
			if (!sound._loaded) continue;
			sound.pause();
			try {
				sound.currentTime = 0;
			} catch (err) {
				console.log("err");
			}
		}
	};

	Sound._setVolume = function (v) {

		for (var path in sounds) {
			sounds[path].pause();
			try {
				sounds[path].volume = sounds[path]._volume * v;
			} catch (err) {
				console.log("err");
			}
		}

	};

	Ω.Sound = Sound;

}(Ω));
(function (Ω) {

    "use strict";

    var Tiled = Ω.Class.extend({

        w: null,
        h: null,
        tileW: null,
        tileH: null,

        layers: null,

        init: function (file, onload) {

            var self = this;

            this.layers = [];
            this.onload = onload;

            Ω.utils.ajax(file, function (xhr) {

                self.processLevel(JSON.parse(xhr.responseText));

            });
        },

        layerByName: function (name) {

            var layer = Ω.utils.getByKeyValue(this.layers, "name", name);
            return layer ? [layer] : [];

        },

        objectByName: function (layer, name) {

            // TODO: fix the .get(data) shit

            return this.layerByName(layer).get("data").reduce(function(acc, el) {

                // Just return one or zero matchs
                if (acc.length === 0 && el.name === name) {
                    acc = [el];
                }
                return acc;
            }, []);

        },

        objectsByName: function (layer, name) {

            // TODO: fix the .get(data) shit

            var layer = this.layerByName(layer).get("data");

            if (!name) {
                return layer;
            }

            return !layer ? [] : layer.reduce(function(acc, el) {

                if (el.name === name) {
                    acc.push(el);
                }
                return acc;
            }, []);

        },

        processLevel: function (json) {
            this.raw = json;

            this.w = json.width;
            this.h = json.height;
            this.tileW = json.tilewidth;
            this.tileH = json.tileheight;

            this.properties = json.properties;

            this.layers = json.layers.map(function (l) {

                var data;
                if (l.type === "tilelayer") {
                    // convert to 2d arrays.
                    data = l.data.reduce(function (acc, el) {
                        if (acc.length === 0 || acc[acc.length - 1].length % json.width === 0) {
                            acc.push([]);
                        }
                        acc[acc.length - 1].push(el);
                        return acc;
                    }, []);
                } else {
                    // Parse the objects into something useful
                    data = l.objects.map(function (o) {
                        return o;
                    });
                }

                return {
                    name: l.name,
                    type: l.type,
                    data: data,
                    opacity: l.opacity,
                    visible: l.visible
                };

            });

            if (this.onload) {
                this.onload(this);
            }
        }

    });

    window.Tiled = Tiled;

}(Ω));
(function (Ω) {

	"use strict";

	var Camera = Ω.Class.extend({

		x: 0,
		y: 0,
		w: 0,
		h: 0,

		init: function (x, y, w, h) {

			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
			this.zoom = 1;

		},

		tick: function () {},

		render: function (gfx, renderables) {

			var c = gfx.ctx,
				self = this,
				minX = this.x,
				minY = this.y,
				maxX = this.x + this.w,
				maxY = this.y + this.h;

			c.save();
			c.scale(this.zoom, this.zoom);
			c.translate(-(Math.round(this.x)), -(Math.round(this.y)));

			renderables
				// Flatten to an array
				.reduce(function (ac, e) {

					if (Array.isArray(e)) {
						return ac.concat(e);
					}
					ac.push(e);
					return ac;

				}, [])
				// Remove out-of-view entites
				.filter(function (r) {

					return r.repeat || !(
						r.x + r.w < self.x ||
						r.y + r.h < self.y ||
						r.x > self.x + (self.w / self.zoom) ||
						r.y > self.y + (self.h / self.zoom));

				})
				// Draw 'em
				.forEach(function (r) {

					r.render(gfx, self);

				});

			c.strokeStyle = "red";
			c.strokeRect(this.x, this.y, this.w / this.zoom, this.h / this.zoom);

			c.restore();

		}

	});

	Ω.Camera = Camera;

}(Ω));
(function (Ω) {

	"use strict";

	var TrackingCamera = Ω.Camera.extend({

		x: 0,
		y: 0,
		w: 0,
		h: 0,
		xRange: 40,
		yRange: 30,

		init: function (entity, x, y, w, h, bounds) {

			this.w = w;
			this.h = h;
			this.zoom = 1;

			this.bounds = bounds;

			this.track(entity);

		},

		track: function (entity) {

			this.entity = entity;
			this.x = entity.x - (this.w / this.zoom / 2) + (entity.w / this.zoom / 2);
			this.y = entity.y - (this.h / this.zoom / 2);

			this.constrainToBounds();

		},

		constrainToBounds: function () {

			if (this.x < 0) {
				this.x = 0;
			}
			if (this.x > 0) {
				if (this.bounds && this.x + this.w / this.zoom > this.bounds[0]) {
					this.x = this.bounds[0] - this.w / this.zoom;
				};
			}
			if (this.y < 0) {
				this.y = 0;
			}
			if (this.y > 0) {
				if (this.bounds && this.y + this.h / this.zoom > this.bounds[1]) {
					this.y = this.bounds[1] - this.h / this.zoom;
				};
			}

		},

		tick: function () {

			var center = Ω.utils.center(this, this.zoom),
				e = this.entity,
				xr = this.xRange,
				yr = this.yRange,
				newX,
				newY;

			if(e.x < center.x - xr) {
				this.x = e.x - (this.w / this.zoom / 2) + xr;
			}
			if(e.x + e.w > center.x + xr) {
				this.x = e.x + e.w - (this.w / this.zoom / 2) - xr;
			}
			if(e.y < center.y - yr) {
				this.y = e.y - (this.h / this.zoom / 2) + yr;
			}
			if(e.y + e.h > center.y + yr) {
				this.y = e.y + e.h - (this.h / this.zoom / 2) - yr;
			}

			this.constrainToBounds();

		},

		render: function (gfx, renderables) {

			if (!this.debug) {
				this._super(gfx, renderables);
				return;
			}

			this._super(gfx, renderables.concat([{
				render: function (gfx, cam) {

					var center = Ω.utils.center(cam, cam.zoom);

					gfx.ctx.strokeStyle = "rgba(200, 255, 255, 1)";
					gfx.ctx.strokeRect(
						center.x - cam.xRange,
						center.y - cam.yRange,
						cam.xRange * 2,
						cam.yRange * 2);

				}
			}]));

		}

	});

	Ω.TrackingCamera = TrackingCamera;

}(Ω));
(function (Ω) {

	"use strict";

	var Physics = {

		checkCollision: function (entity, entities, cbName) {

			var i,
				j,
				a = entity,
				b,
				ax,
				bx,
				cbName = cbName || "hit",
				len = entities.length;


			for (i = 0; i < len; i++) {

				b = entities[i];

				ax = a.x + (a.xbb || 0);
				bx = b.x + (b.xbb || 0);

				if (a !== b &&
					ax + a.w - 1 > bx &&
				    ax < bx + b.w - 1 &&
				    a.y + a.h - 1 > b.y &&
				    a.y < b.y + b.h - 1) {
					a[cbName] && a[cbName](b);
					b[cbName] && b[cbName](a);
				}
			}

		},

		checkCollisions: function (entities, cbName) {

			var i,
				j,
				a,
				b,
				cbName = cbName || "hit",
				all = entities.reduce(function (ac, e) {
					if (Array.isArray(e)) {
						return ac.concat(e);
					}
					ac.push(e);
					return ac;

				}, []),
				len = all.length;

			for (i = 0; i < len - 1; i++) {
				a = all[i];
				for (j = i + 1; j < len; j++) {
					b = all[j];

					if (a.x + a.w >= b.x &&
					    a.x <= b.x + b.w &&
					    a.y + a.h >= b.y &&
					    a.y <= b.y + b.h) {
						a[cbName] && a[cbName](b);
						b[cbName] && b[cbName](a);
					}
				}
			}
		}

	};

	Ω.Physics = Physics;

}(Ω));
(function (Ω) {

	"use strict";

	var Particle = Ω.Class.extend({

		particles: null,
		running: false,

		init: function (opts, cb) {

			this.maxLife = opts.life || 40;
			this.life = this.maxLife;
			this.cb = cb;
			this.col = opts.col || "100, 0, 0";

			this.particles = [];
			for(var i = 0; i < 20; i++) {
				this.particles.push(
					new Part({col: this.col}, this)
				);
			}

		},

		play: function (x, y) {

			this.life = this.maxLife;
			this.x = x;
			this.y = y;
			this.running = true;
			this.particles.forEach(function (p) {
				p.reset();
			});

		},

		tick: function () {

			if (!this.running) {
				return;
			}

			this.life -= 1;

			this.particles.forEach(function (p) {
				p.tick();
			});

			if (this.life < 0) {
				this.running = false;
				this.cb && this.cb();
			}

		},

		render: function (gfx) {

			var self = this;

			if (!this.running) {
				return;
			}

			this.particles.forEach(function (p) {
				p.render(gfx, self.x, self.y);
			});

		}

	});

	function Part (opts, parent) {
		this.parent = parent;
		this.x = 0;
		this.y = 0;
		this.w = 4;
		this.h = 4;
		this.col = opts.col;
		this.xSpeed = Math.random() * 2 - 1;
		this.ySpeed = Math.random() * 2 - 1 - 1;
	}
	Part.prototype = {

		reset: function () {
			this.life = this.parent.maxLife;
			this.x = 0;
			this.y = 0;
			this.xSpeed = Math.random() * 2 - 1;
			this.ySpeed = Math.random() * 2 - 1 - 3;
		},

		tick: function () {
			this.x += this.xSpeed;
			this.y += this.ySpeed;
			this.ySpeed += 0.2;
		},

		render: function (gfx, x, y) {

			var c = gfx.ctx;

			c.fillStyle = "rgba(" + this.col + ", " + (0.3 + this.parent.life / this.parent.maxLife) + ")";
			c.fillRect(this.x + x, this.y + y, this.w, this.h);

		}

	};

	Ω.Particle = Particle;

}(Ω));
(function (Ω) {

	"use strict";

	var Shake = Ω.Class.extend({

		init: function (time) {

			this.time = time || 10;

		},

		tick: function () {

			return this.time--;

		},

		render: function (gfx, x, y) {

			gfx.ctx.translate(Math.random() * 8 | 0, Math.random() * 4 | 0);

		}

	});

	Ω.Shake = Shake;

}(Ω));
(function (Ω) {

	"use strict";

	var Spring = Ω.Class.extend({

		vel: [0, 0],

		init: function (length, strength, friction, gravity) {

			this.springLength = length;
			this.spring = strength;
			this.friction = friction;
			this.gravity = gravity;

		},

		tick: function (fixed, springer) {

			var dx = springer.x - fixed.x,
				dy = springer.y - fixed.y,
				angle = Math.atan2(dy, dx),
				tx = fixed.x + Math.cos(angle) * this.springLength,
				ty = fixed.y + Math.sin(angle) * this.springLength;

			this.vel[0] += (tx - springer.x) * this.spring;
			this.vel[1] += (ty - springer.y) * this.spring;

			this.vel[0] *= this.friction;
			this.vel[1] *= this.friction;

			this.vel[1] += this.gravity;

			return this.vel;

		},

		reset: function () {

			this.vel = [0, 0];


		}

	});

	window.Spring = Spring;

}(Ω));
(function (Ω) {

	"use strict";

	var Screen = Ω.Class.extend({

		loaded: true,

		tick: function () {},

		clear: function (gfx, col) {

			var c = gfx.ctx;

			c.fillStyle = col;
			c.fillRect(0, 0, gfx.w, gfx.h);

		},

		render: function (gfx) {

			var c = gfx.ctx;

			c.fillStyle = "hsl(0, 0%, 0%)";
			c.fillRect(0, 0, gfx.w, gfx.h);

		}

	});

	Ω.Screen = Screen;

}(Ω));
(function (Ω) {

	"use strict";

	var Dialog = Ω.Class.extend({

		killKey: "escape",
		time: 0,

		init: function (key) {

			if (key) {
				this.killKey = key;
			}

		},

		tick: function (delta) {

			this.time += delta;

			if (this.killKey && Ω.input.pressed(this.killKey)) {
				Ω.input.release(this.killKey);
				this.done();
			}

		},

		done: function () {

			game.clearDialog();

		},

		render: function (gfx) {

			var c = gfx.ctx;

			c.fillStyle = "rgba(0, 0, 0, 0.7)";
			c.fillRect(gfx.w * 0.15, gfx.h * 0.25, gfx.w * 0.7, gfx.h * 0.5);

		}

	});

	Ω.Dialog = Dialog;

}(Ω));
(function (Ω) {

	"use strict";

	var Trait = Ω.Class.extend({

		// Convert a property list to an argument array
		// based on the nees of the trait.
		makeArgs: function () {

			return [];

		},

		init: function () {},

		init_trait: function () {},

		tick: function () {

			return true;

		}

	});

	Ω.Trait = Trait;

}(Ω));
(function (Ω) {

	/*
		Set the entity's `remove` flag after X ticks
	*/
	var RemoveAfter = Ω.Trait.extend({

		makeArgs: function (props) {

			return [props.ticks];

		},

		init_trait: function (t, ticks) {

			t.ticks = ticks || 100;

		},

		tick: function (t) {

			if (!this.remove && t.ticks-- === 0) {
				this.remove = true;
				console.log("Trait 'remove' executed.");
			}

			return !(this.remove);

		}

	});

	/*
		Peform a callback after X ticks
	*/
	var Ticker = Ω.Trait.extend({

		makeArgs: function (props) {

			return [props.ticks, props.cb];

		},

		init_trait: function (t, ticks, cb) {

			t.ticks = ticks || 100;
			t.cb = cb || function () {};

		},

		tick: function (t) {

			if (t.ticks-- <= 0) {
				t.cb.call(this, t);
				console.log("Ticker trait expired");
				return false;
			}


			return true;

		}

	});


	/*

		Bounce a value over a sine curve
		Defaults to `yo` (to affect the entity's Y movement)

	*/
	var Sin = Ω.Trait.extend({

		makeArgs: function (props) {

			return [props.speed, props.amp, props.target];

		},

		init_trait: function (t, speed, amp, target) {

			t.speed = speed || 100;
			t.amp = amp || 5;
			t.target = target || "yo";

			return t;

		},

		tick: function (t) {

			this[t.target] += Math.sin(Ω.utils.now() / t.speed) * (t.amp / 10);

			return true;

		}

	});

	Ω.traits = {
		RemoveAfter: RemoveAfter,
		Ticker: Ticker,
		Sin: Sin
	};

}(Ω));
(function (Ω) {

	"use strict";

	var SpriteSheet = Ω.Class.extend({

		init: function (path, width, height, opts) {

			var defaults = {
					flipFlags: null,
					margin: [0, 0],
					padding: [0, 0]
				},
				self = this;

			this.w = width;
			this.h = height || width;
			this.cellW = 0;
			this.cellH = 0;

			// Can pass flipFlags directly: TODO - figure out Options API
			if (!isNaN(opts)) {
				opts = {
					flipFlags: opts
				}
			}
			opts = opts || {};

			this.flipFlags = opts.flipFlags || defaults.flipFlags;
			this.margin = opts.margin || defaults.margin;
			this.padding = opts.padding || defaults.padding;

			if (typeof path !== "string") {
				// Direct init from image
				this.populate(path, this.flipFlags);
			} else {
				Ω.gfx.loadImage(path, function (img) {

					self.populate(img, self.flipFlags);

				});
			}

		},

		populate: function (img, flipFlags) {

			this.sheet = img;
			if (flipFlags >= 0) {
				this.sheet = this.flipImage(img.canvas || img, flipFlags);
			}

			this.cellW = Math.ceil((img.width - this.margin[0]) / (this.w + this.padding[0]));
			this.cellH = Math.ceil((img.height - this.margin[1]) / (this.h + this.padding[1]));

		},

		flipImage: function (img, flags) {

			// flip: x = 1, y = 2, both = 3, none = 0

			var ctx = Ω.gfx.createCanvas(
					img.width * (flags & 1 ? 2 : 1),
					img.height * (flags & 2 ? 2 : 1)
				),
				cellW = img.width / this.w | 0,
				cellH = img.height / this.h | 0,
				i,
				j;

			// Draw the original
			ctx.drawImage(img, 0, 0);

			if (flags & 1) {
				// Flipped X
				for (j = 0; j < cellH; j++) {
					for (i = 0; i < cellW; i++) {
						ctx.save();
						ctx.translate(i * this.w * 0.5, j * this.h);
						ctx.scale(-1 , 1);
						this.render({ctx:ctx}, i, j, -(i * this.w * 0.5) - img.width - this.w, 0);
						ctx.restore();
					}
				}
			}

			if (flags & 2) {
				// Flipped Y
				for (j = 0; j < cellH; j++) {
					for (i = 0; i < cellW; i++) {
						ctx.save();
						ctx.translate(i * this.w, j * this.h * 0.5);
						ctx.scale(1 , -1);
						this.render({ctx:ctx}, i, j, 0, -(j * this.h * 0.5) - img.height - this.h);
						ctx.restore();
					}
				}
			}

			if (flags & 3) {
				// Flipped both
				for (j = 0; j < cellH; j++) {
					for (i = 0; i < cellW; i++) {
						ctx.save();
						ctx.translate(i * this.w * 0.5, j * this.h * 0.5);
						ctx.scale(-1 , -1);
						this.render(
							{ctx:ctx},
							i,
							j,
							-(i * this.w * 0.5) - img.width - this.w,
							-(j * this.h * 0.5) - img.height - this.h);
						ctx.restore();
					}
				}
			}

			return ctx.canvas;

		},

		render: function (gfx, col, row, x, y, w, h, scale) {
			if(col === -1) {
				return;
			}
			scale = scale || 1;
			h = h || 1;
			w = w || 1;

			gfx.ctx.drawImage(
				this.sheet,
				col * (this.w + this.padding[0]) + this.margin[0],
				row * (this.h + this.padding[1]) + this.margin[1],
				w * this.w,
				h * this.h,
				x,
				y,
				w * this.w * scale,
				h * this.h * scale);
		}

	});

	Ω.SpriteSheet = SpriteSheet;

}(Ω));
(function (Ω) {

	"use strict";

	var Font = Ω.Class.extend({

		map: " !\"#$%&'()*+,-./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz[/]^_`abcdefghijklmnopqrstuvwxyz{|}~",

		init: function (path, w, h, map) {

			this.sheet = new Ω.SpriteSheet(path, w, h);

			this.map = (map || this.map).split("").map(function(c) {
				return c.charCodeAt(0);
			});

			this.w = w;
			this.h = h;

		},

		write: function (gfx, msg, x, y) {

			if (!msg) {
				return;
			}

			msg = msg.toString();

			var w = this.sheet.w,
				h = this.sheet.h,
				cellW = this.sheet.cellW,
				cellH = this.sheet.cellH;

			for (var i = 0; i < msg.length; i++) {

				var ch = msg.charCodeAt(i),
					index = this.map.indexOf(ch);

				if (ch === 32 || index === -1) {
					continue;
				}

				this.sheet.render(
					gfx,
					index % cellW,
					index / cellW | 0,
					x + (i * this.w),
					y);

			}

		}

	});

	Ω.Font = Font;

}(Ω));
(function (Ω) {

	"use strict";

	var Anims = Ω.Class.extend({

		current: null,
		all: null,

		init: function (anims) {

			if (anims.length) {
				this.all = anims;
				this.current = anims[0];
			}

		},

		tick: function () {

			this.current.tick();

		},

		add: function (anim) {

			if (!this.all) {
				this.all = [];
				this.current = anim;
			}
			this.all.push(anim);

		},

		each: function (func) {

			this.all.forEach(func);

		},

		get: function () {

			return this.current.name;

		},

		set: function (animName) {

			var anim = this.all.filter(function (anim) {
				return anim.name === animName;
			});

			if (anim.length) {
				this.current = anim[0];
				this.current.reset();
			}

		},

		setTo: function (animName) {

			if (this.get() !== animName) {
				this.set(animName);
			}

		},

		changed: function () {

			return this.current.changed;

		},

		rewound: function () {

			return this.current.rewound;

		},

		render: function (gfx, x, y) {

			this.current.render(gfx, x, y);

		}

	});


	Ω.Anims = Anims;

}(Ω));(function (Ω) {

	"use strict";

	var Anim = Ω.Class.extend({

		init: function (name, sheet, speed, frames, cb) {

			this.name = name;
			this.sheet = sheet;
			this.frames = frames;
			this.speed = speed;
			this.cb = cb;

			this.scale = 1;
			this.changed = false;
			this.rewound = false;

			this.reset();

		},

		tick: function () {

			var diff = Ω.utils.now() - this.frameTime;
			this.changed = false;
			this.rewound = false;

			if (diff > this.speed) {
				this.frameTime = Ω.utils.now() + (Math.min(this.speed, diff - this.speed));
				if (++this.curFrame > this.frames.length - 1) {
					this.curFrame = 0;
					this.rewound = true;
					this.cb && this.cb();
				};
				this.changed = true;
			};

		},

		reset: function () {
			this.curFrame = 0;
			this.frameTime = Ω.utils.now();
		},

		render: function (gfx, x, y) {

			this.sheet.render(
				gfx,
				this.frames[this.curFrame][0],
				this.frames[this.curFrame][1],
				x,
				y,
				1,
				1,
				this.scale);

		}

	});

	Ω.Anim = Anim;

}(Ω));
(function (Ω) {

	"use strict";

	var Map = Ω.Class.extend({

		x: 0, // Position required for camera rendering check
		y: 0,

		walkable: 0,

		repeat: false,
		parallax: 0,

		init: function (sheet, cells, walkable) {

			this.sheet = sheet;
			this.walkable = walkable || 0;

			this.populate(cells || [[]]);

		},

		populate: function (cells) {

			this.cells = cells;
			this.cellH = this.cells.length;
			this.cellW = this.cells[0].length;
			this.h = this.cellH * this.sheet.h;
			this.w = this.cellW * this.sheet.w;

		},

		render: function (gfx, camera) {

			if (!camera) {
				camera = {
					x: 0,
					y: 0,
					w: gfx.w,
					h: gfx.h,
					zoom: 1
				}
			}

			var tw = this.sheet.w,
				th = this.sheet.h,
				cellW = this.sheet.cellW,
				cellH = this.sheet.cellH,
				stx = (camera.x - (camera.x * this.parallax)) / tw | 0,
				sty = (camera.y - (camera.y * this.parallax)) / th | 0,
				endx = stx + (camera.w / camera.zoom / tw | 0) + 1,
				endy = sty + (camera.h / camera.zoom / th | 0) + 1,
				j,
				i,
				cell;

			if (this.parallax) {
				gfx.ctx.save();
				gfx.ctx.translate(camera.x * this.parallax | 0, camera.y * this.parallax | 0);
			}

			for (j = sty; j <= endy; j++) {
				if (j < 0 || (!this.repeat && j > this.cellH - 1)) {
					continue;
				}
				for (i = stx; i <= endx; i++) {
					if (!this.repeat && i > this.cellW - 1) {
						continue;
					}

					cell = this.cells[j % this.cellH][i % this.cellW];
					if (cell === 0) {
						continue;
					}
					this.sheet.render(
						gfx,
						(cell - 1) % cellW  | 0,
						(cell - 1) / cellW | 0,
						i * tw,
						j * th);
				}
			}

			if (this.parallax) {
				gfx.ctx.restore();
			}

		},

		getBlock: function (block) {

			var row = block[1] / this.sheet.h | 0,
				col = block[0] / this.sheet.w | 0;

			if (row < 0 || row > this.cellH - 1) {
				return;
			}

			return this.cells[row][col];

		},

		getBlocks: function (blocks) {

			return blocks.map(this.getBlock, this);

		},

		getBlockEdge: function(pos, vertical) {

			var snapTo = vertical ? this.sheet.h : this.sheet.w;

		    return Ω.utils.snap(pos, snapTo);

		},

		setBlock: function (pos, block) {

			var row = pos[1] / this.sheet.h | 0,
				col = pos[0] / this.sheet.w | 0;

			if (row < 0 || row > this.cellH - 1 || col < 0 || col > this.cellW - 1) {
				return;
			}

			this.cells[row][col] = block;

		},

		/*
			Maps an image (via a color map) to tiles.

			The color map is a key of the r,g,b,a to tile index. For example:

				{
					"0,0,0,250": 0,
					"250,0,0,250": 1
				}

			Please note, due to me not being bothered figuring out retina displays and Safari's
			non-support of imageSmoothingEnabled, I have simple Math.floor-ed all color components!
			So each component ranges from 0 to 250 in increments of 10.

			This function also returns colors X & Y that weren't mapped to tiles
			(so you can use for entities etc)
		*/
		imgToCells: function (img, colourMap, cb, flipFlags) {

			var self = this,
				entities = {},
				autoColMap = {},
				autoColIdx = 0;

			function canvToCells(canvas) {

				var ctx = canvas.getContext("2d"),
					pix = ctx.webkitGetImageDataHD ?
						ctx.webkitGetImageDataHD(0, 0, canvas.width, canvas.height).data :
						ctx.webkitGetImageData(0, 0, canvas.width, canvas.height).data,
					pixOff,
					cells = [],
					i,
					j,
					col,
					key,
					round = function (val) {

						return Math.floor(val / 10) * 10;

					};

				for (j = 0; j < canvas.height; j++) {
					cells.push([]);
					for (i = 0; i < canvas.width; i++) {
						pixOff = j * canvas.width * 4 + (i * 4);
						if (pix[pixOff + 3] !== 0) {

							key = round(pix[pixOff]) + "," +
								round(pix[pixOff + 1]) + "," +
								round(pix[pixOff + 2]) + "," +
								round(pix[pixOff + 3]);

							if (colourMap) {

								// Get the tile from the colour map
								col = colourMap[key];
								if (!col) {
									// This colour is not a tile. It must be an entity...
									if (entities[key]) {
										entities[key].push([i, j])
									} else {
										entities[key] = [[i, j]];
									}
									col = 0;
								}
								cells[cells.length - 1].push(col);

							} else {

								// No supplied color map.
								// Just set tile indexes to colours, as we see them
								col = autoColMap[key];
								if (!col) {
									autoColMap[key] = ++autoColIdx;
								}
								cells[cells.length - 1].push(col);

							}
						} else {
							cells[cells.length - 1].push(0);
						}
					}
				}

				self.populate(cells);

				return entities;

			}

			var unmapped;
			if (typeof img === "string") {
				// Load first
				Ω.gfx.loadImage(img, function (canvas){

					document.body.appendChild(canvas);

					unmapped = canvToCells(canvas);
					cb && cb(self, unmapped);
				}, flipFlags || 0);
			} else {
				unmapped = canvToCells(img);
			}

			return unmapped;

		}

	});

	Ω.Map = Map;

}(Ω));
(function (Ω) {

	"use strict";

	/* Just draw some colourful squares, eh... */

	var DebugMap = Ω.Map.extend({

		init: function (tileW, tileH, xTiles, yTiles, cells, walkable) {

			var ctx = Ω.gfx.createCanvas(tileW * xTiles, tileH * yTiles),
				data = Ω.gfx.ctx.createImageData(tileW * xTiles,tileH * yTiles),
				pix = data.data,
				numPix = data.width * data.height;

			var off = Math.random() * 255 | 0;

			for (var i = 0; i < numPix; i++) {
				var row = i / data.width | 0,
					col = ((i / tileW) | 0) % data.width % xTiles,
					noise = Math.random() < 0.3 ? (Math.random() * 30) : 0,
					color = ((row / tileH) + 1 + (col * 3) + off + (noise / 10)) | 0;


				// Remove the edges, for some roundiness.
				if (i % tileW == 0 && (i / data.width | 0) % tileH == 0) { color = 0; }
				if ((i + 1) % tileW == 0 && (i / data.width | 0) % tileH == 0) { color = 0; }
				if (i % tileW == 0 && ((i / data.width | 0) + 1) % tileH == 0) { color = 0; }
				if ((i + 1) % tileW == 0 && ((i / data.width | 0) + 1) % tileH == 0) { color = 0; }

				pix[i * 4] = (color * 50) % 255 + noise;
				pix[i * 4 + 1] = (color * 240) % 255 + noise;
				pix[i * 4 + 2] = (color * 80) % 255 + noise;
				pix[i * 4 + 3] = 255;
			}

			ctx.putImageData(data, 0, 0);

			document.body.appendChild(ctx.canvas);

			this._super(
				new Ω.SpriteSheet(ctx.canvas, tileW, tileH),
				cells,
				walkable);

		}

	});

	Ω.DebugMap = DebugMap;

}(Ω));
(function (Ω) {

	"use strict";

	var IsoMap = Ω.Map.extend({

		init: function (sheet, data) {

			this._super(sheet, data);

		},

		render: function (gfx, camera) {

			var tw = this.sheet.w,
				th = this.sheet.h / 2,
				stx = camera.x / tw | 0,
				sty = camera.y / th | 0,
				endx = stx + (camera.w / camera.zoom / tw | 0) + 1,
				endy = sty + (camera.h / 0.25 / camera.zoom / th | 0) + 1,
				j,
				i,
				tileX,
				tileY,
				cell;

			for (j = sty; j <= endy; j++) {
				if (j < 0 || j > this.cellH - 1) {
					continue;
				}
				for (i = stx; i <= endx; i++) {
					if (i > this.cellW - 1) {
						continue;
					}
					cell = this.cells[j][i];
					if (cell === 0) {
						continue;
					}

					tileX = (i - j) * th;
					tileX += ((gfx.w / 2) / camera.zoom) - (tw / 2);
					tileY = (i + j) * (th / 2);

					this.sheet.render(
						gfx,
						cell - 1,
						0,
						tileX,
						tileY);
				}
			}

		}

	});

	Ω.IsoMap = IsoMap;

}(Ω));
(function (Ω) {

	"use strict";

	/* WIP: map for doing Wolf3D style games */

	var RayCastMap = Ω.Map.extend({

		init: function (sheet, data, entity) {

			this.entity = entity;

			this._super(sheet, data);

		},

		castRays: function (gfx) {

			var idx = 0,
				i,
				rayPos,
				rayDist,
				rayAngle,
				fov = 60 * Math.PI / 180,
				viewDistance = (gfx.w / 2) / Math.tan((fov / 2)),
				numRays = 15,
				w = 16;

			/*for (var i = 0; i < numRays; i++) {
				rayPos = (-numRays / 2 + i) * w;
				rayDist = Math.sqrt(rayPos * rayPos + viewDistance * viewDistance);
				rayAngle = Math.asin(rayPos / rayDist);

				this.castRay(gfx, Math.PI + rayAngle, idx++);
			}*/
			var p = this.entity;
			for (var i = 0; i < Math.PI * 2; i+= 0.2) {
				var hit = Ω.rays.cast(i, p.x + p.w / 2, p.y + p.h / 2, this);

				if (hit) {
					Ω.rays.draw(gfx, p.x + p.w / 2, p.y + p.h / 2, hit.x, hit.y, this);
				}
			}

		},

		render: function (gfx, camera) {

			// TODO: raycast texture draw
			this._super(gfx, camera);

			this.castRays(gfx);

		}

	});

	Ω.RayCastMap = RayCastMap;

}(Ω));
(function (Ω) {

	"use strict";

	var Entity = Ω.Class.extend({

		x: 0,
		y: 0,
		w: 32,
		h: 32,

		xo: 0,
		yo: 0,

		gravity: 0,
		falling: false,
		wasFalling: false,

		remove: false,

		traits: null,

		init: function (x, y, w, h) {

			this.x = x || this.x;
			this.y = y || this.y;
			this.w = w || this.w;
			this.h = h || this.h;
			this.traits = [];

		},

		tick: function () {

			this.traits = this.traits.filter(function (t) {

				return t.tick.call(this, t);

			}, this);

			return !(this.remove);

		},

		mixin: function (traits) {

			traits.forEach(function (t) {

				if (t.trait) {
					var trait = new t.trait();
					trait.init_trait.apply(this, [trait].concat(trait.makeArgs(t)));
					this.traits.push(trait);
				}

			}, this);

		},

		hit: function (entity) {},

		hitBlocks: function(xBlocks, yBlocks) {},

		/*
			x & y is the amount the entity WANTS to move,
			if there were no collision with the map.
		*/
		move: function (x, y, map) {

			// Temp holder for movement
			var xo,
				yo,

				xv,
				yv,

				hitX = false,
				hitY = false,

				xBlocks,
				yBlocks;

			if (this.falling) {
				y += this.gravity;
			}
			xo = x;
			yo = y;

			xv = this.x + xo;
			yv = this.y + yo;

			// check blocks given vertical movement TL, BL, TR, BR
			yBlocks = map.getBlocks([
				[this.x, yv],
				[this.x, yv + (this.h - 1)],
				[this.x + (this.w - 1), yv],
				[this.x + (this.w - 1), yv + (this.h - 1)]
			]);

			// if overlapping edges, move back a little
			if (y < 0 && (yBlocks[0] > map.walkable || yBlocks[2] > map.walkable)) {
				// Hmmm... why only this guy needs to be floored?
				yo = map.getBlockEdge((yv | 0) + map.sheet.h, "VERT") - this.y;
				hitY = true;
			}
			if (y > 0 && (yBlocks[1] > map.walkable || yBlocks[3] > map.walkable)) {
				yo = map.getBlockEdge(yv + this.h, "VERT") - this.y - this.h;
				hitY = true;
			}

			// Add the allowed Y movement
			this.y += yo;

			// Now check blocks given horizontal movement TL, BL, TR, BR
			xBlocks = map.getBlocks([
				[xv, this.y],
				[xv, this.y + (this.h - 1)],
				[xv + (this.w - 1), this.y],
				[xv + (this.w - 1), this.y + (this.h - 1)]
			]);

			// if overlapping edges, move back a little
			if (x < 0 && (xBlocks[0] > map.walkable || xBlocks[1] > map.walkable)) {
				xo = map.getBlockEdge(xv + map.sheet.w) - this.x;
				hitX = true;
			}
			if (x > 0 && (xBlocks[2] > map.walkable || xBlocks[3] > map.walkable)) {
				xo = map.getBlockEdge(xv + this.w) - this.x - this.w;
				hitX = true;
			}

			if (hitX || hitY) {
				this.hitBlocks(hitX ? xBlocks : null, hitY ? yBlocks : null);
			}

			// Add the allowed X movement
			this.x += xo;

			// check if we're falling
			yBlocks = map.getBlocks([
				[this.x, this.y + this.h],
				[this.x + (this.w - 1), this.y + this.h]
			]);
			if (yBlocks[0] <= map.walkable && yBlocks[1] <= map.walkable) {
				this.falling = true;
			} else {
				this.falling = false;
			}

			// Reset offset amount
			this.xo = 0;
			this.yo = 0;

			return [xo, yo];
		},

		render: function (gfx) {

			var c = gfx.ctx;

			c.fillStyle = "#c00";
			c.fillRect(this.x, this.y, this.w, this.h);

		}

	});

	Ω.Entity = Entity;

}(Ω));
(function (Ω) {

	"use strict";

	var Game = Ω.Class.extend({

		canvas: "body",

		running: false,
		time: 0,

		preset_dt: 1 / 60,
		currentTime: Date.now(),
		accumulator: 0,

		screen: new Ω.Screen(),
		_screenPrev: null,
		_screenFade: 0,
		dialog: null,

		debug: true,

		init: function (w, h) {

			var ctx = initCanvas(this.canvas, w, h),
				self = this;

			Ω.env.w = ctx.canvas.width;
			Ω.env.h = ctx.canvas.height;

			Ω.gfx.init(ctx);
			Ω.input.init(ctx.canvas);

			Ω.evt.onload(function () {
				self.load();
				self.run(Date.now());
			});

			window.addEventListener("load", function () {
				Ω.pageLoad();
			}, false);

            this.running = true;

            // Use the game time, rather than Date.now()
			Ω.utils.now = function () {
				return self.now();
			}

			this.stats = Ω.utils.Stats();

		},

		reset: function () {

			this.time = 0;

		},

		now: function () {

			return this.time * 1000;

		},

		load: function () {},

		run: function () {

            var self = this,
            	now = Date.now(),
                frameTime = Math.min((now - this.currentTime) / 1000, this.preset_dt),
                c;

            this.currentTime = now;
            this.accumulator += frameTime;

            if (this.running) {
                c = 0;
                while (this.accumulator >= this.preset_dt) {
                    c++;
                    this.tick(this.preset_dt);
                    this.accumulator -= this.preset_dt;
                }
                if (c > 1) {
                    console.log("ran " + c + " ticks");
                }

                this.render(Ω.gfx);
            }

            window.requestAnimationFrame(function () {

                self.run(Date.now());

            });

		},

		stop: function () {},

		tick: function (delta) {

			this.stats.start();

			if (this.dialog) {
				this.dialog.tick(delta);
			} else {
				this.time += delta;
				this.screen.loaded && this.screen.tick();
				Ω.timers.tick();
			}
			Ω.input.tick();

			this.stats.stop();

		},

		render: function (gfx) {

			if (!this.screen.loaded) {
				return;
			}

			this.screen.render(gfx);
			if (this.screenFade > 0) {
				gfx.ctx.globalAlpha = this.screenFade;
				this.screenPrev.render(gfx);
				gfx.ctx.globalAlpha = 1;
			}
			this.dialog && this.dialog.render(gfx);

			if (this.debug) {

				var fps = this.stats.fps();
				gfx.ctx.fillStyle = "rgba(0,0,0,0.3)";
				gfx.ctx.fillRect(this.stats.pos[0], this.stats.pos[1], 50, 20);

				gfx.ctx.fillStyle = "#fff";
				gfx.ctx.font = "6pt monospace";
				gfx.ctx.fillText(fps[0] + " " + fps[1] + "/" + fps[2], this.stats.pos[0] + 5, this.stats.pos[1] + 13);

			}

		},

		setScreen: function (screen) {

			var self = this;

			this.screenPrev = this.screen;
			this.screen = screen;

			if (this.screenPrev) {
			    this.screenFade = 1;
			    Ω.timer(10, function (ratio) {

			        self.screenFade = 1 - ratio;

			    }, function () {

			        self.screenFade = 0;

			    });
			}

		},

		setDialog: function (dialog) {

			this.dialog = dialog;

		},

		clearDialog: function () {

			this.setDialog(null);

		}
	});

	/*
		Create or assign the canvas element
	*/
	function initCanvas(canvasSelector, w, h) {

		w = w || 400;
		h = h || 225;

		var selCanvas = document.querySelector(canvasSelector),
			newCanvas,
			ctx;

		if (selCanvas == null) {
			console.error("Canvas DOM container not found:", canvasSelector);
			canvasSelector = "body";
			selCanvas = document.querySelector(canvasSelector);
		}

		if (selCanvas.nodeName.toUpperCase() === "CANVAS") {
			var explicitWidth = selCanvas.getAttribute("width"),
				explicitHeight = selCanvas.getAttribute("height");

			if (explicitWidth === null) {
				selCanvas.setAttribute("width", w);
			}
			if (explicitHeight === null) {
				selCanvas.setAttribute("height", h);
			}
			ctx = selCanvas.getContext("2d");
		} else {
			newCanvas = document.createElement("canvas");
			newCanvas.setAttribute("width", w);
			newCanvas.setAttribute("height", h);
			selCanvas.appendChild(newCanvas);
			ctx = newCanvas.getContext("2d");
		}
		ctx.imageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;

		if (!ctx) {
			console.error("Could not get 2D context.");
		}

		return ctx;
	}

	Ω.Game = Game;

}(Ω));
