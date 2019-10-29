import { Common } from './commons';
import { Vector, Vertex, Vertices, Bounds, Axes } from './geometry';

const _inertiaScale = 4;
const _nextCollidingGroupId = 1;
const _nextNonCollidingGroupId = -1;
const _nextCategory = 0x0001;

export class Impulse extends Vector {
  public angle: number;
  public constructor() {
    super(0, 0);
    this.angle = 0;
  }
}

/**
* The `Matter.Body` module contains methods for creating and manipulating body models.
* A `Matter.Body` is a rigid body that can be simulated by a `Matter.Engine`.
* Factories for commonly used body configurations (such as rectangles, circles and other polygons) can be found in the module `Matter.Bodies`.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
* @class Body
*/

export type Filter = {
  category: number;
  mask: number;
  group: number;
}

export const DefaultCollisionFilter: Filter = {
  category: 0x0001,
  mask: 0xFFFFFFFF,
  group: 0
};

// export type BodyState = {
//   position: Vector;
//   angle: number;
//   force: Vector;
//   torque: number;
//   positionImpulse: Vector;
//   isStatic: boolean;
// }

export class Body {
  public id: number = -1;
  public type = 'body';
  public label = 'Body';
  public parts: Body[] = []; //
  //plugin: { },
  public position: Vector = new Vector(); //{ x: 0, y: 0 },
  public angle = 0;
  public vertices: Vertex[];
  public force: Vector = new Vector() // { x: 0, y: 0 },
  public torque = 0;
  public positionImpulse: Vector = new Vector() // { x: 0, y: 0 },
  public previousPositionImpulse: Vector = new Vector(); //{ x: 0, y: 0 },
  public constraintImpulse: Impulse = new Impulse(); //{ x: 0, y: 0, angle: 0 },
  public totalContacts = 0;
  public speed = 0;
  public angularSpeed = 0;
  public velocity: Vector = new Vector(); //{ x: 0, y: 0 },
  public angularVelocity = 0;
  public isSensor = false;
  public isStatic = false;
  public isSleeping = false;
  public motion = 0;
  public sleepThreshold = 60;
  public density = 0.001;
  public restitution = 0;
  public friction = 0.1;
  public frictionStatic = 0.5;
  public frictionAir = 0.01;
  public collisionFilter = DefaultCollisionFilter;
  public slop = 0.05;
  public timeScale = 1;
  // public render = {
  //   visible: true,
  //   opacity: 1,
  //   sprite: {
  //     xScale: 1,
  //     yScale: 1,
  //     xOffset: 0,
  //     yOffset: 0
  //   },
  //   lineWidth: 0
  // };
  public visible = true;
  public opacity = 1;
  public texture: string | undefined;
  public xScale = 1;
  public yScale = 1;
  public xOffset = 0;
  public yOffset = 0;
  public fillStyle = '';
  public strokeStyle = '';
  public lineWidth = 0;
  public events = [];
  public bounds: Bounds;
  public chamfer = null;
  public circleRadius: number | undefined;
  public positionPrev = new Vector();
  public anglePrev = 0;
  public parent: Body | undefined;
  public axes: Vector[] = [];
  public area = 0;
  public mass = 0;
  public inertia = 0;
  public inverseInertia: number = 0;
  public inverseMass: number = 0;

  public constructor(options: any = {}) {
    Object.assign(this, options);
    this.id = this.id === -1 ? Common.nextId() : this.id;
    this.vertices = options.vertices || Vertices.fromPath([0, 0, 40, 0, 40, 40, 0, 40]);
    // // init required properties (order is important)
    // Body.set(body, {
    //   bounds: body.bounds || Bounds.create(body.vertices),
    this.bounds = Bounds.create(this.vertices);
    //   positionPrev: body.positionPrev || Vector.clone(body.position),
    this.positionPrev = Vector.clone(this.position);
    //   anglePrev: body.anglePrev || body.angle,
    this.anglePrev = this.angle;
    //   vertices: body.vertices,
    this.setVertices(this.vertices);
    //   parts: body.parts || [body],
    this.setParts([this]);
    //   isSleeping: body.isSleeping,
    //   parent: body.parent || body
    // });
    this.parent = this;

    Vertices.rotate(this.vertices, this.angle, this.position);
    Axes.rotate(this.axes, this.angle);
    Bounds.update(this.bounds, this.vertices, this.velocity);

    // // allow options to override the automatically calculated properties
    // Body.set(body, {
    //   axes: options.axes || body.axes,
    //   area: options.area || body.area,
    //   mass: options.mass || body.mass,
    //   inertia: options.inertia || body.inertia
    // });
    this.setAngle(this.angle);
    this.setMass(this.mass);
    this.setInertia(this.inertia);
    //   isStatic: body.isStatic,
    this.setStatic(options['isStatic'] === true);

    // // render properties
    if (this.fillStyle === '') {
      this.fillStyle = '#2e2b44';
    }
    if (this.strokeStyle === '') {
      this.strokeStyle = this.fillStyle;
    }
    this.xOffset += -(this.bounds.min.x - this.position.x) / (this.bounds.max.x - this.bounds.min.x);
    this.yOffset += -(this.bounds.min.y - this.position.y) / (this.bounds.max.y - this.bounds.min.y);
    //console.log(`inertia=${this.inertia}, inverseIneria=${this.inverseInertia}, isStatic=${this.isStatic}`);
  }

