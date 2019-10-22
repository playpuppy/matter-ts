import { Common, Events } from './core';
import { Vector, Vertex, Vertices, Bounds, Axes } from './geometry';
import { Body, Impulse } from './body';

/**
* The `Matter.Constraint` module contains methods for creating and manipulating constraints.
* Constraints are used for specifying that a fixed distance must be maintained between two bodies (or a body and a fixed world-space position).
* The stiffness of constraints can be modified to create springs or elastic.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Constraint
*/

const _warming = 0.4;
const _torqueDampen = 1;
const _minLength = 0.000001;

export class Constraint {
  public id: number;
  public label = 'Constraint';
  public type = 'constraint';
  public bodyA: Body;
  public bodyB: Body;
  public pointA: Vector;
  public pointB: Vector;
  length: number;
  stiffness: number;
  damping: number;
  angularStiffness: number;
  angleA: number;
  angleB: number;
  //plugin = {};

  /**
   * Creates a new constraint.
   * All properties have default values, and many are pre-calculated automatically based on other properties.
   * To simulate a revolute constraint (or pin joint) set `length: 0` and a high `stiffness` value (e.g. `0.7` or above).
   * If the constraint is unstable, try lowering the `stiffness` value and / or increasing `engine.constraintIterations`.
   * For compound bodies, constraints must be applied to the parent body (not one of its parts).
   * See the properties section below for detailed information on what you can pass via the `options` object.
   * @method create
   * @param {} options
   * @return {constraint} constraint
   */

  public static create(options) {
    var constraint = options;

    // if bodies defined but no points, use body centre
    if (constraint.bodyA && !constraint.pointA)
      constraint.pointA = { x: 0, y: 0 };
    if (constraint.bodyB && !constraint.pointB)
      constraint.pointB = { x: 0, y: 0 };

    // calculate static length using initial world space points
    var initialPointA = constraint.bodyA ? Vector.add(constraint.bodyA.position, constraint.pointA) : constraint.pointA,
      initialPointB = constraint.bodyB ? Vector.add(constraint.bodyB.position, constraint.pointB) : constraint.pointB,
      length = Vector.magnitude(Vector.sub(initialPointA, initialPointB));

    constraint.length = typeof constraint.length !== 'undefined' ? constraint.length : length;

    // option defaults
    constraint.id = constraint.id || Common.nextId();
    constraint.label = constraint.label || 'Constraint';
    constraint.type = 'constraint';
    constraint.stiffness = constraint.stiffness || (constraint.length > 0 ? 1 : 0.7);
    constraint.damping = constraint.damping || 0;
    constraint.angularStiffness = constraint.angularStiffness || 0;
    constraint.angleA = constraint.bodyA ? constraint.bodyA.angle : constraint.angleA;
    constraint.angleB = constraint.bodyB ? constraint.bodyB.angle : constraint.angleB;
    constraint.plugin = {};

    // render
    var render = {
      visible: true,
      lineWidth: 2,
      strokeStyle: '#ffffff',
      type: 'line',
      anchors: true
    };

    if (constraint.length === 0 && constraint.stiffness > 0.1) {
      render.type = 'pin';
      render.anchors = false;
    } else if (constraint.stiffness < 0.9) {
      render.type = 'spring';
    }

    constraint.render = Common.extend(render, constraint.render);

    return constraint;
  };

  /**
   * Prepares for solving by constraint warming.
   * @private
   * @method preSolveAll
   * @param {body[]} bodies
   */

  public static preSolveAll(bodies: Body[]) {
    for (var i = 0; i < bodies.length; i += 1) {
      var body = bodies[i];
      var impulse = body.constraintImpulse;

      if (body.isStatic || (impulse.x === 0 && impulse.y === 0 && impulse.angle === 0)) {
        continue;
      }

      body.position.x += impulse.x;
      body.position.y += impulse.y;
      body.angle += impulse.angle;
    }
  }

