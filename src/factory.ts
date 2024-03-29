
import { Body, Composite, Constraint } from './body';
import { Vertices, Vector, Bounds } from './geometry';

/**
* The `Matter.Bodies` module contains factory methods for creating rigid body models 
* with commonly used body configurations (such as rectangles, circles and other polygons).
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Bodies
*/

// TODO: true circle bodies

export class Bodies {
  /**
   * Creates a new rigid body model with a rectangle hull. 
   * The options parameter is an object that specifies any properties you wish to override the defaults.
   * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
   * @method rectangle
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {object} [options]
   * @return {body} A new rectangle body
   */

  public static rectangle(x: number, y: number, width: number, height: number, options: any = {}) {
    var rectangle: any = {
      label: 'Rectangle Body',
      position: new Vector(x, y),
      vertices: Vertices.fromPath([0, 0, width, 0, width, height, 0, height])
    }
    if (options.chamfer) {
      var chamfer = options.chamfer;
      rectangle.vertices = Vertices.chamfer(rectangle.vertices, chamfer.radius,
        chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
      delete options.chamfer;
    }
    Object.assign(options, rectangle);
    return new Body(options);
  }

  /**
   * Creates a new rigid body model with a trapezoid hull. 
   * The options parameter is an object that specifies any properties you wish to override the defaults.
   * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
   * @method trapezoid
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {number} slope
   * @param {object} [options]
   * @return {body} A new trapezoid body
   */

  public static trapezoid(x: number, y: number, width: number, height: number, slope: number, options: any = {}) {
    slope *= 0.5;
    var roof = (1 - (slope * 2)) * width;

    const x1 = width * slope;
    const x2 = x1 + roof;
    const x3 = x2 + x1;
    var verticesPath: number[];

    if (slope < 0.5) {
      //verticesPath = 'L 0 0 L ' + x1 + ' ' + (-height) + ' L ' + x2 + ' ' + (-height) + ' L ' + x3 + ' 0';
      verticesPath = [0, 0, x1, (-height), x2, (-height), x3, 0];
    } else {
      //verticesPath = 'L 0 0 L ' + x2 + ' ' + (-height) + ' L ' + x3 + ' 0';
      verticesPath = [0, 0, x2, (-height), x3, 0];
    }

    var trapezoid: any = {
      label: 'Trapezoid Body',
      position: { x: x, y: y },
      vertices: Vertices.fromPath(verticesPath)
    };

    if (options.chamfer) {
      var chamfer = options.chamfer;
      trapezoid.vertices = Vertices.chamfer(trapezoid.vertices, chamfer.radius,
        chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
      delete options.chamfer;
    }
    Object.assign(trapezoid, options);
    return new Body(trapezoid);
  }

  /**
   * Creates a new rigid body model with a circle hull. 
   * The options parameter is an object that specifies any properties you wish to override the defaults.
   * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
   * @method circle
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {object} [options]
   * @param {number} [maxSides]
   * @return {body} A new circle body
   */
  public static circle(x: number, y: number, radius: number, options: any = {}, maxSides = 25): Body {
    var circle = {
      label: 'Circle Body',
      circleRadius: radius
    }

    // approximate circles with polygons until true circles implemented in SAT
    var sides = Math.ceil(Math.max(10, Math.min(maxSides, radius)));

    // optimisation: always use even number of sides (half the number of unique axes)
    if (sides % 2 === 1)
      sides += 1;
    Object.assign(options, circle);
    return Bodies.polygon(x, y, sides, radius, options);
  }

  /**
   * Creates a new rigid body model with a regular polygon hull with the given number of sides. 
   * The options parameter is an object that specifies any properties you wish to override the defaults.
   * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
   * @method polygon
   * @param {number} x
   * @param {number} y
   * @param {number} sides
   * @param {number} radius
   * @param {object} [options]
   * @return {body} A new regular polygon body
   */

  public static polygon(x: number, y: number, sides: number, radius: number, options: any = {}): Body {
    if (sides < 3)
      return Bodies.circle(x, y, radius, options);
    const theta = 2 * Math.PI / sides;
    const path: number[] = [];
    const offset = theta * 0.5;

    for (var i = 0; i < sides; i += 1) {
      var angle = offset + (i * theta),
        xx = Math.cos(angle) * radius,
        yy = Math.sin(angle) * radius;
      //path += 'L ' + xx.toFixed(3) + ' ' + yy.toFixed(3) + ' ';
      path.push(xx);
      path.push(yy);
    }

    var polygon: any = {
      label: 'Polygon Body',
      position: new Vector(x, y),
      vertices: Vertices.fromPath(path)
    };
    if (options.chamfer) {
      var chamfer = options.chamfer;
      polygon.vertices = Vertices.chamfer(polygon.vertices, chamfer.radius,
        chamfer.quality, chamfer.qualityMin, chamfer.qualityMax);
      delete options.chamfer;
    }
    Object.assign(options, polygon);
    return new Body(options);
  }

  /**
   * Creates a body using the supplied vertices (or an array containing multiple sets of vertices).
   * If the vertices are convex, they will pass through as supplied.
   * Otherwise if the vertices are concave, they will be decomposed if [poly-decomp.js](https://github.com/schteppe/poly-decomp.js) is available.
   * Note that this process is not guaranteed to support complex sets of vertices (e.g. those with holes may fail).
   * By default the decomposition will discard collinear edges (to improve performance).
   * It can also optionally discard any parts that have an area less than `minimumArea`.
   * If the vertices can not be decomposed, the result will fall back to using the convex hull.
   * The options parameter is an object that specifies any `Matter.Body` properties you wish to override the defaults.
   * See the properties section of the `Matter.Body` module for detailed information on what you can pass via the `options` object.
   * @method fromVertices
   * @param {number} x
   * @param {number} y
   * @param [[vector]] vertexSets
   * @param {object} [options]
   * @param {bool} [flagInternal=false]
   * @param {number} [removeCollinear=0.01]
   * @param {number} [minimumArea=10]
   * @return {body}
   */

  // public static fromVertices = function (x, y, vertexSets, options, flagInternal, removeCollinear, minimumArea) {
  //   var decomp = typeof decomp !== 'undefined' ? decomp : require('poly-decomp'),
  //     body,
  //     parts,
  //     isConvex,
  //     vertices,
  //     i,
  //     j,
  //     k,
  //     v,
  //     z;

  //   options = options || {};
  //   parts = [];

  //   flagInternal = typeof flagInternal !== 'undefined' ? flagInternal : false;
  //   removeCollinear = typeof removeCollinear !== 'undefined' ? removeCollinear : 0.01;
  //   minimumArea = typeof minimumArea !== 'undefined' ? minimumArea : 10;

  //   if (!decomp) {
  //     Common.warn('Bodies.fromVertices: poly-decomp.js required. Could not decompose vertices. Fallback to convex hull.');
  //   }

  //   // ensure vertexSets is an array of arrays
  //   if (!Common.isArray(vertexSets[0])) {
  //     vertexSets = [vertexSets];
  //   }

  //   for (v = 0; v < vertexSets.length; v += 1) {
  //     vertices = vertexSets[v];
  //     isConvex = Vertices.isConvex(vertices);

  //     if (isConvex || !decomp) {
  //       if (isConvex) {
  //         vertices = Vertices.clockwiseSort(vertices);
  //       } else {
  //         // fallback to convex hull when decomposition is not possible
  //         vertices = Vertices.hull(vertices);
  //       }

  //       parts.push({
  //         position: { x: x, y: y },
  //         vertices: vertices
  //       });
  //     } else {
  //       // initialise a decomposition
  //       var concave = vertices.map(function (vertex) {
  //         return [vertex.x, vertex.y];
  //       });

  //       // vertices are concave and simple, we can decompose into parts
  //       decomp.makeCCW(concave);
  //       if (removeCollinear !== false)
  //         decomp.removeCollinearPoints(concave, removeCollinear);

  //       // use the quick decomposition algorithm (Bayazit)
  //       var decomposed = decomp.quickDecomp(concave);

  //       // for each decomposed chunk
  //       for (i = 0; i < decomposed.length; i++) {
  //         var chunk = decomposed[i];

  //         // convert vertices into the correct structure
  //         var chunkVertices = chunk.map(function (vertices) {
  //           return {
  //             x: vertices[0],
  //             y: vertices[1]
  //           };
  //         });

  //         // skip small chunks
  //         if (minimumArea > 0 && Vertices.area(chunkVertices) < minimumArea)
  //           continue;

  //         // create a compound part
  //         parts.push({
  //           position: Vertices.centre(chunkVertices),
  //           vertices: chunkVertices
  //         });
  //       }
  //     }
  //   }

  //   // create body parts
  //   for (i = 0; i < parts.length; i++) {
  //     parts[i] = Body.create(Common.extend(parts[i], options));
  //   }

  //   // flag internal edges (coincident part edges)
  //   if (flagInternal) {
  //     var coincident_max_dist = 5;

  //     for (i = 0; i < parts.length; i++) {
  //       var partA = parts[i];

  //       for (j = i + 1; j < parts.length; j++) {
  //         var partB = parts[j];

  //         if (Bounds.overlaps(partA.bounds, partB.bounds)) {
  //           var pav = partA.vertices,
  //             pbv = partB.vertices;

  //           // iterate vertices of both parts
  //           for (k = 0; k < partA.vertices.length; k++) {
  //             for (z = 0; z < partB.vertices.length; z++) {
  //               // find distances between the vertices
  //               var da = Vector.magnitudeSquared(Vector.sub(pav[(k + 1) % pav.length], pbv[z])),
  //                 db = Vector.magnitudeSquared(Vector.sub(pav[k], pbv[(z + 1) % pbv.length]));

  //               // if both vertices are very close, consider the edge concident (internal)
  //               if (da < coincident_max_dist && db < coincident_max_dist) {
  //                 pav[k].isInternal = true;
  //                 pbv[z].isInternal = true;
  //               }
  //             }
  //           }

  //         }
  //       }
  //     }
  //   }

  //   if (parts.length > 1) {
  //     // create the parent body to be returned, that contains generated compound parts
  //     body = Body.create(Common.extend({ parts: parts.slice(0) }, options));
  //     Body.setPosition(body, { x: x, y: y });

  //     return body;
  //   } else {
  //     return parts[0];
  //   }
  // }

}

/**
* The `Matter.Composites` module contains factory methods for creating composite bodies
* with commonly used configurations (such as stacks and chains).
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Composites
*/

export class Composites {

  /**
   * Create a new composite containing bodies created in the callback in a grid arrangement.
   * This function uses the body's bounds to prevent overlaps.
   * @method stack
   * @param {number} xx
   * @param {number} yy
   * @param {number} columns
   * @param {number} rows
   * @param {number} columnGap
   * @param {number} rowGap
   * @param {function} callback
   * @return {composite} A new composite containing objects created in the callback
   */
  // public static stack(xx: number, yy: number, columns: number, rows: number, columnGap: number, rowGap: number, callback) {
  //   var stack = Composite.create({ label: 'Stack' }),
  //     x = xx,
  //     y = yy,
  //     lastBody,
  //     i = 0;

  //   for (var row = 0; row < rows; row++) {
  //     var maxHeight = 0;

  //     for (var column = 0; column < columns; column++) {
  //       var body = callback(x, y, column, row, lastBody, i);

  //       if (body) {
  //         var bodyHeight = body.bounds.max.y - body.bounds.min.y,
  //           bodyWidth = body.bounds.max.x - body.bounds.min.x;

  //         if (bodyHeight > maxHeight)
  //           maxHeight = bodyHeight;

  //         Body.translate(body, { x: bodyWidth * 0.5, y: bodyHeight * 0.5 });

  //         x = body.bounds.max.x + columnGap;

  //         Composite.addBody(stack, body);

  //         lastBody = body;
  //         i += 1;
  //       } else {
  //         x += columnGap;
  //       }
  //     }

  //     y += maxHeight + rowGap;
  //     x = xx;
  //   }

  //   return stack;
  // };

  /**
   * Chains all bodies in the given composite together using constraints.
   * @method chain
   * @param {composite} composite
   * @param {number} xOffsetA
   * @param {number} yOffsetA
   * @param {number} xOffsetB
   * @param {number} yOffsetB
   * @param {object} options
   * @return {composite} A new composite containing objects chained together with constraints
   */
  // public static chain(composite: Composite, xOffsetA: number, yOffsetA: number, xOffsetB: number, yOffsetB: number, options = {}) {
  //   var bodies = composite.bodies;

  //   for (var i = 1; i < bodies.length; i++) {
  //     var bodyA = bodies[i - 1],
  //       bodyB = bodies[i],
  //       bodyAHeight = bodyA.bounds.max.y - bodyA.bounds.min.y,
  //       bodyAWidth = bodyA.bounds.max.x - bodyA.bounds.min.x,
  //       bodyBHeight = bodyB.bounds.max.y - bodyB.bounds.min.y,
  //       bodyBWidth = bodyB.bounds.max.x - bodyB.bounds.min.x;

  //     var defaults = {
  //       bodyA: bodyA,
  //       pointA: new Vector(bodyAWidth * xOffsetA, bodyAHeight * yOffsetA),
  //       bodyB: bodyB,
  //       pointB: new Vector(bodyBWidth * xOffsetB, bodyBHeight * yOffsetB)
  //     };

  //     Object.assign(options, defaults);

  //     composite.addConstraint(Constraint.create(constraint));
  //   }

  //   composite.label += ' Chain';

  //   return composite;
  // };

  // /**
  //  * Connects bodies in the composite with constraints in a grid pattern, with optional cross braces.
  //  * @method mesh
  //  * @param {composite} composite
  //  * @param {number} columns
  //  * @param {number} rows
  //  * @param {boolean} crossBrace
  //  * @param {object} options
  //  * @return {composite} The composite containing objects meshed together with constraints
  //  */
  // Composites.mesh = function (composite, columns, rows, crossBrace, options) {
  //   var bodies = composite.bodies,
  //     row,
  //     col,
  //     bodyA,
  //     bodyB,
  //     bodyC;

  //   for (row = 0; row < rows; row++) {
  //     for (col = 1; col < columns; col++) {
  //       bodyA = bodies[(col - 1) + (row * columns)];
  //       bodyB = bodies[col + (row * columns)];
  //       Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)));
  //     }

  //     if (row > 0) {
  //       for (col = 0; col < columns; col++) {
  //         bodyA = bodies[col + ((row - 1) * columns)];
  //         bodyB = bodies[col + (row * columns)];
  //         Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyA, bodyB: bodyB }, options)));

  //         if (crossBrace && col > 0) {
  //           bodyC = bodies[(col - 1) + ((row - 1) * columns)];
  //           Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB: bodyB }, options)));
  //         }

  //         if (crossBrace && col < columns - 1) {
  //           bodyC = bodies[(col + 1) + ((row - 1) * columns)];
  //           Composite.addConstraint(composite, Constraint.create(Common.extend({ bodyA: bodyC, bodyB: bodyB }, options)));
  //         }
  //       }
  //     }
  //   }

  //   composite.label += ' Mesh';

  //   return composite;
  // };

  /**
   * Create a new composite containing bodies created in the callback in a pyramid arrangement.
   * This function uses the body's bounds to prevent overlaps.
   * @method pyramid
   * @param {number} xx
   * @param {number} yy
   * @param {number} columns
   * @param {number} rows
   * @param {number} columnGap
   * @param {number} rowGap
   * @param {function} callback
   * @return {composite} A new composite containing objects created in the callback
   */

  // Composites.pyramid = function (xx, yy, columns, rows, columnGap, rowGap, callback) {
  //   return Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function (x, y, column, row, lastBody, i) {
  //     var actualRows = Math.min(rows, Math.ceil(columns / 2)),
  //       lastBodyWidth = lastBody ? lastBody.bounds.max.x - lastBody.bounds.min.x : 0;

  //     if (row > actualRows)
  //       return;

  //     // reverse row order
  //     row = actualRows - row;

  //     var start = row,
  //       end = columns - 1 - row;

  //     if (column < start || column > end)
  //       return;

  //     // retroactively fix the first body's position, since width was unknown
  //     if (i === 1) {
  //       Body.translate(lastBody, { x: (column + (columns % 2 === 1 ? 1 : -1)) * lastBodyWidth, y: 0 });
  //     }

  //     var xOffset = lastBody ? column * lastBodyWidth : 0;

  //     return callback(xx + xOffset + column * columnGap, y, column, row, lastBody, i);
  //   });
  // };

  // /**
  //  * Creates a composite with a Newton's Cradle setup of bodies and constraints.
  //  * @method newtonsCradle
  //  * @param {number} xx
  //  * @param {number} yy
  //  * @param {number} number
  //  * @param {number} size
  //  * @param {number} length
  //  * @return {composite} A new composite newtonsCradle body
  //  */

  public static newtonsCradle(xx: number, yy: number, num: number, size: number, length: number) {
    var newtonsCradle = new Composite({ label: 'Newtons Cradle' });

    for (var i = 0; i < num; i++) {
      var separation = 1.9,
        circle = Bodies.circle(xx + i * (size * separation), yy + length, size,
          { inertia: Infinity, restitution: 1, friction: 0, frictionAir: 0.0001, slop: 1 }),
        constraint = new Constraint({ pointA: { x: xx + i * (size * separation), y: yy }, bodyB: circle });

      newtonsCradle.addBody(circle);
      newtonsCradle.addConstraint(constraint);
    }
    return newtonsCradle;
  }

  // /**
  //  * Creates a composite with simple car setup of bodies and constraints.
  //  * @method car
  //  * @param {number} xx
  //  * @param {number} yy
  //  * @param {number} width
  //  * @param {number} height
  //  * @param {number} wheelSize
  //  * @return {composite} A new composite car body
  //  */
  // Composites.car = function (xx, yy, width, height, wheelSize) {
  //   var group = Body.nextGroup(true),
  //     wheelBase = 20,
  //     wheelAOffset = -width * 0.5 + wheelBase,
  //     wheelBOffset = width * 0.5 - wheelBase,
  //     wheelYOffset = 0;

  //   var car = Composite.create({ label: 'Car' }),
  //     body = Bodies.rectangle(xx, yy, width, height, {
  //       collisionFilter: {
  //         group: group
  //       },
  //       chamfer: {
  //         radius: height * 0.5
  //       },
  //       density: 0.0002
  //     });

  //   var wheelA = Bodies.circle(xx + wheelAOffset, yy + wheelYOffset, wheelSize, {
  //     collisionFilter: {
  //       group: group
  //     },
  //     friction: 0.8
  //   });

  //   var wheelB = Bodies.circle(xx + wheelBOffset, yy + wheelYOffset, wheelSize, {
  //     collisionFilter: {
  //       group: group
  //     },
  //     friction: 0.8
  //   });

  //   var axelA = Constraint.create({
  //     bodyB: body,
  //     pointB: { x: wheelAOffset, y: wheelYOffset },
  //     bodyA: wheelA,
  //     stiffness: 1,
  //     length: 0
  //   });

  //   var axelB = Constraint.create({
  //     bodyB: body,
  //     pointB: { x: wheelBOffset, y: wheelYOffset },
  //     bodyA: wheelB,
  //     stiffness: 1,
  //     length: 0
  //   });

  //   Composite.addBody(car, body);
  //   Composite.addBody(car, wheelA);
  //   Composite.addBody(car, wheelB);
  //   Composite.addConstraint(car, axelA);
  //   Composite.addConstraint(car, axelB);

  //   return car;
  // }

  // /**
  //  * Creates a simple soft body like object.
  //  * @method softBody
  //  * @param {number} xx
  //  * @param {number} yy
  //  * @param {number} columns
  //  * @param {number} rows
  //  * @param {number} columnGap
  //  * @param {number} rowGap
  //  * @param {boolean} crossBrace
  //  * @param {number} particleRadius
  //  * @param {} particleOptions
  //  * @param {} constraintOptions
  //  * @return {composite} A new composite softBody
  //  */
  // public static softBody(xx: number, yy: number, columns: number, rows, columnGap, rowGap, crossBrace, particleRadius, particleOptions, constraintOptions) {
  //   particleOptions = Common.extend({ inertia: Infinity }, particleOptions);
  //   constraintOptions = Common.extend({ stiffness: 0.2, render: { type: 'line', anchors: false } }, constraintOptions);

  //   var softBody = Composites.stack(xx, yy, columns, rows, columnGap, rowGap, function (x, y) {
  //     return Bodies.circle(x, y, particleRadius, particleOptions);
  //   });

  //   Composites.mesh(softBody, columns, rows, crossBrace, constraintOptions);

  //   softBody.label = 'Soft Body';

  //   return softBody;
  // }

}
