import { Common, Events } from './commons';
import { Vector, Bounds } from './geometry';
import { Body, Constraint, Composite, World } from './body';
import { Pair, Grid } from './collision';
//import { Mouse } from './mouse';


/**
 * Description
 * @method _createCanvas
 * @private
 * @param {} width
 * @param {} height
 * @return canvas
 */

const createCanvas = (width: number, height: number) => {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.oncontextmenu = () => false;
  canvas.onselectstart = () => false;
  return canvas;
}

/**
 * Gets the pixel ratio of the canvas.
 * @method _getPixelRatio
 * @private
 * @param {HTMLElement} canvas
 * @return {Number} pixel ratio
 */

const _getPixelRatio = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d') as any;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const backingStorePixelRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio
    || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio
    || context.backingStorePixelRatio || 1;
  return devicePixelRatio / backingStorePixelRatio;
};

/**
 * Gets the requested texture (an Image) via its path
 * @method _getTexture
 * @private
 * @param {render} render
 * @param {string} imagePath
 * @return {Image} texture
 */

const textures: any = {

};

const _getTexture = (imagePath: string) => {
  const image = textures[imagePath];
  if (image) {
    return image;
  }
  const image2 = textures[imagePath] = new Image();
  image2.src = imagePath;
  return image2;
};

/**
* The `Matter.Render` module is a simple HTML5 canvas based renderer for visualising instances of `Matter.Engine`.
* It is intended for development and debugging purposes, but may also be suitable for simple games.
* It includes a number of drawing options including wireframe, vector with support for sprites and viewports.
*
* @class Render
*/

//const _requestAnimationFrame: any = undefined;
//const _cancelAnimationFrame: any = undefined;

const _requestAnimationFrame = window.requestAnimationFrame;
const _cancelAnimationFrame = window.cancelAnimationFrame;

// if (typeof window !== 'undefined') {
//   _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
//     || window.mozRequestAnimationFrame || window.msRequestAnimationFrame
//     || function (callback) { window.setTimeout(function () { callback(Common.now()); }, 1000 / 60); };

//   _cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
//     || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;
// }

export class Render {
  public engine: any; // Engine
  public mouse: any; //Mouse;
  private world: World;
  public canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;//?
  // background: string;
  public bounds: Bounds;
  public frameRequestId = -1;

  public options: any = {
    // width: 800,
    // height: 600,
    pixelRatio: 1,
    background: '#18181d',
    wireframeBackground: '#0f0f13',
    //hasBounds: !!options.bounds,
    enabled: true,
    wireframes: false, //
    showSleeping: true,
    showDebug: false,
    showBroadphase: false,
    showBounds: false,
    showVelocity: false,
    showCollisions: false,
    showSeparations: false,
    showAxes: false,
    showPositions: false,
    showAngleIndicator: false,
    showIds: false,
    showShadows: false,
    showVertexNumbers: false,
    showConvexHulls: false,
    showInternalEdges: false,
    showMousePosition: false
  };

  /**
   * Creates a new renderer. The options parameter is an object that specifies any properties you wish to override the defaults.
   * All properties have default values, and many are pre-calculated automatically based on other properties.
   * See the properties section below for detailed information on what you can pass via the `options` object.
   * @method create
   * @param {object} [options]
   * @return {render} A new renderer
   */

  public constructor(engine: any, element: HTMLElement, options: any = {}) {
    this.engine = engine;
    this.world = engine.world;
    console.log(element);
    this.canvas = createCanvas(element.clientWidth, element.clientHeight);
    element.appendChild(this.canvas);
    this.mouse = engine.setRender(this);

    //var render = Common.extend(defaults, options);
    // if (this.canvas) {
    //   this.canvas.width = this.options.width || this.canvas.width;
    //   this.canvas.height = this.options.height || this.canvas.height;
    // }
    // this.canvas = this.canvas || _createCanvas(this.options.width, this.options.height);
    this.context = this.canvas.getContext('2d')!;

    this.bounds = new Bounds(0, 0, this.canvas.width, this.canvas.height);
    if (this.options.pixelRatio !== 1) {
      this.setPixelRatio(this.options.pixelRatio);
    }
  }

  /**
   * Continuously updates the render canvas on the `requestAnimationFrame` event.
   * @method run
   * @param {render} this
   */

  public run() {
    if (_requestAnimationFrame !== undefined) {
      const loop = (time: number) => {
        this.frameRequestId = _requestAnimationFrame(loop);
        this.draw();
      };
      loop(1);//
    }
  }