  /**
   * Solves all constraints in a list of collisions.
   * @private
   * @method solveAll
   * @param {constraint[]} constraints
   * @param {number} timeScale
   */
  public static solveAll(constraints: Constraint[], timeScale: number) {
    // Solve fixed constraints first.
    for (var i = 0; i < constraints.length; i += 1) {
      var constraint = constraints[i],
        fixedA = !constraint.bodyA || (constraint.bodyA && constraint.bodyA.isStatic),
        fixedB = !constraint.bodyB || (constraint.bodyB && constraint.bodyB.isStatic);

      if (fixedA || fixedB) {
        Constraint.solve(constraints[i], timeScale);
      }
    }

    // Solve free constraints last.
    for (i = 0; i < constraints.length; i += 1) {
      constraint = constraints[i];
      fixedA = !constraint.bodyA || (constraint.bodyA && constraint.bodyA.isStatic);
      fixedB = !constraint.bodyB || (constraint.bodyB && constraint.bodyB.isStatic);

      if (!fixedA && !fixedB) {
        Constraint.solve(constraints[i], timeScale);
      }
    }
  };

  /**
   * Solves a distance constraint with Gauss-Siedel method.
   * @private
   * @method solve
   * @param {constraint} constraint
   * @param {number} timeScale
   */
  static solve(constraint: Constraint, timeScale: number) {
    const bodyA = constraint.bodyA;
    const bodyB = constraint.bodyB;
    const pointA = constraint.pointA;
    const pointB = constraint.pointB;

    if (!bodyA && !bodyB)
      return;

    // update reference angle
    if (bodyA && !bodyA.isStatic) {
      Vector.rotate(pointA, bodyA.angle - constraint.angleA, pointA);
      constraint.angleA = bodyA.angle;
    }

    // update reference angle
    if (bodyB && !bodyB.isStatic) {
      Vector.rotate(pointB, bodyB.angle - constraint.angleB, pointB);
      constraint.angleB = bodyB.angle;
    }

    var pointAWorld = pointA;
    var pointBWorld = pointB;

    if (bodyA) pointAWorld = Vector.add(bodyA.position, pointA);
    if (bodyB) pointBWorld = Vector.add(bodyB.position, pointB);

    if (!pointAWorld || !pointBWorld)
      return;

    var delta = Vector.sub(pointAWorld, pointBWorld);
    var currentLength = Vector.magnitude(delta);

    // prevent singularity
    if (currentLength < _minLength) {
      currentLength = _minLength;
    }

    // solve distance constraint with Gauss-Siedel method
    var difference = (currentLength - constraint.length) / currentLength,
      stiffness = constraint.stiffness < 1 ? constraint.stiffness * timeScale : constraint.stiffness,
      force = Vector.mult(delta, difference * stiffness),
      massTotal = (bodyA ? bodyA.inverseMass : 0) + (bodyB ? bodyB.inverseMass : 0),
      inertiaTotal = (bodyA ? bodyA.inverseInertia : 0) + (bodyB ? bodyB.inverseInertia : 0),
      resistanceTotal = massTotal + inertiaTotal,
      torque,
      share,
      normal,
      normalVelocity,
      relativeVelocity;

    if (constraint.damping) {
      var zero = new Vector();
      normal = Vector.div(delta, currentLength);

      relativeVelocity = Vector.sub(
        bodyB && Vector.sub(bodyB.position, bodyB.positionPrev) || zero,
        bodyA && Vector.sub(bodyA.position, bodyA.positionPrev) || zero
      );

      normalVelocity = Vector.dot(normal, relativeVelocity);
    }

    if (bodyA && !bodyA.isStatic) {
      share = bodyA.inverseMass / massTotal;

      // keep track of applied impulses for post solving
      bodyA.constraintImpulse.x -= force.x * share;
      bodyA.constraintImpulse.y -= force.y * share;

      // apply forces
      bodyA.position.x -= force.x * share;
      bodyA.position.y -= force.y * share;

      // apply damping
      if (constraint.damping) {
        bodyA.positionPrev.x -= constraint.damping * normal.x * normalVelocity * share;
        bodyA.positionPrev.y -= constraint.damping * normal.y * normalVelocity * share;
      }

      // apply torque
      torque = (Vector.cross(pointA, force) / resistanceTotal) * _torqueDampen * bodyA.inverseInertia * (1 - constraint.angularStiffness);
      bodyA.constraintImpulse.angle -= torque;
      bodyA.angle -= torque;
    }

    if (bodyB && !bodyB.isStatic) {
      share = bodyB.inverseMass / massTotal;

      // keep track of applied impulses for post solving
      bodyB.constraintImpulse.x += force.x * share;
      bodyB.constraintImpulse.y += force.y * share;

      // apply forces
      bodyB.position.x += force.x * share;
      bodyB.position.y += force.y * share;

      // apply damping
      if (constraint.damping) {
        bodyB.positionPrev.x += constraint.damping * normal.x * normalVelocity * share;
        bodyB.positionPrev.y += constraint.damping * normal.y * normalVelocity * share;
      }

      // apply torque
      torque = (Vector.cross(pointB, force) / resistanceTotal) * _torqueDampen * bodyB.inverseInertia * (1 - constraint.angularStiffness);
      bodyB.constraintImpulse.angle += torque;
      bodyB.angle += torque;
    }
  }