  //public static None: Body = new Body();

  /**
 * Sets the body as static, including isStatic flag and setting mass and inertia to Infinity.
 * @method setStatic
 * @param {body} body
 * @param {bool} isStatic
 */

  public setStatic(isStatic: boolean) {
    for (var i = 0; i < this.parts.length; i++) {
      var part: any = this.parts[i];
      part.isStatic = isStatic;

      if (isStatic) {
        part._original = {
          restitution: part.restitution,
          friction: part.friction,
          mass: part.mass,
          inertia: part.inertia,
          density: part.density,
          inverseMass: part.inverseMass,
          inverseInertia: part.inverseInertia
        };

        part.restitution = 0;
        part.friction = 1;
        part.mass = part.inertia = part.density = Infinity;
        part.inverseMass = part.inverseInertia = 0;
        part.positionPrev.x = part.position.x;
        part.positionPrev.y = part.position.y;
        part.anglePrev = part.angle;
        part.angularVelocity = 0;
        part.speed = 0;
        part.angularSpeed = 0;
        part.motion = 0;
      } else if (part._original) {
        part.restitution = part._original.restitution;
        part.friction = part._original.friction;
        part.mass = part._original.mass;
        part.inertia = part._original.inertia;
        part.density = part._original.density;
        part.inverseMass = part._original.inverseMass;
        part.inverseInertia = part._original.inverseInertia;

        part._original = null;
      }
    }
  }

  /**
 * Sets the mass of the body. Inverse mass, density and inertia are automatically updated to reflect the change.
 * @method setMass
 * @param {body} body
 * @param {number} mass
 */

  public setMass(mass: number) {
    var moment = this.inertia / (this.mass / 6);
    this.inertia = moment * (mass / 6);
    this.inverseInertia = 1 / this.inertia;

    this.mass = mass;
    this.inverseMass = 1 / this.mass;
    this.density = this.mass / this.area;
  }

  /**
   * Sets the density of the body. Mass and inertia are automatically updated to reflect the change.
   * @method setDensity
   * @param {body} this
   * @param {number} density
   */

  public setDensity(density: number) {
    this.setMass(density * this.area);
    this.density = density;
  }

  /**
   * Sets the moment of inertia (i.e. second moment of area) of the body. 
   * Inverse inertia is automatically updated to reflect the change. Mass is not changed.
   * @method setInertia
   * @param {body} this
   * @param {number} inertia
   */

  public setInertia(inertia: number) {
    if (!this.isStatic) {
      this.inertia = inertia;
      this.inverseInertia = 1 / this.inertia;
    }
  }

  /**
   * Sets the body's vertices and updates body properties accordingly, including inertia, area and mass (with respect to `body.density`).
   * Vertices will be automatically transformed to be orientated around their centre of mass as the origin.
   * They are then automatically translated to world space based on `body.position`.
   *
   * The `vertices` argument should be passed as an array of `Matter.Vector` points (or a `Matter.Vertices` array).
   * Vertices must form a convex hull, concave hulls are not supported.
   *
   * @method setVertices
   * @param {body} this
   * @param {vector[]} vertices
   */
  public setVertices(vertices: Vertex[]) {
    // change vertices
    if (vertices[0].body === this) {
      this.vertices = vertices;
    } else {
      this.vertices = Vertices.create(vertices, this);
    }

    // update properties
    this.axes = Axes.fromVertices(this.vertices);
    this.area = Vertices.area(this.vertices);
    this.setMass(this.density * this.area);

    // orient vertices around the centre of mass at origin (0, 0)
    var centre = Vertices.centre(this.vertices);
    Vertices.translate(this.vertices, centre, -1);

    // update inertia while vertices are at origin (0, 0)
    this.setInertia(_inertiaScale * Vertices.inertia(this.vertices, this.mass));

    // update geometry
    Vertices.translate(this.vertices, this.position);
    Bounds.update(this.bounds, this.vertices, this.velocity);
  }

  /**
   * Sets the parts of the `body` and updates mass, inertia and centroid.
   * Each part will have its parent set to `body`.
   * By default the convex hull will be automatically computed and set on `body`, unless `autoHull` is set to `false.`
   * Note that this method will ensure that the first part in `body.parts` will always be the `body`.
   * @method setParts
   * @param {body} this
   * @param [this] parts
   * @param {bool} [autoHull=true]
   */

