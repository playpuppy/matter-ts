
class Engine {
  public positionIterations = 6;
  public velocityIterations = 4;
  public constraintIterations = 2;
  public enableSleeping = false;
  public events = [];
  public timing: any;
  public world: World;

  public constructor() {
    this.timing = {
      timestamp: 0,
      timeScale: 1
    };
    //   broadphase: {
    //   controller: Grid
    // }
    this.world = new World();
    // engine.world = options.world || World.create(engine.world);
    // engine.pairs = Pairs.create();
    // engine.broadphase = engine.broadphase.controller.create(engine.broadphase);
    // engine.metrics = engine.metrics || { extended: false };
  }

  /**
 * Applys a mass dependant force to all given bodies.
 * @method _bodiesApplyGravity
 * @private
 * @param {body[]} bodies
 * @param {vector} gravity
 */
  private bodiesApplyGravity(bodies: Body[], gravity: any) {
    var gravityScale = typeof gravity.scale !== 'undefined' ? gravity.scale : 0.001;

    if ((gravity.x === 0 && gravity.y === 0) || gravityScale === 0) {
      return;
    }

    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];

      if (body.isStatic || body.isSleeping)
        continue;

      // apply gravity
      body.force.y += body.mass * gravity.y * gravityScale;
      body.force.x += body.mass * gravity.x * gravityScale;
    }
  };

  /**
   * Applys `Body.update` to all given `bodies`.
   * @method _bodiesUpdate
   * @private
   * @param {body[]} bodies
   * @param {number} deltaTime 
   * The amount of time elapsed between updates
   * @param {number} timeScale
   * @param {number} correction 
   * The Verlet correction factor (deltaTime / lastDeltaTime)
   * @param {bounds} worldBounds
   */

  private bodiesUpdate(bodies: Body[], deltaTime, timeScale, correction, worldBounds) {
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];
      if (body.isStatic || body.isSleeping)
        continue;
      body.update(deltaTime, timeScale, correction);
    }
  }

  public update(delta = 1000 / 60, correction = 1) {
    // var world = engine.world,
    //   timing = engine.timing,
    //   broadphase = engine.broadphase,
    //   broadphasePairs = [],
    //   i;

    const world = this.world;
    const timing = this.timing;
    // increment timestamp
    timing.timestamp += delta * timing.timeScale;

    // create an event object
    var event = {
      timestamp: timing.timestamp
    };

    Events.trigger(this, 'beforeUpdate', event);

    // get lists of all bodies and constraints, no matter what composites they are in
    const allBodies = this.world.allBodies();
    const allConstraints = this.world.allConstraints();

    // @if DEBUG
    // reset metrics logging
    Metrics.reset(engine.metrics);
    // @endif

    // if sleeping enabled, call the sleeping controller
    if (this.enableSleeping)
      Sleeping.update(allBodies, timing.timeScale);

    // applies gravity to all bodies
    this.bodiesApplyGravity(allBodies, this.world.gravity);

    // update all body position and rotation by integration
    this.bodiesUpdate(allBodies, delta, timing.timeScale, correction, this.world.bounds);

    // update all constraints (first pass)
    Constraint.preSolveAll(allBodies);
    for (i = 0; i < engine.constraintIterations; i++) {
      Constraint.solveAll(allConstraints, timing.timeScale);
    }
    Constraint.postSolveAll(allBodies);

    // broadphase pass: find potential collision pairs
    if (broadphase.controller) {
      // if world is dirty, we must flush the whole grid
      if (world.isModified)
        broadphase.controller.clear(broadphase);

      // update the grid buckets based on current bodies
      broadphase.controller.update(broadphase, allBodies, engine, world.isModified);
      broadphasePairs = broadphase.pairsList;
    } else {
      // if no broadphase set, we just pass all bodies
      broadphasePairs = allBodies;
    }

    // clear all composite modified flags
    if (world.isModified) {
      Composite.setModified(world, false, false, true);
    }

    // narrowphase pass: find actual collisions, then create or update collision pairs
    var collisions = broadphase.detector(broadphasePairs, engine);

    // update collision pairs
    var pairs = engine.pairs,
      timestamp = timing.timestamp;
    Pairs.update(pairs, collisions, timestamp);
    Pairs.removeOld(pairs, timestamp);

    // wake up bodies involved in collisions
    if (engine.enableSleeping)
      Sleeping.afterCollisions(pairs.list, timing.timeScale);

    // trigger collision events
    if (pairs.collisionStart.length > 0)
      Events.trigger(engine, 'collisionStart', { pairs: pairs.collisionStart });

    // iteratively resolve position between collisions
    Resolver.preSolvePosition(pairs.list);
    for (i = 0; i < this.positionIterations; i++) {
      Resolver.solvePosition(pairs.list, allBodies, timing.timeScale);
    }
    Resolver.postSolvePosition(allBodies);

    // update all constraints (second pass)
    Constraint.preSolveAll(allBodies);
    for (i = 0; i < engine.constraintIterations; i++) {
      Constraint.solveAll(allConstraints, timing.timeScale);
    }
    Constraint.postSolveAll(allBodies);

    // iteratively resolve velocity between collisions
    Resolver.preSolveVelocity(pairs.list);
    for (let i = 0; i < this.velocityIterations; i += 1) {
      Resolver.solveVelocity(pairs.list, timing.timeScale);
    }

    // trigger collision events
    if (pairs.collisionActive.length > 0)
      Events.trigger(engine, 'collisionActive', { pairs: pairs.collisionActive });

    if (pairs.collisionEnd.length > 0)
      Events.trigger(engine, 'collisionEnd', { pairs: pairs.collisionEnd });

    // @if DEBUG
    // update metrics log
    Metrics.update(engine.metrics, engine);
    // @endif

    // clear force buffers
    Engine._bodiesClearForces(allBodies);

    Events.trigger(this, 'afterUpdate', event);
  }
}




