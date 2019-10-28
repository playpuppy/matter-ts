import { Common, Events } from './commons';
import { Vector, Bounds } from "./geometry";
import { Body, Constraint, World } from "./body";
import { Pair, Pairs, Resolver, Grid } from "./collision";
import { Render } from "./render";
import { Mouse, MouseConstraint } from "./mouse";


/**
* The `Matter.Sleeping` module contains methods to manage the sleeping state of bodies.
*
* @class Sleeping
*/

const _motionWakeThreshold = 0.18;
const _motionSleepThreshold = 0.08;
const _minBias = 0.9;

export class Sleeping {

  /**
   * Puts bodies to sleep or wakes them up depending on their motion.
   * @method update
   * @param {body[]} bodies
   * @param {number} timeScale
   */

  public static update(bodies: Body[], timeScale: number) {
    var timeFactor = timeScale * timeScale * timeScale;

    // update bodies sleeping status
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i],
        motion = body.speed * body.speed + body.angularSpeed * body.angularSpeed;

      // wake up bodies if they have a force applied
      if (body.force.x !== 0 || body.force.y !== 0) {
        Sleeping.set(body, false);
        continue;
      }

      var minMotion = Math.min(body.motion, motion),
        maxMotion = Math.max(body.motion, motion);

      // biased average motion estimation between frames
      body.motion = _minBias * minMotion + (1 - _minBias) * maxMotion;

      if (body.sleepThreshold > 0 && body.motion < _motionSleepThreshold * timeFactor) {
        (body as any)['sleepCounter'] += 1;

        if ((body as any)['sleepCounter'] >= body.sleepThreshold)
          Sleeping.set(body, true);
      } else if ((body as any)['sleepCounter'] > 0) {
        (body as any)['sleepCounter'] -= 1;
      }
    }
  }

  /**
   * Given a set of colliding pairs, wakes the sleeping bodies involved.
   * @method afterCollisions
   * @param {pair[]} pairs
   * @param {number} timeScale
   */
  public static afterCollisions(pairs: Pair[], timeScale: number) {
    var timeFactor = timeScale * timeScale * timeScale;

    // wake up bodies involved in collisions
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];

      // don't wake inactive pairs
      if (!pair.isActive)
        continue;

      var collision = pair.collision,
        bodyA = collision.bodyA.parent!,
        bodyB = collision.bodyB.parent!;

      // don't wake if at least one body is static
      if ((bodyA.isSleeping && bodyB.isSleeping) || bodyA.isStatic || bodyB.isStatic)
        continue;

      if (bodyA.isSleeping || bodyB.isSleeping) {
        var sleepingBody = (bodyA.isSleeping && !bodyA.isStatic) ? bodyA : bodyB,
          movingBody = sleepingBody === bodyA ? bodyB : bodyA;

        if (!sleepingBody.isStatic && movingBody.motion > _motionWakeThreshold * timeFactor) {
          Sleeping.set(sleepingBody, false);
        }
      }
    }
  };

  /**
   * Set a body as sleeping or awake.
   * @method set
   * @param {body} body
   * @param {boolean} isSleeping
   */

  public static set(body: Body, isSleeping: boolean) {
    var wasSleeping = body.isSleeping;

    if (isSleeping) {
      body.isSleeping = true;
      (body as any)['sleepCounter'] = body.sleepThreshold;

      body.positionImpulse.x = 0;
      body.positionImpulse.y = 0;

      body.positionPrev.x = body.position.x;
      body.positionPrev.y = body.position.y;

      body.anglePrev = body.angle;
      body.speed = 0;
      body.angularSpeed = 0;
      body.motion = 0;

      if (!wasSleeping) {
        Events.trigger(body, 'sleepStart');
      }
    } else {
      body.isSleeping = false;
      (body as any)['sleepCounter'] = 0;

      if (wasSleeping) {
        Events.trigger(body, 'sleepEnd');
      }
    }
  }

}

