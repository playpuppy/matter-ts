import { Events } from './commons';
import { Vector, Vertices, Bounds } from './geometry';
import { Body, Filter, DefaultCollisionFilter, Constraint } from './body';
import { Engine, Sleeping } from './core';
import { Detector } from './collision';

/**
* The`Matter.Mouse` module contains methods for creating and manipulating mouse inputs.
*
* @class Mouse
*/

export class Mouse {
  public element: HTMLElement; // = element || document.body;
  public absolute = new Vector(); // { x: 0, y: 0 };
  public position = new Vector(); //{ x: 0, y: 0 };
  public mousedownPosition = new Vector(); //{ x: 0, y: 0 };
  public mouseupPosition = new Vector(); //{ x: 0, y: 0 };
  public offset = new Vector(); //{ x: 0, y: 0 };
  public scale = new Vector(1, 1); //{ x: 1, y: 1 };
  public wheelDelta = 0;
  public button = -1;
  public pixelRatio: number;

  mousemove: (e: any) => void;
  mousedown: (e: any) => void;
  mouseup: (e: any) => void;
  mousewheel: (e: any) => void;

  sourceEvents = {
    mousemove: null,
    mousedown: null,
    mouseup: null,
    mousewheel: null
  };

  // = parseInt(mouse.element.getAttribute('data-pixel-ratio'), 10) || 1;

  /**
   * Creates a mouse input.
   * @method create
   * @param {HTMLElement} element
   * @return {mouse} A new mouse
   */

  public constructor(element: HTMLElement) {
    // if (!element) {
    //   Common.log('Mouse.create: element was undefined, defaulting to document.body', 'warn');
    // }
    this.element = element;
    this.pixelRatio = element.getAttribute('data-pixel-ratio') ?
      parseInt(element.getAttribute('data-pixel-ratio')!, 10) : 1;

    this.mousemove = (event) => {
      const position = Mouse.getRelativeMousePosition(event, this.element, this.pixelRatio);
      const touches = event.changedTouches;

      if (touches) {
        this.button = 0;
        event.preventDefault();
      }

      this.absolute.x = position.x;
      this.absolute.y = position.y;
      this.position.x = this.absolute.x * this.scale.x + this.offset.x;
      this.position.y = this.absolute.y * this.scale.y + this.offset.y;
      this.sourceEvents.mousemove = event;
    };

    this.mousedown = (event) => {
      const position = Mouse.getRelativeMousePosition(event, this.element, this.pixelRatio);
      const touches = event.changedTouches;

      if (touches) {
        this.button = 0;
        event.preventDefault();
      } else {
        this.button = event.button;
      }

      this.absolute.x = position.x;
      this.absolute.y = position.y;
      this.position.x = this.absolute.x * this.scale.x + this.offset.x;
      this.position.y = this.absolute.y * this.scale.y + this.offset.y;
      this.mousedownPosition.x = this.position.x;
      this.mousedownPosition.y = this.position.y;
      this.sourceEvents.mousedown = event;
    };

    this.mouseup = (event) => {
      const position = Mouse.getRelativeMousePosition(event, this.element, this.pixelRatio);
      const touches = event.changedTouches;

      if (touches) {
        event.preventDefault();
      }

      this.button = -1;
      this.absolute.x = position.x;
      this.absolute.y = position.y;
      this.position.x = this.absolute.x * this.scale.x + this.offset.x;
      this.position.y = this.absolute.y * this.scale.y + this.offset.y;
      this.mouseupPosition.x = this.position.x;
      this.mouseupPosition.y = this.position.y;
      this.sourceEvents.mouseup = event;
    };

    this.mousewheel = (event) => {
      this.wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
      event.preventDefault();
    };
    this.setElement(this.element);
  }

  /**
   * Sets the element the mouse is bound to (and relative to).
   * @method setElement
   * @param {mouse} this
   * @param {HTMLElement} element
   */

  public setElement(element: HTMLElement) {
    this.element = element;
    element.addEventListener('mousemove', this.mousemove);
    element.addEventListener('mousedown', this.mousedown);
    element.addEventListener('mouseup', this.mouseup);

    element.addEventListener('mousewheel', this.mousewheel);
    element.addEventListener('DOMMouseScroll', this.mousewheel);

    element.addEventListener('touchmove', this.mousemove);
    element.addEventListener('touchstart', this.mousedown);
    element.addEventListener('touchend', this.mouseup);
  };

  /**
   * Clears all captured source events.
   * @method clearSourceEvents
   * @param {mouse} mouse
   */

  public clearSourceEvents() {
    this.sourceEvents.mousemove = null;
    this.sourceEvents.mousedown = null;
    this.sourceEvents.mouseup = null;
    this.sourceEvents.mousewheel = null;
    this.wheelDelta = 0;
  }

  /**
   * Sets the mouse position offset.
   * @method setOffset
   * @param {mouse} this
   * @param {vector} offset
   */

