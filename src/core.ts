import { Vector } from "./geometry";

var _nextId = 0;
var _seed = 0;
var _nowStartTime = +(new Date());

export class Common {

  //   /**
  //  * Extends the object in the first argument using the object in the second argument.
  //  * @method extend
  //  * @param {} obj
  //  * @param {boolean} deep
  //  * @return {} obj extended
  //  */

  //   public static extend(obj, deep) {
  //     var argsStart,
  //       args,
  //       deepClone;

  //     if (typeof deep === 'boolean') {
  //       argsStart = 2;
  //       deepClone = deep;
  //     } else {
  //       argsStart = 1;
  //       deepClone = true;
  //     }

  //     for (var i = argsStart; i < arguments.length; i++) {
  //       var source = arguments[i];

  //       if (source) {
  //         for (var prop in source) {
  //           if (deepClone && source[prop] && source[prop].constructor === Object) {
  //             if (!obj[prop] || obj[prop].constructor === Object) {
  //               obj[prop] = obj[prop] || {};
  //               Common.extend(obj[prop], deepClone, source[prop]);
  //             } else {
  //               obj[prop] = source[prop];
  //             }
  //           } else {
  //             obj[prop] = source[prop];
  //           }
  //         }
  //       }
  //     }

  //     return obj;
  //   }

  //   /**
  //    * Creates a new clone of the object, if deep is true references will also be cloned.
  //    * @method clone
  //    * @param {} obj
  //    * @param {bool} deep
  //    * @return {} obj cloned
  //    */

  //   public static clone(obj, deep) {
  //     return Common.extend({}, deep, obj);
  //   };

  /**
 * Returns the list of keys for the given object.
 * @method keys
 * @param {} obj
 * @return {string[]} keys
 */
  public static keys(obj: any) {
    if (Object.keys)
      return Object.keys(obj);

    // avoid hasOwnProperty for performance
    var keys = [];
    for (var key in obj)
      keys.push(key);
    return keys;
  }

  /**
   * Returns the list of values for the given object.
   * @method values
   * @param {} obj
   * @return {array} Array of the objects property values
   */

  public static values(obj): any[] {
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
  }

  /**
   * Returns the given value clamped between a minimum and maximum value.
   * @method clamp
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @return {number} The value clamped between min and max inclusive
   */
  public static clamp(value: number, min: number, max: number) {
    if (value < min)
      return min;
    if (value > max)
      return max;
    return value;
  }

  /**
   * Returns the sign of the given value.
   * @method sign
   * @param {number} value
   * @return {number} -1 if negative, +1 if 0 or positive
   */
  public static sign(value: number) {
    return value < 0 ? -1 : 1;
  }

  /**
 * Returns the next unique sequential ID.
 * @method nextId
 * @return {Number} Unique sequential ID
 */
  public static nextId() {
    return _nextId++;
  }

  /**
   * A cross browser compatible indexOf implementation.
   * @method indexOf
   * @param {array} haystack
   * @param {object} needle
   * @return {number} The position of needle in haystack, otherwise -1.
   */
  public static indexOf(haystack: any, needle: any) {
    if (haystack.indexOf)
      return haystack.indexOf(needle);

    for (var i = 0; i < haystack.length; i++) {
      if (haystack[i] === needle)
        return i;
    }
    return -1;
  }

}

const emptyarray: any[] = [];

export class Events {
  /**
   * Subscribes a callback function to the given object's `eventName`.
   * @method on
   * @param {} object
   * @param {string} eventNames
   * @param {function} callback
   */

  public static on(object: any, name: string, callback: any) {
    object.events = object.events || {};
    object.events[name] = object.events[name] || [];
    object.events[name].push(callback);
  }

  /**
   * Removes the given event callback. If no callback, clears all callbacks in `eventNames`. If no `eventNames`, clears all events.
   * @method off
   * @param {} object
   * @param {string} eventNames
   * @param {function} callback
   */

  public static off(object: any, name?: string, callback?: any) {
    if (name === undefined) {
      object.events = {};
      return;
    }

    if (callback === undefined) {
      object.events[name] = [];
      return;
    }

    const callbacks = object.events[name];
    if (callbacks !== undefined) {
      const newCallbacks = [];
      for (var j = 0; j < callbacks.length; j += 1) {
        if (callbacks[j] !== callback)
          newCallbacks.push(callbacks[j]);
      }
      object.events[name] = newCallbacks;
    }
  }

  /**
 * Fires all the callbacks subscribed to the given object's `eventName`, in the order they subscribed, if any.
 * @method trigger
 * @param {} object
 * @param {string} eventNames
 * @param {} event
 */

  public static trigger(object: any, name: string, event?: any) {
    if (object.events !== undefined) {
      const callbacks: any[] = object.events[name] || emptyarray;
      event['name'] = name;
      event['source'] = object;
      for (const callback of callbacks) {
        //eventClone = Common.clone(event, false);
        callback.apply(object, [event]);
      }
    }
  }

