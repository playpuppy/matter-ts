var _nextId = 0;
var _seed = 0;
var _nowStartTime = +(new Date());

export class Common {
  public static now() {
    return +(new Date()) - _nowStartTime;
  }
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

  public static values(obj: any): any[] {
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

}