/**
 * Returns the list of keys for the given object.
 * @method keys
 * @param {} obj
 * @return {string[]} keys
 */
Common.keys = function (obj) {
  if (Object.keys)
    return Object.keys(obj);

  // avoid hasOwnProperty for performance
  var keys = [];
  for (var key in obj)
    keys.push(key);
  return keys;
};

/**
 * Returns the list of values for the given object.
 * @method values
 * @param {} obj
 * @return {array} Array of the objects property values
 */
Common.values = function (obj) {
  var values = [];

  if (Object.keys) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      values.push(obj[keys[i]]);
    }
    return values;
  }

  // avoid hasOwnProperty for performance
  for (var key in obj)
    values.push(obj[key]);
  return values;
};

/**
 * Gets a value from `base` relative to the `path` string.
 * @method get
 * @param {} obj The base object
 * @param {string} path The path relative to `base`, e.g. 'Foo.Bar.baz'
 * @param {number} [begin] Path slice begin
 * @param {number} [end] Path slice end
 * @return {} The object at the given path
 */
Common.get = function (obj, path, begin, end) {
  path = path.split('.').slice(begin, end);

  for (var i = 0; i < path.length; i += 1) {
    obj = obj[path[i]];
  }

  return obj;
};

/**
 * Sets a value on `base` relative to the given `path` string.
 * @method set
 * @param {} obj The base object
 * @param {string} path The path relative to `base`, e.g. 'Foo.Bar.baz'
 * @param {} val The value to set
 * @param {number} [begin] Path slice begin
 * @param {number} [end] Path slice end
 * @return {} Pass through `val` for chaining
 */
Common.set = function (obj, path, val, begin, end) {
  var parts = path.split('.').slice(begin, end);
  Common.get(obj, path, 0, -1)[parts[parts.length - 1]] = val;
  return val;
};

/**
 * Shuffles the given array in-place.
 * The function uses a seeded random generator.
 * @method shuffle
 * @param {array} array
 * @return {array} array shuffled randomly
 */
Common.shuffle = function (array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Common.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};

/**
 * Randomly chooses a value from a list with equal probability.
 * The function uses a seeded random generator.
 * @method choose
 * @param {array} choices
 * @return {object} A random choice object from the array
 */
Common.choose = function (choices) {
  return choices[Math.floor(Common.random() * choices.length)];
};

