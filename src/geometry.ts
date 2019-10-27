import { Common } from './core';
import { Body } from './body';

/**
* The `Matter.Vector` module contains methods for creating and manipulating vectors.
* Vectors are the basis of all the geometry related operations in the engine.
* A `Matter.Vector` object is of the form `{ x: 0, y: 0 }`.
*
* See the included usage [examples](https://github.com/liabru/matter-js/tree/master/examples).
*
* @class Vector
*/

// TODO: consider params for reusing vector objects

export class Vector {
  public x: number;
  public y: number;

  public constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public static Null = new Vector();

  /**
   * Returns a new vector with `x` and `y` copied from the given `vector`.
   * @method clone
   * @param {vector} vector
   * @return {vector} A new cloned vector
   */

  public static clone(vector: Vector): Vector {
    return new Vector(vector.x, vector.y);
  }

  /**
   * Returns the magnitude (length) of a vector.
   * @method magnitude
   * @param {vector} vector
   * @return {number} The magnitude of the vector
   */
  public static magnitude(vector: Vector) {
    return Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
  }

  /**
   * Returns the magnitude (length) of a vector (therefore saving a `sqrt` operation).
   * @method magnitudeSquared
   * @param {vector} vector
   * @return {number} The squared magnitude of the vector
   */
  public static magnitudeSquared(vector: Vector) {
    return (vector.x * vector.x) + (vector.y * vector.y);
  }