  public static onclick(object: any, func: (object, event) => object) {
    const target = object.past;
    this.on(object, 'beforeUpdate', (event) => {
      func(target, event);
      return false;
    });
  }

}


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

  public static update(bodies, timeScale) {
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
        body.sleepCounter += 1;

        if (body.sleepCounter >= body.sleepThreshold)
          Sleeping.set(body, true);
      } else if (body.sleepCounter > 0) {
        body.sleepCounter -= 1;
      }
    }
  };

  /**
   * Given a set of colliding pairs, wakes the sleeping bodies involved.
   * @method afterCollisions
   * @param {pair[]} pairs
   * @param {number} timeScale
   */

  public static afterCollisions(pairs, timeScale) {
    var timeFactor = timeScale * timeScale * timeScale;

    // wake up bodies involved in collisions
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];

      // don't wake inactive pairs
      if (!pair.isActive)
        continue;

      var collision = pair.collision,
        bodyA = collision.bodyA.parent,
        bodyB = collision.bodyB.parent;

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
  public static set(body, isSleeping) {
    var wasSleeping = body.isSleeping;

    if (isSleeping) {
      body.isSleeping = true;
      body.sleepCounter = body.sleepThreshold;

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
      body.sleepCounter = 0;

      if (wasSleeping) {
        Events.trigger(body, 'sleepEnd');
      }
    }
  }
}

/**
* The`Matter.Mouse` module contains methods for creating and manipulating mouse inputs.
*
* @class Mouse
*/

export class Mouse {
  public element;// = element || document.body;
  public absolute = new Vector(); // { x: 0, y: 0 };
  public position = new Vector(); //{ x: 0, y: 0 };
  public mousedownPosition = new Vector(); //{ x: 0, y: 0 };
  public mouseupPosition = new Vector(); //{ x: 0, y: 0 };
  public offset = new Vector(); //{ x: 0, y: 0 };
  public scale = new Vector(1, 1); //{ x: 1, y: 1 };
  public wheelDelta = 0;
  public button = -1;
  public pixelRatio: number;

  mousemove: (any) => void;
  mousedown: (any) => void;
  mouseup: (any) => void;
  mousewheel: (any) => void;
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
    this.pixelRatio = parseInt(this.element.getAttribute('data-pixel-ratio'), 10) || 1;

    this.mousemove = function (event) {
      var position = Mouse._getRelativeMousePosition(event, this.element, this.pixelRatio),
        touches = event.changedTouches;

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

    this.mousedown = function (event) {
      var position = Mouse._getRelativeMousePosition(event, this.element, this.pixelRatio),
        touches = event.changedTouches;

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

    this.mouseup = function (event) {
      var position = Mouse._getRelativeMousePosition(event, this.element, this.pixelRatio),
        touches = event.changedTouches;

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

    this.mousewheel = function (event) {
      this.wheelDelta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
      event.preventDefault();
    };

    this.setElement(this.element);

    return this;
  };

  /**
   * Sets the element the mouse is bound to (and relative to).
   * @method setElement
   * @param {mouse} this
   * @param {HTMLElement} element
   */

  public setElement(element) {
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
  };

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
  };

  /**
   * Sets the mouse position scale.
   * @method setScale
   * @param {mouse} mouse
   * @param {vector} scale
   */
  public setScale = function (scale: Vector) {
    this.scale.x = scale.x;
    this.scale.y = scale.y;
    this.position.x = this.absolute.x * this.scale.x + this.offset.x;
    this.position.y = this.absolute.y * this.scale.y + this.offset.y;
  };

  /**
   * Gets the mouse position relative to an element given a screen pixel ratio.
   * @method _getRelativeMousePosition
   * @private
   * @param {} event
   * @param {} element
   * @param {number} pixelRatio
   * @return {}
   */
  public static _getRelativeMousePosition(event: any, element, pixelRatio: number) {
    var elementBounds = element.getBoundingClientRect(),
      rootNode = (document.documentElement || document.body.parentNode || document.body),
      scrollX = (window.pageXOffset !== undefined) ? window.pageXOffset : rootNode.scrollLeft,
      scrollY = (window.pageYOffset !== undefined) ? window.pageYOffset : rootNode.scrollTop,
      touches = event.changedTouches,
      x, y;

    if (touches) {
      x = touches[0].pageX - elementBounds.left - scrollX;
      y = touches[0].pageY - elementBounds.top - scrollY;
    } else {
      x = event.pageX - elementBounds.left - scrollX;
      y = event.pageY - elementBounds.top - scrollY;
    }

    return new Vector(
      x / (element.clientWidth / (element.width || element.clientWidth) * pixelRatio),
      y / (element.clientHeight / (element.height || element.clientHeight) * pixelRatio)
    );
  }
}