/**
* The `Matter.Engine` module contains methods for creating and manipulating engines.
* An engine is a controller that manages updating the simulation of the world.
* See `Matter.Runner` for an optional game loop utility.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Engine
*/

export type Timing = {
  timestamp: number;
  timeScale: number;
}

export class Engine {
  public world: World;
  public pairs: Pairs;
  public broadphase: Grid;
  public render: Render | undefined;
  public mouse: Mouse | undefined;
  public mouseConstraint: MouseConstraint | undefined;
  public positionIterations = 6;
  public velocityIterations = 4;
  public constraintIterations = 2;
  public enableSleeping = false;
  public events = [];
  public timing: Timing = {
    timestamp: 0,
    timeScale: 1
  };

  /**
  * Creates a new engine. The options parameter is an object that specifies any properties you wish to override the defaults.
  * All properties have default values, and many are pre-calculated automatically based on other properties.
  * See the properties section below for detailed information on what you can pass via the `options` object.
  * @method create
  * @param {object} [options]
  * @return {engine} engine
  */

  // Engine.create = function (element, options) {
  //   // options may be passed as the first (and only) argument
  //   options = Common.isElement(element) ? options : element;
  //   element = Common.isElement(element) ? element : null;
  //   options = options || {};

  //   if (element || options.render) {
  //     Common.warn('Engine.create: engine.render is deprecated (see docs)');
  //   }

  //   var defaults = {
  //     positionIterations: 6,
  //     velocityIterations: 4,
  //     constraintIterations: 2,
  //     enableSleeping: false,
  //     events: [],
  //     plugin: {},
  //     timing: {
  //       timestamp: 0,
  //       timeScale: 1
  //     },
  //     broadphase: {
  //       controller: Grid
  //     }
  //   };

  //   var engine = Common.extend(defaults, options);

  //   // @deprecated
  //   if (element || engine.render) {
  //     var renderDefaults = {
  //       element: element,
  //       controller: Render
  //     };

  //     engine.render = Common.extend(renderDefaults, engine.render);
  //   }

  //   // @deprecated
  //   if (engine.render && engine.render.controller) {
  //     engine.render = engine.render.controller.create(engine.render);
  //   }

  //   // @deprecated
  //   if (engine.render) {
  //     engine.render.engine = engine;
  //   }

  //   engine.world = options.world || World.create(engine.world);
  //   engine.pairs = Pairs.create();
  //   engine.broadphase = engine.broadphase.controller.create(engine.broadphase);
  //   engine.metrics = engine.metrics || { extended: false };

  //   // @if DEBUG
  //   engine.metrics = Metrics.create(engine.metrics);
  //   // @endif

  //   return engine;
  // };

  public constructor(world: World) {
    this.world = world;
    this.timing = {
      timestamp: 0,
      timeScale: 1
    };
    this.pairs = new Pairs();
    this.broadphase = new Grid();
    //    this.broadphase = broadphase.controller.create(broadphase);

    // engine.world = options.world || World.create(engine.world);
    // engine.pairs = Pairs.create();
    // engine.metrics = engine.metrics || { extended: false };
  }

