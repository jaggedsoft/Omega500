# Ω500: JS Game Library

Ω500 is a library for making canvas-based games. It focuses on providing an architecturally old-school, straightforward set of tools for creating games: primarily for game jams and rapid prototyping. Check out the online examples: http://mrspeaker.github.io/Omega500/.

![Platform example](http://www.mrspeaker.net/images/omegaPlat.png)

## Getting Started

Easiest way to start is to copy the `/ex/template` folder (and rename it), then run it in your browser. Game on! The "game" displays a screen containing a player, which you control left/right with the keyboard keys. The `src` directory contains a main `Ω.Game` object, and a `Ω.Screen` object (called MainScreen) that contains a `Ω.Entity` object (called Player).

    - template
        - lib
            Ω500.js
        - src
            - entities
                Player.js
            - screens
                MainScreen.js
            game.js
        index.html

A real game will probably have a bunch of screens and a bunch of entites - but they will be wired up mostly like the demo. Check out the other examples and games to see how this scales.

## Some games using Ω500

- [Oscillator](http://mrspeaker.itch.io/oscillator): Cyberpunk missile command. [Source](https://github.com/mrspeaker/oscillator)
- [Flappy Bird Typing Tutor](http://www.mrspeaker.net/dev/game/flappy): All the simplicity of <em>Flappy Bird</em> combined with a relaxing touch-typing  test [Source in /ex](https://github.com/mrspeaker/Omega500/tree/master/ex/flapjam).
- [DIGIBOTS & CO](http://www.mrspeaker.net/dev/game/digibots): inside-out Lemmings game where you need to build a path to complete the level. Finalist in the NoFuture contest where it's to become a real-life arcade machine. Neat-o! [Source on GitHub](https://github.com/mrspeaker/digibots).
- [Time Flies Straight](http://mrspeaker.net/dev/ld27): Time Flies Straight. A non-usual game of fractal time - starring Carl Sagan. Made in 48 hours for LD#27 [Source on GitHub](https://github.com/mrspeaker/ld27)
- [Zmore](http://mrspeaker.net/dev/ld26): LD#26 entry on the theme "minimalism". Turn light into darkness and escape minimalist captivity [Source on GitHub](https://github.com/mrspeaker/ld26).

![DIGIBOTS & CO](http://www.mrspeaker.net/images/digibots-title.jpg).
![DIGIBOTS & CO](http://www.mrspeaker.net/images/omegaDigibots.jpg).
![Zmore](http://www.mrspeaker.net/images/omegaZmore.png).
![Time Flies Straight](http://www.mrspeaker.net/images/tfsCarl.png).
![Time Flies Straight](http://www.mrspeaker.net/images/tfsHalls.png)

## Ω500 Features:

Main game loop. Screens, dialogs, and transitions. Input handling (keys, mouse, touch, iCade). Image loading and display. SpriteSheet animations. Tile and isometric maps. Repeating maps, with parallax. Entity/Map and Entity/Entity collisions. Velocity acceleration & gravity components. Generate maps from images. Camera'd map, Tracked camera (with box). Audio load/play. Math/random/timer helpers. Asset preloader/progress. Simple particle controller. Raycast against maps. Path finding. Auto-genereated tile sets for prototyping. Text helpers. Trig helpers, Font plotter. Mixin system. State machine helper. "Tiled" map editor level support. Fullscreen API support. Flipped spritesheets and images. Spring algo (for camera & entities). Various "effects".

# Using Ω500

Best is to dive into the examples, and snippets...

## General idea/notes

Old-school, super-simple architecture: Everything has `tick` and `render(gfx)` methods. Each object manages its children and passes these calls on so the entire heirachy receives the messages. Everyone gets ticked, then rendered.

    .           game            // extend Ω.Game
    .            |
    .          screen           // extend Ω.Screen
    .            |
    .      ____________
    .     |      |     |
    .  player baddies  map      // extend Ω.Entity, Ω.Entity, and Ω.Map
    .     |
    .  bullets                  // extend Ω.Entity

Every loop  the engine calls `tick` on the main game object. This (automatically) calls `tick` on its current screen. The screen (manually) calls `tick` on its children (player, all the baddies in the baddie array, map) and so on. Once the tick is done, the same thing happens with `render`.

That's the rule: if you want something ticked, then `tick` it. If you want something rendered, then `render` it.

**Random helpful notes**

* Many positions in maps etc are given as a 2 element [x, y] array (TODO: standardize this!).
* Uses John Resig's simple class with inheritance (see below)
* Project setup: copy/paster `Ω500.js` into your project

## Ω.Game
[Ω/Game.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/Game.js)

Extend `Ω.Game` to create your game. If you need to do stuff in `init`, don't forget to pass the `width` and `height` arguments up to the `_super` class:

    var MyGame = Ω.Game.extend({

    	init: function (w, h) {

    		this._super(w, h);

    	},

    	load: function () {

    		// Called when all resources have loaded

    	}

    });

    var game = new MyGame(640, 480);

The Game super class has some boilerplate, such as accepting a `screen` object to display as well as the `tick` and `render` methods described above (you can override them if you need).

Canvas/DOM container:

The `canvas` property to sets the game canvas: can be a CSS selector to either the canvas element you want to use, or the containing element you want the canvas to be created inside of. Defaults to `"body"`. If an explicit width or height is set on the canvas element this will be used, otherwise it will use the values passed in - or defualt to 400x250.

## Screen
[/screens/Screen.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/screens/Screen.js)

Things inherited from `Ω.Screen` are scene containers to display stuff in. `tick` and `render` will be called automatically by the game if you set using `game.setScreen`. Changing screens will use a small fade transition between the current and the new:

    game.setScreen(new TitleScreen());

If you're just calling it from the game `load` function then it's `this.setScreen(...)`. If you need to do async stuff on load, then set the screen's `loaded` property to `false`. When you're done, set it to `true`.

In render, you can clear the screen to a color (if you need to):

    this.clear(gfx, "#333"); // for clearing

Screens have a property `frame` that is initialized to 0 and incremented by the game every tick.

### Transitions

Default is straight crossfade, but you can choose a colour to fade to (or in/out of):

    game.setScreen(screen, {type: "inout", time:50, color: "#ffff00"});

`out` // Fade out to a colour
`inout` // Fade in/out to a colour

## Entity
[Ω/entities/Entity.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/entities/Entity.js)

Players, bad guys, monsters etc should inherit from `Ω.Entity`. Entities know how to move inside maps, and can have collision detection with other entities.

    var player = new Ω.Entity(100, 100, 18, 24); // x, y, w, h

Has x, y, w, h properties which is used for map/entity collision detection. Width and height are optional if you specify them in the class itself (default is w: 32, h: 32).

There are a couple of conventions for updating collections of entities. For "ticking", call tick on each object - and inside the object's tick method return `true` if it's still alive, and `false` if it should be removed:

    this.baddies = this.baddies.filter(function (baddie) {
        return baddie.tick();
    });

The `entity` base class has a `remove` flag which you can set anywhere in the entity, and return it (negatively) from the tick method:

    ...
    remove: false,

    tick: function () {

        return !(this.remove);

    },
    ...

For rendering, just `forEach` them:

    this.baddies.forEach(function (baddie) {
        baddie.tick(gfx);
    });

How things are rendered is completely up to you. You get the passed the `gfx` object which has the 2D graphics context as property `ctx`. You can draw with canvas primitives, or render images (see images), sprite sheets (see sprite sheets), or animation frames (see animations).

*Bounding boxes*

Sometimes it's useful to see where the bounding box of your entity is. There's no debug mode, but the default rendering of an entity is something like this:

    gfx.ctx.fillStyle = "red";
    gfx.ctx.fillRect(this.x, this.y, this.w, this.h);

You can call `this._super(gfx)` at the end of your entity render function (or draw your own) and you'll get a red box showing where the collision detection is used.

At the moment there is no option to have a different sized bounding box.

## Classes

Uses John Resig simple classes:

    var MyClass = Ω.Class.extend({
        init: function () {}
    });

    // Extend a base class
    var MySubClass = MyClass.extend({});

    // Instanciate the things
    myClassGuy = new MyClass();
    mySubClassGuy = new MySubClass();

Can call super:

    var Baddie = Ω.Entity.extend({

        init: function (x, y) {

            _this.super(x,y);

            // ... do baddie init
        }

    });

There's also an `init_post` method that will be called after `init`.


## Input
[Ω/input/input.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/input/input.js)

Bind "actions" to key codes. The actions are just strings that make sense for your game... "fire", "jump", "decapitate"... whatever... You match the keycode (or a aliases like "up", "down" - see `Ω.input` for the full list) to the action:

    Ω.input.bind("explodeThings", 32); // Bind space bar (code 32) to action "explodeThings"

Can map multiple at once:

	Ω.input.bind({
        "fire": ["space", "touch", 13], // Bind multiple keys to "fire"
		"left": "left",
		"right": "right",
		"up": "up",
		"down": "down"
    });

This lets you have multiple keys bind to the same action. In the example above the touch screen, space bar, and the enter key (keycode 13 (which incidentally also has the alias "enter")) all trigger the action "fire".

Then to test:

    if (Ω.input.pressed("fire")) // A button with the action "fire" was pressed
	if (Ω.input.released("fire")) // A button with the action "fire" was released
    if (Ω.input.isDown("up")) // Button is being held down
    if (Ω.input.wasDown("left")) // Button was down in the last frame

To force an action to be released (even if user still holding down button):

    Ω.input.release("left")

Reset all keys (stops stuck keys when transitioning screens):

    Ω.input.reset();

## Image
[Ω/assets/Image.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/assets/Image.js)

Usually you load the image as a class property (so it is preloaded). Don't be afraid to add the same image in many classes - it will only be loaded once.

    var img = new Ω.Image("res/minecraft.png")

In container render:

    img.render(gfx, 10, 10)

The image can be loaded "flipped" (flip x=1, flip 2=2, flip both=3)

    // Load the image upside down
    new Ω.Image("res/minecraft.png", 2)

And scaled:

    // Non-flipped, 50% size
    new Ω.Image("res/minecraft.png", null, 0.5);
    // Flipped Y, 150% size
    new Ω.Image("res/minecraft.png", 2, 1.5);

## Sound
[Ω/assets/Sound.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/assets/Sound.js)

Usually you load the sound as a class property (so it is preloaded).

    var sound = new Ω.Sound("res/boink.wav");

If you don't put an extension it'll choose .mp3 if supported, else .ogg

To set the volume - between 0 and 1

    var sound = new Ω.Sound("res/boink.wav", 0.5);

To play a sound:

    sound.play();

## Sprite sheets
[Ω/gfx/SpriteSheet](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/gfx/SpriteSheet.js)

Specify tile sheet, tile `w` and tile `h`.

	var sheet = new Ω.SpriteSheet("res/chars.png", 25, 45);

To draw a tile:

	sheet.render(gfx, frameX, frameY, posX, posY);

Optional param: flipFlags: only flip x = 1, only flip y = 2, flip both=3

    new Ω.SpriteSheet("res/chars.png", 25, 45, 3)

This will create a spritesheet twice as wide, and twice as high as the original. The top left part of the sheet will be the original sprites. The top right will have each cell flipped horizontally. The bottom left will have each cell flipped vertically, and the bottom right will be flipped both horizontally and vertically.

## Animation

[Ω/anim/Anim.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/anim/Anim.js)
[Ω/anim/Anims.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/anim/Anims.js)

Takes a name, a spritesheet, a time-per-frame, and an array of [x,y] offsets into the spritesheet.

Can be grouped with `Ω.Anims`:

    this.anims = new Ω.Anims([
        new Ω.Anim("idle", this.sheet, 500, [[8, 0], [9, 0]]),
        new Ω.Anim("walk", this.sheet, 60, [[0, 0], [1, 0], [2, 0]])
    ]);

In the example, the "idle" animation will loop over the spritesheet frames 8,0 and 9,0 showing each frame for 500 milliseconds.

Set the anim you want to use (defaults to first). You don't have to do this if you are just using a single Anim, rather than grouped Ω.Anims:

    this.anims.set("walk");

Tick it inside the container's tick:

    this.anims.tick();

Render it inside the container's render:

    this.anims.render(gfx, this.x, this.y);

## Map
[Ω/maps/Map.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/maps/Map.js)

Maps take a sprite sheet, and a bunch of 2D cells. Usually give it a camera to render.

    sheet: new Ω.SpriteSheet("../res/images/tiles.png", 32, 32)

    ...

    var map = new Ω.Map(this.sheet, [
        [1,1,1,1,1,],
        [1,0,0,0,0,],
        [1,0,1,1,0,],
        [1,0,0,0,0,],
        [1,1,1,1,1,]
    ]);

Optional 3rd parameter that indicates the last number that is "walkable" (or "not solid") for entity collision detection. Default is 0.

### Debug Map
[Ω/maps/DebugMap.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/maps/DebugMap.js)

Doesn't require a spritesheet - it's magically generated (for prototyping)

### Iso Map
[Ω/maps/IsoMap.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/maps/IsoMap.js)

There's *nothing* done for iso stuff yet.

### Collisions

In your entity's tick method, determine the distance you want it to move for the frame and call `move`. If the entity would end up inside a wall, the move function will push the entity back to be snug up against it. The entity can slide along a wall.

    entity.move(xAmount, yAmount, map);

### Loading a map from an image*

You can paint pixels and use that as your map - mapping different colours to different tiles. Other colours can then be used to set the locations of entities and spawn points etc. Good for rapid prototying and game jams.

    map.imgToCells(path, colorMap, callback, flipFlags)

The callback (if you provide a path to an image, otherwise the return value if you provide an image directly) returns colours from the colour map that were not matched. These (it's assumed) are used for entity locations etc.

### "Tiled Editor" Map loader
[Ω/assets/Tiled.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/assets/Tiled.js)

For loading maps created with [Tiled Editor](http://www.mapeditor.org/)

## Physics
[Ω/physics/Physics.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/physics/Physics.js)

Collision detection

Check for collision against all entities against each other, and call the enitity's `hit` method, passing the entity that hit it.

    Ω.Physics.checkCollisions([
        this.players,
        this.baddies
    ]);

You can provide an optional second paramater that is the entity method name to call instead of `hit`.

If you only want to check a single entity against other then `checkCollision` (singluar!) checks for a single entity agains an array (or array of arrays) of other entities:

    Ω.Physics.checkCollision(
        this.player,
        [this.baddies, this.monsters],
        "hitEnemy"
    );


You can check for collision via collision points, if the entity has an array property called `points` (containing elements that are [x, y])

    Ω.Physics.checkPointsCollision(
        entityWithPoints,
        entitiesArray,
        cbName
    );

## Dialog
[Ω/screens/Dialog.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/screens/Dialog.js)

Overlay for displaying menus etc.

    game.setDialog(new Ω.Dialog())

Time stops when dialogs are up (assuming you are using `Ω.utils.now()` for tracking current time)

Customiseable "kill action" to remove the dialog. Defaults to the action "escape" (see `Input`).

## Camera
[Ω/cameras/Camera.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/cameras/Camera.js)

Camera lets you define a viewport and draws only a small part of the world at a time. Pass in anything you want to draw to the camera and it'll be rendered in the correct world location.

It accepts an array of entities, or arrays of entities to render. They are drawn using the painters alogrithm:

    // Camera at pos 0, 0 with viewport size 320x240.
    var camera = new Ω.Camera(0, 0, 320, 240);

    // Draw the map, player and baddies (anything (or array of things) with a render function!)
    camera.render(gfx, [map, player, baddies]);

There's also a **TrackingCamera** that will follow the entity you pass to it.
[Ω/cameras/TrackingCamera.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/cameras/TrackingCamera.js)

## Preloading

Put resources as properties in your classes - they'll get preloaded.
You can track the loading progress in your game object, for making a loading bar:

    Ω.evt.progress.push(function (loadedSoFar, maxToLoad) {
        // console.log(loadedSoFar, maxToLoad);
    });

## Font plotting
[Ω/text/Font.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/text/Font.js)

Rather than using borin' old `ctx.fillText` you can use a bitmap font.

    font: new Ω.Font("myfont.png", 16, 16)

in render:

    this.font.write(gfx, "hello, world!", 100, 100)

The font assumes a specific ordering of letters (that seemed to show up on a bunch of different bitmapped fonts I found:

    !"#$%&'()*+,-./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz[/]^_`abcdefghijklmnopqrstuvwxyz{|}~

If you have a font with a different ordering of characters, supply this as an argument:

    font: new Ω.Font("myfont.png", 16, 16, "!?abcdefghijklmnopqrstuvwyz.[]")

## Ray casting
[Ω/utils/rays.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/utils/rays.js)

Just for hitting maps, not other entities.

## Effects

### Particles
[Ω/effects/Particle.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/effects/Particle.js)

    var p = new Ω.Particle({});
    p.play(20, 20); // Starts the particles

    ...
    p.tick();
    ...
    p.render(gfx);

### Shake.
[Ω/effects/Shake.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/effects/Shake.js)

### Flash.
[Ω/effects/Flash.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/effects/Flash.js)

## Utils - Math
[Ω/utils/math](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/utils/math.js)

    Ω.math.dist(a, b) // Distance between two entities (or [x,y] arrays)
    Ω.math.distCenter(a, b) // Distance between center of two entities
    Ω.math.angleBetween(a, b)
    Ω.math.clamp(val, min, max) // clamp value to a range
    Ω.math.ratio(start, finish, amount)
    Ω.math.lerp(start, finish, amount)
    Ω.math.lerpPerc // for a percent
    Ω.math.smoothstep(start, finish, amount)
    Ω.math.snap(value, snapSize) // Snap given value to snap size (floored)
    Ω.math.snapRound(value, snapSize) // // Snap given value to snap size (rounded)
    Ω.math.center(entity) // get the middle of a rectangle
    Ω.math.constrain(pos, bounds) // given a [x,y] pos, keep inside a rectangle
    Ω.math.degToRad()
    Ω.math.radToDeg()

## Utils
[Ω/utils/utils](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/utils/utils.js)

Note about time: use `Ω.utils.now()` for *everything* time related. Time is not incremented in dialogs, so you can pause the game without time-dependent functions being affected.

*Randoms*

    Ω.utils.rand(10)  // Random whole number between 0 and 9
    Ω.utils.oneIn(10) // 1 in 10 chance of being true
    Ω.utils.rnd.seed = 42 // For seeded random: set the seed
    Ω.utils.rnd.rand(max, min) // Seeded int between min and max

*Time*

    Ω.utils.now()
    Ω.utils.since(time)
    Ω.utils.toggle(ms, steps) // cycles through 0-steps every ms milliseconds
    Ω.utils.formatTime(time)

*Ajax*

    Ω.utils.ajax(url, callback)

*Fullscreen API*

Sends an element fullscreen (using HTML5 fullscreen API). Needs to be done inside a user interaction (like a click, keypress) handler:

    document
        .querySelector("#fsButton")
        .addEventListener("click", function () {
            Ω.utils.fullscreen.toggle("#myGameCanvas");
        }, false);

Mathods:

    Ω.utils.fullscreen.request("#board")
    Ω.utils.fullscreen.cancel()
    Ω.utils.fullscreen.toggle("#board") //toggle between request/cancel

## State helper
[Ω/utils/State.js](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/utils/State.js)

    this.state = new Ω.utils.State("BORN") // Init to a state
    this.state.set("RUNNING"); // Set to a state

In container tick:

    this.state.tick();

    switch (this.state.get()) {
        case "BORN": ...
        case "RUNNING": ...
        case "DEAD": ...
    }

Testing state:

    if (this.state.first()) // first frame....
    if (this.state.count > 40) // 40th frame
    if (this.state.is("BORN") // is "BORN"
    if (this.state.isNot("DEAD") // is not "DEAD"
    if (this.state.in("BORN", "RUNNING")) // is any of these
    if (this.state.notIn("DEAD", "RUNNING")) // none of these

## Mixins

Not quite a component/entity system - but will do in a pinch. Just experimenting with some mixins/traits... stay tuned.

Some pre-defined traits

    this.player.mixin([
        {trait: Ω.traits.RemoveAfter, life: 300},
        {trait: Ω.traits.Sin, speed: 70, amp: 10}
    ]);

## Using with Ejecta

Currently Ω500 needs a few hacks to integrate with the awesome [Ejecta project](https://github.com/phoboslab/Ejecta). For now, hack out the following things in Ω500:

* Call Ω.pageload() manually when ready
* Replace all getAttribute and setAttribute (TODO: submit patch to Ejecta)
* Replace querySelector with getElementById

Then build add your project to the Ejecta `/App` folder, and build with Xcode.

## WIP / TODO / Roadmap

The development of Ω500 has thus-far followed a "games first" evolution: with a focus on getting games out the door, rather than making beautiful APIs. Hence, there are some warts around. Now that it has proven itself in the field, Ω500 will enter a grand period of refactoring, consolidation, and unit testing.

Highest priority and bugs:

- API: standardise and consolidate api methods, parameter types, and parameter order.
- API: remove/fix references to global instantiated "game" object
- API: Maybe... add the tick/renderable entity automagically:
    - tick priority
    - render z-index
    - add individual or collection.
- API: move traits to game object, maybe
- API: Input should be a class, not a singleton
- Tests: add QUnit or other testing framework.
- Tests: write basic test suite
- BUG: bad map collision if entity taller/wider than block
- BUG: bad map collision with velocity/gravity when jammed hard left into block (jump straight up and get stuck on upper block)
- BUG: tracking camera box moves on zoom.
- BUG: tracking camera box jumps when map is not as wide as screen, but needs to scroll.
- Examples: add example using Box2D or other physics lib (see "Oscillator" game)

High priority:

- Perf: dirty rectangles
- Perf: profiling - offscreen canvas, collection methods
- Perf: Object pooling
- Physics: Alternate hit box size for collisions
- GUI: button implementation for canvas only games
- Assets: Partial loader - per-screen asset loading
- Screens: Multiple screens (as layers)
- BUG: Load from image on retina devices
- Maps: Auto-tiling
- Maps: Tiled image background

- Moar documentation

Low prority:

- Audio: add multi-voice sounds through some kind of pool.
- Gfx: DSP on spritesheets (especially a "tint" for images)
- Gfx: "Post" effects in webgl (see DIGIBOTS & CO.)
- Utils: Serialize/deserialize levels
- Maps: block selecting (iso)
- Jams: Not Ω; but script conversion from WAV/AIFF to MP3 & OGG.
- Jams: Not Ω; quick set up for grunt/gulp.
- Export: defaults/conversions for Ejecta (export to iOS)
- Better website and examples
- Font - individual letter widths

Later (or when needed for a game):

- Math: Swarm/flock algo
- Polygon objects
- WebGL renderer

## inFAQ:

Q. How do you do that omega symbol thing?
A. Ω symbol is alt-z, on a mac. I promise to change this stupid name if the lib becomes any good.

Q. When do we get a version bump?
A. Every time I finish a game with it. Version 1.0 in 5 more games!

Q. License?
A. [Unlicense](https://github.com/mrspeaker/Omega500/blob/master/%CE%A9/UNLICENSE)!