  public setParts(parts: Body[], autoHull = true) {
    // add all the parts, ensuring that the first part is always the parent body
    parts = parts.slice(0);
    this.parts.length = 0;
    this.parts.push(this);
    this.parent = this;

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part !== this) {
        part.parent = this;
        this.parts.push(part);
      }
    }

    if (this.parts.length === 1)
      return;

    // find the convex hull of all parts to set on the parent body
    if (autoHull) {
      var vertices: Vertex[] = [];
      for (var i = 0; i < parts.length; i++) {
        vertices = vertices.concat(parts[i].vertices);
      }
      Vertices.clockwiseSort(vertices);
      const hull = Vertices.hull(vertices);
      const hullCentre = Vertices.centre(hull);
      this.setVertices(hull);
      Vertices.translate(this.vertices, hullCentre);
    }

    // sum the properties of all compound parts of the parent body
    var total = this.totalProperties();

    this.area = total.area;
    this.parent = this;
    this.position.x = total.centre.x;
    this.position.y = total.centre.y;
    this.positionPrev.x = total.centre.x;
    this.positionPrev.y = total.centre.y;

    this.setMass(total.mass);
    this.setInertia(total.inertia);
    this.setPosition(total.centre);
  }

  /**
   * Set the centre of mass of the body. 
   * The `centre` is a vector in world-space unless `relative` is set, in which case it is a translation.
   * The centre of mass is the point the body rotates about and can be used to simulate non-uniform density.
   * This is equal to moving `body.position` but not the `body.vertices`.
   * Invalid if the `centre` falls outside the body's convex hull.
   * @method setCentre
   * @param {body} this
   * @param {vector} centre
   * @param {bool} relative
   */

  public setCentre(centre: Vector, relative?: boolean) {
    if (!relative) {
      this.positionPrev.x = centre.x - (this.position.x - this.positionPrev.x);
      this.positionPrev.y = centre.y - (this.position.y - this.positionPrev.y);
      this.position.x = centre.x;
      this.position.y = centre.y;
    } else {
      this.positionPrev.x += centre.x;
      this.positionPrev.y += centre.y;
      this.position.x += centre.x;
      this.position.y += centre.y;
    }
  };

  /**
   * Sets the position of the body instantly. Velocity, angle, force etc. are unchanged.
   * @method setPosition
   * @param {body} this
   * @param {vector} position
   */

  public setPosition(position: Vector) {
    var delta = Vector.sub(position, this.position);
    this.positionPrev.x += delta.x;
    this.positionPrev.y += delta.y;

    for (var i = 0; i < this.parts.length; i++) {
      var part = this.parts[i];
      part.position.x += delta.x;
      part.position.y += delta.y;
      Vertices.translate(part.vertices, delta);
      Bounds.update(part.bounds, part.vertices, this.velocity);
    }
  }

  /**
   * Sets the angle of the body instantly. Angular velocity, position, force etc. are unchanged.
   * @method setAngle
   * @param {body} body
   * @param {number} angle
   */

  public setAngle(angle: number) {
    var delta = angle - this.angle;
    this.anglePrev += delta;

    for (var i = 0; i < this.parts.length; i++) {
      var part = this.parts[i];
      part.angle += delta;
      Vertices.rotate(part.vertices, delta, this.position);
      Axes.rotate(part.axes, delta);
      Bounds.update(part.bounds, part.vertices, this.velocity);
      if (i > 0) {
        Vector.rotateAbout(part.position, delta, this.position, part.position);
      }
    }
  }

  /**
   * Sets the linear velocity of the body instantly. Position, angle, force etc. are unchanged. See also `Body.applyForce`.
   * @method setVelocity
   * @param {body} this
   * @param {vector} velocity
   */

  public setVelocity(velocity: Vector) {
    this.positionPrev.x = this.position.x - velocity.x;
    this.positionPrev.y = this.position.y - velocity.y;
    this.velocity.x = velocity.x;
    this.velocity.y = velocity.y;
    this.speed = Vector.magnitude(this.velocity);
  }

  /**
   * Sets the angular velocity of the body instantly. Position, angle, force etc. are unchanged. See also `Body.applyForce`.
   * @method setAngularVelocity
   * @param {body} this
   * @param {number} velocity
   */
  public setAngularVelocity(velocity: number) {
    this.anglePrev = this.angle - velocity;
    this.angularVelocity = velocity;
    this.angularSpeed = Math.abs(this.angularVelocity);
  }

  /**
   * Moves a body by a given vector relative to its current position, without imparting any velocity.
   * @method translate
   * @param {body} this
   * @param {vector} translation
   */

  public translate(translation: Vector) {
    this.setPosition(Vector.add(this.position, translation));
  }

  /**
   * Rotates a body by a given angle relative to its current angle, without imparting any angular velocity.
   * @method rotate
   * @param {body} this
   * @param {number} rotation
   * @param {vector} [point]
   */
  public rotate(rotation: number, point?: Vector) {
    if (!point) {
      this.setAngle(this.angle + rotation);
    } else {
      var cos = Math.cos(rotation),
        sin = Math.sin(rotation),
        dx = this.position.x - point.x,
        dy = this.position.y - point.y;

      this.setPosition(new Vector(
        point.x + (dx * cos - dy * sin),
        point.y + (dx * sin + dy * cos)
      ));
      this.setAngle(this.angle + rotation);
    }
  }

  /**
   * Scales the body, including updating physical properties (mass, area, axes, inertia), from a world-space point (default is body centre).
   * @method scale
   * @param {body} body
   * @param {number} scaleX
   * @param {number} scaleY
   * @param {vector} [point]
   */

  public scale(scaleX: number, scaleY: number, point?: Vector) {
    var totalArea = 0;
    var totalInertia = 0;
    point = point || this.position;

    for (var i = 0; i < this.parts.length; i++) {
      var part = this.parts[i];

      // scale vertices
      Vertices.scale(part.vertices, scaleX, scaleY, point);

      // update properties
      part.axes = Axes.fromVertices(part.vertices);
      part.area = Vertices.area(part.vertices);
      part.setMass(this.density * part.area);

      // update inertia (requires vertices to be at origin)
      Vertices.translate(part.vertices, { x: -part.position.x, y: -part.position.y });
      part.setInertia(_inertiaScale * Vertices.inertia(part.vertices, part.mass));
      Vertices.translate(part.vertices, { x: part.position.x, y: part.position.y });

      if (i > 0) {
        totalArea += part.area;
        totalInertia += part.inertia;
      }

      // scale position
      part.position.x = point.x + (part.position.x - point.x) * scaleX;
      part.position.y = point.y + (part.position.y - point.y) * scaleY;

      // update bounds
      Bounds.update(part.bounds, part.vertices, this.velocity);
    }

    // handle parent body
    if (this.parts.length > 1) {
      this.area = totalArea;

      if (!this.isStatic) {
        this.setMass(this.density * totalArea);
        this.setInertia(totalInertia);
      }
    }

    // handle circles
    if (this.circleRadius) {
      if (scaleX === scaleY) {
        this.circleRadius *= scaleX;
      } else {
        // body is no longer a circle
        this.circleRadius = undefined;
      }
    }
  }

  /**
   * Performs a simulation step for the given `body`, including updating position and angle using Verlet integration.
   * @method update
   * @param {body} body
   * @param {number} deltaTime
   * @param {number} timeScale
   * @param {number} correction
   */
  public update(deltaTime: number, timeScale: number, correction: number) {
    var deltaTimeSquared = Math.pow(deltaTime * timeScale * this.timeScale, 2);

    // from the previous step
    var frictionAir = 1 - this.frictionAir * timeScale * this.timeScale,
      velocityPrevX = this.position.x - this.positionPrev.x,
      velocityPrevY = this.position.y - this.positionPrev.y;

    // update velocity with Verlet integration
    this.velocity.x = (velocityPrevX * frictionAir * correction) + (this.force.x / this.mass) * deltaTimeSquared;
    this.velocity.y = (velocityPrevY * frictionAir * correction) + (this.force.y / this.mass) * deltaTimeSquared;

    this.positionPrev.x = this.position.x;
    this.positionPrev.y = this.position.y;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // update angular velocity with Verlet integration
    this.angularVelocity = ((this.angle - this.anglePrev) * frictionAir * correction) + (this.torque / this.inertia) * deltaTimeSquared;
    this.anglePrev = this.angle;
    this.angle += this.angularVelocity;

    // track speed and acceleration
    this.speed = Vector.magnitude(this.velocity);
    this.angularSpeed = Math.abs(this.angularVelocity);

    // transform the body geometry
    for (var i = 0; i < this.parts.length; i++) {
      var part = this.parts[i];

      Vertices.translate(part.vertices, this.velocity);

      if (i > 0) {
        part.position.x += this.velocity.x;
        part.position.y += this.velocity.y;
      }

      if (this.angularVelocity !== 0) {
        Vertices.rotate(part.vertices, this.angularVelocity, this.position);
        Axes.rotate(part.axes, this.angularVelocity);
        if (i > 0) {
          Vector.rotateAbout(part.position, this.angularVelocity, this.position, part.position);
        }
      }

      Bounds.update(part.bounds, part.vertices, this.velocity);
    }
  }

  /**
   * Applies a force to a body from a given world-space position, including resulting torque.
   * @method applyForce
   * @param {body} body
   * @param {vector} position
   * @param {vector} force
   */

  public applyForce(position: Vector, force: Vector) {
    this.force.x += force.x;
    this.force.y += force.y;
    const offsetX = position.x - this.position.x;
    const offsetY = position.y - this.position.y;
    this.torque += offsetX * force.y - offsetY * force.x;
  }

  /**
   * Returns the sums of the properties of all compound parts of the parent body.
   * @method _totalProperties
   * @private
   * @param {body} body
   * @return {}
   */

  private totalProperties() {
    // from equations at:
    // https://ecourses.ou.edu/cgi-bin/ebook.cgi?doc=&topic=st&chap_sec=07.2&page=theory
    // http://output.to/sideway/default.asp?qno=121100087

    var properties = {
      mass: 0,
      area: 0,
      inertia: 0,
      centre: new Vector()
    }

    // sum the properties of all compound parts of the parent body
    for (var i = this.parts.length === 1 ? 0 : 1; i < this.parts.length; i++) {
      const part = this.parts[i];
      const mass = part.mass !== Infinity ? part.mass : 1;

      properties.mass += mass;
      properties.area += part.area;
      properties.inertia += part.inertia;
      properties.centre = Vector.add(properties.centre, Vector.mult(part.position, mass));
    }

    properties.centre = Vector.div(properties.centre, properties.mass);

    return properties;
  }
}

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
  public bodyA: Body | null = null;
  public bodyB: Body | null = null;
  public pointA: Vector | null = null;
  public pointB: Vector | null = null;
  public length: number = -1;
  public stiffness: number = 0.7;
  public damping: number = 0;
  public angularStiffness: number = 0;
  public angleA: number = 0;
  public angleB: number = 0;
  //plugin = {};
  // render

  // render
  //     var render = {
  //   visible: true,
  //   lineWidth: 2,
  //   strokeStyle: '#ffffff',
  //   type: 'line',
  //   anchors: true
  // };
  public visible = true;
  public lineWidth = 2;
  public strokeStyle = '#ffffff';
  public renderType = 'line'; // type
  public anchors = true;

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

  public constructor(options?: any) {
    this.id = Common.nextId();
    this.label = this.label || 'Constraint';
    this.type = 'constraint';

    if (options !== undefined) {
      Object.assign(this, options);
    }

    // if bodies defined but no points, use body centre
    if (this.bodyA && !this.pointA)
      this.pointA = new Vector();
    if (this.bodyB && !this.pointB)
      this.pointB = new Vector();

    // calculate static length using initial world space points
    if (this.length === -1) {
      const initialPointA = this.bodyA ? Vector.add(this.bodyA.position, this.pointA!) : this.pointA!;
      const initialPointB = this.bodyB ? Vector.add(this.bodyB.position, this.pointB!) : this.pointB!;
      this.length = Vector.magnitude(Vector.sub(initialPointA, initialPointB));
    }

    // option defaults

    this.stiffness = this.stiffness || (this.length > 0 ? 1 : 0.7);
    this.damping = this.damping || 0;
    this.angularStiffness = this.angularStiffness || 0;
    this.angleA = this.bodyA ? this.bodyA.angle : this.angleA;
    this.angleB = this.bodyB ? this.bodyB.angle : this.angleB;

    if (this.length === 0 && this.stiffness > 0.1) {
      this.renderType = 'pin';
      this.anchors = false;
    } else if (this.stiffness < 0.9) {
      this.renderType = 'spring';
    }
    return this;
  }

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
    const pointA = constraint.pointA!;
    const pointB = constraint.pointB!;

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
    const difference = (currentLength - constraint.length) / currentLength;
    const stiffness = constraint.stiffness < 1 ? constraint.stiffness * timeScale : constraint.stiffness;
    const force = Vector.mult(delta, difference * stiffness);
    const massTotal = (bodyA ? bodyA.inverseMass : 0) + (bodyB ? bodyB.inverseMass : 0);
    const inertiaTotal = (bodyA ? bodyA.inverseInertia : 0) + (bodyB ? bodyB.inverseInertia : 0);
    const resistanceTotal = massTotal + inertiaTotal;
    const zero = new Vector();
    var normal = zero;
    var normalVelocity = 0;

    if (constraint.damping) {
      normal = Vector.div(delta, currentLength);

      var relativeVelocity = Vector.sub(
        bodyB && Vector.sub(bodyB.position, bodyB.positionPrev) || zero,
        bodyA && Vector.sub(bodyA.position, bodyA.positionPrev) || zero
      );

      normalVelocity = Vector.dot(normal, relativeVelocity);
    }

    if (bodyA && !bodyA.isStatic) {
      var share = bodyA.inverseMass / massTotal;

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
      const torque = (Vector.cross(pointA, force) / resistanceTotal) * _torqueDampen * bodyA.inverseInertia * (1 - constraint.angularStiffness);
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
      const torque = (Vector.cross(pointB, force) / resistanceTotal) * _torqueDampen * bodyB.inverseInertia * (1 - constraint.angularStiffness);
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
      const body = bodies[i];
      var impulse = body.constraintImpulse;

      if (body.isStatic || (impulse.x === 0 && impulse.y === 0 && impulse.angle === 0)) {
        continue;
      }

      //FIXME
      //Sleeping.set(body, false);

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
      (this.bodyA ? this.bodyA.position.x : 0) + this.pointA!.x,
      (this.bodyA ? this.bodyA.position.y : 0) + this.pointA!.y
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
      (this.bodyB ? this.bodyB.position.x : 0) + this.pointB!.x,
      (this.bodyB ? this.bodyB.position.y : 0) + this.pointB!.y
    );
  }
}