  /**
   * Rotates the vector about (0, 0) by specified angle.
   * @method rotate
   * @param {vector} vector
   * @param {number} angle
   * @param {vector} [output]
   * @return {vector} The vector rotated about (0, 0)
   */
  public static rotate(vector: Vector, angle: number, output?: Vector) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    if (!output) output = new Vector();
    var x = vector.x * cos - vector.y * sin;
    output.y = vector.x * sin + vector.y * cos;
    output.x = x;
    return output;
  }

  /**
   * Rotates the vector about a specified point by specified angle.
   * @method rotateAbout
   * @param {vector} vector
   * @param {number} angle
   * @param {vector} point
   * @param {vector} [output]
   * @return {vector} A new vector rotated about the point
   */
  public static rotateAbout(vector: Vector, angle: number, point: Vector, output?: Vector) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    if (!output) output = new Vector();
    var x = point.x + ((vector.x - point.x) * cos - (vector.y - point.y) * sin);
    output.y = point.y + ((vector.x - point.x) * sin + (vector.y - point.y) * cos);
    output.x = x;
    return output;
  }

  /**
   * Normalises a vector (such that its magnitude is `1`).
   * @method normalise
   * @param {vector} vector
   * @return {vector} A new vector normalised
   */

  public static normalise(vector: Vector) {
    var magnitude = Vector.magnitude(vector);
    if (magnitude === 0)
      return new Vector();
    return new Vector(vector.x / magnitude, vector.y / magnitude);
  }

  /**
   * Returns the dot-product of two vectors.
   * @method dot
   * @param {vector} vectorA
   * @param {vector} vectorB
   * @return {number} The dot product of the two vectors
   */
  public static dot(vectorA: Vector, vectorB: Vector) {
    return (vectorA.x * vectorB.x) + (vectorA.y * vectorB.y);
  }

  /**
   * Returns the cross-product of two vectors.
   * @method cross
   * @param {vector} vectorA
   * @param {vector} vectorB
   * @return {number} The cross product of the two vectors
   */
  public static cross(vectorA: Vector, vectorB: Vector): number {
    return (vectorA.x * vectorB.y) - (vectorA.y * vectorB.x);
  };

  /**
   * Returns the cross-product of three vectors.
   * @method cross3
   * @param {vector} vectorA
   * @param {vector} vectorB
   * @param {vector} vectorC
   * @return {number} The cross product of the three vectors
   */
  public static cross3(vectorA: Vector, vectorB: Vector, vectorC: Vector): number {
    return (vectorB.x - vectorA.x) * (vectorC.y - vectorA.y) - (vectorB.y - vectorA.y) * (vectorC.x - vectorA.x);
  };

  /**
   * Adds the two vectors.
   * @method add
   * @param {vector} vectorA
   * @param {vector} vectorB
   * @param {vector} [output]
   * @return {vector} A new vector of vectorA and vectorB added
   */
  public static add(vectorA: Vector, vectorB: Vector, output?: Vector) {
    if (!output) output = new Vector();
    output.x = vectorA.x + vectorB.x;
    output.y = vectorA.y + vectorB.y;
    return output;
  };

  /**
   * Subtracts the two vectors.
   * @method sub
   * @param {vector} vectorA
   * @param {vector} vectorB
   * @param {vector} [output]
   * @return {vector} A new vector of vectorA and vectorB subtracted
   */
  public static sub(vectorA: Vector, vectorB: Vector, output?: Vector) {
    if (!output) output = new Vector();
    output.x = vectorA.x - vectorB.x;
    output.y = vectorA.y - vectorB.y;
    return output;
  };

  /**
   * Multiplies a vector and a scalar.
   * @method mult
   * @param {vector} vector
   * @param {number} scalar
   * @return {vector} A new vector multiplied by scalar
   */
  public static mult(vector: Vector, scalar: number): Vector {
    return new Vector(vector.x * scalar, vector.y * scalar);
  };

  /**
   * Divides a vector and a scalar.
   * @method div
   * @param {vector} vector
   * @param {number} scalar
   * @return {vector} A new vector divided by scalar
   */
  public static div(vector: Vector, scalar: number): Vector {
    return new Vector(vector.x / scalar, vector.y / scalar);
  };

  /**
   * Returns the perpendicular vector. Set `negate` to true for the perpendicular in the opposite direction.
   * @method perp
   * @param {vector} vector
   * @param {bool} [negate=false]
   * @return {vector} The perpendicular vector
   */
  public static perp(vector: Vector, negate = false): Vector {
    const n = negate === true ? -1 : 1;
    return new Vector(n * -vector.y, n * vector.x);
  };

  /**
   * Negates both components of a vector such that it points in the opposite direction.
   * @method neg
   * @param {vector} vector
   * @return {vector} The negated vector
   */
  public static neg(vector: Vector): Vector {
    return new Vector(-vector.x, -vector.y);
  };

  /**
   * Returns the angle between the vector `vectorB - vectorA` and the x-axis in radians.
   * @method angle
   * @param {vector} vectorA
   * @param {vector} vectorB
   * @return {number} The angle in radians
   */
  public static angle(vectorA: Vector, vectorB: Vector): number {
    return Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
  };

  /**
   * Temporary vector pool (not thread-safe).
   * @property _temp
   * @type {vector[]}
   * @private
   */
  public static _temp = [
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(), new Vector()
  ];

}

export type Contact = {
  vertex: Vertex;
  normalImpulse: number;
  tangentImpulse: number;
}

export class Vertex extends Vector {
  public index: number;
  public body: Body;
  public isInternal: boolean;
  public contact: Contact;

  constructor(x: number, y: number, index: number, body?: Body) {
    super(x, y);
    this.index = index;
    this.body = body === undefined ? Body.None : body;
    this.isInternal = false;
    this.contact = {
      vertex: this,
      normalImpulse: 0,
      tangentImpulse: 0
    };
  }
}

export class Vertices {
  /**
   * Creates a new set of `Matter.Body` compatible vertices.
   * The `points` argument accepts an array of `Matter.Vector` points orientated around the origin `(0, 0)`, for example:
   *
   *     [{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }]
   *
   * The `Vertices.create` method returns a new array of vertices, which are similar to Matter.Vector objects,
   * but with some additional references required for efficient collision detection routines.
   *
   * Vertices must be specified in clockwise order.
   *
   * Note that the `body` argument is not optional, a `Matter.Body` reference must be provided.
   *
   * @method create
   * @param {vector[]} points
   * @param {body} body
   */

  public static create(points: Vector[], body?: Body) {
    var vertices = [];

    for (var i = 0; i < points.length; i++) {
      const point = points[i];
      const vertex = new Vertex(point.x, point.y, i, body);
      vertices.push(vertex);
    }
    return vertices;
  }