/**
 * Returns true if the object is a HTMLElement, otherwise false.
 * @method isElement
 * @param {object} obj
 * @return {boolean} True if the object is a HTMLElement, otherwise false
 */
Common.isElement = function (obj) {
  if (typeof HTMLElement !== 'undefined') {
    return obj instanceof HTMLElement;
  }

  return !!(obj && obj.nodeType && obj.nodeName);
};

/**
 * Returns true if the object is an array.
 * @method isArray
 * @param {object} obj
 * @return {boolean} True if the object is an array, otherwise false
 */
Common.isArray = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

/**
 * Returns true if the object is a function.
 * @method isFunction
 * @param {object} obj
 * @return {boolean} True if the object is a function, otherwise false
 */
Common.isFunction = function (obj) {
  return typeof obj === "function";
};

/**
 * Returns true if the object is a plain object.
 * @method isPlainObject
 * @param {object} obj
 * @return {boolean} True if the object is a plain object, otherwise false
 */
Common.isPlainObject = function (obj) {
  return typeof obj === 'object' && obj.constructor === Object;
};

/**
 * Returns true if the object is a string.
 * @method isString
 * @param {object} obj
 * @return {boolean} True if the object is a string, otherwise false
 */
Common.isString = function (obj) {
  return toString.call(obj) === '[object String]';
};


/**
 * Returns the current timestamp since the time origin (e.g. from page load).
 * The result will be high-resolution including decimal places if available.
 * @method now
 * @return {number} the current timestamp
 */
Common.now = function () {
  if (typeof window !== 'undefined' && window.performance) {
    if (window.performance.now) {
      return window.performance.now();
    } else if (window.performance.webkitNow) {
      return window.performance.webkitNow();
    }
  }

  return (new Date()) - Common._nowStartTime;
};

/**
 * Returns a random value between a minimum and a maximum value inclusive.
 * The function uses a seeded random generator.
 * @method random
 * @param {number} min
 * @param {number} max
 * @return {number} A random number between min and max inclusive
 */
Common.random = function (min, max) {
  min = (typeof min !== "undefined") ? min : 0;
  max = (typeof max !== "undefined") ? max : 1;
  return min + _seededRandom() * (max - min);
};

var _seededRandom = function () {
  // https://en.wikipedia.org/wiki/Linear_congruential_generator
  Common._seed = (Common._seed * 9301 + 49297) % 233280;
  return Common._seed / 233280;
};

/**
 * Converts a CSS hex colour string into an integer.
 * @method colorToNumber
 * @param {string} colorString
 * @return {number} An integer representing the CSS hex string
 */
Common.colorToNumber = function (colorString) {
  colorString = colorString.replace('#', '');

  if (colorString.length == 3) {
    colorString = colorString.charAt(0) + colorString.charAt(0)
      + colorString.charAt(1) + colorString.charAt(1)
      + colorString.charAt(2) + colorString.charAt(2);
  }

  return parseInt(colorString, 16);
};

/**
 * The console logging level to use, where each level includes all levels above and excludes the levels below.
 * The default level is 'debug' which shows all console messages.  
 *
 * Possible level values are:
 * - 0 = None
 * - 1 = Debug
 * - 2 = Info
 * - 3 = Warn
 * - 4 = Error
 * @property Common.logLevel
 * @type {Number}
 * @default 1
 */
Common.logLevel = 1;

/**
 * Shows a `console.log` message only if the current `Common.logLevel` allows it.
 * The message will be prefixed with 'matter-js' to make it easily identifiable.
 * @method log
 * @param ...objs {} The objects to log.
 */
Common.log = function () {
  if (console && Common.logLevel > 0 && Common.logLevel <= 3) {
    console.log.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
  }
};

/**
 * Shows a `console.info` message only if the current `Common.logLevel` allows it.
 * The message will be prefixed with 'matter-js' to make it easily identifiable.
 * @method info
 * @param ...objs {} The objects to log.
 */
Common.info = function () {
  if (console && Common.logLevel > 0 && Common.logLevel <= 2) {
    console.info.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
  }
};

/**
 * Shows a `console.warn` message only if the current `Common.logLevel` allows it.
 * The message will be prefixed with 'matter-js' to make it easily identifiable.
 * @method warn
 * @param ...objs {} The objects to log.
 */