/**
* The `Matter.Composite` module contains methods for creating and manipulating composite bodies.
* A composite body is a collection of `Matter.Body`, `Matter.Constraint` and other `Matter.Composite`, therefore composites form a tree structure.
* It is important to use the functions in this module to modify composites, rather than directly modifying their properties.
* Note that the `Matter.World` object is also a type of `Matter.Composite` and as such all composite methods here can also operate on a `Matter.World`.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Composite
*/

export class Composite {
  public id: number = -1;
  public type = 'composite';
  public parent: Composite | undefined;
  public isModified = false;
  public bodies: Body[] = [];
  public constraints: Constraint[] = [];
  public composites: Composite[] = [];
  public label = 'Composite';
  //plugin: { }

  /**
   * Creates a new composite. The options parameter is an object that specifies any properties you wish to override the defaults.
   * See the properites section below for detailed information on what you can pass via the `options` object.
   * @method create
   * @param {} [options]
   * @return {composite} A new composite
   */

  public constructor(options: any = {}) {
    if (options) {
      Object.assign(this, options)
    }
    this.id = this.id === -1 ? Common.nextId() : this.id;
    this.parent = undefined;
  }

  /**
   * Sets the composite's `isModified` flag. 
   * If `updateParents` is true, all parents will be set (default: false).
   * If `updateChildren` is true, all children will be set (default: false).
   * @method setModified
   * @param {composite} this
   * @param {boolean} isModified
   * @param {boolean} [updateParents=false]
   * @param {boolean} [updateChildren=false]
   */