  /**
   * Performs body updates required after solving constraints.
   * @private
   * @method postSolveAll
   * @param {body[]} bodies
   */
  public static postSolveAll(bodies: Body[]) {
    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i],
      var impulse = body.constraintImpulse;

      if (body.isStatic || (impulse.x === 0 && impulse.y === 0 && impulse.angle === 0)) {
        continue;
      }

      Sleeping.set(body, false);

      // update geometry and reset
      for (var j = 0; j < body.parts.length; j++) {
        var part = body.parts[j];

        Vertices.translate(part.vertices, impulse);

        if (j > 0) {
          part.position.x += impulse.x;
          part.position.y += impulse.y;
        }

        if (impulse.angle !== 0) {
          Vertices.rotate(part.vertices, impulse.angle, body.position);
          Axes.rotate(part.axes, impulse.angle);
          if (j > 0) {
            Vector.rotateAbout(part.position, impulse.angle, body.position, part.position);
          }
        }
        Bounds.update(part.bounds, part.vertices, body.velocity);
      }
      // dampen the cached impulse for warming next step
      impulse.angle *= _warming;
      impulse.x *= _warming;
      impulse.y *= _warming;
    }
  }

  /**
   * Returns the world-space position of `constraint.pointA`, accounting for `constraint.bodyA`.
   * @method pointAWorld
   * @param {constraint} this
   * @returns {vector} the world-space position
   */
  public pointAWorld() {
    return new Vector(
      (this.bodyA ? this.bodyA.position.x : 0) + this.pointA.x,
      (this.bodyA ? this.bodyA.position.y : 0) + this.pointA.y
    );
  }

  /**
   * Returns the world-space position of `constraint.pointB`, accounting for `constraint.bodyB`.
   * @method pointBWorld
   * @param {constraint} this
   * @returns {vector} the world-space position
   */
  public pointBWorld() {
    return new Vector(
      (this.bodyB ? this.bodyB.position.x : 0) + this.pointB.x,
      (this.bodyB ? this.bodyB.position.y : 0) + this.pointB.y
    );
  }

  /*
  *
  *  Properties Documentation
  *
  */

  /**
   * An integer `Number` uniquely identifying number generated in `Composite.create` by `Common.nextId`.
   *
   * @property id
   * @type number
   */

  /**
   * A `String` denoting the type of object.
   *
   * @property type
   * @type string
   * @default "constraint"
   * @readOnly
   */

  /**
   * An arbitrary `String` name to help the user identify and manage bodies.
   *
   * @property label
   * @type string
   * @default "Constraint"
   */

  /**
   * An `Object` that defines the rendering properties to be consumed by the module `Matter.Render`.
   *
   * @property render
   * @type object
   */

  /**
   * A flag that indicates if the constraint should be rendered.
   *
   * @property render.visible
   * @type boolean
   * @default true
   */

  /**
   * A `Number` that defines the line width to use when rendering the constraint outline.
   * A value of `0` means no outline will be rendered.
   *
   * @property render.lineWidth
   * @type number
   * @default 2
   */

  /**
   * A `String` that defines the stroke style to use when rendering the constraint outline.
   * It is the same as when using a canvas, so it accepts CSS style property values.
   *
   * @property render.strokeStyle
   * @type string
   * @default a random colour
   */

  /**
   * A `String` that defines the constraint rendering type. 
   * The possible values are 'line', 'pin', 'spring'.
   * An appropriate render type will be automatically chosen unless one is given in options.
   *
   * @property render.type
   * @type string
   * @default 'line'
   */

  /**
   * A `Boolean` that defines if the constraint's anchor points should be rendered.
   *
   * @property render.anchors
   * @type boolean
   * @default true
   */

  /**
   * The first possible `Body` that this constraint is attached to.
   *
   * @property bodyA
   * @type body
   * @default null
   */

  /**
   * The second possible `Body` that this constraint is attached to.
   *
   * @property bodyB
   * @type body
   * @default null
   */

  /**
   * A `Vector` that specifies the offset of the constraint from center of the `constraint.bodyA` if defined, otherwise a world-space position.
   *
   * @property pointA
   * @type vector
   * @default { x: 0, y: 0 }
   */

  /**
   * A `Vector` that specifies the offset of the constraint from center of the `constraint.bodyB` if defined, otherwise a world-space position.
   *
   * @property pointB
   * @type vector
   * @default { x: 0, y: 0 }
   */

  /**
   * A `Number` that specifies the stiffness of the constraint, i.e. the rate at which it returns to its resting `constraint.length`.
   * A value of `1` means the constraint should be very stiff.
   * A value of `0.2` means the constraint acts like a soft spring.
   *
   * @property stiffness
   * @type number
   * @default 1
   */

  /**
   * A `Number` that specifies the damping of the constraint, 
   * i.e. the amount of resistance applied to each body based on their velocities to limit the amount of oscillation.
   * Damping will only be apparent when the constraint also has a very low `stiffness`.
   * A value of `0.1` means the constraint will apply heavy damping, resulting in little to no oscillation.
   * A value of `0` means the constraint will apply no damping.
   *
   * @property damping
   * @type number
   * @default 0
   */

  /**
   * A `Number` that specifies the target resting length of the constraint. 
   * It is calculated automatically in `Constraint.create` from initial positions of the `constraint.bodyA` and `constraint.bodyB`.
   *
   * @property length
   * @type number
   */

  /**
   * An object reserved for storing plugin-specific properties.
   *
   * @property plugin
   * @type {}
   */

}