  /**
   * Parses a string containing ordered x y pairs separated by spaces (and optionally commas), 
   * into a `Matter.Vertices` object for the given `Matter.Body`.
   * For parsing SVG paths, see `Svg.pathToVertices`.
   * @method fromPath
   * @param {string} path
   * @param {body} body
   * @return {vertices} vertices
   */

  public static fromPath(path: number[], body?: Body) {
    // if (typeof path === 'string') {
    //   const points: Vector[] = [];
    //   const pathPattern = /L?\s*([-\d.e]+)[\s,]*([-\d.e]+)*/ig;
    //   path.replace(pathPattern, function (match, x, y) {
    //     points.push(new Vector(parseFloat(x), parseFloat(y)));
    //   });
    //   return Vertices.create(points, body);
    // }
    // else {
    var vertices = [];
    for (let i = 0; i < path.length; i += 2) {
      const vertex = new Vertex(path[i], path[i + 1], i / 2, body);
      vertices.push(vertex);
    }
    return vertices;
    // }
  }

  /**
   * Returns the centre (centroid) of the set of vertices.
   * @method centre
   * @param {vertices} vertices
   * @return {vector} The centre point
   */

  public static centre(vertices: Vertex[]) {
    var area = Vertices.area(vertices, true);
    var centre = new Vector();

    for (var i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      const cross = Vector.cross(vertices[i], vertices[j]);
      const temp = Vector.mult(Vector.add(vertices[i], vertices[j]), cross);
      centre = Vector.add(centre, temp);
    }
    return Vector.div(centre, 6 * area);
  }

  /**
   * Returns the average (mean) of the set of vertices.
   * @method mean
   * @param {vertices} vertices
   * @return {vector} The average point
   */

  public static mean(vertices: Vertex[]) {
    //var average = { x: 0, y: 0 };
    var x = 0;
    var y = 0;
    for (var i = 0; i < vertices.length; i++) {
      x += vertices[i].x;
      y += vertices[i].y;
    }
    return Vector.div(new Vector(x, y), vertices.length);
  };

  /**
   * Returns the area of the set of vertices.
   * @method area
   * @param {vertices} vertices
   * @param {bool} signed
   * @return {number} The area
   */
  public static area(vertices: Vertex[], signed?: boolean) {
    var area = 0;
    var j = vertices.length - 1;
    for (var i = 0; i < vertices.length; i++) {
      area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
      j = i;
    }
    if (signed)
      return area / 2;
    return Math.abs(area) / 2;
  };

  /**
   * Returns the moment of inertia (second moment of area) of the set of vertices given the total mass.
   * @method inertia
   * @param {vertices} vertices
   * @param {number} mass
   * @return {number} The polygon's moment of inertia
   */

  public static inertia(vertices: Vertex[], mass: number) {
    var numerator = 0;
    var denominator = 0;
    var v = vertices;
    // find the polygon's moment of inertia, using second moment of area
    // from equations at http://www.physicsforums.com/showthread.php?t=25293

    for (var n = 0; n < v.length; n++) {
      const j = (n + 1) % v.length;
      const cross = Math.abs(Vector.cross(v[j], v[n]));
      numerator += cross * (Vector.dot(v[j], v[j]) + Vector.dot(v[j], v[n]) + Vector.dot(v[n], v[n]));
      denominator += cross;
    }
    return (mass / 6) * (numerator / denominator);
  };

  /**
   * Translates the set of vertices in-place.
   * @method translate
   * @param {vertices} vertices
   * @param {vector} vector
   * @param {number} scalar
   */

  public static translate(vertices: Vertex[], vector: Vector, scalar?: number) {
    if (scalar) {
      for (var i = 0; i < vertices.length; i++) {
        vertices[i].x += vector.x * scalar;
        vertices[i].y += vector.y * scalar;
      }
    } else {
      for (var i = 0; i < vertices.length; i++) {
        vertices[i].x += vector.x;
        vertices[i].y += vector.y;
      }
    }
    return vertices;
  };