  public setOffset(offset: Vector) {
    this.offset.x = offset.x;
    this.offset.y = offset.y;
    this.position.x = this.absolute.x * this.scale.x + this.offset.x;
    this.position.y = this.absolute.y * this.scale.y + this.offset.y;
  }

  /**
   * Sets the mouse position scale.
   * @method setScale
   * @param {mouse} mouse
   * @param {vector} scale
   */

  public setScale(scale: Vector) {
    this.scale.x = scale.x;
    this.scale.y = scale.y;
    this.position.x = this.absolute.x * this.scale.x + this.offset.x;
    this.position.y = this.absolute.y * this.scale.y + this.offset.y;
  }

  /**
   * Gets the mouse position relative to an element given a screen pixel ratio.
   * @method _getRelativeMousePosition
   * @private
   * @param {} event
   * @param {} element
   * @param {number} pixelRatio
   * @return {}
   */

  private static getRelativeMousePosition(event: any, element: HTMLElement, pixelRatio: number) {
    const elementBounds = element.getBoundingClientRect();
    const rootNode = (document.documentElement || document.body.parentNode || document.body);
    const scrollX = (window.pageXOffset !== undefined) ? window.pageXOffset : rootNode.scrollLeft;
    const scrollY = (window.pageYOffset !== undefined) ? window.pageYOffset : rootNode.scrollTop;
    const touches = event.changedTouches;
    var x, y;

    if (touches) {
      x = touches[0].pageX - elementBounds.left - scrollX;
      y = touches[0].pageY - elementBounds.top - scrollY;
    } else {
      x = event.pageX - elementBounds.left - scrollX;
      y = event.pageY - elementBounds.top - scrollY;
    }

    return new Vector(
      x / (element.clientWidth / ((element as any)['width'] || element.clientWidth) * pixelRatio),
      y / (element.clientHeight / ((element as any)['height'] || element.clientHeight) * pixelRatio)
    );
  }
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
  public constraint: Constraint;
  public type = 'mouseConstraint';
  public mouse: Mouse;
  public element: HTMLElement | null;
  public body: Body | null = null;
  public collisionFilter: Filter = DefaultCollisionFilter;

  /**
   * Creates a new mouse constraint.
   * All properties have default values, and many are pre-calculated automatically based on other properties.
   * See the properties section below for detailed information on what you can pass via the `options` object.
   * @method create
   * @param {engine} engine
   * @param {} options
   * @return {MouseConstraint} A new MouseConstraint
   */

  public constructor(engine: Engine, options?: any) {
    var mouse = engine.mouse!;
    // if (!mouse) {
    //   if (engine && engine.render && engine.render.canvas) {
    //     mouse = Mouse.create(engine.render.canvas);
    //   } else if (options && options.element) {
    //     mouse = Mouse.create(options.element);
    //   } else {
    //     mouse = Mouse.create();
    //     Common.warn('MouseConstraint.create: options.mouse was undefined, options.element was undefined, may not function as expected');
    //   }
    // }
    this.constraint = new Constraint({
      label: 'Mouse Constraint',
      pointA: mouse.position,
      pointB: { x: 0, y: 0 },
      length: 0.01,
      stiffness: 0.1,
      angularStiffness: 1,
      strokeStyle: '#90EE90',
      lineWidth: 3
    });
    this.mouse = mouse;
    this.element = null;
    this.body = null;

    if (options !== undefined) {
      Object.assign(this, options);
    }

    Events.on(engine, 'beforeUpdate', () => {
      var allBodies = engine.world.allBodies();
      MouseConstraint.update(this, allBodies);
      MouseConstraint.triggerEvents(this);
    });
  }

  /**
   * Updates the given mouse constraint.
   * @private
   * @method update
   * @param {MouseConstraint} mouseConstraint
   * @param {body[]} bodies
   */

  public static update(mouseConstraint: MouseConstraint, bodies: Body[]) {
    const mouse = mouseConstraint.mouse;
    const constraint = mouseConstraint.constraint;
    const body = mouseConstraint.body;

    if (mouse.button === 0) {
      if (!constraint.bodyB) {
        for (var i = 0; i < bodies.length; i++) {
          const body = bodies[i];
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
  }

  /**
   * Triggers mouse constraint events.
   * @method _triggerEvents
   * @private
   * @param {mouse} mouseConstraint
   */
  private static triggerEvents(mouseConstraint: MouseConstraint) {
    const mouse = mouseConstraint.mouse;
    const mouseEvents = mouse.sourceEvents;

    if (mouseEvents.mousemove)
      Events.trigger(mouseConstraint, 'mousemove', { mouse: mouse });

    if (mouseEvents.mousedown)
      Events.trigger(mouseConstraint, 'mousedown', { mouse: mouse });

    if (mouseEvents.mouseup)
      Events.trigger(mouseConstraint, 'mouseup', { mouse: mouse });

    // reset the mouse state ready for the next step
    mouse.clearSourceEvents();
  }

}