  public setRender(render: Render) {
    this.render = render;
    this.mouse = new Mouse(render.canvas);
    this.mouseConstraint = new MouseConstraint(this, {
      stiffness: 0.2,
    });
    this.world.addConstraint(this.mouseConstraint.constraint);
    return this.mouse;
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

  private bodiesUpdate(bodies: Body[], deltaTime: number, timeScale: number, correction: number, worldBounds?: Bounds) {
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];
      if (body.isStatic || body.isSleeping)
        continue;
      body.update(deltaTime, timeScale, correction);
    }
  }

  /**
  * Moves the simulation forward in time by `delta` ms.
  * The `correction` argument is an optional `Number` that specifies the time correction factor to apply to the update.
  * This can help improve the accuracy of the simulation in cases where `delta` is changing between updates.
  * The value of `correction` is defined as `delta / lastDelta`, i.e. the percentage change of `delta` over the last step.
  * Therefore the value is always `1` (no correction) when `delta` constant (or when no correction is desired, which is the default).
  * See the paper on <a href="http://lonesock.net/article/verlet.html">Time Corrected Verlet</a> for more information.
  *
  * Triggers `beforeUpdate` and `afterUpdate` events.
  * Triggers `collisionStart`, `collisionActive` and `collisionEnd` events.
  * @method update
  * @param {engine} engine
  * @param {number} [delta=16.666]
  * @param {number} [correction=1]
  */

  public update(delta = 1000 / 60, correction = 1) {
    const world = this.world;
    const timing = this.timing;
    const broadphase = this.broadphase;
    var broadphasePairs: any[];

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
    //Metrics.reset(engine.metrics);
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
    for (var i = 0; i < this.constraintIterations; i++) {
      Constraint.solveAll(allConstraints, timing.timeScale);
    }
    Constraint.postSolveAll(allBodies);

    // broadphase pass: find potential collision pairs
    if (broadphase.controller) {
      // if world is dirty, we must flush the whole grid
      if (world.isModified)
        broadphase.controller.clear(broadphase);

      // update the grid buckets based on current bodies
      broadphase.controller.update(broadphase, allBodies, world, world.isModified);
      broadphasePairs = broadphase.pairsList;
    } else {
      // if no broadphase set, we just pass all bodies
      broadphasePairs = allBodies;
    }

    // clear all composite modified flags
    if (world.isModified) {
      world.setModified(false, false, true);
    }

    // narrowphase pass: find actual collisions, then create or update collision pairs
    var collisions = broadphase.detector(broadphasePairs, this);

    // update collision pairs
    var pairs = this.pairs,
      timestamp = timing.timestamp;
    pairs.update(collisions, timestamp);
    pairs.removeOld(timestamp);

    // wake up bodies involved in collisions
    if (this.enableSleeping)
      Sleeping.afterCollisions(pairs.list, timing.timeScale);

    // trigger collision events
    if (pairs.collisionStart.length > 0)
      Events.trigger(this, 'collisionStart', { pairs: pairs.collisionStart });

    // iteratively resolve position between collisions
    Resolver.preSolvePosition(pairs.list);
    for (i = 0; i < this.positionIterations; i++) {
      Resolver.solvePosition(pairs.list, allBodies, timing.timeScale);
    }
    Resolver.postSolvePosition(allBodies);

    // update all constraints (second pass)
    Constraint.preSolveAll(allBodies);
    for (i = 0; i < this.constraintIterations; i++) {
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
      Events.trigger(this, 'collisionActive', { pairs: pairs.collisionActive });

    if (pairs.collisionEnd.length > 0)
      Events.trigger(this, 'collisionEnd', { pairs: pairs.collisionEnd });

    // @if DEBUG
    // update metrics log
    //Metrics.update(engine.metrics, engine);
    // @endif

    // clear force buffers
    Engine.bodiesClearForces(allBodies);

    Events.trigger(this, 'afterUpdate', event);
  }

  // /**
  //  * Merges two engines by keeping the configuration of `engineA` but replacing the world with the one from `engineB`.
  //  * @method merge
  //  * @param {engine} engineA
  //  * @param {engine} engineB
  //  */

  // Engine.merge = function (engineA, engineB) {
  //   Common.extend(engineA, engineB);

  //   if (engineB.world) {
  //     engineA.world = engineB.world;

  //     Engine.clear(engineA);

  //     var bodies = Composite.allBodies(engineA.world);

  //     for (var i = 0; i < bodies.length; i++) {
  //       var body = bodies[i];
  //       Sleeping.set(body, false);
  //       body.id = Common.nextId();
  //     }
  //   }
  // };

  /**
   * Clears the engine including the world, pairs and broadphase.
   * @method clear
   * @param {engine} this
   */

  public clear() {
    const world = this.world;
    this.pairs.clear();

    const broadphase = this.broadphase;
    if (broadphase.controller) {
      var bodies = world.allBodies();
      broadphase.controller.clear(broadphase);
      broadphase.controller.update(broadphase, bodies, world, true);
    }
  }

  /**
   * Zeroes the `body.force` and `body.torque` force buffers.
   * @method _bodiesClearForces
   * @private
   * @param {body[]} bodies
   */

  private static bodiesClearForces = function (bodies: Body[]) {
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];
      // reset force buffers
      body.force.x = 0;
      body.force.y = 0;
      body.torque = 0;
    }
  }

  /**
   * Applys a mass dependant force to all given bodies.
   * @method _bodiesApplyGravity
   * @private
   * @param {body[]} bodies
   * @param {vector} gravity
   */

  private static bodiesApplyGravity(bodies: Body[], gravity: Vector) {
    //var gravityScale = typeof gravity.scale !== 'undefined' ? gravity.scale : 0.001;
    var gravityScale = 0.001;

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

  private static bodiesUpdate(bodies: Body[], deltaTime: number, timeScale: number, correction: number, worldBounds?: Bounds) {
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];

      if (body.isStatic || body.isSleeping)
        continue;

      body.update(deltaTime, timeScale, correction);
    }
  }

}