  /**
   * Rotates the set of vertices in-place.
   * @method rotate
   * @param {vertices} vertices
   * @param {number} angle
   * @param {vector} point
   */

  public static rotate(vertices: Vertex[], angle: number, point: Vector) {
    if (angle === 0) return;
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    for (var i = 0; i < vertices.length; i++) {
      const vertice = vertices[i];
      const dx = vertice.x - point.x;
      const dy = vertice.y - point.y;
      vertice.x = point.x + (dx * cos - dy * sin);
      vertice.y = point.y + (dx * sin + dy * cos);
    }
    return vertices;
  }

  /**
   * Returns `true` if the `point` is inside the set of `vertices`.
   * @method contains
   * @param {vertices} vertices
   * @param {vector} point
   * @return {boolean} True if the vertices contains point, otherwise false
   */

  public static contains(vertices: Vertex[], point: Vector) {
    for (var i = 0; i < vertices.length; i++) {
      const vertice = vertices[i];
      const nextVertice = vertices[(i + 1) % vertices.length];
      if ((point.x - vertice.x) * (nextVertice.y - vertice.y) + (point.y - vertice.y) * (vertice.x - nextVertice.x) > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Scales the vertices from a point (default is centre) in-place.
   * @method scale
   * @param {vertices} vertices
   * @param {number} scaleX
   * @param {number} scaleY
   * @param {vector} point
   */

  public static scale(vertices: Vertex[], scaleX: number, scaleY: number, point: Vector) {
    if (scaleX === 1 && scaleY === 1) {
      return vertices;
    }

    point = point || Vertices.centre(vertices);
    for (var i = 0; i < vertices.length; i++) {
      const vertex = vertices[i];
      const delta = Vector.sub(vertex, point);
      vertices[i].x = point.x + delta.x * scaleX;
      vertices[i].y = point.y + delta.y * scaleY;
    }
    return vertices;
  }

  /**
   * Chamfers a set of vertices by giving them rounded corners, returns a new set of vertices.
   * The radius parameter is a single number or an array to specify the radius for each vertex.
   * @method chamfer
   * @param {vertices} vertices
   * @param {number[]} radius
   * @param {number} quality
   * @param {number} qualityMin
   * @param {number} qualityMax
   */

  public static chamfer(vertices: Vertex[], radius0: any, quality = -1, qualityMin = 2, qualityMax = 14) {
    var radius: number[];

    if (typeof radius0 === 'number') {
      radius = [radius0];
    } else {
      radius = radius0 || [8];
    }

    // quality defaults to -1, which is auto

    var newVertices = [];

    for (var i = 0; i < vertices.length; i++) {
      var prevVertex = vertices[i - 1 >= 0 ? i - 1 : vertices.length - 1],
        vertex = vertices[i],
        nextVertex = vertices[(i + 1) % vertices.length],
        currentRadius = radius[i < radius.length ? i : radius.length - 1];

      if (currentRadius === 0) {
        newVertices.push(vertex);
        continue;
      }

      var prevNormal = Vector.normalise(new Vector(
        vertex.y - prevVertex.y,
        prevVertex.x - vertex.x
      ));

      var nextNormal = Vector.normalise(new Vector(
        nextVertex.y - vertex.y,
        vertex.x - nextVertex.x
      ));

      const diagonalRadius = Math.sqrt(2 * Math.pow(currentRadius, 2));
      const radiusVector = Vector.mult(prevNormal, currentRadius);
      const midNormal = Vector.normalise(Vector.mult(Vector.add(prevNormal, nextNormal), 0.5));
      const scaledVertex = Vector.sub(vertex, Vector.mult(midNormal, diagonalRadius));

      var precision = quality;

      if (quality === -1) {
        // automatically decide precision
        precision = Math.pow(currentRadius, 0.32) * 1.75;
      }

      precision = Common.clamp(precision, qualityMin, qualityMax);

      // use an even value for precision, more likely to reduce axes by using symmetry
      if (precision % 2 === 1)
        precision += 1;

      const alpha = Math.acos(Vector.dot(prevNormal, nextNormal));
      const theta = alpha / precision;

      for (var j = 0; j < precision; j++) {
        newVertices.push(Vector.add(Vector.rotate(radiusVector, theta * j), scaledVertex));
      }
    }

    return newVertices;
  }

  /**
   * Sorts the input vertices into clockwise order in place.
   * @method clockwiseSort
   * @param {vertices} vertices
   * @return {vertices} vertices
   */

  public static clockwiseSort(vertices: Vertex[]) {
    var centre = Vertices.mean(vertices);
    vertices.sort((vertexA, vertexB) => {
      return Vector.angle(centre, vertexA) - Vector.angle(centre, vertexB);
    });
    return vertices;
  };

  /**
   * Returns true if the vertices form a convex shape (vertices must be in clockwise order).
   * @method isConvex
   * @param {vertices} vertices
   * @return {bool} `true` if the `vertices` are convex, `false` if not (or `null` if not computable).
   */

  public static isConvex(vertices: Vertex[]) {
    // http://paulbourke.net/geometry/polygonmesh/
    // Copyright (c) Paul Bourke (use permitted)

    var flag = 0,
      n = vertices.length,
      i,
      j,
      k,
      z;

    if (n < 3)
      return null;

    for (i = 0; i < n; i++) {
      j = (i + 1) % n;
      k = (i + 2) % n;
      z = (vertices[j].x - vertices[i].x) * (vertices[k].y - vertices[j].y);
      z -= (vertices[j].y - vertices[i].y) * (vertices[k].x - vertices[j].x);

      if (z < 0) {
        flag |= 1;
      } else if (z > 0) {
        flag |= 2;
      }

      if (flag === 3) {
        return false;
      }
    }

    if (flag !== 0) {
      return true;
    } else {
      return null;
    }
  }

  /**
   * Returns the convex hull of the input vertices as a new array of points.
   * @method hull
   * @param {vertices} vertices
   * @return [vertex] vertices
   */

  public static hull(vertices: Vertex[]) {
    // http://geomalgorithms.com/a10-_hull-1.html

    var upper = [],
      lower = [],
      vertex,
      i;

    // sort vertices on x-axis (y-axis for ties)
    vertices = vertices.slice(0);
    vertices.sort(function (vertexA, vertexB) {
      var dx = vertexA.x - vertexB.x;
      return dx !== 0 ? dx : vertexA.y - vertexB.y;
    });

    // build lower hull
    for (i = 0; i < vertices.length; i += 1) {
      vertex = vertices[i];

      while (lower.length >= 2
        && Vector.cross3(lower[lower.length - 2], lower[lower.length - 1], vertex) <= 0) {
        lower.pop();
      }

      lower.push(vertex);
    }

    // build upper hull
    for (i = vertices.length - 1; i >= 0; i -= 1) {
      vertex = vertices[i];

      while (upper.length >= 2
        && Vector.cross3(upper[upper.length - 2], upper[upper.length - 1], vertex) <= 0) {
        upper.pop();
      }

      upper.push(vertex);
    }

    // concatenation of the lower and upper hulls gives the convex hull
    // omit last points because they are repeated at the beginning of the other list
    upper.pop();
    lower.pop();

    return upper.concat(lower);
  }
}

export class Bounds {
  public max: Vector;
  public min: Vector;

  public constructor(minX: number, minY: number, maxX: number, maxY: number) {
    this.min = new Vector(minY, minY);
    this.max = new Vector(maxX, maxY);
  }

  public static Null = new Bounds(0, 0, 0, 0);

  /**
   * Creates a new axis-aligned bounding box (AABB) for the given vertices.
   * @method create
   * @param {vertices} vertices
   * @return {bounds} A new bounds object
   */

  public static create(vertices?: Vector[]) {
    var bounds = new Bounds(0, 0, 0, 0);
    if (vertices) {
      Bounds.update(bounds, vertices);
    }
    return bounds;
  }

  /**
   * Updates bounds using the given vertices and extends the bounds given a velocity.
   * @method update
   * @param {bounds} bounds
   * @param {vertices} vertices
   * @param {vector} velocity
   */

  public static update(bounds: Bounds, vertices: Vector[], velocity?: Vector) {
    bounds.min.x = Infinity;
    bounds.max.x = -Infinity;
    bounds.min.y = Infinity;
    bounds.max.y = -Infinity;

    for (var i = 0; i < vertices.length; i++) {
      var vertex = vertices[i];
      if (vertex.x > bounds.max.x) bounds.max.x = vertex.x;
      if (vertex.x < bounds.min.x) bounds.min.x = vertex.x;
      if (vertex.y > bounds.max.y) bounds.max.y = vertex.y;
      if (vertex.y < bounds.min.y) bounds.min.y = vertex.y;
    }

    if (velocity) {
      if (velocity.x > 0) {
        bounds.max.x += velocity.x;
      } else {
        bounds.min.x += velocity.x;
      }

      if (velocity.y > 0) {
        bounds.max.y += velocity.y;
      } else {
        bounds.min.y += velocity.y;
      }
    }
  }

  /**
   * Returns true if the bounds contains the given point.
   * @method contains
   * @param {bounds} bounds
   * @param {vector} point
   * @return {boolean} True if the bounds contain the point, otherwise false
   */
  public static contains(bounds: Bounds, point: Vector): boolean {
    return point.x >= bounds.min.x && point.x <= bounds.max.x
      && point.y >= bounds.min.y && point.y <= bounds.max.y;
  }

  /**
   * Returns true if the two bounds intersect.
   * @method overlaps
   * @param {bounds} boundsA
   * @param {bounds} boundsB
   * @return {boolean} True if the bounds overlap, otherwise false
   */
  public static overlaps(boundsA: Bounds, boundsB: Bounds): boolean {
    return (boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x
      && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y);
  };

  /**
   * Translates the bounds by the given vector.
   * @method translate
   * @param {bounds} bounds
   * @param {vector} vector
   */

  public static translate(bounds: Bounds, vector: Vector) {
    bounds.min.x += vector.x;
    bounds.max.x += vector.x;
    bounds.min.y += vector.y;
    bounds.max.y += vector.y;
  }

  /**
   * Shifts the bounds to the given position.
   * @method shift
   * @param {bounds} bounds
   * @param {vector} position
   */

  public static shift(bounds: Bounds, position: Vector) {
    const deltaX = bounds.max.x - bounds.min.x;
    const deltaY = bounds.max.y - bounds.min.y;
    bounds.min.x = position.x;
    bounds.max.x = position.x + deltaX;
    bounds.min.y = position.y;
    bounds.max.y = position.y + deltaY;
  }
}

/**
* The `Matter.Axes` module contains methods for creating and manipulating sets of axes.
*
* @class Axes
*/

export class Axes {

  /**
   * Creates a new set of axes from the given vertices.
   * @method fromVertices
   * @param {vertices} vertices
   * @return {axes} A new axes from the given vertices
   */

  public static fromVertices(vertices: Vertex[]): Vector[] {
    var axes: { [key: string]: Vector; } = {};
    // find the unique axes, using edge normal gradients
    for (var i = 0; i < vertices.length; i++) {
      var j = (i + 1) % vertices.length;
      var normal = Vector.normalise(new Vector(
        vertices[j].y - vertices[i].y,
        vertices[i].x - vertices[j].x
      ));
      var gradient = (normal.y === 0) ? Infinity : (normal.x / normal.y);
      // limit precision
      var key = gradient.toFixed(3).toString();
      axes[key] = normal;
    }
    return Common.values(axes);
  }

  /**
   * Rotates a set of axes by the given angle.
   * @method rotate
   * @param {axes} axes
   * @param {number} angle
   */
  public static rotate(axes: Vector[], angle: number) {
    if (angle === 0)
      return;

    var cos = Math.cos(angle),
      sin = Math.sin(angle);

    for (var i = 0; i < axes.length; i++) {
      var axis = axes[i];
      var xx = axis.x * cos - axis.y * sin;
      axis.y = axis.x * sin + axis.y * cos;
      axis.x = xx;
    }
  }
}