  /**
   * Ends execution of `Render.run` on the given `render`, by canceling the animation frame request event loop.
   * @method stop
   * @param {render} render
   */
  public stop() {
    if (_cancelAnimationFrame !== undefined) {
      _cancelAnimationFrame(this.frameRequestId);
    }
  }

  /**
   * Sets the pixel ratio of the renderer and updates the canvas.
   * To automatically detect the correct ratio, pass the string `'auto'` for `pixelRatio`.
   * @method setPixelRatio
   * @param {render} this
   * @param {number} pixelRatio
   */

  private setPixelRatio(pixelRatio?: number) {
    var options = this.options;
    var canvas = this.canvas;

    if (pixelRatio === undefined) {
      pixelRatio = _getPixelRatio(canvas);
    }

    options.pixelRatio = pixelRatio;
    canvas.setAttribute('data-pixel-ratio', `${pixelRatio}`);
    canvas.width = options.width * pixelRatio;
    canvas.height = options.height * pixelRatio;
    canvas.style.width = options.width + 'px';
    canvas.style.height = options.height + 'px';
  };

  /**
   * Positions and sizes the viewport around the given object bounds.
   * Objects must have at least one of the following properties:
   * - `object.bounds`
   * - `object.position`
   * - `object.min` and `object.max`
   * - `object.x` and `object.y`
   * @method lookAt
   * @param {render} this
   * @param {object[]} objects
   * @param {vector} [padding]
   * @param {bool} [center=true]
   */

  public lookAt(objects: any[], padding?: Vector, center = true) {
    objects = Array.isArray(objects) ? objects : [objects];
    if (padding === undefined) {
      padding = new Vector();
    }

    // find bounds of all objects
    var bounds = new Bounds(Infinity, Infinity, -Infinity, -Infinity);

    for (var i = 0; i < objects.length; i += 1) {
      var object = objects[i],
        min = object.bounds ? object.bounds.min : (object.min || object.position || object),
        max = object.bounds ? object.bounds.max : (object.max || object.position || object);

      if (min && max) {
        if (min.x < bounds.min.x)
          bounds.min.x = min.x;

        if (max.x > bounds.max.x)
          bounds.max.x = max.x;

        if (min.y < bounds.min.y)
          bounds.min.y = min.y;

        if (max.y > bounds.max.y)
          bounds.max.y = max.y;
      }
    }

    // find ratios
    var width = (bounds.max.x - bounds.min.x) + 2 * padding.x,
      height = (bounds.max.y - bounds.min.y) + 2 * padding.y,
      viewHeight = this.canvas.height,
      viewWidth = this.canvas.width,
      outerRatio = viewWidth / viewHeight,
      innerRatio = width / height,
      scaleX = 1,
      scaleY = 1;

    // find scale factor
    if (innerRatio > outerRatio) {
      scaleY = innerRatio / outerRatio;
    } else {
      scaleX = outerRatio / innerRatio;
    }

    // enable bounds
    this.options.hasBounds = true;

    // position and size
    this.bounds.min.x = bounds.min.x;
    this.bounds.max.x = bounds.min.x + width * scaleX;
    this.bounds.min.y = bounds.min.y;
    this.bounds.max.y = bounds.min.y + height * scaleY;

    // center
    if (center) {
      this.bounds.min.x += width * 0.5 - (width * scaleX) * 0.5;
      this.bounds.max.x += width * 0.5 - (width * scaleX) * 0.5;
      this.bounds.min.y += height * 0.5 - (height * scaleY) * 0.5;
      this.bounds.max.y += height * 0.5 - (height * scaleY) * 0.5;
    }

    // padding
    this.bounds.min.x -= padding.x;
    this.bounds.max.x -= padding.x;
    this.bounds.min.y -= padding.y;
    this.bounds.max.y -= padding.y;

    // update mouse
    if (this.mouse) {
      this.mouse.setScale(new Vector(
        (this.bounds.max.x - this.bounds.min.x) / this.canvas.width,
        (this.bounds.max.y - this.bounds.min.y) / this.canvas.height
      ));
      this.mouse.setOffset(this.bounds.min);
    }
  };

  /**
   * Applies viewport transforms based on `render.bounds` to a render context.
   * @method startViewTransform
   * @param {render} this
   */

  public startViewTransform() {
    var boundsWidth = this.bounds.max.x - this.bounds.min.x,
      boundsHeight = this.bounds.max.y - this.bounds.min.y,
      boundsScaleX = boundsWidth / this.options.width,
      boundsScaleY = boundsHeight / this.options.height;

    this.context.setTransform(
      this.options.pixelRatio / boundsScaleX, 0, 0,
      this.options.pixelRatio / boundsScaleY, 0, 0
    );

    this.context.translate(-this.bounds.min.x, -this.bounds.min.y);
  };