/**
* The `Matter.Runner` module is an optional utility which provides a game loop, 
* that handles continuously updating a `Matter.Engine` for you within a browser.
* It is intended for development and debugging purposes, but may also be suitable for simple games.
* If you are using your own game loop instead, then you do not need the `Matter.Runner` module.
* Instead just call `Engine.update(engine, delta)` in your own loop.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Runner
*/

// var _frameTimeout: any;
// var _requestAnimationFrame = (callback: any) => {
//   _frameTimeout = setTimeout(function () {
//     callback(Common.now());
//   }, 1000 / 60);
//   return 0;
// };

// var _cancelAnimationFrame = (handle: number) => {
//   clearTimeout(_frameTimeout);
// }

const _requestAnimationFrame = window.requestAnimationFrame;
const _cancelAnimationFrame = window.cancelAnimationFrame;


// if (window) {
//   _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
//   //  || window['mozRequestAnimationFrame'] || window['msRequestAnimationFrame'];
//   _cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame
//   //  || window['mozCancelAnimationFrame'] || window['msCancelAnimationFrame'];
// }

export class Runner {
  public fps = 60;
  public correction = 1;
  public deltaSampleSize = 60;
  public counterTimestamp = 0;
  public frameCounter = 0;
  public deltaHistory: number[] = [];
  public timePrev = 0;
  public timeScalePrev = 1;
  public frameRequestId = -1;
  public isFixed = false;
  public enabled = true;
  delta: number;
  deltaMin: number;
  deltaMax: number;

  /**
   * Creates a new Runner. The options parameter is an object that specifies any properties you wish to override the defaults.
   * @method create
   * @param {} options
   */

  public constructor(options?: any) {
    if (options !== undefined) {
      Object.assign(this, options);
      this.delta = options.delta || 1000 / this.fps;
      this.deltaMin = options.deltaMin || 1000 / this.fps;
      this.deltaMax = options.deltaMax || 1000 / (this.fps * 0.5);
    }
    else {
      this.delta = 1000 / this.fps;
      this.deltaMin = 1000 / this.fps;
      this.deltaMax = 1000 / (this.fps * 0.5);
    }
    this.fps = 1000 / this.delta;
  }

  /**
   * Continuously ticks a `Matter.Engine` by calling `Runner.tick` on the `requestAnimationFrame` event.
   * @method run
   * @param {engine} engine
   */

  public static run(runner: Runner, engine: Engine) {
    // // create runner if engine is first argument
    // if (typeof runner.positionIterations !== 'undefined') {
    //   engine = runner;
    //   runner = Runner.create();
    // }

    (function render(time: number) {
      runner.frameRequestId = _requestAnimationFrame(render);

      if (time && runner.enabled) {
        Runner.tick(runner, engine, time);
      }
    })(0);

    return runner;
  };