  public setModified(isModified: boolean, updateParents = false, updateChildren = false) {
    this.isModified = isModified;

    if (updateParents && this.parent) {
      this.parent.setModified(isModified, updateParents, updateChildren);
    }

    if (updateChildren) {
      for (var i = 0; i < this.composites.length; i++) {
        const childComposite = this.composites[i];
        childComposite.setModified(isModified, updateParents, updateChildren);
      }
    }
  }

  /**
   * Generic add function. Adds one or many body(s), constraint(s) or a composite(s) to the given composite.
   * Triggers `beforeAdd` and `afterAdd` events on the `composite`.
   * @method add
   * @param {composite} this
   * @param {} object
   * @return {composite} The original composite with the objects added
   */

  public add(objects: any[]) {
    //var objects: any[] = [].concat(object);
    //FIXME
    //Events.trigger(this, 'beforeAdd', { object: object });
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj instanceof Body) {
        this.addBody(obj);
      }
      else if (obj instanceof Constraint) {
        this.addConstraint(obj);
      }
      else if (obj instanceof Composite) {
        this.addComposite(obj);
      }
      // FIXME
      // else if (obj instanceof MouseConstraint) {
      //   this.addConstraint(obj.constraint);
      // }
    }
    //FIXME
    //Events.trigger(this, 'afterAdd', { object: object });
    return this;
  }

  /**
   * Generic remove function. Removes one or many body(s), constraint(s) or a composite(s) to the given composite.
   * Optionally searching its children recursively.
   * Triggers `beforeRemove` and `afterRemove` events on the `composite`.
   * @method remove
   * @param {composite} this
   * @param {} object
   * @param {boolean} [deep=false]
   * @return {composite} The original composite with the objects removed
   */

  public remove(object: any, deep = false) {
    var objects: any[] = [].concat(object);
    //FIXME
    //Events.trigger(this, 'beforeRemove', { object: object });
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj instanceof Body) {
        this.removeBody(obj);
      }
      else if (obj instanceof Constraint) {
        this.removeConstraint(obj);
      }
      else if (obj instanceof Composite) {
        this.removeComposite(obj);
      }
      // FIXME
      // else if (obj instanceof MouseConstraint) {
      //   this.removeConstraint(obj.constraint);
      // }
    }
    //FIXME
    //Events.trigger(this, 'afterRemove', { object: object });
    return this;
  }

  /**
   * Adds a composite to the given composite.
   * @private
   * @method addComposite
   * @param {composite} this
   * @param {composite} compositeB
   * @return {composite} The original compositeA with the objects from compositeB added
   */

  public addComposite(compositeB: Composite) {
    this.composites.push(compositeB);
    compositeB.parent = this;
    this.setModified(true, true, false);
    return this;
  }

  /**
   * Removes a composite from the given composite, and optionally searching its children recursively.
   * @private
   * @method removeComposite
   * @param {composite} this
   * @param {composite} compositeB
   * @param {boolean} [deep=false]
   * @return {composite} The original compositeA with the composite removed
   */
  public removeComposite(compositeB: Composite, deep = false) {
    var position = Common.indexOf(this.composites, compositeB);
    if (position !== -1) {
      this.removeCompositeAt(position);
      this.setModified(true, true, false);
    }
    if (deep) {
      for (var i = 0; i < this.composites.length; i++) {
        this.composites[i].removeComposite(compositeB, true);
      }
    }
    return this;
  }

  /**
   * Removes a composite from the given composite.
   * @private
   * @method removeCompositeAt
   * @param {composite} this
   * @param {number} position
   * @return {composite} The original composite with the composite removed
   */
  public removeCompositeAt(position: number) {
    this.composites.splice(position, 1);
    this.setModified(true, true, false);
    return this;
  };

  /**
   * Adds a body to the given composite.
   * @private
   * @method addBody
   * @param {composite} this
   * @param {body} body
   * @return {composite} The original composite with the body added
   */
  public addBody(body: Body) {
    this.bodies.push(body);
    this.setModified(true, true, false);
    return this;
  }

  /**
   * Removes a body from the given composite, and optionally searching its children recursively.
   * @private
   * @method removeBody
   * @param {composite} composite
   * @param {body} body
   * @param {boolean} [deep=false]
   * @return {composite} The original composite with the body removed
   */
  public removeBody(body: Body, deep = false) {
    var position = Common.indexOf(this.bodies, body);
    if (position !== -1) {
      this.removeBodyAt(position);
      this.setModified(true, true, false);
    }
    if (deep) {
      for (var i = 0; i < this.composites.length; i++) {
        this.composites[i].removeBody(body, true);
      }
    }
    return this;
  }

  /**
   * Removes a body from the given composite.
   * @private
   * @method removeBodyAt
   * @param {composite} composite
   * @param {number} position
   * @return {composite} The original composite with the body removed
   */
  public removeBodyAt(position: number) {
    this.bodies.splice(position, 1);
    this.setModified(true, true, false);
    return this;
  }

  /**
   * Adds a constraint to the given composite.
   * @private
   * @method addConstraint
   * @param {composite} this
   * @param {constraint} constraint
   * @return {composite} The original composite with the constraint added
   */
  public addConstraint(constraint: Constraint) {
    this.constraints.push(constraint);
    this.setModified(true, true, false);
    return this;
  };

  /**
   * Removes a constraint from the given composite, and optionally searching its children recursively.
   * @private
   * @method removeConstraint
   * @param {composite} this
   * @param {constraint} constraint
   * @param {boolean} [deep=false]
   * @return {composite} The original composite with the constraint removed
   */
  public removeConstraint(constraint: Constraint, deep = false) {
    var position = Common.indexOf(this.constraints, constraint);
    if (position !== -1) {
      this.removeConstraintAt(position);
    }

    if (deep) {
      for (var i = 0; i < this.composites.length; i++) {
        this.composites[i].removeConstraint(constraint, true);
      }
    }

    return this;
  };

  /**
   * Removes a body from the given composite.
   * @private
   * @method removeConstraintAt
   * @param {composite} this
   * @param {number} position
   * @return {composite} The original composite with the constraint removed
   */

  public removeConstraintAt(position: number) {
    this.constraints.splice(position, 1);
    this.setModified(true, true, false);
    return this;
  }

  /**
   * Removes all bodies, constraints and composites from the given composite.
   * Optionally clearing its children recursively.
   * @method clear
   * @param {composite} this
   * @param {boolean} keepStatic
   * @param {boolean} [deep=false]
   */
  public clear(keepStatic: boolean, deep = false) {
    if (deep) {
      for (var i = 0; i < this.composites.length; i++) {
        this.composites[i].clear(keepStatic, true);
      }
    }

    if (keepStatic) {
      this.bodies = this.bodies.filter((body: Body) => body.isStatic);
    } else {
      this.bodies.length = 0;
    }

    this.constraints.length = 0;
    this.composites.length = 0;
    this.setModified(true, true, false);
    return this;
  }

  /**
   * Returns all bodies in the given composite, including all bodies in its children, recursively.
   * @method allBodies
   * @param {composite} composite
   * @return {body[]} All the bodies
   */

  public allBodies(): Body[] {
    var bodies: Body[] = ([] as Body[]).concat(this.bodies);
    for (var i = 0; i < this.composites.length; i++) {
      bodies = bodies.concat(this.composites[i].allBodies());
    }
    return bodies;
  }

  /**
   * Returns all constraints in the given composite, including all constraints in its children, recursively.
   * @method allConstraints
   * @param {composite} composite
   * @return {constraint[]} All the constraints
   */

  public allConstraints(): Constraint[] {
    var constraints = ([] as Constraint[]).concat(this.constraints);
    for (var i = 0; i < this.composites.length; i++) {
      constraints = constraints.concat(this.composites[i].allConstraints());
    }
    return constraints;
  }

  /**
   * Returns all composites in the given composite, including all composites in its children, recursively.
   * @method allComposites
   * @param {composite} this
   * @return {composite[]} All the composites
   */

  public allComposites(): Composite[] {
    var composites = ([] as Composite[]).concat(this.composites);
    for (var i = 0; i < this.composites.length; i++) {
      composites = composites.concat(this.composites[i].allComposites());
    }
    return composites;
  }

  // /**
  //  * Searches the composite recursively for an object matching the type and id supplied, null if not found.
  //  * @method get
  //  * @param {composite} composite
  //  * @param {number} id
  //  * @param {string} type
  //  * @return {object} The requested object, if found
  //  */
  // public get(id: number, type: string) {
  //   var objects,
  //     object;

  //   switch (type) {
  //     case 'body':
  //       objects = this.allBodies();
  //       break;
  //     case 'constraint':
  //       objects = this.allConstraints();
  //       break;
  //     case 'composite':
  //       objects = this.allComposites().concat(this);
  //       break;
  //   }

  //   if (!objects)
  //     return null;

  //   object = objects.filter(function (object) {
  //     return object.id.toString() === id.toString();
  //   });

  //   return object.length === 0 ? null : object[0];
  // };

  // /**
  //  * Moves the given object(s) from compositeA to compositeB (equal to a remove followed by an add).
  //  * @method move
  //  * @param {compositeA} compositeA
  //  * @param {object[]} objects
  //  * @param {compositeB} compositeB
  //  * @return {composite} Returns compositeA
  //  */
  // public move(objects, compositeB: Composite) {
  //   this.remove(objects);
  //   compositeB.add(objects);
  //   return this;
  // }

  /**
   * Assigns new ids for all objects in the composite, recursively.
   * @method rebase
   * @param {composite} composite
   * @return {composite} Returns composite
   */
  public rebase() {
    const objects: any[] = (this.allBodies() as any[])
      .concat(this.allConstraints() as any[])
      .concat(this.allComposites() as any[]);

    for (var i = 0; i < objects.length; i++) {
      objects[i].id = Common.nextId();
    }
    this.setModified(true, true, false);
    return this;
  }

  /**
   * Translates all children in the composite by a given vector relative to their current positions, 
   * without imparting any velocity.
   * @method translate
   * @param {composite} composite
   * @param {vector} translation
   * @param {bool} [recursive=true]
   */

  public translate(translation: Vector, recursive = true) {
    const bodies = recursive ? this.allBodies() : this.bodies;

    for (var i = 0; i < bodies.length; i++) {
      bodies[i].translate(translation);
    }

    this.setModified(true, true, false);
    return this;
  }

  /**
   * Rotates all children in the composite by a given angle about the given point, without imparting any angular velocity.
   * @method rotate
   * @param {composite} composite
   * @param {number} rotation
   * @param {vector} point
   * @param {bool} [recursive=true]
   */

  public rotate(rotation: number, point: Vector, recursive = true) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const bodies = recursive ? this.allBodies() : this.bodies;

    for (var i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const dx = body.position.x - point.x;
      const dy = body.position.y - point.y;

      body.setPosition(new Vector(
        point.x + (dx * cos - dy * sin),
        point.y + (dx * sin + dy * cos)
      ));
      body.rotate(rotation);
    }
    this.setModified(true, true, false);
    return this;
  }

  /**
   * Scales all children in the composite, including updating physical properties (mass, area, axes, inertia), from a world-space point.
   * @method scale
   * @param {composite} composite
   * @param {number} scaleX
   * @param {number} scaleY
   * @param {vector} point
   * @param {bool} [recursive=true]
   */

  public scale(scaleX: number, scaleY: number, point: Vector, recursive = true) {
    const bodies = recursive ? this.allBodies() : this.bodies;

    for (var i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const dx = body.position.x - point.x;
      const dy = body.position.y - point.y;

      body.setPosition(new Vector(
        point.x + dx * scaleX,
        point.y + dy * scaleY
      ));

      body.scale(scaleX, scaleY);
    }
    this.setModified(true, true, false);
    return this;
  }

  /**
   * Returns the union of the bounds of all of the composite's bodies.
   * @method bounds
   * @param {composite} this The composite.
   * @returns {bounds} The composite bounds.
   */

  public mkbounds() {
    const bodies = this.allBodies();
    const vertices: Vector[] = [];

    for (var i = 0; i < bodies.length; i += 1) {
      var body = bodies[i];
      vertices.push(body.bounds.min, body.bounds.max);
    }

    return Bounds.create(vertices);
  }
}

export class World extends Composite {
  public gravity: Vector = new Vector(0, 1);
  public bounds: Bounds = new Bounds(0, 0, 1000, 1000);

  public constructor(options: any = {}) {
    super(options);
  }

}