  /**
   * Resets all transforms on the render context.
   * @method endViewTransform
   * @param {render} render
   */
  public endViewTransform() {
    this.context.setTransform(this.options.pixelRatio, 0, 0, this.options.pixelRatio, 0, 0);
  };

  /**
   * Renders the given `engine`'s `Matter.World` object.
   * This is the entry point for all rendering and should be called every time the scene changes.
   * @method world
   * @param {render} this
   */

  private currentBackground = '';

  public draw() {
    const engine = this.engine;
    const world = engine.world;
    const canvas = this.canvas;
    const context = this.context;
    const options = this.options;
    const allBodies = world.allBodies();
    const allConstraints = world.allConstraints();
    const background = options.wireframes ? options.wireframeBackground : options.background;
    var bodies: Body[] = [];
    var constraints: Constraint[] = [];

    var event = {
      timestamp: engine.timing.timestamp
    }

    Events.trigger(this, 'beforeRender', event);

    // apply background if it has changed
    if (this.currentBackground !== background) {
      this.applyBackground(background);
    }

    // clear the canvas with a transparent fill, to allow the canvas background to show
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = "transparent";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'source-over';

    // handle bounds
    if (options.hasBounds) {
      // filter out bodies that are not in view
      for (var i = 0; i < allBodies.length; i++) {
        var body = allBodies[i];
        if (Bounds.overlaps(body.bounds, this.bounds))
          bodies.push(body);
      }

      // filter out constraints that are not in view
      for (var i = 0; i < allConstraints.length; i++) {
        var constraint = allConstraints[i],
          bodyA = constraint.bodyA,
          bodyB = constraint.bodyB,
          pointAWorld = constraint.pointA,
          pointBWorld = constraint.pointB;

        if (bodyA) pointAWorld = Vector.add(bodyA.position, constraint.pointA!);
        if (bodyB) pointBWorld = Vector.add(bodyB.position, constraint.pointB!);

        if (!pointAWorld || !pointBWorld)
          continue;

        if (Bounds.contains(this.bounds, pointAWorld) || Bounds.contains(this.bounds, pointBWorld))
          constraints.push(constraint);
      }

      // transform the view
      this.startViewTransform();

      // update mouse
      if (this.mouse) {
        this.mouse.setScale(new Vector(
          (this.bounds.max.x - this.bounds.min.x) / this.options.width,
          (this.bounds.max.y - this.bounds.min.y) / this.options.height
        ));
        this.mouse.setOffset(this.bounds.min);
      }
    } else {
      constraints = allConstraints;
      bodies = allBodies;

      if (this.options.pixelRatio !== 1) {
        this.context.setTransform(this.options.pixelRatio, 0, 0, this.options.pixelRatio, 0, 0);
      }
    }

    if (!options.wireframes || (engine.enableSleeping && options.showSleeping)) {
      // fully featured rendering of bodies
      this.bodies(bodies, context);
    } else {
      if (options.showConvexHulls)
        this.bodyConvexHulls(bodies, context);

      // optimised method for wireframes only
      this.bodyWireframes(bodies, context);
    }

    if (options.showBounds)
      this.bodyBounds(bodies, context);

    if (options.showAxes || options.showAngleIndicator)
      this.bodyAxes(bodies, context);

    if (options.showPositions)
      this.bodyPositions(bodies, context);

    if (options.showVelocity)
      this.bodyVelocity(bodies, context);

    if (options.showIds)
      this.bodyIds(bodies, context);

    if (options.showSeparations)
      this.separations(engine.pairs.list, context);

    if (options.showCollisions)
      this.collisions(engine.pairs.list, context);

    if (options.showVertexNumbers)
      this.vertexNumbers(bodies, context);

    if (options.showMousePosition)
      this.mousePosition(this.mouse, context);

    Render.constraints(constraints, context);

    if (options.showBroadphase && engine.broadphase instanceof Grid)
      this.grid(engine.broadphase, context);

    if (options.showDebug)
      this.debug(context);

    if (options.hasBounds) {
      // revert view transforms
      this.endViewTransform();
    }

    Events.trigger(this, 'afterRender', event);
  };

  /**
  * Applies the background to the canvas using CSS.
  * @method applyBackground
  * @private
  * @param {render} render
  * @param {string} background
  */