Common.warn = function () {
  if (console && Common.logLevel > 0 && Common.logLevel <= 3) {
    console.warn.apply(console, ['matter-js:'].concat(Array.prototype.slice.call(arguments)));
  }
};


/**
 * A cross browser compatible array map implementation.
 * @method map
 * @param {array} list
 * @param {function} func
 * @return {array} Values from list transformed by func.
 */
Common.map = function (list, func) {
  if (list.map) {
    return list.map(func);
  }

  var mapped = [];

  for (var i = 0; i < list.length; i += 1) {
    mapped.push(func(list[i]));
  }

  return mapped;
};

/**
 * Takes a directed graph and returns the partially ordered set of vertices in topological order.
 * Circular dependencies are allowed.
 * @method topologicalSort
 * @param {object} graph
 * @return {array} Partially ordered set of vertices in topological order.
 */
Common.topologicalSort = function (graph) {
  // https://github.com/mgechev/javascript-algorithms
  // Copyright (c) Minko Gechev (MIT license)
  // Modifications: tidy formatting and naming
  var result = [],
    visited = [],
    temp = [];

  for (var node in graph) {
    if (!visited[node] && !temp[node]) {
      Common._topologicalSort(node, visited, temp, graph, result);
    }
  }

  return result;
};

Common._topologicalSort = function (node, visited, temp, graph, result) {
  var neighbors = graph[node] || [];
  temp[node] = true;

  for (var i = 0; i < neighbors.length; i += 1) {
    var neighbor = neighbors[i];

    if (temp[neighbor]) {
      // skip circular dependencies
      continue;
    }

    if (!visited[neighbor]) {
      Common._topologicalSort(neighbor, visited, temp, graph, result);
    }
  }

  temp[node] = false;
  visited[node] = true;

  result.push(node);
};

/**
 * Takes _n_ functions as arguments and returns a new function that calls them in order.
 * The arguments applied when calling the new function will also be applied to every function passed.
 * The value of `this` refers to the last value returned in the chain that was not `undefined`.
 * Therefore if a passed function does not return a value, the previously returned value is maintained.
 * After all passed functions have been called the new function returns the last returned value (if any).
 * If any of the passed functions are a chain, then the chain will be flattened.
 * @method chain
 * @param ...funcs {function} The functions to chain.
 * @return {function} A new function that calls the passed functions in order.
 */
Common.chain = function () {
  var funcs = [];

  for (var i = 0; i < arguments.length; i += 1) {
    var func = arguments[i];

    if (func._chained) {
      // flatten already chained functions
      funcs.push.apply(funcs, func._chained);
    } else {
      funcs.push(func);
    }
  }

  var chain = function () {
    // https://github.com/GoogleChrome/devtools-docs/issues/53#issuecomment-51941358
    var lastResult,
      args = new Array(arguments.length);

    for (var i = 0, l = arguments.length; i < l; i++) {
      args[i] = arguments[i];
    }

    for (i = 0; i < funcs.length; i += 1) {
      var result = funcs[i].apply(lastResult, args);

      if (typeof result !== 'undefined') {
        lastResult = result;
      }
    }

    return lastResult;
  };

  chain._chained = funcs;

  return chain;
};

/**
 * Chains a function to excute before the original function on the given `path` relative to `base`.
 * See also docs for `Common.chain`.
 * @method chainPathBefore
 * @param {} base The base object
 * @param {string} path The path relative to `base`
 * @param {function} func The function to chain before the original
 * @return {function} The chained function that replaced the original
 */
Common.chainPathBefore = function (base, path, func) {
  return Common.set(base, path, Common.chain(
    func,
    Common.get(base, path)
  ));
};

/**
 * Chains a function to excute after the original function on the given `path` relative to `base`.
 * See also docs for `Common.chain`.
 * @method chainPathAfter
 * @param {} base The base object
 * @param {string} path The path relative to `base`
 * @param {function} func The function to chain after the original
 * @return {function} The chained function that replaced the original
 */
Common.chainPathAfter = function (base, path, func) {
  return Common.set(base, path, Common.chain(
    Common.get(base, path),
    func
  ));
};