/**
* The `Matter.MouseConstraint` module contains methods for creating mouse constraints.
* Mouse constraints are used for allowing user interaction, providing the ability to move bodies via the mouse or touch.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class MouseConstraint
*/

export class MouseConstraint {

  /**
   * Creates a new mouse constraint.
   * All properties have default values, and many are pre-calculated automatically based on other properties.
   * See the properties section below for detailed information on what you can pass via the `options` object.
   * @method create
   * @param {engine} engine
   * @param {} options
   * @return {MouseConstraint} A new MouseConstraint
   */

  MouseConstraint.create = function (engine, options) {
    var mouse = (engine ? engine.mouse : null) || (options ? options.mouse : null);

    if (!mouse) {
      if (engine && engine.render && engine.render.canvas) {
        mouse = Mouse.create(engine.render.canvas);
      } else if (options && options.element) {
        mouse = Mouse.create(options.element);
      } else {
        mouse = Mouse.create();
        Common.warn('MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected');
      }
    }

    var constraint = Constraint.create({
      label: 'Mouse Constraint',
      pointA: mouse.position,
      pointB: { x: 0, y: 0 },
      length: 0.01,
      stiffness: 0.1,
      angularStiffness: 1,
      render: {
        strokeStyle: '#90EE90',
        lineWidth: 3
      }
    });

    var defaults = {
      type: 'mouseConstraint',
      mouse: mouse,
      element: null,
      body: null,
      constraint: constraint,
      collisionFilter: {
        category: 0x0001,
        mask: 0xFFFFFFFF,
        group: 0
      }
    };

    var mouseConstraint = Common.extend(defaults, options);

    Events.on(engine, 'beforeUpdate', function () {
      var allBodies = Composite.allBodies(engine.world);
      MouseConstraint.update(mouseConstraint, allBodies);
      MouseConstraint._triggerEvents(mouseConstraint);
    });

    return mouseConstraint;
  }

  /**
   * Updates the given mouse constraint.
   * @private
   * @method update
   * @param {MouseConstraint} mouseConstraint
   * @param {body[]} bodies
   */