  private applyBackground(background: string) {
    var cssBackground = background;
    if (/(jpg|gif|png)$/.test(background))
      cssBackground = 'url(' + background + ')';
    this.canvas.style.background = cssBackground;
    this.canvas.style.backgroundSize = "contain";
    this.currentBackground = background;
  }

  private debugString = '';
  private debugTimestamp = 0;

  /**
   * Description
   * @private
   * @method debug
   * @param {render} this
   * @param {RenderingContext} context
   */
  private debug(context: CanvasRenderingContext2D) {
    var c = context,
      engine = this.engine,
      world = engine.world,
      // metrics = engine.metrics,
      options = this.options,
      bodies = world.allBodies(),
      space = "    ";

    if (engine.timing.timestamp - (this.debugTimestamp) >= 500) {
      var text = "";

      // if (metrics.timing) {
      //   text += "fps: " + Math.round(metrics.timing.fps) + space;
      // }

      // // @if DEBUG
      // if (metrics.extended) {
      //   if (metrics.timing) {
      //     text += "delta: " + metrics.timing.delta.toFixed(3) + space;
      //     text += "correction: " + metrics.timing.correction.toFixed(3) + space;
      //   }

      //   text += "bodies: " + bodies.length + space;

      //   if (engine.broadphase.controller === Grid)
      //     text += "buckets: " + metrics.buckets + space;

      //   text += "\n";

      //   text += "collisions: " + metrics.collisions + space;
      //   text += "pairs: " + engine.pairs.list.length + space;
      //   text += "broad: " + metrics.broadEff + space;
      //   text += "mid: " + metrics.midEff + space;
      //   text += "narrow: " + metrics.narrowEff + space;
      // }
      // @endif

      this.debugString = text;
      this.debugTimestamp = engine.timing.timestamp;
    }

    if (this.debugString) {
      c.font = "12px Arial";

      if (options.wireframes) {
        c.fillStyle = 'rgba(255,255,255,0.5)';
      } else {
        c.fillStyle = 'rgba(0,0,0,0.5)';
      }

      var split = this.debugString.split('\n');

      for (var i = 0; i < split.length; i++) {
        c.fillText(split[i], 50, 50 + i * 18);
      }
    }
  }

  /**
   * Description
   * @private
   * @method constraints
   * @param {constraint[]} constraints
   * @param {RenderingContext} context
   */

  private static constraints(constraints: Constraint[], context: CanvasRenderingContext2D) {
    var c = context;

    for (var i = 0; i < constraints.length; i++) {
      var constraint = constraints[i];

      if (!constraint.visible || !constraint.pointA || !constraint.pointB)
        continue;

      var bodyA = constraint.bodyA,
        bodyB = constraint.bodyB,
        start,
        end = Vector.Null;

      if (bodyA) {
        start = Vector.add(bodyA.position, constraint.pointA);
      } else {
        start = constraint.pointA;
      }

      if (constraint.renderType === 'pin') {
        c.beginPath();
        c.arc(start.x, start.y, 3, 0, 2 * Math.PI);
        c.closePath();
      } else {
        if (bodyB) {
          end = Vector.add(bodyB.position, constraint.pointB);
        } else {
          end = constraint.pointB;
        }

        c.beginPath();
        c.moveTo(start.x, start.y);

        if (constraint.renderType === 'spring') {
          var delta = Vector.sub(end, start),
            normal = Vector.perp(Vector.normalise(delta)),
            coils = Math.ceil(Common.clamp(constraint.length / 5, 12, 20)),
            offset;

          for (var j = 1; j < coils; j += 1) {
            offset = j % 2 === 0 ? 1 : -1;

            c.lineTo(
              start.x + delta.x * (j / coils) + normal.x * offset * 4,
              start.y + delta.y * (j / coils) + normal.y * offset * 4
            );
          }
        }

        c.lineTo(end.x, end.y);
      }

      if (constraint.lineWidth) {
        c.lineWidth = constraint.lineWidth;
        c.strokeStyle = constraint.strokeStyle;
        c.stroke();
      }

      if (constraint.anchors) {
        c.fillStyle = constraint.strokeStyle;
        c.beginPath();
        c.arc(start.x, start.y, 3, 0, 2 * Math.PI);
        c.arc(end.x, end.y, 3, 0, 2 * Math.PI);
        c.closePath();
        c.fill();
      }
    }
  }

  /**
   * Description
   * @private
   * @method bodyShadows
   * @param {render} render
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */

  private bodyShadows(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context,
      engine = this.engine;

    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];

      if (!body.visible)
        continue;