  /**
   * A game loop utility that updates the engine and renderer by one step (a 'tick').
   * Features delta smoothing, time correction and fixed or dynamic timing.
   * Triggers `beforeTick`, `tick` and `afterTick` events on the engine.
   * Consider just `Engine.update(engine, delta)` if you're using your own loop.
   * @method tick
   * @param {runner} runner
   * @param {engine} engine
   * @param {number} time
   */

  public static tick(runner: Runner, engine: Engine, time: number) {
    const timing = engine.timing;
    var correction = 1;
    var delta;

    // create an event object
    var event = {
      timestamp: timing.timestamp
    };

    Events.trigger(runner, 'beforeTick', event);
    Events.trigger(engine, 'beforeTick', event); // @deprecated

    if (runner.isFixed) {
      // fixed timestep
      delta = runner.delta;
    } else {
      // dynamic timestep based on wall clock between calls
      delta = (time - runner.timePrev) || runner.delta;
      runner.timePrev = time;

      // optimistically filter delta over a few frames, to improve stability
      runner.deltaHistory.push(delta);
      runner.deltaHistory = runner.deltaHistory.slice(-runner.deltaSampleSize);
      delta = Math.min.apply(null, runner.deltaHistory);

      // limit delta
      delta = delta < runner.deltaMin ? runner.deltaMin : delta;
      delta = delta > runner.deltaMax ? runner.deltaMax : delta;

      // correction for delta
      correction = delta / runner.delta;

      // update engine timing object
      runner.delta = delta;
    }

    // time correction for time scaling
    if (runner.timeScalePrev !== 0)
      correction *= timing.timeScale / runner.timeScalePrev;

    if (timing.timeScale === 0)
      correction = 0;

    runner.timeScalePrev = timing.timeScale;
    runner.correction = correction;

    // fps counter
    runner.frameCounter += 1;
    if (time - runner.counterTimestamp >= 1000) {
      runner.fps = runner.frameCounter * ((time - runner.counterTimestamp) / 1000);
      runner.counterTimestamp = time;
      runner.frameCounter = 0;
    }

    Events.trigger(runner, 'tick', event);
    Events.trigger(engine, 'tick', event); // @deprecated

    // if world has been modified, clear the render scene graph
    // if (engine.world.isModified && engine.render) {
    //   engine.render.clear();
    // }

    // update
    Events.trigger(runner, 'beforeUpdate', event);
    engine.update(delta, correction);
    Events.trigger(runner, 'afterUpdate', event);

    // render
    // @deprecated
    if (engine.render) {
      Events.trigger(runner, 'beforeRender', event);
      Events.trigger(engine, 'beforeRender', event); // @deprecated

      engine.render.draw();

      Events.trigger(runner, 'afterRender', event);
      Events.trigger(engine, 'afterRender', event); // @deprecated
    }

    Events.trigger(runner, 'afterTick', event);
    Events.trigger(engine, 'afterTick', event); // @deprecated
  };

  /**
   * Ends execution of `Runner.run` on the given `runner`, by canceling the animation frame request event loop.
   * If you wish to only temporarily pause the engine, see `engine.enabled` instead.
   * @method stop
   * @param {runner} runner
   */

  public static stop(runner: Runner) {
    _cancelAnimationFrame(runner.frameRequestId);
  }

  /**
   * Alias for `Runner.run`.
   * @method start
   * @param {runner} runner
   * @param {engine} engine
   */
  public static start(runner: Runner, engine: Engine) {
    Runner.run(runner, engine);
  }
}

/**
* The `Matter` module is the top level namespace. It also includes a function for installing plugins on top of the library.
*
* @class Matter
*/

export class Matter {
  //public static name = 'matter-ts';
  public static version = '@@VERSION@@';
}