  MouseConstraint.update = function (mouseConstraint, bodies) {
    var mouse = mouseConstraint.mouse,
      constraint = mouseConstraint.constraint,
      body = mouseConstraint.body;

    if (mouse.button === 0) {
      if (!constraint.bodyB) {
        for (var i = 0; i < bodies.length; i++) {
          body = bodies[i];
          if (Bounds.contains(body.bounds, mouse.position)
            && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
            for (var j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
              var part = body.parts[j];
              if (Vertices.contains(part.vertices, mouse.position)) {
                constraint.pointA = mouse.position;
                constraint.bodyB = mouseConstraint.body = body;
                constraint.pointB = { x: mouse.position.x - body.position.x, y: mouse.position.y - body.position.y };
                constraint.angleB = body.angle;

                Sleeping.set(body, false);
                Events.trigger(mouseConstraint, 'startdrag', { mouse: mouse, body: body });

                break;
              }
            }
          }
        }
      } else {
        Sleeping.set(constraint.bodyB, false);
        constraint.pointA = mouse.position;
      }
    } else {
      constraint.bodyB = mouseConstraint.body = null;
      constraint.pointB = null;

      if (body)
        Events.trigger(mouseConstraint, 'enddrag', { mouse: mouse, body: body });
    }
  };

  /**
   * Triggers mouse constraint events.
   * @method _triggerEvents
   * @private
   * @param {mouse} mouseConstraint
   */
  MouseConstraint._triggerEvents = function (mouseConstraint) {
    var mouse = mouseConstraint.mouse,
      mouseEvents = mouse.sourceEvents;

    if (mouseEvents.mousemove)
      Events.trigger(mouseConstraint, 'mousemove', { mouse: mouse });

    if (mouseEvents.mousedown)
      Events.trigger(mouseConstraint, 'mousedown', { mouse: mouse });

    if (mouseEvents.mouseup)
      Events.trigger(mouseConstraint, 'mouseup', { mouse: mouse });

    // reset the mouse state ready for the next step
    Mouse.clearSourceEvents(mouse);
  };

  /*
  *
  *  Events Documentation
  *
  */

  /**
  * Fired when the mouse has moved (or a touch moves) during the last step
  *
  * @event mousemove
  * @param {} event An event object
  * @param {mouse} event.mouse The engine's mouse instance
  * @param {} event.source The source object of the event
  * @param {} event.name The name of the event
  */

  /**
  * Fired when the mouse is down (or a touch has started) during the last step
  *
  * @event mousedown
  * @param {} event An event object
  * @param {mouse} event.mouse The engine's mouse instance
  * @param {} event.source The source object of the event
  * @param {} event.name The name of the event
  */

  /**
  * Fired when the mouse is up (or a touch has ended) during the last step
  *
  * @event mouseup
  * @param {} event An event object
  * @param {mouse} event.mouse The engine's mouse instance
  * @param {} event.source The source object of the event
  * @param {} event.name The name of the event
  */

  /**
  * Fired when the user starts dragging a body
  *
  * @event startdrag
  * @param {} event An event object
  * @param {mouse} event.mouse The engine's mouse instance
  * @param {body} event.body The body being dragged
  * @param {} event.source The source object of the event
  * @param {} event.name The name of the event
  */

  /**
  * Fired when the user ends dragging a body
  *
  * @event enddrag
  * @param {} event An event object
  * @param {mouse} event.mouse The engine's mouse instance
  * @param {body} event.body The body that has stopped being dragged
  * @param {} event.source The source object of the event
  * @param {} event.name The name of the event
  */

  /*
  *
  *  Properties Documentation
  *
  */

  /**
   * A `String` denoting the type of object.
   *
   * @property type
   * @type string
   * @default "constraint"
   * @readOnly
   */

  /**
   * The `Mouse` instance in use. If not supplied in `MouseConstraint.create`, one will be created.
   *
   * @property mouse
   * @type mouse
   * @default mouse
   */

  /**
   * The `Body` that is currently being moved by the user, or `null` if no body.
   *
   * @property body
   * @type body
   * @default null
   */

  /**
   * The `Constraint` object that is used to move the body during interaction.
   *
   * @property constraint
   * @type constraint
   */

  /**
   * An `Object` that specifies the collision filter properties.
   * The collision filter allows the user to define which types of body this mouse constraint can interact with.
   * See `body.collisionFilter` for more information.
   *
   * @property collisionFilter
   * @type object
   */

}