      if (body.circleRadius) {
        c.beginPath();
        c.arc(body.position.x, body.position.y, body.circleRadius, 0, 2 * Math.PI);
        c.closePath();
      } else {
        c.beginPath();
        c.moveTo(body.vertices[0].x, body.vertices[0].y);
        for (var j = 1; j < body.vertices.length; j++) {
          c.lineTo(body.vertices[j].x, body.vertices[j].y);
        }
        c.closePath();
      }

      var distanceX = body.position.x - this.options.width * 0.5,
        distanceY = body.position.y - this.options.height * 0.2,
        distance = Math.abs(distanceX) + Math.abs(distanceY);

      c.shadowColor = 'rgba(0,0,0,0.15)';
      c.shadowOffsetX = 0.05 * distanceX;
      c.shadowOffsetY = 0.05 * distanceY;
      c.shadowBlur = 1 + 12 * Math.min(1, distance / 1000);

      c.fill();

      // FIXME
      // c.shadowColor = null;
      // c.shadowOffsetX = null;
      // c.shadowOffsetY = null;
      // c.shadowBlur = null;
    }
  }

  /**
   * Description
   * @private
   * @method bodies
   * @param {render} render
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */

  private bodies(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context,
      engine = this.engine,
      options = this.options,
      showInternalEdges = options.showInternalEdges || !options.wireframes,
      body,
      part,
      i,
      k;

    for (i = 0; i < bodies.length; i++) {
      body = bodies[i];

      if (!body.visible)
        continue;

      // handle compound parts
      for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
        part = body.parts[k];

        if (!part.visible)
          continue;

        if (options.showSleeping && body.isSleeping) {
          c.globalAlpha = 0.5 * part.opacity;
        } else if (part.opacity !== 1) {
          c.globalAlpha = part.opacity;
        }

        if (part.texture && !options.wireframes) {
          // part sprite
          const texture = _getTexture(part.texture);

          c.translate(part.position.x, part.position.y);
          c.rotate(part.angle);

          c.drawImage(
            texture,
            texture.width * -part.xOffset * part.xScale,
            texture.height * -part.yOffset * part.yScale,
            texture.width * part.xScale,
            texture.height * part.yScale
          );

          // revert translation, hopefully faster than save / restore
          c.rotate(-part.angle);
          c.translate(-part.position.x, -part.position.y);
        } else {
          // part polygon
          if (part.circleRadius) {
            c.beginPath();
            c.arc(part.position.x, part.position.y, part.circleRadius, 0, 2 * Math.PI);
          } else {
            c.beginPath();
            c.moveTo(part.vertices[0].x, part.vertices[0].y);

            for (var j = 1; j < part.vertices.length; j++) {
              if (!part.vertices[j - 1].isInternal || showInternalEdges) {
                c.lineTo(part.vertices[j].x, part.vertices[j].y);
              } else {
                c.moveTo(part.vertices[j].x, part.vertices[j].y);
              }

              if (part.vertices[j].isInternal && !showInternalEdges) {
                c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
              }
            }

            c.lineTo(part.vertices[0].x, part.vertices[0].y);
            c.closePath();
          }

          if (!options.wireframes) {
            c.fillStyle = part.fillStyle;

            if (part.lineWidth) {
              c.lineWidth = part.lineWidth;
              c.strokeStyle = part.strokeStyle;
              c.stroke();
            }

            c.fill();
          } else {
            c.lineWidth = 1;
            c.strokeStyle = '#bbb';
            c.stroke();
          }
        }

        c.globalAlpha = 1;
      }
    }
  }

  /**
   * Optimised method for drawing body wireframes in one pass
   * @private
   * @method bodyWireframes
   * @param {render} this
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */

  private bodyWireframes(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context,
      showInternalEdges = this.options.showInternalEdges,
      body,
      part,
      i,
      j,
      k;

    c.beginPath();

    // render all bodies
    for (i = 0; i < bodies.length; i++) {
      body = bodies[i];

      if (!body.visible)
        continue;

      // handle compound parts
      for (k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k++) {
        part = body.parts[k];

        c.moveTo(part.vertices[0].x, part.vertices[0].y);

        for (j = 1; j < part.vertices.length; j++) {
          if (!part.vertices[j - 1].isInternal || showInternalEdges) {
            c.lineTo(part.vertices[j].x, part.vertices[j].y);
          } else {
            c.moveTo(part.vertices[j].x, part.vertices[j].y);
          }

          if (part.vertices[j].isInternal && !showInternalEdges) {
            c.moveTo(part.vertices[(j + 1) % part.vertices.length].x, part.vertices[(j + 1) % part.vertices.length].y);
          }
        }

        c.lineTo(part.vertices[0].x, part.vertices[0].y);
      }
    }

    c.lineWidth = 1;
    c.strokeStyle = '#bbb';
    c.stroke();
  };

  /**
   * Optimised method for drawing body convex hull wireframes in one pass
   * @private
   * @method bodyConvexHulls
   * @param {render} this
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */

  private bodyConvexHulls(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context,
      body,
      part,
      i,
      j,
      k;

    c.beginPath();

    // render convex hulls
    for (i = 0; i < bodies.length; i++) {
      body = bodies[i];

      if (!body.visible || body.parts.length === 1)
        continue;

      c.moveTo(body.vertices[0].x, body.vertices[0].y);

      for (j = 1; j < body.vertices.length; j++) {
        c.lineTo(body.vertices[j].x, body.vertices[j].y);
      }

      c.lineTo(body.vertices[0].x, body.vertices[0].y);
    }

    c.lineWidth = 1;
    c.strokeStyle = 'rgba(255,255,255,0.2)';
    c.stroke();
  };

  /**
   * Renders body vertex numbers.
   * @private
   * @method vertexNumbers
   * @param {render} render
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */
  private vertexNumbers(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context,
      i,
      j,
      k;

    for (i = 0; i < bodies.length; i++) {
      var parts = bodies[i].parts;
      for (k = parts.length > 1 ? 1 : 0; k < parts.length; k++) {
        var part = parts[k];
        for (j = 0; j < part.vertices.length; j++) {
          c.fillStyle = 'rgba(255,255,255,0.2)';
          c.fillText(i + '_' + j, part.position.x + (part.vertices[j].x - part.position.x) * 0.8, part.position.y + (part.vertices[j].y - part.position.y) * 0.8);
        }
      }
    }
  };

  /**
   * Renders mouse position.
   * @private
   * @method mousePosition
   * @param {render} render
   * @param {mouse} mouse
   * @param {RenderingContext} context
   */
  private mousePosition(mouse: any, context: CanvasRenderingContext2D) {
    var c = context;
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillText(mouse.position.x + '  ' + mouse.position.y, mouse.position.x + 5, mouse.position.y - 5);
  };

  /**
   * Draws body bounds
   * @private
   * @method bodyBounds
   * @param {render} render
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */
  private bodyBounds(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context,
      engine = this.engine,
      options = this.options;

    c.beginPath();

    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];

      if (body.visible) {
        var parts = bodies[i].parts;
        for (var j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
          var part = parts[j];
          c.rect(part.bounds.min.x, part.bounds.min.y, part.bounds.max.x - part.bounds.min.x, part.bounds.max.y - part.bounds.min.y);
        }
      }
    }

    if (options.wireframes) {
      c.strokeStyle = 'rgba(255,255,255,0.08)';
    } else {
      c.strokeStyle = 'rgba(0,0,0,0.1)';
    }

    c.lineWidth = 1;
    c.stroke();
  };

  /**
   * Draws body angle indicators and axes
   * @private
   * @method bodyAxes
   * @param {render} render
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */

  private bodyAxes(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context,
      engine = this.engine,
      options = this.options,
      part,
      i,
      j,
      k;

    c.beginPath();

    for (i = 0; i < bodies.length; i++) {
      var body = bodies[i],
        parts = body.parts;

      if (!body.visible)
        continue;

      if (options.showAxes) {
        // render all axes
        for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
          part = parts[j];
          for (k = 0; k < part.axes.length; k++) {
            var axis = part.axes[k];
            c.moveTo(part.position.x, part.position.y);
            c.lineTo(part.position.x + axis.x * 20, part.position.y + axis.y * 20);
          }
        }
      } else {
        for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
          part = parts[j];
          for (k = 0; k < part.axes.length; k++) {
            // render a single axis indicator
            c.moveTo(part.position.x, part.position.y);
            c.lineTo((part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2,
              (part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2);
          }
        }
      }
    }

    if (options.wireframes) {
      c.strokeStyle = 'indianred';
      c.lineWidth = 1;
    } else {
      c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      c.globalCompositeOperation = 'overlay';
      c.lineWidth = 2;
    }

    c.stroke();
    c.globalCompositeOperation = 'source-over';
  };

  /**
   * Draws body positions
   * @private
   * @method bodyPositions
   * @param {render} render
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */

  private bodyPositions(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context,
      engine = this.engine,
      options = this.options,
      body,
      part,
      i,
      k;

    c.beginPath();

    // render current positions
    for (i = 0; i < bodies.length; i++) {
      body = bodies[i];

      if (!body.visible)
        continue;

      // handle compound parts
      for (k = 0; k < body.parts.length; k++) {
        part = body.parts[k];
        c.arc(part.position.x, part.position.y, 3, 0, 2 * Math.PI, false);
        c.closePath();
      }
    }

    if (options.wireframes) {
      c.fillStyle = 'indianred';
    } else {
      c.fillStyle = 'rgba(0,0,0,0.5)';
    }
    c.fill();

    c.beginPath();

    // render previous positions
    for (i = 0; i < bodies.length; i++) {
      body = bodies[i];
      if (body.visible) {
        c.arc(body.positionPrev.x, body.positionPrev.y, 2, 0, 2 * Math.PI, false);
        c.closePath();
      }
    }

    c.fillStyle = 'rgba(255,165,0,0.8)';
    c.fill();
  }

  /**
   * Draws body velocity
   * @private
   * @method bodyVelocity
   * @param {render} this
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */
  private bodyVelocity(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context;

    c.beginPath();

    for (var i = 0; i < bodies.length; i++) {
      var body = bodies[i];

      if (!body.visible)
        continue;

      c.moveTo(body.position.x, body.position.y);
      c.lineTo(body.position.x + (body.position.x - body.positionPrev.x) * 2, body.position.y + (body.position.y - body.positionPrev.y) * 2);
    }

    c.lineWidth = 3;
    c.strokeStyle = 'cornflowerblue';
    c.stroke();
  }

  /**
   * Draws body ids
   * @private
   * @method bodyIds
   * @param {render} this
   * @param {body[]} bodies
   * @param {RenderingContext} context
   */

  private bodyIds(bodies: Body[], context: CanvasRenderingContext2D) {
    var c = context,
      i,
      j;

    for (i = 0; i < bodies.length; i++) {
      if (!bodies[i].visible)
        continue;

      var parts = bodies[i].parts;
      for (j = parts.length > 1 ? 1 : 0; j < parts.length; j++) {
        var part = parts[j];
        c.font = "12px Arial";
        c.fillStyle = 'rgba(255,255,255,0.5)';
        c.fillText(`${part.id}`, part.position.x + 10, part.position.y - 10);
      }
    }
  }

  /**
   * Description
   * @private
   * @method collisions
   * @param {render} render
   * @param {pair[]} pairs
   * @param {RenderingContext} context
   */

  private collisions(pairs: Pair[], context: CanvasRenderingContext2D) {
    var c = context,
      options = this.options,
      pair,
      collision,
      corrected,
      bodyA,
      bodyB,
      i,
      j;

    c.beginPath();

    // render collision positions
    for (i = 0; i < pairs.length; i++) {
      pair = pairs[i];

      if (!pair.isActive)
        continue;

      collision = pair.collision;
      for (j = 0; j < pair.activeContacts.length; j++) {
        var contact = pair.activeContacts[j],
          vertex = contact.vertex;
        c.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
      }
    }

    if (options.wireframes) {
      c.fillStyle = 'rgba(255,255,255,0.7)';
    } else {
      c.fillStyle = 'orange';
    }
    c.fill();

    c.beginPath();

    // render collision normals
    for (i = 0; i < pairs.length; i++) {
      pair = pairs[i];

      if (!pair.isActive)
        continue;

      collision = pair.collision;

      if (pair.activeContacts.length > 0) {
        var normalPosX = pair.activeContacts[0].vertex.x,
          normalPosY = pair.activeContacts[0].vertex.y;

        if (pair.activeContacts.length === 2) {
          normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
          normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
        }

        if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
          c.moveTo(normalPosX - collision.normal.x * 8, normalPosY - collision.normal.y * 8);
        } else {
          c.moveTo(normalPosX + collision.normal.x * 8, normalPosY + collision.normal.y * 8);
        }

        c.lineTo(normalPosX, normalPosY);
      }
    }

    if (options.wireframes) {
      c.strokeStyle = 'rgba(255,165,0,0.7)';
    } else {
      c.strokeStyle = 'orange';
    }

    c.lineWidth = 1;
    c.stroke();
  }

  /**
   * Description
   * @private
   * @method separations
   * @param {render} render
   * @param {pair[]} pairs
   * @param {RenderingContext} context
   */
  private separations(pairs: Pair[], context: CanvasRenderingContext2D) {
    var c = context,
      options = this.options,
      pair,
      collision,
      corrected,
      bodyA,
      bodyB,
      i,
      j;

    c.beginPath();

    // render separations
    for (i = 0; i < pairs.length; i++) {
      pair = pairs[i];

      if (!pair.isActive)
        continue;

      collision = pair.collision;
      bodyA = collision.bodyA;
      bodyB = collision.bodyB;

      var k = 1;

      if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
      if (bodyB.isStatic) k = 0;

      c.moveTo(bodyB.position.x, bodyB.position.y);
      c.lineTo(bodyB.position.x - collision.penetration.x * k, bodyB.position.y - collision.penetration.y * k);

      k = 1;

      if (!bodyB.isStatic && !bodyA.isStatic) k = 0.5;
      if (bodyA.isStatic) k = 0;

      c.moveTo(bodyA.position.x, bodyA.position.y);
      c.lineTo(bodyA.position.x + collision.penetration.x * k, bodyA.position.y + collision.penetration.y * k);
    }

    if (options.wireframes) {
      c.strokeStyle = 'rgba(255,165,0,0.5)';
    } else {
      c.strokeStyle = 'orange';
    }
    c.stroke();
  }

  /**
   * Description
   * @private
   * @method grid
   * @param {render} this
   * @param {grid} grid
   * @param {RenderingContext} context
   */

  private grid(grid: Grid, context: CanvasRenderingContext2D) {
    var c = context,
      options = this.options;

    if (options.wireframes) {
      c.strokeStyle = 'rgba(255,180,0,0.1)';
    } else {
      c.strokeStyle = 'rgba(255,180,0,0.5)';
    }

    c.beginPath();

    var bucketKeys = Common.keys(grid.buckets);

    for (var i = 0; i < bucketKeys.length; i++) {
      var bucketId = bucketKeys[i];

      if (grid.buckets[bucketId].length < 2)
        continue;

      var region = bucketId.split(/C|R/);
      c.rect(0.5 + parseInt(region[1], 10) * grid.bucketWidth,
        0.5 + parseInt(region[2], 10) * grid.bucketHeight,
        grid.bucketWidth,
        grid.bucketHeight);
    }

    c.lineWidth = 1;
    c.stroke();
  }

  /**
   * Description
   * @private
   * @method inspector
   * @param {inspector} inspector
   * @param {RenderingContext} context
   */
  private inspector(inspector: any, context: CanvasRenderingContext2D) {
    var engine = inspector.engine,
      selected = inspector.selected,
      render = inspector.render,
      options = render.options,
      bounds;

    if (options.hasBounds) {
      var boundsWidth = render.bounds.max.x - render.bounds.min.x,
        boundsHeight = render.bounds.max.y - render.bounds.min.y,
        boundsScaleX = boundsWidth / render.options.width,
        boundsScaleY = boundsHeight / render.options.height;

      context.scale(1 / boundsScaleX, 1 / boundsScaleY);
      context.translate(-render.bounds.min.x, -render.bounds.min.y);
    }

    for (var i = 0; i < selected.length; i++) {
      var item = selected[i].data;

      context.translate(0.5, 0.5);
      context.lineWidth = 1;
      context.strokeStyle = 'rgba(255,165,0,0.9)';
      context.setLineDash([1, 2]);

      switch (item.type) {

        case 'body':

          // render body selections
          bounds = item.bounds;
          context.beginPath();
          context.rect(Math.floor(bounds.min.x - 3), Math.floor(bounds.min.y - 3),
            Math.floor(bounds.max.x - bounds.min.x + 6), Math.floor(bounds.max.y - bounds.min.y + 6));
          context.closePath();
          context.stroke();

          break;

        case 'constraint':

          // render constraint selections
          var point = item.pointA;
          if (item.bodyA)
            point = item.pointB;
          context.beginPath();
          context.arc(point.x, point.y, 10, 0, 2 * Math.PI);
          context.closePath();
          context.stroke();

          break;

      }

      context.setLineDash([]);
      context.translate(-0.5, -0.5);
    }

    // render selection region
    if (inspector.selectStart !== null) {
      context.translate(0.5, 0.5);
      context.lineWidth = 1;
      context.strokeStyle = 'rgba(255,165,0,0.6)';
      context.fillStyle = 'rgba(255,165,0,0.1)';
      bounds = inspector.selectBounds;
      context.beginPath();
      context.rect(Math.floor(bounds.min.x), Math.floor(bounds.min.y),
        Math.floor(bounds.max.x - bounds.min.x), Math.floor(bounds.max.y - bounds.min.y));
      context.closePath();
      context.stroke();
      context.fill();
      context.translate(-0.5, -0.5);
    }

    if (options.hasBounds)
      context.setTransform(1, 0, 0, 1, 0, 0);
  }


}