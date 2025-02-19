
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
function _mergeNamespaces(n, m) {
	m.forEach(function (e) {
		e && typeof e !== 'string' && !Array.isArray(e) && Object.keys(e).forEach(function (k) {
			if (k !== 'default' && !(k in n)) {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		});
	});
	return Object.freeze(n);
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var loglevel = {exports: {}};

/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/

(function (module) {
  (function (root, definition) {

    if (module.exports) {
      module.exports = definition();
    } else {
      root.log = definition();
    }
  })(commonjsGlobal, function () {

    var noop = function () {};

    var undefinedType = "undefined";
    var isIE = typeof window !== undefinedType && typeof window.navigator !== undefinedType && /Trident\/|MSIE /.test(window.navigator.userAgent);
    var logMethods = ["trace", "debug", "info", "warn", "error"]; // Cross-browser bind equivalent that works at least back to IE6

    function bindMethod(obj, methodName) {
      var method = obj[methodName];

      if (typeof method.bind === 'function') {
        return method.bind(obj);
      } else {
        try {
          return Function.prototype.bind.call(method, obj);
        } catch (e) {
          // Missing bind shim or IE8 + Modernizr, fallback to wrapping
          return function () {
            return Function.prototype.apply.apply(method, [obj, arguments]);
          };
        }
      }
    } // Trace() doesn't print the message in IE, so for that case we need to wrap it


    function traceForIE() {
      if (console.log) {
        if (console.log.apply) {
          console.log.apply(console, arguments);
        } else {
          // In old IE, native console methods themselves don't have apply().
          Function.prototype.apply.apply(console.log, [console, arguments]);
        }
      }

      if (console.trace) console.trace();
    } // Build the best logging method possible for this env
    // Wherever possible we want to bind, not wrap, to preserve stack traces


    function realMethod(methodName) {
      if (methodName === 'debug') {
        methodName = 'log';
      }

      if (typeof console === undefinedType) {
        return false; // No method possible, for now - fixed later by enableLoggingWhenConsoleArrives
      } else if (methodName === 'trace' && isIE) {
        return traceForIE;
      } else if (console[methodName] !== undefined) {
        return bindMethod(console, methodName);
      } else if (console.log !== undefined) {
        return bindMethod(console, 'log');
      } else {
        return noop;
      }
    } // These private functions always need `this` to be set properly


    function replaceLoggingMethods(level, loggerName) {
      /*jshint validthis:true */
      for (var i = 0; i < logMethods.length; i++) {
        var methodName = logMethods[i];
        this[methodName] = i < level ? noop : this.methodFactory(methodName, level, loggerName);
      } // Define log.log as an alias for log.debug


      this.log = this.debug;
    } // In old IE versions, the console isn't present until you first open it.
    // We build realMethod() replacements here that regenerate logging methods


    function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
      return function () {
        if (typeof console !== undefinedType) {
          replaceLoggingMethods.call(this, level, loggerName);
          this[methodName].apply(this, arguments);
        }
      };
    } // By default, we use closely bound real methods wherever possible, and
    // otherwise we wait for a console to appear, and then try again.


    function defaultMethodFactory(methodName, level, loggerName) {
      /*jshint validthis:true */
      return realMethod(methodName) || enableLoggingWhenConsoleArrives.apply(this, arguments);
    }

    function Logger(name, defaultLevel, factory) {
      var self = this;
      var currentLevel;
      defaultLevel = defaultLevel == null ? "WARN" : defaultLevel;
      var storageKey = "loglevel";

      if (typeof name === "string") {
        storageKey += ":" + name;
      } else if (typeof name === "symbol") {
        storageKey = undefined;
      }

      function persistLevelIfPossible(levelNum) {
        var levelName = (logMethods[levelNum] || 'silent').toUpperCase();
        if (typeof window === undefinedType || !storageKey) return; // Use localStorage if available

        try {
          window.localStorage[storageKey] = levelName;
          return;
        } catch (ignore) {} // Use session cookie as fallback


        try {
          window.document.cookie = encodeURIComponent(storageKey) + "=" + levelName + ";";
        } catch (ignore) {}
      }

      function getPersistedLevel() {
        var storedLevel;
        if (typeof window === undefinedType || !storageKey) return;

        try {
          storedLevel = window.localStorage[storageKey];
        } catch (ignore) {} // Fallback to cookies if local storage gives us nothing


        if (typeof storedLevel === undefinedType) {
          try {
            var cookie = window.document.cookie;
            var location = cookie.indexOf(encodeURIComponent(storageKey) + "=");

            if (location !== -1) {
              storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
            }
          } catch (ignore) {}
        } // If the stored level is not valid, treat it as if nothing was stored.


        if (self.levels[storedLevel] === undefined) {
          storedLevel = undefined;
        }

        return storedLevel;
      }

      function clearPersistedLevel() {
        if (typeof window === undefinedType || !storageKey) return; // Use localStorage if available

        try {
          window.localStorage.removeItem(storageKey);
          return;
        } catch (ignore) {} // Use session cookie as fallback


        try {
          window.document.cookie = encodeURIComponent(storageKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        } catch (ignore) {}
      }
      /*
       *
       * Public logger API - see https://github.com/pimterry/loglevel for details
       *
       */


      self.name = name;
      self.levels = {
        "TRACE": 0,
        "DEBUG": 1,
        "INFO": 2,
        "WARN": 3,
        "ERROR": 4,
        "SILENT": 5
      };
      self.methodFactory = factory || defaultMethodFactory;

      self.getLevel = function () {
        return currentLevel;
      };

      self.setLevel = function (level, persist) {
        if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
          level = self.levels[level.toUpperCase()];
        }

        if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
          currentLevel = level;

          if (persist !== false) {
            // defaults to true
            persistLevelIfPossible(level);
          }

          replaceLoggingMethods.call(self, level, name);

          if (typeof console === undefinedType && level < self.levels.SILENT) {
            return "No console available for logging";
          }
        } else {
          throw "log.setLevel() called with invalid level: " + level;
        }
      };

      self.setDefaultLevel = function (level) {
        defaultLevel = level;

        if (!getPersistedLevel()) {
          self.setLevel(level, false);
        }
      };

      self.resetLevel = function () {
        self.setLevel(defaultLevel, false);
        clearPersistedLevel();
      };

      self.enableAll = function (persist) {
        self.setLevel(self.levels.TRACE, persist);
      };

      self.disableAll = function (persist) {
        self.setLevel(self.levels.SILENT, persist);
      }; // Initialize with the right level


      var initialLevel = getPersistedLevel();

      if (initialLevel == null) {
        initialLevel = defaultLevel;
      }

      self.setLevel(initialLevel, false);
    }
    /*
     *
     * Top-level API
     *
     */


    var defaultLogger = new Logger();
    var _loggersByName = {};

    defaultLogger.getLogger = function getLogger(name) {
      if (typeof name !== "symbol" && typeof name !== "string" || name === "") {
        throw new TypeError("You must supply a name when creating a logger.");
      }

      var logger = _loggersByName[name];

      if (!logger) {
        logger = _loggersByName[name] = new Logger(name, defaultLogger.getLevel(), defaultLogger.methodFactory);
      }

      return logger;
    }; // Grab the current global log variable in case of overwrite


    var _log = typeof window !== undefinedType ? window.log : undefined;

    defaultLogger.noConflict = function () {
      if (typeof window !== undefinedType && window.log === defaultLogger) {
        window.log = _log;
      }

      return defaultLogger;
    };

    defaultLogger.getLoggers = function getLoggers() {
      return _loggersByName;
    }; // ES6 default export, for compatibility


    defaultLogger['default'] = defaultLogger;
    return defaultLogger;
  });
})(loglevel);

var LogLevel;

(function (LogLevel) {
  LogLevel[LogLevel["trace"] = 0] = "trace";
  LogLevel[LogLevel["debug"] = 1] = "debug";
  LogLevel[LogLevel["info"] = 2] = "info";
  LogLevel[LogLevel["warn"] = 3] = "warn";
  LogLevel[LogLevel["error"] = 4] = "error";
  LogLevel[LogLevel["silent"] = 5] = "silent";
})(LogLevel || (LogLevel = {}));

const livekitLogger = loglevel.exports.getLogger('livekit');
livekitLogger.setLevel(LogLevel.info);

var long = Long;
/**
 * wasm optimizations, to do native i64 multiplication and divide
 */

var wasm = null;

try {
  wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11])), {}).exports;
} catch (e) {// no wasm support :(
}
/**
 * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
 *  See the from* functions below for more convenient ways of constructing Longs.
 * @exports Long
 * @class A Long class for representing a 64 bit two's-complement integer value.
 * @param {number} low The low (signed) 32 bits of the long
 * @param {number} high The high (signed) 32 bits of the long
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @constructor
 */


function Long(low, high, unsigned) {
  /**
   * The low 32 bits as a signed value.
   * @type {number}
   */
  this.low = low | 0;
  /**
   * The high 32 bits as a signed value.
   * @type {number}
   */

  this.high = high | 0;
  /**
   * Whether unsigned or not.
   * @type {boolean}
   */

  this.unsigned = !!unsigned;
} // The internal representation of a long is the two given signed, 32-bit values.
// We use 32-bit pieces because these are the size of integers on which
// Javascript performs bit-operations.  For operations like addition and
// multiplication, we split each number into 16 bit pieces, which can easily be
// multiplied within Javascript's floating-point representation without overflow
// or change in sign.
//
// In the algorithms below, we frequently reduce the negative case to the
// positive case by negating the input(s) and then post-processing the result.
// Note that we must ALWAYS check specially whether those values are MIN_VALUE
// (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
// a positive number, it overflows back into a negative).  Not handling this
// case would often result in infinite recursion.
//
// Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
// methods on which they depend.

/**
 * An indicator used to reliably determine if an object is a Long or not.
 * @type {boolean}
 * @const
 * @private
 */


Long.prototype.__isLong__;
Object.defineProperty(Long.prototype, "__isLong__", {
  value: true
});
/**
 * @function
 * @param {*} obj Object
 * @returns {boolean}
 * @inner
 */

function isLong(obj) {
  return (obj && obj["__isLong__"]) === true;
}
/**
 * Tests if the specified object is a Long.
 * @function
 * @param {*} obj Object
 * @returns {boolean}
 */


Long.isLong = isLong;
/**
 * A cache of the Long representations of small integer values.
 * @type {!Object}
 * @inner
 */

var INT_CACHE = {};
/**
 * A cache of the Long representations of small unsigned integer values.
 * @type {!Object}
 * @inner
 */

var UINT_CACHE = {};
/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */

function fromInt(value, unsigned) {
  var obj, cachedObj, cache;

  if (unsigned) {
    value >>>= 0;

    if (cache = 0 <= value && value < 256) {
      cachedObj = UINT_CACHE[value];
      if (cachedObj) return cachedObj;
    }

    obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
    if (cache) UINT_CACHE[value] = obj;
    return obj;
  } else {
    value |= 0;

    if (cache = -128 <= value && value < 128) {
      cachedObj = INT_CACHE[value];
      if (cachedObj) return cachedObj;
    }

    obj = fromBits(value, value < 0 ? -1 : 0, false);
    if (cache) INT_CACHE[value] = obj;
    return obj;
  }
}
/**
 * Returns a Long representing the given 32 bit integer value.
 * @function
 * @param {number} value The 32 bit integer in question
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long} The corresponding Long value
 */


Long.fromInt = fromInt;
/**
 * @param {number} value
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */

function fromNumber(value, unsigned) {
  if (isNaN(value)) return unsigned ? UZERO : ZERO;

  if (unsigned) {
    if (value < 0) return UZERO;
    if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
  } else {
    if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
    if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
  }

  if (value < 0) return fromNumber(-value, unsigned).neg();
  return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
}
/**
 * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
 * @function
 * @param {number} value The number in question
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long} The corresponding Long value
 */


Long.fromNumber = fromNumber;
/**
 * @param {number} lowBits
 * @param {number} highBits
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */

function fromBits(lowBits, highBits, unsigned) {
  return new Long(lowBits, highBits, unsigned);
}
/**
 * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
 *  assumed to use 32 bits.
 * @function
 * @param {number} lowBits The low 32 bits
 * @param {number} highBits The high 32 bits
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long} The corresponding Long value
 */


Long.fromBits = fromBits;
/**
 * @function
 * @param {number} base
 * @param {number} exponent
 * @returns {number}
 * @inner
 */

var pow_dbl = Math.pow; // Used 4 times (4*8 to 15+4)

/**
 * @param {string} str
 * @param {(boolean|number)=} unsigned
 * @param {number=} radix
 * @returns {!Long}
 * @inner
 */

function fromString(str, unsigned, radix) {
  if (str.length === 0) throw Error('empty string');
  if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity") return ZERO;

  if (typeof unsigned === 'number') {
    // For goog.math.long compatibility
    radix = unsigned, unsigned = false;
  } else {
    unsigned = !!unsigned;
  }

  radix = radix || 10;
  if (radix < 2 || 36 < radix) throw RangeError('radix');
  var p;
  if ((p = str.indexOf('-')) > 0) throw Error('interior hyphen');else if (p === 0) {
    return fromString(str.substring(1), unsigned, radix).neg();
  } // Do several (8) digits each time through the loop, so as to
  // minimize the calls to the very expensive emulated div.

  var radixToPower = fromNumber(pow_dbl(radix, 8));
  var result = ZERO;

  for (var i = 0; i < str.length; i += 8) {
    var size = Math.min(8, str.length - i),
        value = parseInt(str.substring(i, i + size), radix);

    if (size < 8) {
      var power = fromNumber(pow_dbl(radix, size));
      result = result.mul(power).add(fromNumber(value));
    } else {
      result = result.mul(radixToPower);
      result = result.add(fromNumber(value));
    }
  }

  result.unsigned = unsigned;
  return result;
}
/**
 * Returns a Long representation of the given string, written using the specified radix.
 * @function
 * @param {string} str The textual representation of the Long
 * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to signed
 * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
 * @returns {!Long} The corresponding Long value
 */


Long.fromString = fromString;
/**
 * @function
 * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val
 * @param {boolean=} unsigned
 * @returns {!Long}
 * @inner
 */

function fromValue(val, unsigned) {
  if (typeof val === 'number') return fromNumber(val, unsigned);
  if (typeof val === 'string') return fromString(val, unsigned); // Throws for non-objects, converts non-instanceof Long:

  return fromBits(val.low, val.high, typeof unsigned === 'boolean' ? unsigned : val.unsigned);
}
/**
 * Converts the specified value to a Long using the appropriate from* function for its type.
 * @function
 * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val Value
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {!Long}
 */


Long.fromValue = fromValue; // NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
// no runtime penalty for these.

/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_16_DBL = 1 << 16;
/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_24_DBL = 1 << 24;
/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
/**
 * @type {number}
 * @const
 * @inner
 */

var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
/**
 * @type {!Long}
 * @const
 * @inner
 */

var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
/**
 * @type {!Long}
 * @inner
 */

var ZERO = fromInt(0);
/**
 * Signed zero.
 * @type {!Long}
 */

Long.ZERO = ZERO;
/**
 * @type {!Long}
 * @inner
 */

var UZERO = fromInt(0, true);
/**
 * Unsigned zero.
 * @type {!Long}
 */

Long.UZERO = UZERO;
/**
 * @type {!Long}
 * @inner
 */

var ONE = fromInt(1);
/**
 * Signed one.
 * @type {!Long}
 */

Long.ONE = ONE;
/**
 * @type {!Long}
 * @inner
 */

var UONE = fromInt(1, true);
/**
 * Unsigned one.
 * @type {!Long}
 */

Long.UONE = UONE;
/**
 * @type {!Long}
 * @inner
 */

var NEG_ONE = fromInt(-1);
/**
 * Signed negative one.
 * @type {!Long}
 */

Long.NEG_ONE = NEG_ONE;
/**
 * @type {!Long}
 * @inner
 */

var MAX_VALUE = fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0, false);
/**
 * Maximum signed value.
 * @type {!Long}
 */

Long.MAX_VALUE = MAX_VALUE;
/**
 * @type {!Long}
 * @inner
 */

var MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF | 0, 0xFFFFFFFF | 0, true);
/**
 * Maximum unsigned value.
 * @type {!Long}
 */

Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
/**
 * @type {!Long}
 * @inner
 */

var MIN_VALUE = fromBits(0, 0x80000000 | 0, false);
/**
 * Minimum signed value.
 * @type {!Long}
 */

Long.MIN_VALUE = MIN_VALUE;
/**
 * @alias Long.prototype
 * @inner
 */

var LongPrototype = Long.prototype;
/**
 * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
 * @returns {number}
 */

LongPrototype.toInt = function toInt() {
  return this.unsigned ? this.low >>> 0 : this.low;
};
/**
 * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
 * @returns {number}
 */


LongPrototype.toNumber = function toNumber() {
  if (this.unsigned) return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
  return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
};
/**
 * Converts the Long to a string written in the specified radix.
 * @param {number=} radix Radix (2-36), defaults to 10
 * @returns {string}
 * @override
 * @throws {RangeError} If `radix` is out of range
 */


LongPrototype.toString = function toString(radix) {
  radix = radix || 10;
  if (radix < 2 || 36 < radix) throw RangeError('radix');
  if (this.isZero()) return '0';

  if (this.isNegative()) {
    // Unsigned Longs are never negative
    if (this.eq(MIN_VALUE)) {
      // We need to change the Long value before it can be negated, so we remove
      // the bottom-most digit in this base and then recurse to do the rest.
      var radixLong = fromNumber(radix),
          div = this.div(radixLong),
          rem1 = div.mul(radixLong).sub(this);
      return div.toString(radix) + rem1.toInt().toString(radix);
    } else return '-' + this.neg().toString(radix);
  } // Do several (6) digits each time through the loop, so as to
  // minimize the calls to the very expensive emulated div.


  var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned),
      rem = this;
  var result = '';

  while (true) {
    var remDiv = rem.div(radixToPower),
        intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
        digits = intval.toString(radix);
    rem = remDiv;
    if (rem.isZero()) return digits + result;else {
      while (digits.length < 6) digits = '0' + digits;

      result = '' + digits + result;
    }
  }
};
/**
 * Gets the high 32 bits as a signed integer.
 * @returns {number} Signed high bits
 */


LongPrototype.getHighBits = function getHighBits() {
  return this.high;
};
/**
 * Gets the high 32 bits as an unsigned integer.
 * @returns {number} Unsigned high bits
 */


LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
  return this.high >>> 0;
};
/**
 * Gets the low 32 bits as a signed integer.
 * @returns {number} Signed low bits
 */


LongPrototype.getLowBits = function getLowBits() {
  return this.low;
};
/**
 * Gets the low 32 bits as an unsigned integer.
 * @returns {number} Unsigned low bits
 */


LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
  return this.low >>> 0;
};
/**
 * Gets the number of bits needed to represent the absolute value of this Long.
 * @returns {number}
 */


LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
  if (this.isNegative()) // Unsigned Longs are never negative
    return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
  var val = this.high != 0 ? this.high : this.low;

  for (var bit = 31; bit > 0; bit--) if ((val & 1 << bit) != 0) break;

  return this.high != 0 ? bit + 33 : bit + 1;
};
/**
 * Tests if this Long's value equals zero.
 * @returns {boolean}
 */


LongPrototype.isZero = function isZero() {
  return this.high === 0 && this.low === 0;
};
/**
 * Tests if this Long's value equals zero. This is an alias of {@link Long#isZero}.
 * @returns {boolean}
 */


LongPrototype.eqz = LongPrototype.isZero;
/**
 * Tests if this Long's value is negative.
 * @returns {boolean}
 */

LongPrototype.isNegative = function isNegative() {
  return !this.unsigned && this.high < 0;
};
/**
 * Tests if this Long's value is positive.
 * @returns {boolean}
 */


LongPrototype.isPositive = function isPositive() {
  return this.unsigned || this.high >= 0;
};
/**
 * Tests if this Long's value is odd.
 * @returns {boolean}
 */


LongPrototype.isOdd = function isOdd() {
  return (this.low & 1) === 1;
};
/**
 * Tests if this Long's value is even.
 * @returns {boolean}
 */


LongPrototype.isEven = function isEven() {
  return (this.low & 1) === 0;
};
/**
 * Tests if this Long's value equals the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.equals = function equals(other) {
  if (!isLong(other)) other = fromValue(other);
  if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1) return false;
  return this.high === other.high && this.low === other.low;
};
/**
 * Tests if this Long's value equals the specified's. This is an alias of {@link Long#equals}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.eq = LongPrototype.equals;
/**
 * Tests if this Long's value differs from the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.notEquals = function notEquals(other) {
  return !this.eq(
  /* validates */
  other);
};
/**
 * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.neq = LongPrototype.notEquals;
/**
 * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.ne = LongPrototype.notEquals;
/**
 * Tests if this Long's value is less than the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.lessThan = function lessThan(other) {
  return this.comp(
  /* validates */
  other) < 0;
};
/**
 * Tests if this Long's value is less than the specified's. This is an alias of {@link Long#lessThan}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.lt = LongPrototype.lessThan;
/**
 * Tests if this Long's value is less than or equal the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
  return this.comp(
  /* validates */
  other) <= 0;
};
/**
 * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.lte = LongPrototype.lessThanOrEqual;
/**
 * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.le = LongPrototype.lessThanOrEqual;
/**
 * Tests if this Long's value is greater than the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.greaterThan = function greaterThan(other) {
  return this.comp(
  /* validates */
  other) > 0;
};
/**
 * Tests if this Long's value is greater than the specified's. This is an alias of {@link Long#greaterThan}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.gt = LongPrototype.greaterThan;
/**
 * Tests if this Long's value is greater than or equal the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
  return this.comp(
  /* validates */
  other) >= 0;
};
/**
 * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */


LongPrototype.gte = LongPrototype.greaterThanOrEqual;
/**
 * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {boolean}
 */

LongPrototype.ge = LongPrototype.greaterThanOrEqual;
/**
 * Compares this Long's value with the specified's.
 * @param {!Long|number|string} other Other value
 * @returns {number} 0 if they are the same, 1 if the this is greater and -1
 *  if the given one is greater
 */

LongPrototype.compare = function compare(other) {
  if (!isLong(other)) other = fromValue(other);
  if (this.eq(other)) return 0;
  var thisNeg = this.isNegative(),
      otherNeg = other.isNegative();
  if (thisNeg && !otherNeg) return -1;
  if (!thisNeg && otherNeg) return 1; // At this point the sign bits are the same

  if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1; // Both are positive if at least one is unsigned

  return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
};
/**
 * Compares this Long's value with the specified's. This is an alias of {@link Long#compare}.
 * @function
 * @param {!Long|number|string} other Other value
 * @returns {number} 0 if they are the same, 1 if the this is greater and -1
 *  if the given one is greater
 */


LongPrototype.comp = LongPrototype.compare;
/**
 * Negates this Long's value.
 * @returns {!Long} Negated Long
 */

LongPrototype.negate = function negate() {
  if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
  return this.not().add(ONE);
};
/**
 * Negates this Long's value. This is an alias of {@link Long#negate}.
 * @function
 * @returns {!Long} Negated Long
 */


LongPrototype.neg = LongPrototype.negate;
/**
 * Returns the sum of this and the specified Long.
 * @param {!Long|number|string} addend Addend
 * @returns {!Long} Sum
 */

LongPrototype.add = function add(addend) {
  if (!isLong(addend)) addend = fromValue(addend); // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

  var a48 = this.high >>> 16;
  var a32 = this.high & 0xFFFF;
  var a16 = this.low >>> 16;
  var a00 = this.low & 0xFFFF;
  var b48 = addend.high >>> 16;
  var b32 = addend.high & 0xFFFF;
  var b16 = addend.low >>> 16;
  var b00 = addend.low & 0xFFFF;
  var c48 = 0,
      c32 = 0,
      c16 = 0,
      c00 = 0;
  c00 += a00 + b00;
  c16 += c00 >>> 16;
  c00 &= 0xFFFF;
  c16 += a16 + b16;
  c32 += c16 >>> 16;
  c16 &= 0xFFFF;
  c32 += a32 + b32;
  c48 += c32 >>> 16;
  c32 &= 0xFFFF;
  c48 += a48 + b48;
  c48 &= 0xFFFF;
  return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
};
/**
 * Returns the difference of this and the specified Long.
 * @param {!Long|number|string} subtrahend Subtrahend
 * @returns {!Long} Difference
 */


LongPrototype.subtract = function subtract(subtrahend) {
  if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
  return this.add(subtrahend.neg());
};
/**
 * Returns the difference of this and the specified Long. This is an alias of {@link Long#subtract}.
 * @function
 * @param {!Long|number|string} subtrahend Subtrahend
 * @returns {!Long} Difference
 */


LongPrototype.sub = LongPrototype.subtract;
/**
 * Returns the product of this and the specified Long.
 * @param {!Long|number|string} multiplier Multiplier
 * @returns {!Long} Product
 */

LongPrototype.multiply = function multiply(multiplier) {
  if (this.isZero()) return ZERO;
  if (!isLong(multiplier)) multiplier = fromValue(multiplier); // use wasm support if present

  if (wasm) {
    var low = wasm.mul(this.low, this.high, multiplier.low, multiplier.high);
    return fromBits(low, wasm.get_high(), this.unsigned);
  }

  if (multiplier.isZero()) return ZERO;
  if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
  if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;

  if (this.isNegative()) {
    if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());else return this.neg().mul(multiplier).neg();
  } else if (multiplier.isNegative()) return this.mul(multiplier.neg()).neg(); // If both longs are small, use float multiplication


  if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24)) return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned); // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
  // We can skip products that would overflow.

  var a48 = this.high >>> 16;
  var a32 = this.high & 0xFFFF;
  var a16 = this.low >>> 16;
  var a00 = this.low & 0xFFFF;
  var b48 = multiplier.high >>> 16;
  var b32 = multiplier.high & 0xFFFF;
  var b16 = multiplier.low >>> 16;
  var b00 = multiplier.low & 0xFFFF;
  var c48 = 0,
      c32 = 0,
      c16 = 0,
      c00 = 0;
  c00 += a00 * b00;
  c16 += c00 >>> 16;
  c00 &= 0xFFFF;
  c16 += a16 * b00;
  c32 += c16 >>> 16;
  c16 &= 0xFFFF;
  c16 += a00 * b16;
  c32 += c16 >>> 16;
  c16 &= 0xFFFF;
  c32 += a32 * b00;
  c48 += c32 >>> 16;
  c32 &= 0xFFFF;
  c32 += a16 * b16;
  c48 += c32 >>> 16;
  c32 &= 0xFFFF;
  c32 += a00 * b32;
  c48 += c32 >>> 16;
  c32 &= 0xFFFF;
  c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
  c48 &= 0xFFFF;
  return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
};
/**
 * Returns the product of this and the specified Long. This is an alias of {@link Long#multiply}.
 * @function
 * @param {!Long|number|string} multiplier Multiplier
 * @returns {!Long} Product
 */


LongPrototype.mul = LongPrototype.multiply;
/**
 * Returns this Long divided by the specified. The result is signed if this Long is signed or
 *  unsigned if this Long is unsigned.
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Quotient
 */

LongPrototype.divide = function divide(divisor) {
  if (!isLong(divisor)) divisor = fromValue(divisor);
  if (divisor.isZero()) throw Error('division by zero'); // use wasm support if present

  if (wasm) {
    // guard against signed division overflow: the largest
    // negative number / -1 would be 1 larger than the largest
    // positive number, due to two's complement.
    if (!this.unsigned && this.high === -0x80000000 && divisor.low === -1 && divisor.high === -1) {
      // be consistent with non-wasm code path
      return this;
    }

    var low = (this.unsigned ? wasm.div_u : wasm.div_s)(this.low, this.high, divisor.low, divisor.high);
    return fromBits(low, wasm.get_high(), this.unsigned);
  }

  if (this.isZero()) return this.unsigned ? UZERO : ZERO;
  var approx, rem, res;

  if (!this.unsigned) {
    // This section is only relevant for signed longs and is derived from the
    // closure library as a whole.
    if (this.eq(MIN_VALUE)) {
      if (divisor.eq(ONE) || divisor.eq(NEG_ONE)) return MIN_VALUE; // recall that -MIN_VALUE == MIN_VALUE
      else if (divisor.eq(MIN_VALUE)) return ONE;else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shr(1);
        approx = halfThis.div(divisor).shl(1);

        if (approx.eq(ZERO)) {
          return divisor.isNegative() ? ONE : NEG_ONE;
        } else {
          rem = this.sub(divisor.mul(approx));
          res = approx.add(rem.div(divisor));
          return res;
        }
      }
    } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;

    if (this.isNegative()) {
      if (divisor.isNegative()) return this.neg().div(divisor.neg());
      return this.neg().div(divisor).neg();
    } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();

    res = ZERO;
  } else {
    // The algorithm below has not been made for unsigned longs. It's therefore
    // required to take special care of the MSB prior to running it.
    if (!divisor.unsigned) divisor = divisor.toUnsigned();
    if (divisor.gt(this)) return UZERO;
    if (divisor.gt(this.shru(1))) // 15 >>> 1 = 7 ; with divisor = 8 ; true
      return UONE;
    res = UZERO;
  } // Repeat the following until the remainder is less than other:  find a
  // floating-point that approximates remainder / other *from below*, add this
  // into the result, and subtract it from the remainder.  It is critical that
  // the approximate value is less than or equal to the real value so that the
  // remainder never becomes negative.


  rem = this;

  while (rem.gte(divisor)) {
    // Approximate the result of division. This may be a little greater or
    // smaller than the actual value.
    approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber())); // We will tweak the approximate result by changing it in the 48-th digit or
    // the smallest non-fractional digit, whichever is larger.

    var log2 = Math.ceil(Math.log(approx) / Math.LN2),
        delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48),
        // Decrease the approximation until it is smaller than the remainder.  Note
    // that if it is too large, the product overflows and is negative.
    approxRes = fromNumber(approx),
        approxRem = approxRes.mul(divisor);

    while (approxRem.isNegative() || approxRem.gt(rem)) {
      approx -= delta;
      approxRes = fromNumber(approx, this.unsigned);
      approxRem = approxRes.mul(divisor);
    } // We know the answer can't be zero... and actually, zero would cause
    // infinite recursion since we would make no progress.


    if (approxRes.isZero()) approxRes = ONE;
    res = res.add(approxRes);
    rem = rem.sub(approxRem);
  }

  return res;
};
/**
 * Returns this Long divided by the specified. This is an alias of {@link Long#divide}.
 * @function
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Quotient
 */


LongPrototype.div = LongPrototype.divide;
/**
 * Returns this Long modulo the specified.
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Remainder
 */

LongPrototype.modulo = function modulo(divisor) {
  if (!isLong(divisor)) divisor = fromValue(divisor); // use wasm support if present

  if (wasm) {
    var low = (this.unsigned ? wasm.rem_u : wasm.rem_s)(this.low, this.high, divisor.low, divisor.high);
    return fromBits(low, wasm.get_high(), this.unsigned);
  }

  return this.sub(this.div(divisor).mul(divisor));
};
/**
 * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
 * @function
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Remainder
 */


LongPrototype.mod = LongPrototype.modulo;
/**
 * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
 * @function
 * @param {!Long|number|string} divisor Divisor
 * @returns {!Long} Remainder
 */

LongPrototype.rem = LongPrototype.modulo;
/**
 * Returns the bitwise NOT of this Long.
 * @returns {!Long}
 */

LongPrototype.not = function not() {
  return fromBits(~this.low, ~this.high, this.unsigned);
};
/**
 * Returns the bitwise AND of this Long and the specified.
 * @param {!Long|number|string} other Other Long
 * @returns {!Long}
 */


LongPrototype.and = function and(other) {
  if (!isLong(other)) other = fromValue(other);
  return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
};
/**
 * Returns the bitwise OR of this Long and the specified.
 * @param {!Long|number|string} other Other Long
 * @returns {!Long}
 */


LongPrototype.or = function or(other) {
  if (!isLong(other)) other = fromValue(other);
  return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
};
/**
 * Returns the bitwise XOR of this Long and the given one.
 * @param {!Long|number|string} other Other Long
 * @returns {!Long}
 */


LongPrototype.xor = function xor(other) {
  if (!isLong(other)) other = fromValue(other);
  return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
};
/**
 * Returns this Long with bits shifted to the left by the given amount.
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */


LongPrototype.shiftLeft = function shiftLeft(numBits) {
  if (isLong(numBits)) numBits = numBits.toInt();
  if ((numBits &= 63) === 0) return this;else if (numBits < 32) return fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits, this.unsigned);else return fromBits(0, this.low << numBits - 32, this.unsigned);
};
/**
 * Returns this Long with bits shifted to the left by the given amount. This is an alias of {@link Long#shiftLeft}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */


LongPrototype.shl = LongPrototype.shiftLeft;
/**
 * Returns this Long with bits arithmetically shifted to the right by the given amount.
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */

LongPrototype.shiftRight = function shiftRight(numBits) {
  if (isLong(numBits)) numBits = numBits.toInt();
  if ((numBits &= 63) === 0) return this;else if (numBits < 32) return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);else return fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
};
/**
 * Returns this Long with bits arithmetically shifted to the right by the given amount. This is an alias of {@link Long#shiftRight}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */


LongPrototype.shr = LongPrototype.shiftRight;
/**
 * Returns this Long with bits logically shifted to the right by the given amount.
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */

LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
  if (isLong(numBits)) numBits = numBits.toInt();
  numBits &= 63;
  if (numBits === 0) return this;else {
    var high = this.high;

    if (numBits < 32) {
      var low = this.low;
      return fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits, this.unsigned);
    } else if (numBits === 32) return fromBits(high, 0, this.unsigned);else return fromBits(high >>> numBits - 32, 0, this.unsigned);
  }
};
/**
 * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */


LongPrototype.shru = LongPrototype.shiftRightUnsigned;
/**
 * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
 * @function
 * @param {number|!Long} numBits Number of bits
 * @returns {!Long} Shifted Long
 */

LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
/**
 * Converts this Long to signed.
 * @returns {!Long} Signed long
 */

LongPrototype.toSigned = function toSigned() {
  if (!this.unsigned) return this;
  return fromBits(this.low, this.high, false);
};
/**
 * Converts this Long to unsigned.
 * @returns {!Long} Unsigned long
 */


LongPrototype.toUnsigned = function toUnsigned() {
  if (this.unsigned) return this;
  return fromBits(this.low, this.high, true);
};
/**
 * Converts this Long to its byte representation.
 * @param {boolean=} le Whether little or big endian, defaults to big endian
 * @returns {!Array.<number>} Byte representation
 */


LongPrototype.toBytes = function toBytes(le) {
  return le ? this.toBytesLE() : this.toBytesBE();
};
/**
 * Converts this Long to its little endian byte representation.
 * @returns {!Array.<number>} Little endian byte representation
 */


LongPrototype.toBytesLE = function toBytesLE() {
  var hi = this.high,
      lo = this.low;
  return [lo & 0xff, lo >>> 8 & 0xff, lo >>> 16 & 0xff, lo >>> 24, hi & 0xff, hi >>> 8 & 0xff, hi >>> 16 & 0xff, hi >>> 24];
};
/**
 * Converts this Long to its big endian byte representation.
 * @returns {!Array.<number>} Big endian byte representation
 */


LongPrototype.toBytesBE = function toBytesBE() {
  var hi = this.high,
      lo = this.low;
  return [hi >>> 24, hi >>> 16 & 0xff, hi >>> 8 & 0xff, hi & 0xff, lo >>> 24, lo >>> 16 & 0xff, lo >>> 8 & 0xff, lo & 0xff];
};
/**
 * Creates a Long from its byte representation.
 * @param {!Array.<number>} bytes Byte representation
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @param {boolean=} le Whether little or big endian, defaults to big endian
 * @returns {Long} The corresponding Long value
 */


Long.fromBytes = function fromBytes(bytes, unsigned, le) {
  return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
};
/**
 * Creates a Long from its little endian byte representation.
 * @param {!Array.<number>} bytes Little endian byte representation
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {Long} The corresponding Long value
 */


Long.fromBytesLE = function fromBytesLE(bytes, unsigned) {
  return new Long(bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24, bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24, unsigned);
};
/**
 * Creates a Long from its big endian byte representation.
 * @param {!Array.<number>} bytes Big endian byte representation
 * @param {boolean=} unsigned Whether unsigned or not, defaults to signed
 * @returns {Long} The corresponding Long value
 */


Long.fromBytesBE = function fromBytesBE(bytes, unsigned) {
  return new Long(bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7], bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], unsigned);
};

var minimal$1 = {exports: {}};

var indexMinimal = {};

var minimal = {};

var aspromise;
var hasRequiredAspromise;

function requireAspromise() {
  if (hasRequiredAspromise) return aspromise;
  hasRequiredAspromise = 1;

  aspromise = asPromise;
  /**
   * Callback as used by {@link util.asPromise}.
   * @typedef asPromiseCallback
   * @type {function}
   * @param {Error|null} error Error, if any
   * @param {...*} params Additional arguments
   * @returns {undefined}
   */

  /**
   * Returns a promise from a node-style callback function.
   * @memberof util
   * @param {asPromiseCallback} fn Function to call
   * @param {*} ctx Function context
   * @param {...*} params Function arguments
   * @returns {Promise<*>} Promisified function
   */

  function asPromise(fn, ctx
  /*, varargs */
  ) {
    var params = new Array(arguments.length - 1),
        offset = 0,
        index = 2,
        pending = true;

    while (index < arguments.length) params[offset++] = arguments[index++];

    return new Promise(function executor(resolve, reject) {
      params[offset] = function callback(err
      /*, varargs */
      ) {
        if (pending) {
          pending = false;
          if (err) reject(err);else {
            var params = new Array(arguments.length - 1),
                offset = 0;

            while (offset < params.length) params[offset++] = arguments[offset];

            resolve.apply(null, params);
          }
        }
      };

      try {
        fn.apply(ctx || null, params);
      } catch (err) {
        if (pending) {
          pending = false;
          reject(err);
        }
      }
    });
  }

  return aspromise;
}

var base64$1 = {};

var hasRequiredBase64;

function requireBase64() {
  if (hasRequiredBase64) return base64$1;
  hasRequiredBase64 = 1;

  (function (exports) {
    /**
     * A minimal base64 implementation for number arrays.
     * @memberof util
     * @namespace
     */

    var base64 = exports;
    /**
     * Calculates the byte length of a base64 encoded string.
     * @param {string} string Base64 encoded string
     * @returns {number} Byte length
     */

    base64.length = function length(string) {
      var p = string.length;
      if (!p) return 0;
      var n = 0;

      while (--p % 4 > 1 && string.charAt(p) === "=") ++n;

      return Math.ceil(string.length * 3) / 4 - n;
    }; // Base64 encoding table


    var b64 = new Array(64); // Base64 decoding table

    var s64 = new Array(123); // 65..90, 97..122, 48..57, 43, 47

    for (var i = 0; i < 64;) s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
    /**
     * Encodes a buffer to a base64 encoded string.
     * @param {Uint8Array} buffer Source buffer
     * @param {number} start Source start
     * @param {number} end Source end
     * @returns {string} Base64 encoded string
     */


    base64.encode = function encode(buffer, start, end) {
      var parts = null,
          chunk = [];
      var i = 0,
          // output index
      j = 0,
          // goto index
      t; // temporary

      while (start < end) {
        var b = buffer[start++];

        switch (j) {
          case 0:
            chunk[i++] = b64[b >> 2];
            t = (b & 3) << 4;
            j = 1;
            break;

          case 1:
            chunk[i++] = b64[t | b >> 4];
            t = (b & 15) << 2;
            j = 2;
            break;

          case 2:
            chunk[i++] = b64[t | b >> 6];
            chunk[i++] = b64[b & 63];
            j = 0;
            break;
        }

        if (i > 8191) {
          (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
          i = 0;
        }
      }

      if (j) {
        chunk[i++] = b64[t];
        chunk[i++] = 61;
        if (j === 1) chunk[i++] = 61;
      }

      if (parts) {
        if (i) parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
      }

      return String.fromCharCode.apply(String, chunk.slice(0, i));
    };

    var invalidEncoding = "invalid encoding";
    /**
     * Decodes a base64 encoded string to a buffer.
     * @param {string} string Source string
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Number of bytes written
     * @throws {Error} If encoding is invalid
     */

    base64.decode = function decode(string, buffer, offset) {
      var start = offset;
      var j = 0,
          // goto index
      t; // temporary

      for (var i = 0; i < string.length;) {
        var c = string.charCodeAt(i++);
        if (c === 61 && j > 1) break;
        if ((c = s64[c]) === undefined) throw Error(invalidEncoding);

        switch (j) {
          case 0:
            t = c;
            j = 1;
            break;

          case 1:
            buffer[offset++] = t << 2 | (c & 48) >> 4;
            t = c;
            j = 2;
            break;

          case 2:
            buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
            t = c;
            j = 3;
            break;

          case 3:
            buffer[offset++] = (t & 3) << 6 | c;
            j = 0;
            break;
        }
      }

      if (j === 1) throw Error(invalidEncoding);
      return offset - start;
    };
    /**
     * Tests if the specified string appears to be base64 encoded.
     * @param {string} string String to test
     * @returns {boolean} `true` if probably base64 encoded, otherwise false
     */


    base64.test = function test(string) {
      return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
    };
  })(base64$1);

  return base64$1;
}

var eventemitter;
var hasRequiredEventemitter;

function requireEventemitter() {
  if (hasRequiredEventemitter) return eventemitter;
  hasRequiredEventemitter = 1;

  eventemitter = EventEmitter;
  /**
   * Constructs a new event emitter instance.
   * @classdesc A minimal event emitter.
   * @memberof util
   * @constructor
   */

  function EventEmitter() {
    /**
     * Registered listeners.
     * @type {Object.<string,*>}
     * @private
     */
    this._listeners = {};
  }
  /**
   * Registers an event listener.
   * @param {string} evt Event name
   * @param {function} fn Listener
   * @param {*} [ctx] Listener context
   * @returns {util.EventEmitter} `this`
   */


  EventEmitter.prototype.on = function on(evt, fn, ctx) {
    (this._listeners[evt] || (this._listeners[evt] = [])).push({
      fn: fn,
      ctx: ctx || this
    });
    return this;
  };
  /**
   * Removes an event listener or any matching listeners if arguments are omitted.
   * @param {string} [evt] Event name. Removes all listeners if omitted.
   * @param {function} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
   * @returns {util.EventEmitter} `this`
   */


  EventEmitter.prototype.off = function off(evt, fn) {
    if (evt === undefined) this._listeners = {};else {
      if (fn === undefined) this._listeners[evt] = [];else {
        var listeners = this._listeners[evt];

        for (var i = 0; i < listeners.length;) if (listeners[i].fn === fn) listeners.splice(i, 1);else ++i;
      }
    }
    return this;
  };
  /**
   * Emits an event by calling its listeners with the specified arguments.
   * @param {string} evt Event name
   * @param {...*} args Arguments
   * @returns {util.EventEmitter} `this`
   */


  EventEmitter.prototype.emit = function emit(evt) {
    var listeners = this._listeners[evt];

    if (listeners) {
      var args = [],
          i = 1;

      for (; i < arguments.length;) args.push(arguments[i++]);

      for (i = 0; i < listeners.length;) listeners[i].fn.apply(listeners[i++].ctx, args);
    }

    return this;
  };

  return eventemitter;
}

var float;
var hasRequiredFloat;

function requireFloat() {
  if (hasRequiredFloat) return float;
  hasRequiredFloat = 1;

  float = factory(factory);
  /**
   * Reads / writes floats / doubles from / to buffers.
   * @name util.float
   * @namespace
   */

  /**
   * Writes a 32 bit float to a buffer using little endian byte order.
   * @name util.float.writeFloatLE
   * @function
   * @param {number} val Value to write
   * @param {Uint8Array} buf Target buffer
   * @param {number} pos Target buffer offset
   * @returns {undefined}
   */

  /**
   * Writes a 32 bit float to a buffer using big endian byte order.
   * @name util.float.writeFloatBE
   * @function
   * @param {number} val Value to write
   * @param {Uint8Array} buf Target buffer
   * @param {number} pos Target buffer offset
   * @returns {undefined}
   */

  /**
   * Reads a 32 bit float from a buffer using little endian byte order.
   * @name util.float.readFloatLE
   * @function
   * @param {Uint8Array} buf Source buffer
   * @param {number} pos Source buffer offset
   * @returns {number} Value read
   */

  /**
   * Reads a 32 bit float from a buffer using big endian byte order.
   * @name util.float.readFloatBE
   * @function
   * @param {Uint8Array} buf Source buffer
   * @param {number} pos Source buffer offset
   * @returns {number} Value read
   */

  /**
   * Writes a 64 bit double to a buffer using little endian byte order.
   * @name util.float.writeDoubleLE
   * @function
   * @param {number} val Value to write
   * @param {Uint8Array} buf Target buffer
   * @param {number} pos Target buffer offset
   * @returns {undefined}
   */

  /**
   * Writes a 64 bit double to a buffer using big endian byte order.
   * @name util.float.writeDoubleBE
   * @function
   * @param {number} val Value to write
   * @param {Uint8Array} buf Target buffer
   * @param {number} pos Target buffer offset
   * @returns {undefined}
   */

  /**
   * Reads a 64 bit double from a buffer using little endian byte order.
   * @name util.float.readDoubleLE
   * @function
   * @param {Uint8Array} buf Source buffer
   * @param {number} pos Source buffer offset
   * @returns {number} Value read
   */

  /**
   * Reads a 64 bit double from a buffer using big endian byte order.
   * @name util.float.readDoubleBE
   * @function
   * @param {Uint8Array} buf Source buffer
   * @param {number} pos Source buffer offset
   * @returns {number} Value read
   */
  // Factory function for the purpose of node-based testing in modified global environments

  function factory(exports) {
    // float: typed array
    if (typeof Float32Array !== "undefined") (function () {
      var f32 = new Float32Array([-0]),
          f8b = new Uint8Array(f32.buffer),
          le = f8b[3] === 128;

      function writeFloat_f32_cpy(val, buf, pos) {
        f32[0] = val;
        buf[pos] = f8b[0];
        buf[pos + 1] = f8b[1];
        buf[pos + 2] = f8b[2];
        buf[pos + 3] = f8b[3];
      }

      function writeFloat_f32_rev(val, buf, pos) {
        f32[0] = val;
        buf[pos] = f8b[3];
        buf[pos + 1] = f8b[2];
        buf[pos + 2] = f8b[1];
        buf[pos + 3] = f8b[0];
      }
      /* istanbul ignore next */


      exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
      /* istanbul ignore next */

      exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;

      function readFloat_f32_cpy(buf, pos) {
        f8b[0] = buf[pos];
        f8b[1] = buf[pos + 1];
        f8b[2] = buf[pos + 2];
        f8b[3] = buf[pos + 3];
        return f32[0];
      }

      function readFloat_f32_rev(buf, pos) {
        f8b[3] = buf[pos];
        f8b[2] = buf[pos + 1];
        f8b[1] = buf[pos + 2];
        f8b[0] = buf[pos + 3];
        return f32[0];
      }
      /* istanbul ignore next */


      exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
      /* istanbul ignore next */

      exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy; // float: ieee754
    })();else (function () {
      function writeFloat_ieee754(writeUint, val, buf, pos) {
        var sign = val < 0 ? 1 : 0;
        if (sign) val = -val;
        if (val === 0) writeUint(1 / val > 0 ?
        /* positive */
        0 :
        /* negative 0 */
        2147483648, buf, pos);else if (isNaN(val)) writeUint(2143289344, buf, pos);else if (val > 3.4028234663852886e+38) // +-Infinity
          writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);else if (val < 1.1754943508222875e-38) // denormal
          writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);else {
          var exponent = Math.floor(Math.log(val) / Math.LN2),
              mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
          writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
        }
      }

      exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
      exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);

      function readFloat_ieee754(readUint, buf, pos) {
        var uint = readUint(buf, pos),
            sign = (uint >> 31) * 2 + 1,
            exponent = uint >>> 23 & 255,
            mantissa = uint & 8388607;
        return exponent === 255 ? mantissa ? NaN : sign * Infinity : exponent === 0 // denormal
        ? sign * 1.401298464324817e-45 * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
      }

      exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
      exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
    })(); // double: typed array

    if (typeof Float64Array !== "undefined") (function () {
      var f64 = new Float64Array([-0]),
          f8b = new Uint8Array(f64.buffer),
          le = f8b[7] === 128;

      function writeDouble_f64_cpy(val, buf, pos) {
        f64[0] = val;
        buf[pos] = f8b[0];
        buf[pos + 1] = f8b[1];
        buf[pos + 2] = f8b[2];
        buf[pos + 3] = f8b[3];
        buf[pos + 4] = f8b[4];
        buf[pos + 5] = f8b[5];
        buf[pos + 6] = f8b[6];
        buf[pos + 7] = f8b[7];
      }

      function writeDouble_f64_rev(val, buf, pos) {
        f64[0] = val;
        buf[pos] = f8b[7];
        buf[pos + 1] = f8b[6];
        buf[pos + 2] = f8b[5];
        buf[pos + 3] = f8b[4];
        buf[pos + 4] = f8b[3];
        buf[pos + 5] = f8b[2];
        buf[pos + 6] = f8b[1];
        buf[pos + 7] = f8b[0];
      }
      /* istanbul ignore next */


      exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
      /* istanbul ignore next */

      exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;

      function readDouble_f64_cpy(buf, pos) {
        f8b[0] = buf[pos];
        f8b[1] = buf[pos + 1];
        f8b[2] = buf[pos + 2];
        f8b[3] = buf[pos + 3];
        f8b[4] = buf[pos + 4];
        f8b[5] = buf[pos + 5];
        f8b[6] = buf[pos + 6];
        f8b[7] = buf[pos + 7];
        return f64[0];
      }

      function readDouble_f64_rev(buf, pos) {
        f8b[7] = buf[pos];
        f8b[6] = buf[pos + 1];
        f8b[5] = buf[pos + 2];
        f8b[4] = buf[pos + 3];
        f8b[3] = buf[pos + 4];
        f8b[2] = buf[pos + 5];
        f8b[1] = buf[pos + 6];
        f8b[0] = buf[pos + 7];
        return f64[0];
      }
      /* istanbul ignore next */


      exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
      /* istanbul ignore next */

      exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy; // double: ieee754
    })();else (function () {
      function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
        var sign = val < 0 ? 1 : 0;
        if (sign) val = -val;

        if (val === 0) {
          writeUint(0, buf, pos + off0);
          writeUint(1 / val > 0 ?
          /* positive */
          0 :
          /* negative 0 */
          2147483648, buf, pos + off1);
        } else if (isNaN(val)) {
          writeUint(0, buf, pos + off0);
          writeUint(2146959360, buf, pos + off1);
        } else if (val > 1.7976931348623157e+308) {
          // +-Infinity
          writeUint(0, buf, pos + off0);
          writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
        } else {
          var mantissa;

          if (val < 2.2250738585072014e-308) {
            // denormal
            mantissa = val / 5e-324;
            writeUint(mantissa >>> 0, buf, pos + off0);
            writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
          } else {
            var exponent = Math.floor(Math.log(val) / Math.LN2);
            if (exponent === 1024) exponent = 1023;
            mantissa = val * Math.pow(2, -exponent);
            writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
            writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
          }
        }
      }

      exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
      exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);

      function readDouble_ieee754(readUint, off0, off1, buf, pos) {
        var lo = readUint(buf, pos + off0),
            hi = readUint(buf, pos + off1);
        var sign = (hi >> 31) * 2 + 1,
            exponent = hi >>> 20 & 2047,
            mantissa = 4294967296 * (hi & 1048575) + lo;
        return exponent === 2047 ? mantissa ? NaN : sign * Infinity : exponent === 0 // denormal
        ? sign * 5e-324 * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
      }

      exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
      exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
    })();
    return exports;
  } // uint helpers


  function writeUintLE(val, buf, pos) {
    buf[pos] = val & 255;
    buf[pos + 1] = val >>> 8 & 255;
    buf[pos + 2] = val >>> 16 & 255;
    buf[pos + 3] = val >>> 24;
  }

  function writeUintBE(val, buf, pos) {
    buf[pos] = val >>> 24;
    buf[pos + 1] = val >>> 16 & 255;
    buf[pos + 2] = val >>> 8 & 255;
    buf[pos + 3] = val & 255;
  }

  function readUintLE(buf, pos) {
    return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
  }

  function readUintBE(buf, pos) {
    return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
  }

  return float;
}

var inquire_1;
var hasRequiredInquire;

function requireInquire() {
  if (hasRequiredInquire) return inquire_1;
  hasRequiredInquire = 1;

  inquire_1 = inquire;
  /**
   * Requires a module only if available.
   * @memberof util
   * @param {string} moduleName Module to require
   * @returns {?Object} Required module if available and not empty, otherwise `null`
   */

  function inquire(moduleName) {
    try {
      var mod = undefined; // eslint-disable-line no-eval

      if (mod && (mod.length || Object.keys(mod).length)) return mod;
    } catch (e) {} // eslint-disable-line no-empty


    return null;
  }

  return inquire_1;
}

var utf8$2 = {};

var hasRequiredUtf8;

function requireUtf8() {
  if (hasRequiredUtf8) return utf8$2;
  hasRequiredUtf8 = 1;

  (function (exports) {
    /**
     * A minimal UTF8 implementation for number arrays.
     * @memberof util
     * @namespace
     */

    var utf8 = exports;
    /**
     * Calculates the UTF8 byte length of a string.
     * @param {string} string String
     * @returns {number} Byte length
     */

    utf8.length = function utf8_length(string) {
      var len = 0,
          c = 0;

      for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128) len += 1;else if (c < 2048) len += 2;else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
          ++i;
          len += 4;
        } else len += 3;
      }

      return len;
    };
    /**
     * Reads UTF8 bytes as a string.
     * @param {Uint8Array} buffer Source buffer
     * @param {number} start Source start
     * @param {number} end Source end
     * @returns {string} String read
     */


    utf8.read = function utf8_read(buffer, start, end) {
      var len = end - start;
      if (len < 1) return "";
      var parts = null,
          chunk = [],
          i = 0,
          // char offset
      t; // temporary

      while (start < end) {
        t = buffer[start++];
        if (t < 128) chunk[i++] = t;else if (t > 191 && t < 224) chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;else if (t > 239 && t < 365) {
          t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
          chunk[i++] = 0xD800 + (t >> 10);
          chunk[i++] = 0xDC00 + (t & 1023);
        } else chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;

        if (i > 8191) {
          (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
          i = 0;
        }
      }

      if (parts) {
        if (i) parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
      }

      return String.fromCharCode.apply(String, chunk.slice(0, i));
    };
    /**
     * Writes a string as UTF8 bytes.
     * @param {string} string Source string
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Bytes written
     */


    utf8.write = function utf8_write(string, buffer, offset) {
      var start = offset,
          c1,
          // character 1
      c2; // character 2

      for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);

        if (c1 < 128) {
          buffer[offset++] = c1;
        } else if (c1 < 2048) {
          buffer[offset++] = c1 >> 6 | 192;
          buffer[offset++] = c1 & 63 | 128;
        } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
          c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
          ++i;
          buffer[offset++] = c1 >> 18 | 240;
          buffer[offset++] = c1 >> 12 & 63 | 128;
          buffer[offset++] = c1 >> 6 & 63 | 128;
          buffer[offset++] = c1 & 63 | 128;
        } else {
          buffer[offset++] = c1 >> 12 | 224;
          buffer[offset++] = c1 >> 6 & 63 | 128;
          buffer[offset++] = c1 & 63 | 128;
        }
      }

      return offset - start;
    };
  })(utf8$2);

  return utf8$2;
}

var pool_1;
var hasRequiredPool;

function requirePool() {
  if (hasRequiredPool) return pool_1;
  hasRequiredPool = 1;

  pool_1 = pool;
  /**
   * An allocator as used by {@link util.pool}.
   * @typedef PoolAllocator
   * @type {function}
   * @param {number} size Buffer size
   * @returns {Uint8Array} Buffer
   */

  /**
   * A slicer as used by {@link util.pool}.
   * @typedef PoolSlicer
   * @type {function}
   * @param {number} start Start offset
   * @param {number} end End offset
   * @returns {Uint8Array} Buffer slice
   * @this {Uint8Array}
   */

  /**
   * A general purpose buffer pool.
   * @memberof util
   * @function
   * @param {PoolAllocator} alloc Allocator
   * @param {PoolSlicer} slice Slicer
   * @param {number} [size=8192] Slab size
   * @returns {PoolAllocator} Pooled allocator
   */

  function pool(alloc, slice, size) {
    var SIZE = size || 8192;
    var MAX = SIZE >>> 1;
    var slab = null;
    var offset = SIZE;
    return function pool_alloc(size) {
      if (size < 1 || size > MAX) return alloc(size);

      if (offset + size > SIZE) {
        slab = alloc(SIZE);
        offset = 0;
      }

      var buf = slice.call(slab, offset, offset += size);
      if (offset & 7) // align to 32 bit
        offset = (offset | 7) + 1;
      return buf;
    };
  }

  return pool_1;
}

var longbits;
var hasRequiredLongbits;

function requireLongbits() {
  if (hasRequiredLongbits) return longbits;
  hasRequiredLongbits = 1;

  longbits = LongBits;
  var util = requireMinimal();
  /**
   * Constructs new long bits.
   * @classdesc Helper class for working with the low and high bits of a 64 bit value.
   * @memberof util
   * @constructor
   * @param {number} lo Low 32 bits, unsigned
   * @param {number} hi High 32 bits, unsigned
   */

  function LongBits(lo, hi) {
    // note that the casts below are theoretically unnecessary as of today, but older statically
    // generated converter code might still call the ctor with signed 32bits. kept for compat.

    /**
     * Low bits.
     * @type {number}
     */
    this.lo = lo >>> 0;
    /**
     * High bits.
     * @type {number}
     */

    this.hi = hi >>> 0;
  }
  /**
   * Zero bits.
   * @memberof util.LongBits
   * @type {util.LongBits}
   */


  var zero = LongBits.zero = new LongBits(0, 0);

  zero.toNumber = function () {
    return 0;
  };

  zero.zzEncode = zero.zzDecode = function () {
    return this;
  };

  zero.length = function () {
    return 1;
  };
  /**
   * Zero hash.
   * @memberof util.LongBits
   * @type {string}
   */


  var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";
  /**
   * Constructs new long bits from the specified number.
   * @param {number} value Value
   * @returns {util.LongBits} Instance
   */

  LongBits.fromNumber = function fromNumber(value) {
    if (value === 0) return zero;
    var sign = value < 0;
    if (sign) value = -value;
    var lo = value >>> 0,
        hi = (value - lo) / 4294967296 >>> 0;

    if (sign) {
      hi = ~hi >>> 0;
      lo = ~lo >>> 0;

      if (++lo > 4294967295) {
        lo = 0;
        if (++hi > 4294967295) hi = 0;
      }
    }

    return new LongBits(lo, hi);
  };
  /**
   * Constructs new long bits from a number, long or string.
   * @param {Long|number|string} value Value
   * @returns {util.LongBits} Instance
   */


  LongBits.from = function from(value) {
    if (typeof value === "number") return LongBits.fromNumber(value);

    if (util.isString(value)) {
      /* istanbul ignore else */
      if (util.Long) value = util.Long.fromString(value);else return LongBits.fromNumber(parseInt(value, 10));
    }

    return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
  };
  /**
   * Converts this long bits to a possibly unsafe JavaScript number.
   * @param {boolean} [unsigned=false] Whether unsigned or not
   * @returns {number} Possibly unsafe number
   */


  LongBits.prototype.toNumber = function toNumber(unsigned) {
    if (!unsigned && this.hi >>> 31) {
      var lo = ~this.lo + 1 >>> 0,
          hi = ~this.hi >>> 0;
      if (!lo) hi = hi + 1 >>> 0;
      return -(lo + hi * 4294967296);
    }

    return this.lo + this.hi * 4294967296;
  };
  /**
   * Converts this long bits to a long.
   * @param {boolean} [unsigned=false] Whether unsigned or not
   * @returns {Long} Long
   */


  LongBits.prototype.toLong = function toLong(unsigned) {
    return util.Long ? new util.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
    /* istanbul ignore next */
    : {
      low: this.lo | 0,
      high: this.hi | 0,
      unsigned: Boolean(unsigned)
    };
  };

  var charCodeAt = String.prototype.charCodeAt;
  /**
   * Constructs new long bits from the specified 8 characters long hash.
   * @param {string} hash Hash
   * @returns {util.LongBits} Bits
   */

  LongBits.fromHash = function fromHash(hash) {
    if (hash === zeroHash) return zero;
    return new LongBits((charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0, (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0);
  };
  /**
   * Converts this long bits to a 8 characters long hash.
   * @returns {string} Hash
   */


  LongBits.prototype.toHash = function toHash() {
    return String.fromCharCode(this.lo & 255, this.lo >>> 8 & 255, this.lo >>> 16 & 255, this.lo >>> 24, this.hi & 255, this.hi >>> 8 & 255, this.hi >>> 16 & 255, this.hi >>> 24);
  };
  /**
   * Zig-zag encodes this long bits.
   * @returns {util.LongBits} `this`
   */


  LongBits.prototype.zzEncode = function zzEncode() {
    var mask = this.hi >> 31;
    this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
    this.lo = (this.lo << 1 ^ mask) >>> 0;
    return this;
  };
  /**
   * Zig-zag decodes this long bits.
   * @returns {util.LongBits} `this`
   */


  LongBits.prototype.zzDecode = function zzDecode() {
    var mask = -(this.lo & 1);
    this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
    this.hi = (this.hi >>> 1 ^ mask) >>> 0;
    return this;
  };
  /**
   * Calculates the length of this longbits when encoded as a varint.
   * @returns {number} Length
   */


  LongBits.prototype.length = function length() {
    var part0 = this.lo,
        part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
        part2 = this.hi >>> 24;
    return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
  };

  return longbits;
}

var hasRequiredMinimal;

function requireMinimal() {
  if (hasRequiredMinimal) return minimal;
  hasRequiredMinimal = 1;

  (function (exports) {

    var util = exports; // used to return a Promise where callback is omitted

    util.asPromise = requireAspromise(); // converts to / from base64 encoded strings

    util.base64 = requireBase64(); // base class of rpc.Service

    util.EventEmitter = requireEventemitter(); // float handling accross browsers

    util.float = requireFloat(); // requires modules optionally and hides the call from bundlers

    util.inquire = requireInquire(); // converts to / from utf8 encoded strings

    util.utf8 = requireUtf8(); // provides a node-like buffer pool in the browser

    util.pool = requirePool(); // utility to work with the low and high bits of a 64 bit value

    util.LongBits = requireLongbits();
    /**
     * Whether running within node or not.
     * @memberof util
     * @type {boolean}
     */

    util.isNode = Boolean(typeof commonjsGlobal !== "undefined" && commonjsGlobal && commonjsGlobal.process && commonjsGlobal.process.versions && commonjsGlobal.process.versions.node);
    /**
     * Global object reference.
     * @memberof util
     * @type {Object}
     */

    util.global = util.isNode && commonjsGlobal || typeof window !== "undefined" && window || typeof self !== "undefined" && self || commonjsGlobal; // eslint-disable-line no-invalid-this

    /**
     * An immuable empty array.
     * @memberof util
     * @type {Array.<*>}
     * @const
     */

    util.emptyArray = Object.freeze ? Object.freeze([]) :
    /* istanbul ignore next */
    []; // used on prototypes

    /**
     * An immutable empty object.
     * @type {Object}
     * @const
     */

    util.emptyObject = Object.freeze ? Object.freeze({}) :
    /* istanbul ignore next */
    {}; // used on prototypes

    /**
     * Tests if the specified value is an integer.
     * @function
     * @param {*} value Value to test
     * @returns {boolean} `true` if the value is an integer
     */

    util.isInteger = Number.isInteger ||
    /* istanbul ignore next */
    function isInteger(value) {
      return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
    };
    /**
     * Tests if the specified value is a string.
     * @param {*} value Value to test
     * @returns {boolean} `true` if the value is a string
     */


    util.isString = function isString(value) {
      return typeof value === "string" || value instanceof String;
    };
    /**
     * Tests if the specified value is a non-null object.
     * @param {*} value Value to test
     * @returns {boolean} `true` if the value is a non-null object
     */


    util.isObject = function isObject(value) {
      return value && typeof value === "object";
    };
    /**
     * Checks if a property on a message is considered to be present.
     * This is an alias of {@link util.isSet}.
     * @function
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */


    util.isset =
    /**
     * Checks if a property on a message is considered to be present.
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    util.isSet = function isSet(obj, prop) {
      var value = obj[prop];
      if (value != null && obj.hasOwnProperty(prop)) // eslint-disable-line eqeqeq, no-prototype-builtins
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
      return false;
    };
    /**
     * Any compatible Buffer instance.
     * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
     * @interface Buffer
     * @extends Uint8Array
     */

    /**
     * Node's Buffer class if available.
     * @type {Constructor<Buffer>}
     */


    util.Buffer = function () {
      try {
        var Buffer = util.inquire("buffer").Buffer; // refuse to use non-node buffers if not explicitly assigned (perf reasons):

        return Buffer.prototype.utf8Write ? Buffer :
        /* istanbul ignore next */
        null;
      } catch (e) {
        /* istanbul ignore next */
        return null;
      }
    }(); // Internal alias of or polyfull for Buffer.from.


    util._Buffer_from = null; // Internal alias of or polyfill for Buffer.allocUnsafe.

    util._Buffer_allocUnsafe = null;
    /**
     * Creates a new buffer of whatever type supported by the environment.
     * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
     * @returns {Uint8Array|Buffer} Buffer
     */

    util.newBuffer = function newBuffer(sizeOrArray) {
      /* istanbul ignore next */
      return typeof sizeOrArray === "number" ? util.Buffer ? util._Buffer_allocUnsafe(sizeOrArray) : new util.Array(sizeOrArray) : util.Buffer ? util._Buffer_from(sizeOrArray) : typeof Uint8Array === "undefined" ? sizeOrArray : new Uint8Array(sizeOrArray);
    };
    /**
     * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
     * @type {Constructor<Uint8Array>}
     */


    util.Array = typeof Uint8Array !== "undefined" ? Uint8Array
    /* istanbul ignore next */
    : Array;
    /**
     * Any compatible Long instance.
     * This is a minimal stand-alone definition of a Long instance. The actual type is that exported by long.js.
     * @interface Long
     * @property {number} low Low bits
     * @property {number} high High bits
     * @property {boolean} unsigned Whether unsigned or not
     */

    /**
     * Long.js's Long class if available.
     * @type {Constructor<Long>}
     */

    util.Long =
    /* istanbul ignore next */
    util.global.dcodeIO &&
    /* istanbul ignore next */
    util.global.dcodeIO.Long ||
    /* istanbul ignore next */
    util.global.Long || util.inquire("long");
    /**
     * Regular expression used to verify 2 bit (`bool`) map keys.
     * @type {RegExp}
     * @const
     */

    util.key2Re = /^true|false|0|1$/;
    /**
     * Regular expression used to verify 32 bit (`int32` etc.) map keys.
     * @type {RegExp}
     * @const
     */

    util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;
    /**
     * Regular expression used to verify 64 bit (`int64` etc.) map keys.
     * @type {RegExp}
     * @const
     */

    util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;
    /**
     * Converts a number or long to an 8 characters long hash string.
     * @param {Long|number} value Value to convert
     * @returns {string} Hash
     */

    util.longToHash = function longToHash(value) {
      return value ? util.LongBits.from(value).toHash() : util.LongBits.zeroHash;
    };
    /**
     * Converts an 8 characters long hash string to a long or number.
     * @param {string} hash Hash
     * @param {boolean} [unsigned=false] Whether unsigned or not
     * @returns {Long|number} Original value
     */


    util.longFromHash = function longFromHash(hash, unsigned) {
      var bits = util.LongBits.fromHash(hash);
      if (util.Long) return util.Long.fromBits(bits.lo, bits.hi, unsigned);
      return bits.toNumber(Boolean(unsigned));
    };
    /**
     * Merges the properties of the source object into the destination object.
     * @memberof util
     * @param {Object.<string,*>} dst Destination object
     * @param {Object.<string,*>} src Source object
     * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
     * @returns {Object.<string,*>} Destination object
     */


    function merge(dst, src, ifNotSet) {
      // used by converters
      for (var keys = Object.keys(src), i = 0; i < keys.length; ++i) if (dst[keys[i]] === undefined || !ifNotSet) dst[keys[i]] = src[keys[i]];

      return dst;
    }

    util.merge = merge;
    /**
     * Converts the first character of a string to lower case.
     * @param {string} str String to convert
     * @returns {string} Converted string
     */

    util.lcFirst = function lcFirst(str) {
      return str.charAt(0).toLowerCase() + str.substring(1);
    };
    /**
     * Creates a custom error constructor.
     * @memberof util
     * @param {string} name Error name
     * @returns {Constructor<Error>} Custom error constructor
     */


    function newError(name) {
      function CustomError(message, properties) {
        if (!(this instanceof CustomError)) return new CustomError(message, properties); // Error.call(this, message);
        // ^ just returns a new error instance because the ctor can be called as a function

        Object.defineProperty(this, "message", {
          get: function () {
            return message;
          }
        });
        /* istanbul ignore next */

        if (Error.captureStackTrace) // node
          Error.captureStackTrace(this, CustomError);else Object.defineProperty(this, "stack", {
          value: new Error().stack || ""
        });
        if (properties) merge(this, properties);
      }

      CustomError.prototype = Object.create(Error.prototype, {
        constructor: {
          value: CustomError,
          writable: true,
          enumerable: false,
          configurable: true
        },
        name: {
          get() {
            return name;
          },

          set: undefined,
          enumerable: false,
          // configurable: false would accurately preserve the behavior of
          // the original, but I'm guessing that was not intentional.
          // For an actual error subclass, this property would
          // be configurable.
          configurable: true
        },
        toString: {
          value() {
            return this.name + ": " + this.message;
          },

          writable: true,
          enumerable: false,
          configurable: true
        }
      });
      return CustomError;
    }

    util.newError = newError;
    /**
     * Constructs a new protocol error.
     * @classdesc Error subclass indicating a protocol specifc error.
     * @memberof util
     * @extends Error
     * @template T extends Message<T>
     * @constructor
     * @param {string} message Error message
     * @param {Object.<string,*>} [properties] Additional properties
     * @example
     * try {
     *     MyMessage.decode(someBuffer); // throws if required fields are missing
     * } catch (e) {
     *     if (e instanceof ProtocolError && e.instance)
     *         console.log("decoded so far: " + JSON.stringify(e.instance));
     * }
     */

    util.ProtocolError = newError("ProtocolError");
    /**
     * So far decoded message instance.
     * @name util.ProtocolError#instance
     * @type {Message<T>}
     */

    /**
     * A OneOf getter as returned by {@link util.oneOfGetter}.
     * @typedef OneOfGetter
     * @type {function}
     * @returns {string|undefined} Set field name, if any
     */

    /**
     * Builds a getter for a oneof's present field name.
     * @param {string[]} fieldNames Field names
     * @returns {OneOfGetter} Unbound getter
     */

    util.oneOfGetter = function getOneOf(fieldNames) {
      var fieldMap = {};

      for (var i = 0; i < fieldNames.length; ++i) fieldMap[fieldNames[i]] = 1;
      /**
       * @returns {string|undefined} Set field name, if any
       * @this Object
       * @ignore
       */


      return function () {
        // eslint-disable-line consistent-return
        for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i) if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null) return keys[i];
      };
    };
    /**
     * A OneOf setter as returned by {@link util.oneOfSetter}.
     * @typedef OneOfSetter
     * @type {function}
     * @param {string|undefined} value Field name
     * @returns {undefined}
     */

    /**
     * Builds a setter for a oneof's present field name.
     * @param {string[]} fieldNames Field names
     * @returns {OneOfSetter} Unbound setter
     */


    util.oneOfSetter = function setOneOf(fieldNames) {
      /**
       * @param {string} name Field name
       * @returns {undefined}
       * @this Object
       * @ignore
       */
      return function (name) {
        for (var i = 0; i < fieldNames.length; ++i) if (fieldNames[i] !== name) delete this[fieldNames[i]];
      };
    };
    /**
     * Default conversion options used for {@link Message#toJSON} implementations.
     *
     * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
     *
     * - Longs become strings
     * - Enums become string keys
     * - Bytes become base64 encoded strings
     * - (Sub-)Messages become plain objects
     * - Maps become plain objects with all string keys
     * - Repeated fields become arrays
     * - NaN and Infinity for float and double fields become strings
     *
     * @type {IConversionOptions}
     * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
     */


    util.toJSONOptions = {
      longs: String,
      enums: String,
      bytes: String,
      json: true
    }; // Sets up buffer utility according to the environment (called in index-minimal)

    util._configure = function () {
      var Buffer = util.Buffer;
      /* istanbul ignore if */

      if (!Buffer) {
        util._Buffer_from = util._Buffer_allocUnsafe = null;
        return;
      } // because node 4.x buffers are incompatible & immutable
      // see: https://github.com/dcodeIO/protobuf.js/pull/665


      util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from ||
      /* istanbul ignore next */
      function Buffer_from(value, encoding) {
        return new Buffer(value, encoding);
      };

      util._Buffer_allocUnsafe = Buffer.allocUnsafe ||
      /* istanbul ignore next */
      function Buffer_allocUnsafe(size) {
        return new Buffer(size);
      };
    };
  })(minimal);

  return minimal;
}

var writer$2 = Writer$1;
var util$4 = requireMinimal();
var BufferWriter$1; // cyclic

var LongBits$1 = util$4.LongBits,
    base64 = util$4.base64,
    utf8$1 = util$4.utf8;
/**
 * Constructs a new writer operation instance.
 * @classdesc Scheduled writer operation.
 * @constructor
 * @param {function(*, Uint8Array, number)} fn Function to call
 * @param {number} len Value byte length
 * @param {*} val Value to write
 * @ignore
 */

function Op(fn, len, val) {
  /**
   * Function to call.
   * @type {function(Uint8Array, number, *)}
   */
  this.fn = fn;
  /**
   * Value byte length.
   * @type {number}
   */

  this.len = len;
  /**
   * Next operation.
   * @type {Writer.Op|undefined}
   */

  this.next = undefined;
  /**
   * Value to write.
   * @type {*}
   */

  this.val = val; // type varies
}
/* istanbul ignore next */


function noop() {} // eslint-disable-line no-empty-function

/**
 * Constructs a new writer state instance.
 * @classdesc Copied writer state.
 * @memberof Writer
 * @constructor
 * @param {Writer} writer Writer to copy state from
 * @ignore
 */


function State(writer) {
  /**
   * Current head.
   * @type {Writer.Op}
   */
  this.head = writer.head;
  /**
   * Current tail.
   * @type {Writer.Op}
   */

  this.tail = writer.tail;
  /**
   * Current buffer length.
   * @type {number}
   */

  this.len = writer.len;
  /**
   * Next state.
   * @type {State|null}
   */

  this.next = writer.states;
}
/**
 * Constructs a new writer instance.
 * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 */


function Writer$1() {
  /**
   * Current length.
   * @type {number}
   */
  this.len = 0;
  /**
   * Operations head.
   * @type {Object}
   */

  this.head = new Op(noop, 0, 0);
  /**
   * Operations tail
   * @type {Object}
   */

  this.tail = this.head;
  /**
   * Linked forked states.
   * @type {Object|null}
   */

  this.states = null; // When a value is written, the writer calculates its byte length and puts it into a linked
  // list of operations to perform when finish() is called. This both allows us to allocate
  // buffers of the exact required size and reduces the amount of work we have to do compared
  // to first calculating over objects and then encoding over objects. In our case, the encoding
  // part is just a linked list walk calling operations with already prepared values.
}

var create$1 = function create() {
  return util$4.Buffer ? function create_buffer_setup() {
    return (Writer$1.create = function create_buffer() {
      return new BufferWriter$1();
    })();
  }
  /* istanbul ignore next */
  : function create_array() {
    return new Writer$1();
  };
};
/**
 * Creates a new writer.
 * @function
 * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
 */


Writer$1.create = create$1();
/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */

Writer$1.alloc = function alloc(size) {
  return new util$4.Array(size);
}; // Use Uint8Array buffer pool in the browser, just like node does with buffers

/* istanbul ignore else */


if (util$4.Array !== Array) Writer$1.alloc = util$4.pool(Writer$1.alloc, util$4.Array.prototype.subarray);
/**
 * Pushes a new operation to the queue.
 * @param {function(Uint8Array, number, *)} fn Function to call
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @returns {Writer} `this`
 * @private
 */

Writer$1.prototype._push = function push(fn, len, val) {
  this.tail = this.tail.next = new Op(fn, len, val);
  this.len += len;
  return this;
};

function writeByte(val, buf, pos) {
  buf[pos] = val & 255;
}

function writeVarint32(val, buf, pos) {
  while (val > 127) {
    buf[pos++] = val & 127 | 128;
    val >>>= 7;
  }

  buf[pos] = val;
}
/**
 * Constructs a new varint writer operation instance.
 * @classdesc Scheduled varint writer operation.
 * @extends Op
 * @constructor
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @ignore
 */


function VarintOp(len, val) {
  this.len = len;
  this.next = undefined;
  this.val = val;
}

VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;
/**
 * Writes an unsigned 32 bit value as a varint.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */

Writer$1.prototype.uint32 = function write_uint32(value) {
  // here, the call to this.push has been inlined and a varint specific Op subclass is used.
  // uint32 is by far the most frequently used operation and benefits significantly from this.
  this.len += (this.tail = this.tail.next = new VarintOp((value = value >>> 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5, value)).len;
  return this;
};
/**
 * Writes a signed 32 bit value as a varint.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */


Writer$1.prototype.int32 = function write_int32(value) {
  return value < 0 ? this._push(writeVarint64, 10, LongBits$1.fromNumber(value)) // 10 bytes per spec
  : this.uint32(value);
};
/**
 * Writes a 32 bit value as a varint, zig-zag encoded.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */


Writer$1.prototype.sint32 = function write_sint32(value) {
  return this.uint32((value << 1 ^ value >> 31) >>> 0);
};

function writeVarint64(val, buf, pos) {
  while (val.hi) {
    buf[pos++] = val.lo & 127 | 128;
    val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
    val.hi >>>= 7;
  }

  while (val.lo > 127) {
    buf[pos++] = val.lo & 127 | 128;
    val.lo = val.lo >>> 7;
  }

  buf[pos++] = val.lo;
}
/**
 * Writes an unsigned 64 bit value as a varint.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */


Writer$1.prototype.uint64 = function write_uint64(value) {
  var bits = LongBits$1.from(value);
  return this._push(writeVarint64, bits.length(), bits);
};
/**
 * Writes a signed 64 bit value as a varint.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */


Writer$1.prototype.int64 = Writer$1.prototype.uint64;
/**
 * Writes a signed 64 bit value as a varint, zig-zag encoded.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */

Writer$1.prototype.sint64 = function write_sint64(value) {
  var bits = LongBits$1.from(value).zzEncode();
  return this._push(writeVarint64, bits.length(), bits);
};
/**
 * Writes a boolish value as a varint.
 * @param {boolean} value Value to write
 * @returns {Writer} `this`
 */


Writer$1.prototype.bool = function write_bool(value) {
  return this._push(writeByte, 1, value ? 1 : 0);
};

function writeFixed32(val, buf, pos) {
  buf[pos] = val & 255;
  buf[pos + 1] = val >>> 8 & 255;
  buf[pos + 2] = val >>> 16 & 255;
  buf[pos + 3] = val >>> 24;
}
/**
 * Writes an unsigned 32 bit value as fixed 32 bits.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */


Writer$1.prototype.fixed32 = function write_fixed32(value) {
  return this._push(writeFixed32, 4, value >>> 0);
};
/**
 * Writes a signed 32 bit value as fixed 32 bits.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */


Writer$1.prototype.sfixed32 = Writer$1.prototype.fixed32;
/**
 * Writes an unsigned 64 bit value as fixed 64 bits.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */

Writer$1.prototype.fixed64 = function write_fixed64(value) {
  var bits = LongBits$1.from(value);
  return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
};
/**
 * Writes a signed 64 bit value as fixed 64 bits.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */


Writer$1.prototype.sfixed64 = Writer$1.prototype.fixed64;
/**
 * Writes a float (32 bit).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */

Writer$1.prototype.float = function write_float(value) {
  return this._push(util$4.float.writeFloatLE, 4, value);
};
/**
 * Writes a double (64 bit float).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */


Writer$1.prototype.double = function write_double(value) {
  return this._push(util$4.float.writeDoubleLE, 8, value);
};

var writeBytes = util$4.Array.prototype.set ? function writeBytes_set(val, buf, pos) {
  buf.set(val, pos); // also works for plain array values
}
/* istanbul ignore next */
: function writeBytes_for(val, buf, pos) {
  for (var i = 0; i < val.length; ++i) buf[pos + i] = val[i];
};
/**
 * Writes a sequence of bytes.
 * @param {Uint8Array|string} value Buffer or base64 encoded string to write
 * @returns {Writer} `this`
 */

Writer$1.prototype.bytes = function write_bytes(value) {
  var len = value.length >>> 0;
  if (!len) return this._push(writeByte, 1, 0);

  if (util$4.isString(value)) {
    var buf = Writer$1.alloc(len = base64.length(value));
    base64.decode(value, buf, 0);
    value = buf;
  }

  return this.uint32(len)._push(writeBytes, len, value);
};
/**
 * Writes a string.
 * @param {string} value Value to write
 * @returns {Writer} `this`
 */


Writer$1.prototype.string = function write_string(value) {
  var len = utf8$1.length(value);
  return len ? this.uint32(len)._push(utf8$1.write, len, value) : this._push(writeByte, 1, 0);
};
/**
 * Forks this writer's state by pushing it to a stack.
 * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
 * @returns {Writer} `this`
 */


Writer$1.prototype.fork = function fork() {
  this.states = new State(this);
  this.head = this.tail = new Op(noop, 0, 0);
  this.len = 0;
  return this;
};
/**
 * Resets this instance to the last state.
 * @returns {Writer} `this`
 */


Writer$1.prototype.reset = function reset() {
  if (this.states) {
    this.head = this.states.head;
    this.tail = this.states.tail;
    this.len = this.states.len;
    this.states = this.states.next;
  } else {
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
  }

  return this;
};
/**
 * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
 * @returns {Writer} `this`
 */


Writer$1.prototype.ldelim = function ldelim() {
  var head = this.head,
      tail = this.tail,
      len = this.len;
  this.reset().uint32(len);

  if (len) {
    this.tail.next = head.next; // skip noop

    this.tail = tail;
    this.len += len;
  }

  return this;
};
/**
 * Finishes the write operation.
 * @returns {Uint8Array} Finished buffer
 */


Writer$1.prototype.finish = function finish() {
  var head = this.head.next,
      // skip noop
  buf = this.constructor.alloc(this.len),
      pos = 0;

  while (head) {
    head.fn(head.val, buf, pos);
    pos += head.len;
    head = head.next;
  } // this.head = this.tail = null;


  return buf;
};

Writer$1._configure = function (BufferWriter_) {
  BufferWriter$1 = BufferWriter_;
  Writer$1.create = create$1();

  BufferWriter$1._configure();
};

var writer_buffer = BufferWriter; // extends Writer

var Writer = writer$2;
(BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;
var util$3 = requireMinimal();
/**
 * Constructs a new buffer writer instance.
 * @classdesc Wire format writer using node buffers.
 * @extends Writer
 * @constructor
 */

function BufferWriter() {
  Writer.call(this);
}

BufferWriter._configure = function () {
  /**
   * Allocates a buffer of the specified size.
   * @function
   * @param {number} size Buffer size
   * @returns {Buffer} Buffer
   */
  BufferWriter.alloc = util$3._Buffer_allocUnsafe;
  BufferWriter.writeBytesBuffer = util$3.Buffer && util$3.Buffer.prototype instanceof Uint8Array && util$3.Buffer.prototype.set.name === "set" ? function writeBytesBuffer_set(val, buf, pos) {
    buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
    // also works for plain array values
  }
  /* istanbul ignore next */
  : function writeBytesBuffer_copy(val, buf, pos) {
    if (val.copy) // Buffer values
      val.copy(buf, pos, 0, val.length);else for (var i = 0; i < val.length;) // plain array values
    buf[pos++] = val[i++];
  };
};
/**
 * @override
 */


BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
  if (util$3.isString(value)) value = util$3._Buffer_from(value, "base64");
  var len = value.length >>> 0;
  this.uint32(len);
  if (len) this._push(BufferWriter.writeBytesBuffer, len, value);
  return this;
};

function writeStringBuffer(val, buf, pos) {
  if (val.length < 40) // plain js is faster for short strings (probably due to redundant assertions)
    util$3.utf8.write(val, buf, pos);else if (buf.utf8Write) buf.utf8Write(val, pos);else buf.write(val, pos);
}
/**
 * @override
 */


BufferWriter.prototype.string = function write_string_buffer(value) {
  var len = util$3.Buffer.byteLength(value);
  this.uint32(len);
  if (len) this._push(writeStringBuffer, len, value);
  return this;
};
/**
 * Finishes the write operation.
 * @name BufferWriter#finish
 * @function
 * @returns {Buffer} Finished buffer
 */


BufferWriter._configure();

var reader = Reader$1;
var util$2 = requireMinimal();
var BufferReader$1; // cyclic

var LongBits = util$2.LongBits,
    utf8 = util$2.utf8;
/* istanbul ignore next */

function indexOutOfRange(reader, writeLength) {
  return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
}
/**
 * Constructs a new reader instance using the specified buffer.
 * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 * @param {Uint8Array} buffer Buffer to read from
 */


function Reader$1(buffer) {
  /**
   * Read buffer.
   * @type {Uint8Array}
   */
  this.buf = buffer;
  /**
   * Read buffer position.
   * @type {number}
   */

  this.pos = 0;
  /**
   * Read buffer length.
   * @type {number}
   */

  this.len = buffer.length;
}

var create_array = typeof Uint8Array !== "undefined" ? function create_typed_array(buffer) {
  if (buffer instanceof Uint8Array || Array.isArray(buffer)) return new Reader$1(buffer);
  throw Error("illegal buffer");
}
/* istanbul ignore next */
: function create_array(buffer) {
  if (Array.isArray(buffer)) return new Reader$1(buffer);
  throw Error("illegal buffer");
};

var create = function create() {
  return util$2.Buffer ? function create_buffer_setup(buffer) {
    return (Reader$1.create = function create_buffer(buffer) {
      return util$2.Buffer.isBuffer(buffer) ? new BufferReader$1(buffer)
      /* istanbul ignore next */
      : create_array(buffer);
    })(buffer);
  }
  /* istanbul ignore next */
  : create_array;
};
/**
 * Creates a new reader using the specified buffer.
 * @function
 * @param {Uint8Array|Buffer} buffer Buffer to read from
 * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
 * @throws {Error} If `buffer` is not a valid buffer
 */


Reader$1.create = create();
Reader$1.prototype._slice = util$2.Array.prototype.subarray ||
/* istanbul ignore next */
util$2.Array.prototype.slice;
/**
 * Reads a varint as an unsigned 32 bit value.
 * @function
 * @returns {number} Value read
 */

Reader$1.prototype.uint32 = function read_uint32_setup() {
  var value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)

  return function read_uint32() {
    value = (this.buf[this.pos] & 127) >>> 0;
    if (this.buf[this.pos++] < 128) return value;
    value = (value | (this.buf[this.pos] & 127) << 7) >>> 0;
    if (this.buf[this.pos++] < 128) return value;
    value = (value | (this.buf[this.pos] & 127) << 14) >>> 0;
    if (this.buf[this.pos++] < 128) return value;
    value = (value | (this.buf[this.pos] & 127) << 21) >>> 0;
    if (this.buf[this.pos++] < 128) return value;
    value = (value | (this.buf[this.pos] & 15) << 28) >>> 0;
    if (this.buf[this.pos++] < 128) return value;
    /* istanbul ignore if */

    if ((this.pos += 5) > this.len) {
      this.pos = this.len;
      throw indexOutOfRange(this, 10);
    }

    return value;
  };
}();
/**
 * Reads a varint as a signed 32 bit value.
 * @returns {number} Value read
 */


Reader$1.prototype.int32 = function read_int32() {
  return this.uint32() | 0;
};
/**
 * Reads a zig-zag encoded varint as a signed 32 bit value.
 * @returns {number} Value read
 */


Reader$1.prototype.sint32 = function read_sint32() {
  var value = this.uint32();
  return value >>> 1 ^ -(value & 1) | 0;
};
/* eslint-disable no-invalid-this */


function readLongVarint() {
  // tends to deopt with local vars for octet etc.
  var bits = new LongBits(0, 0);
  var i = 0;

  if (this.len - this.pos > 4) {
    // fast route (lo)
    for (; i < 4; ++i) {
      // 1st..4th
      bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
      if (this.buf[this.pos++] < 128) return bits;
    } // 5th


    bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
    bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
    if (this.buf[this.pos++] < 128) return bits;
    i = 0;
  } else {
    for (; i < 3; ++i) {
      /* istanbul ignore if */
      if (this.pos >= this.len) throw indexOutOfRange(this); // 1st..3th

      bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
      if (this.buf[this.pos++] < 128) return bits;
    } // 4th


    bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
    return bits;
  }

  if (this.len - this.pos > 4) {
    // fast route (hi)
    for (; i < 5; ++i) {
      // 6th..10th
      bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
      if (this.buf[this.pos++] < 128) return bits;
    }
  } else {
    for (; i < 5; ++i) {
      /* istanbul ignore if */
      if (this.pos >= this.len) throw indexOutOfRange(this); // 6th..10th

      bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
      if (this.buf[this.pos++] < 128) return bits;
    }
  }
  /* istanbul ignore next */


  throw Error("invalid varint encoding");
}
/* eslint-enable no-invalid-this */

/**
 * Reads a varint as a signed 64 bit value.
 * @name Reader#int64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as an unsigned 64 bit value.
 * @name Reader#uint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a zig-zag encoded varint as a signed 64 bit value.
 * @name Reader#sint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as a boolean.
 * @returns {boolean} Value read
 */


Reader$1.prototype.bool = function read_bool() {
  return this.uint32() !== 0;
};

function readFixed32_end(buf, end) {
  // note that this uses `end`, not `pos`
  return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
}
/**
 * Reads fixed 32 bits as an unsigned 32 bit integer.
 * @returns {number} Value read
 */


Reader$1.prototype.fixed32 = function read_fixed32() {
  /* istanbul ignore if */
  if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);
  return readFixed32_end(this.buf, this.pos += 4);
};
/**
 * Reads fixed 32 bits as a signed 32 bit integer.
 * @returns {number} Value read
 */


Reader$1.prototype.sfixed32 = function read_sfixed32() {
  /* istanbul ignore if */
  if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);
  return readFixed32_end(this.buf, this.pos += 4) | 0;
};
/* eslint-disable no-invalid-this */


function
  /* this: Reader */
readFixed64() {
  /* istanbul ignore if */
  if (this.pos + 8 > this.len) throw indexOutOfRange(this, 8);
  return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}
/* eslint-enable no-invalid-this */

/**
 * Reads fixed 64 bits.
 * @name Reader#fixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads zig-zag encoded fixed 64 bits.
 * @name Reader#sfixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a float (32 bit) as a number.
 * @function
 * @returns {number} Value read
 */


Reader$1.prototype.float = function read_float() {
  /* istanbul ignore if */
  if (this.pos + 4 > this.len) throw indexOutOfRange(this, 4);
  var value = util$2.float.readFloatLE(this.buf, this.pos);
  this.pos += 4;
  return value;
};
/**
 * Reads a double (64 bit float) as a number.
 * @function
 * @returns {number} Value read
 */


Reader$1.prototype.double = function read_double() {
  /* istanbul ignore if */
  if (this.pos + 8 > this.len) throw indexOutOfRange(this, 4);
  var value = util$2.float.readDoubleLE(this.buf, this.pos);
  this.pos += 8;
  return value;
};
/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @returns {Uint8Array} Value read
 */


Reader$1.prototype.bytes = function read_bytes() {
  var length = this.uint32(),
      start = this.pos,
      end = this.pos + length;
  /* istanbul ignore if */

  if (end > this.len) throw indexOutOfRange(this, length);
  this.pos += length;
  if (Array.isArray(this.buf)) // plain array
    return this.buf.slice(start, end);
  return start === end // fix for IE 10/Win8 and others' subarray returning array of size 1
  ? new this.buf.constructor(0) : this._slice.call(this.buf, start, end);
};
/**
 * Reads a string preceeded by its byte length as a varint.
 * @returns {string} Value read
 */


Reader$1.prototype.string = function read_string() {
  var bytes = this.bytes();
  return utf8.read(bytes, 0, bytes.length);
};
/**
 * Skips the specified number of bytes if specified, otherwise skips a varint.
 * @param {number} [length] Length if known, otherwise a varint is assumed
 * @returns {Reader} `this`
 */


Reader$1.prototype.skip = function skip(length) {
  if (typeof length === "number") {
    /* istanbul ignore if */
    if (this.pos + length > this.len) throw indexOutOfRange(this, length);
    this.pos += length;
  } else {
    do {
      /* istanbul ignore if */
      if (this.pos >= this.len) throw indexOutOfRange(this);
    } while (this.buf[this.pos++] & 128);
  }

  return this;
};
/**
 * Skips the next element of the specified wire type.
 * @param {number} wireType Wire type received
 * @returns {Reader} `this`
 */


Reader$1.prototype.skipType = function (wireType) {
  switch (wireType) {
    case 0:
      this.skip();
      break;

    case 1:
      this.skip(8);
      break;

    case 2:
      this.skip(this.uint32());
      break;

    case 3:
      while ((wireType = this.uint32() & 7) !== 4) {
        this.skipType(wireType);
      }

      break;

    case 5:
      this.skip(4);
      break;

    /* istanbul ignore next */

    default:
      throw Error("invalid wire type " + wireType + " at offset " + this.pos);
  }

  return this;
};

Reader$1._configure = function (BufferReader_) {
  BufferReader$1 = BufferReader_;
  Reader$1.create = create();

  BufferReader$1._configure();

  var fn = util$2.Long ? "toLong" :
  /* istanbul ignore next */
  "toNumber";
  util$2.merge(Reader$1.prototype, {
    int64: function read_int64() {
      return readLongVarint.call(this)[fn](false);
    },
    uint64: function read_uint64() {
      return readLongVarint.call(this)[fn](true);
    },
    sint64: function read_sint64() {
      return readLongVarint.call(this).zzDecode()[fn](false);
    },
    fixed64: function read_fixed64() {
      return readFixed64.call(this)[fn](true);
    },
    sfixed64: function read_sfixed64() {
      return readFixed64.call(this)[fn](false);
    }
  });
};

var reader_buffer = BufferReader; // extends Reader

var Reader = reader;
(BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;
var util$1 = requireMinimal();
/**
 * Constructs a new buffer reader instance.
 * @classdesc Wire format reader using node buffers.
 * @extends Reader
 * @constructor
 * @param {Buffer} buffer Buffer to read from
 */

function BufferReader(buffer) {
  Reader.call(this, buffer);
  /**
   * Read buffer.
   * @name BufferReader#buf
   * @type {Buffer}
   */
}

BufferReader._configure = function () {
  /* istanbul ignore else */
  if (util$1.Buffer) BufferReader.prototype._slice = util$1.Buffer.prototype.slice;
};
/**
 * @override
 */


BufferReader.prototype.string = function read_string_buffer() {
  var len = this.uint32(); // modifies pos

  return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + len, this.len));
};
/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @name BufferReader#bytes
 * @function
 * @returns {Buffer} Value read
 */


BufferReader._configure();

var rpc = {};

var service = Service;
var util = requireMinimal(); // Extends EventEmitter

(Service.prototype = Object.create(util.EventEmitter.prototype)).constructor = Service;
/**
 * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
 *
 * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
 * @typedef rpc.ServiceMethodCallback
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {TRes} [response] Response message
 * @returns {undefined}
 */

/**
 * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
 * @typedef rpc.ServiceMethod
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
 * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
 */

/**
 * Constructs a new RPC service instance.
 * @classdesc An RPC service as returned by {@link Service#create}.
 * @exports rpc.Service
 * @extends util.EventEmitter
 * @constructor
 * @param {RPCImpl} rpcImpl RPC implementation
 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
 */

function Service(rpcImpl, requestDelimited, responseDelimited) {
  if (typeof rpcImpl !== "function") throw TypeError("rpcImpl must be a function");
  util.EventEmitter.call(this);
  /**
   * RPC implementation. Becomes `null` once the service is ended.
   * @type {RPCImpl|null}
   */

  this.rpcImpl = rpcImpl;
  /**
   * Whether requests are length-delimited.
   * @type {boolean}
   */

  this.requestDelimited = Boolean(requestDelimited);
  /**
   * Whether responses are length-delimited.
   * @type {boolean}
   */

  this.responseDelimited = Boolean(responseDelimited);
}
/**
 * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
 * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
 * @param {Constructor<TReq>} requestCtor Request constructor
 * @param {Constructor<TRes>} responseCtor Response constructor
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
 * @returns {undefined}
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 */


Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
  if (!request) throw TypeError("request must be specified");
  var self = this;
  if (!callback) return util.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);

  if (!self.rpcImpl) {
    setTimeout(function () {
      callback(Error("already ended"));
    }, 0);
    return undefined;
  }

  try {
    return self.rpcImpl(method, requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(), function rpcCallback(err, response) {
      if (err) {
        self.emit("error", err, method);
        return callback(err);
      }

      if (response === null) {
        self.end(
        /* endedByRPC */
        true);
        return undefined;
      }

      if (!(response instanceof responseCtor)) {
        try {
          response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
        } catch (err) {
          self.emit("error", err, method);
          return callback(err);
        }
      }

      self.emit("data", response, method);
      return callback(null, response);
    });
  } catch (err) {
    self.emit("error", err, method);
    setTimeout(function () {
      callback(err);
    }, 0);
    return undefined;
  }
};
/**
 * Ends this service and emits the `end` event.
 * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
 * @returns {rpc.Service} `this`
 */


Service.prototype.end = function end(endedByRPC) {
  if (this.rpcImpl) {
    if (!endedByRPC) // signal end to rpcImpl
      this.rpcImpl(null, null, null);
    this.rpcImpl = null;
    this.emit("end").off();
  }

  return this;
};

(function (exports) {
  /**
   * Streaming RPC helpers.
   * @namespace
   */

  var rpc = exports;
  /**
   * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
   * @typedef RPCImpl
   * @type {function}
   * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
   * @param {Uint8Array} requestData Request data
   * @param {RPCImplCallback} callback Callback function
   * @returns {undefined}
   * @example
   * function rpcImpl(method, requestData, callback) {
   *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
   *         throw Error("no such method");
   *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
   *         callback(err, responseData);
   *     });
   * }
   */

  /**
   * Node-style callback as used by {@link RPCImpl}.
   * @typedef RPCImplCallback
   * @type {function}
   * @param {Error|null} error Error, if any, otherwise `null`
   * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
   * @returns {undefined}
   */

  rpc.Service = service;
})(rpc);

var roots = {};

(function (exports) {

  var protobuf = exports;
  /**
   * Build type, one of `"full"`, `"light"` or `"minimal"`.
   * @name build
   * @type {string}
   * @const
   */

  protobuf.build = "minimal"; // Serialization

  protobuf.Writer = writer$2;
  protobuf.BufferWriter = writer_buffer;
  protobuf.Reader = reader;
  protobuf.BufferReader = reader_buffer; // Utility

  protobuf.util = requireMinimal();
  protobuf.rpc = rpc;
  protobuf.roots = roots;
  protobuf.configure = configure;
  /* istanbul ignore next */

  /**
   * Reconfigures the library according to the environment.
   * @returns {undefined}
   */

  function configure() {
    protobuf.util._configure();

    protobuf.Writer._configure(protobuf.BufferWriter);

    protobuf.Reader._configure(protobuf.BufferReader);
  } // Set up buffer utility according to the environment


  configure();
})(indexMinimal);

(function (module) {

  module.exports = indexMinimal;
})(minimal$1);

var _m0 = /*@__PURE__*/getDefaultExportFromCjs(minimal$1.exports);

/* eslint-disable */

var globalThis$3 = (() => {
  if (typeof globalThis$3 !== "undefined") {
    return globalThis$3;
  }

  if (typeof self !== "undefined") {
    return self;
  }

  if (typeof window !== "undefined") {
    return window;
  }

  if (typeof global !== "undefined") {
    return global;
  }

  throw "Unable to locate global object";
})();

if (_m0.util.Long !== long) {
  _m0.util.Long = long;

  _m0.configure();
}

/* eslint-disable */
var TrackType;

(function (TrackType) {
  TrackType[TrackType["AUDIO"] = 0] = "AUDIO";
  TrackType[TrackType["VIDEO"] = 1] = "VIDEO";
  TrackType[TrackType["DATA"] = 2] = "DATA";
  TrackType[TrackType["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(TrackType || (TrackType = {}));

function trackTypeFromJSON(object) {
  switch (object) {
    case 0:
    case "AUDIO":
      return TrackType.AUDIO;

    case 1:
    case "VIDEO":
      return TrackType.VIDEO;

    case 2:
    case "DATA":
      return TrackType.DATA;

    case -1:
    case "UNRECOGNIZED":
    default:
      return TrackType.UNRECOGNIZED;
  }
}
function trackTypeToJSON(object) {
  switch (object) {
    case TrackType.AUDIO:
      return "AUDIO";

    case TrackType.VIDEO:
      return "VIDEO";

    case TrackType.DATA:
      return "DATA";

    case TrackType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var TrackSource;

(function (TrackSource) {
  TrackSource[TrackSource["UNKNOWN"] = 0] = "UNKNOWN";
  TrackSource[TrackSource["CAMERA"] = 1] = "CAMERA";
  TrackSource[TrackSource["MICROPHONE"] = 2] = "MICROPHONE";
  TrackSource[TrackSource["SCREEN_SHARE"] = 3] = "SCREEN_SHARE";
  TrackSource[TrackSource["SCREEN_SHARE_AUDIO"] = 4] = "SCREEN_SHARE_AUDIO";
  TrackSource[TrackSource["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(TrackSource || (TrackSource = {}));

function trackSourceFromJSON(object) {
  switch (object) {
    case 0:
    case "UNKNOWN":
      return TrackSource.UNKNOWN;

    case 1:
    case "CAMERA":
      return TrackSource.CAMERA;

    case 2:
    case "MICROPHONE":
      return TrackSource.MICROPHONE;

    case 3:
    case "SCREEN_SHARE":
      return TrackSource.SCREEN_SHARE;

    case 4:
    case "SCREEN_SHARE_AUDIO":
      return TrackSource.SCREEN_SHARE_AUDIO;

    case -1:
    case "UNRECOGNIZED":
    default:
      return TrackSource.UNRECOGNIZED;
  }
}
function trackSourceToJSON(object) {
  switch (object) {
    case TrackSource.UNKNOWN:
      return "UNKNOWN";

    case TrackSource.CAMERA:
      return "CAMERA";

    case TrackSource.MICROPHONE:
      return "MICROPHONE";

    case TrackSource.SCREEN_SHARE:
      return "SCREEN_SHARE";

    case TrackSource.SCREEN_SHARE_AUDIO:
      return "SCREEN_SHARE_AUDIO";

    case TrackSource.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var VideoQuality;

(function (VideoQuality) {
  VideoQuality[VideoQuality["LOW"] = 0] = "LOW";
  VideoQuality[VideoQuality["MEDIUM"] = 1] = "MEDIUM";
  VideoQuality[VideoQuality["HIGH"] = 2] = "HIGH";
  VideoQuality[VideoQuality["OFF"] = 3] = "OFF";
  VideoQuality[VideoQuality["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(VideoQuality || (VideoQuality = {}));

function videoQualityFromJSON(object) {
  switch (object) {
    case 0:
    case "LOW":
      return VideoQuality.LOW;

    case 1:
    case "MEDIUM":
      return VideoQuality.MEDIUM;

    case 2:
    case "HIGH":
      return VideoQuality.HIGH;

    case 3:
    case "OFF":
      return VideoQuality.OFF;

    case -1:
    case "UNRECOGNIZED":
    default:
      return VideoQuality.UNRECOGNIZED;
  }
}
function videoQualityToJSON(object) {
  switch (object) {
    case VideoQuality.LOW:
      return "LOW";

    case VideoQuality.MEDIUM:
      return "MEDIUM";

    case VideoQuality.HIGH:
      return "HIGH";

    case VideoQuality.OFF:
      return "OFF";

    case VideoQuality.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var ConnectionQuality$1;

(function (ConnectionQuality) {
  ConnectionQuality[ConnectionQuality["POOR"] = 0] = "POOR";
  ConnectionQuality[ConnectionQuality["GOOD"] = 1] = "GOOD";
  ConnectionQuality[ConnectionQuality["EXCELLENT"] = 2] = "EXCELLENT";
  ConnectionQuality[ConnectionQuality["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(ConnectionQuality$1 || (ConnectionQuality$1 = {}));

function connectionQualityFromJSON(object) {
  switch (object) {
    case 0:
    case "POOR":
      return ConnectionQuality$1.POOR;

    case 1:
    case "GOOD":
      return ConnectionQuality$1.GOOD;

    case 2:
    case "EXCELLENT":
      return ConnectionQuality$1.EXCELLENT;

    case -1:
    case "UNRECOGNIZED":
    default:
      return ConnectionQuality$1.UNRECOGNIZED;
  }
}
function connectionQualityToJSON(object) {
  switch (object) {
    case ConnectionQuality$1.POOR:
      return "POOR";

    case ConnectionQuality$1.GOOD:
      return "GOOD";

    case ConnectionQuality$1.EXCELLENT:
      return "EXCELLENT";

    case ConnectionQuality$1.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var ClientConfigSetting;

(function (ClientConfigSetting) {
  ClientConfigSetting[ClientConfigSetting["UNSET"] = 0] = "UNSET";
  ClientConfigSetting[ClientConfigSetting["DISABLED"] = 1] = "DISABLED";
  ClientConfigSetting[ClientConfigSetting["ENABLED"] = 2] = "ENABLED";
  ClientConfigSetting[ClientConfigSetting["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(ClientConfigSetting || (ClientConfigSetting = {}));

function clientConfigSettingFromJSON(object) {
  switch (object) {
    case 0:
    case "UNSET":
      return ClientConfigSetting.UNSET;

    case 1:
    case "DISABLED":
      return ClientConfigSetting.DISABLED;

    case 2:
    case "ENABLED":
      return ClientConfigSetting.ENABLED;

    case -1:
    case "UNRECOGNIZED":
    default:
      return ClientConfigSetting.UNRECOGNIZED;
  }
}
function clientConfigSettingToJSON(object) {
  switch (object) {
    case ClientConfigSetting.UNSET:
      return "UNSET";

    case ClientConfigSetting.DISABLED:
      return "DISABLED";

    case ClientConfigSetting.ENABLED:
      return "ENABLED";

    case ClientConfigSetting.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var DisconnectReason;

(function (DisconnectReason) {
  DisconnectReason[DisconnectReason["UNKNOWN_REASON"] = 0] = "UNKNOWN_REASON";
  DisconnectReason[DisconnectReason["CLIENT_INITIATED"] = 1] = "CLIENT_INITIATED";
  DisconnectReason[DisconnectReason["DUPLICATE_IDENTITY"] = 2] = "DUPLICATE_IDENTITY";
  DisconnectReason[DisconnectReason["SERVER_SHUTDOWN"] = 3] = "SERVER_SHUTDOWN";
  DisconnectReason[DisconnectReason["PARTICIPANT_REMOVED"] = 4] = "PARTICIPANT_REMOVED";
  DisconnectReason[DisconnectReason["ROOM_DELETED"] = 5] = "ROOM_DELETED";
  DisconnectReason[DisconnectReason["STATE_MISMATCH"] = 6] = "STATE_MISMATCH";
  DisconnectReason[DisconnectReason["JOIN_FAILURE"] = 7] = "JOIN_FAILURE";
  DisconnectReason[DisconnectReason["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(DisconnectReason || (DisconnectReason = {}));

function disconnectReasonFromJSON(object) {
  switch (object) {
    case 0:
    case "UNKNOWN_REASON":
      return DisconnectReason.UNKNOWN_REASON;

    case 1:
    case "CLIENT_INITIATED":
      return DisconnectReason.CLIENT_INITIATED;

    case 2:
    case "DUPLICATE_IDENTITY":
      return DisconnectReason.DUPLICATE_IDENTITY;

    case 3:
    case "SERVER_SHUTDOWN":
      return DisconnectReason.SERVER_SHUTDOWN;

    case 4:
    case "PARTICIPANT_REMOVED":
      return DisconnectReason.PARTICIPANT_REMOVED;

    case 5:
    case "ROOM_DELETED":
      return DisconnectReason.ROOM_DELETED;

    case 6:
    case "STATE_MISMATCH":
      return DisconnectReason.STATE_MISMATCH;

    case 7:
    case "JOIN_FAILURE":
      return DisconnectReason.JOIN_FAILURE;

    case -1:
    case "UNRECOGNIZED":
    default:
      return DisconnectReason.UNRECOGNIZED;
  }
}
function disconnectReasonToJSON(object) {
  switch (object) {
    case DisconnectReason.UNKNOWN_REASON:
      return "UNKNOWN_REASON";

    case DisconnectReason.CLIENT_INITIATED:
      return "CLIENT_INITIATED";

    case DisconnectReason.DUPLICATE_IDENTITY:
      return "DUPLICATE_IDENTITY";

    case DisconnectReason.SERVER_SHUTDOWN:
      return "SERVER_SHUTDOWN";

    case DisconnectReason.PARTICIPANT_REMOVED:
      return "PARTICIPANT_REMOVED";

    case DisconnectReason.ROOM_DELETED:
      return "ROOM_DELETED";

    case DisconnectReason.STATE_MISMATCH:
      return "STATE_MISMATCH";

    case DisconnectReason.JOIN_FAILURE:
      return "JOIN_FAILURE";

    case DisconnectReason.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var ParticipantInfo_State;

(function (ParticipantInfo_State) {
  /** JOINING - websocket' connected, but not offered yet */
  ParticipantInfo_State[ParticipantInfo_State["JOINING"] = 0] = "JOINING";
  /** JOINED - server received client offer */

  ParticipantInfo_State[ParticipantInfo_State["JOINED"] = 1] = "JOINED";
  /** ACTIVE - ICE connectivity established */

  ParticipantInfo_State[ParticipantInfo_State["ACTIVE"] = 2] = "ACTIVE";
  /** DISCONNECTED - WS disconnected */

  ParticipantInfo_State[ParticipantInfo_State["DISCONNECTED"] = 3] = "DISCONNECTED";
  ParticipantInfo_State[ParticipantInfo_State["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(ParticipantInfo_State || (ParticipantInfo_State = {}));

function participantInfo_StateFromJSON(object) {
  switch (object) {
    case 0:
    case "JOINING":
      return ParticipantInfo_State.JOINING;

    case 1:
    case "JOINED":
      return ParticipantInfo_State.JOINED;

    case 2:
    case "ACTIVE":
      return ParticipantInfo_State.ACTIVE;

    case 3:
    case "DISCONNECTED":
      return ParticipantInfo_State.DISCONNECTED;

    case -1:
    case "UNRECOGNIZED":
    default:
      return ParticipantInfo_State.UNRECOGNIZED;
  }
}
function participantInfo_StateToJSON(object) {
  switch (object) {
    case ParticipantInfo_State.JOINING:
      return "JOINING";

    case ParticipantInfo_State.JOINED:
      return "JOINED";

    case ParticipantInfo_State.ACTIVE:
      return "ACTIVE";

    case ParticipantInfo_State.DISCONNECTED:
      return "DISCONNECTED";

    case ParticipantInfo_State.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var DataPacket_Kind;

(function (DataPacket_Kind) {
  DataPacket_Kind[DataPacket_Kind["RELIABLE"] = 0] = "RELIABLE";
  DataPacket_Kind[DataPacket_Kind["LOSSY"] = 1] = "LOSSY";
  DataPacket_Kind[DataPacket_Kind["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(DataPacket_Kind || (DataPacket_Kind = {}));

function dataPacket_KindFromJSON(object) {
  switch (object) {
    case 0:
    case "RELIABLE":
      return DataPacket_Kind.RELIABLE;

    case 1:
    case "LOSSY":
      return DataPacket_Kind.LOSSY;

    case -1:
    case "UNRECOGNIZED":
    default:
      return DataPacket_Kind.UNRECOGNIZED;
  }
}
function dataPacket_KindToJSON(object) {
  switch (object) {
    case DataPacket_Kind.RELIABLE:
      return "RELIABLE";

    case DataPacket_Kind.LOSSY:
      return "LOSSY";

    case DataPacket_Kind.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var ServerInfo_Edition;

(function (ServerInfo_Edition) {
  ServerInfo_Edition[ServerInfo_Edition["Standard"] = 0] = "Standard";
  ServerInfo_Edition[ServerInfo_Edition["Cloud"] = 1] = "Cloud";
  ServerInfo_Edition[ServerInfo_Edition["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(ServerInfo_Edition || (ServerInfo_Edition = {}));

function serverInfo_EditionFromJSON(object) {
  switch (object) {
    case 0:
    case "Standard":
      return ServerInfo_Edition.Standard;

    case 1:
    case "Cloud":
      return ServerInfo_Edition.Cloud;

    case -1:
    case "UNRECOGNIZED":
    default:
      return ServerInfo_Edition.UNRECOGNIZED;
  }
}
function serverInfo_EditionToJSON(object) {
  switch (object) {
    case ServerInfo_Edition.Standard:
      return "Standard";

    case ServerInfo_Edition.Cloud:
      return "Cloud";

    case ServerInfo_Edition.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var ClientInfo_SDK;

(function (ClientInfo_SDK) {
  ClientInfo_SDK[ClientInfo_SDK["UNKNOWN"] = 0] = "UNKNOWN";
  ClientInfo_SDK[ClientInfo_SDK["JS"] = 1] = "JS";
  ClientInfo_SDK[ClientInfo_SDK["SWIFT"] = 2] = "SWIFT";
  ClientInfo_SDK[ClientInfo_SDK["ANDROID"] = 3] = "ANDROID";
  ClientInfo_SDK[ClientInfo_SDK["FLUTTER"] = 4] = "FLUTTER";
  ClientInfo_SDK[ClientInfo_SDK["GO"] = 5] = "GO";
  ClientInfo_SDK[ClientInfo_SDK["UNITY"] = 6] = "UNITY";
  ClientInfo_SDK[ClientInfo_SDK["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(ClientInfo_SDK || (ClientInfo_SDK = {}));

function clientInfo_SDKFromJSON(object) {
  switch (object) {
    case 0:
    case "UNKNOWN":
      return ClientInfo_SDK.UNKNOWN;

    case 1:
    case "JS":
      return ClientInfo_SDK.JS;

    case 2:
    case "SWIFT":
      return ClientInfo_SDK.SWIFT;

    case 3:
    case "ANDROID":
      return ClientInfo_SDK.ANDROID;

    case 4:
    case "FLUTTER":
      return ClientInfo_SDK.FLUTTER;

    case 5:
    case "GO":
      return ClientInfo_SDK.GO;

    case 6:
    case "UNITY":
      return ClientInfo_SDK.UNITY;

    case -1:
    case "UNRECOGNIZED":
    default:
      return ClientInfo_SDK.UNRECOGNIZED;
  }
}
function clientInfo_SDKToJSON(object) {
  switch (object) {
    case ClientInfo_SDK.UNKNOWN:
      return "UNKNOWN";

    case ClientInfo_SDK.JS:
      return "JS";

    case ClientInfo_SDK.SWIFT:
      return "SWIFT";

    case ClientInfo_SDK.ANDROID:
      return "ANDROID";

    case ClientInfo_SDK.FLUTTER:
      return "FLUTTER";

    case ClientInfo_SDK.GO:
      return "GO";

    case ClientInfo_SDK.UNITY:
      return "UNITY";

    case ClientInfo_SDK.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

function createBaseRoom() {
  return {
    sid: "",
    name: "",
    emptyTimeout: 0,
    maxParticipants: 0,
    creationTime: 0,
    turnPassword: "",
    enabledCodecs: [],
    metadata: "",
    numParticipants: 0,
    activeRecording: false
  };
}

const Room$1 = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.sid !== "") {
      writer.uint32(10).string(message.sid);
    }

    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }

    if (message.emptyTimeout !== 0) {
      writer.uint32(24).uint32(message.emptyTimeout);
    }

    if (message.maxParticipants !== 0) {
      writer.uint32(32).uint32(message.maxParticipants);
    }

    if (message.creationTime !== 0) {
      writer.uint32(40).int64(message.creationTime);
    }

    if (message.turnPassword !== "") {
      writer.uint32(50).string(message.turnPassword);
    }

    for (const v of message.enabledCodecs) {
      Codec.encode(v, writer.uint32(58).fork()).ldelim();
    }

    if (message.metadata !== "") {
      writer.uint32(66).string(message.metadata);
    }

    if (message.numParticipants !== 0) {
      writer.uint32(72).uint32(message.numParticipants);
    }

    if (message.activeRecording === true) {
      writer.uint32(80).bool(message.activeRecording);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRoom();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.sid = reader.string();
          break;

        case 2:
          message.name = reader.string();
          break;

        case 3:
          message.emptyTimeout = reader.uint32();
          break;

        case 4:
          message.maxParticipants = reader.uint32();
          break;

        case 5:
          message.creationTime = longToNumber$1(reader.int64());
          break;

        case 6:
          message.turnPassword = reader.string();
          break;

        case 7:
          message.enabledCodecs.push(Codec.decode(reader, reader.uint32()));
          break;

        case 8:
          message.metadata = reader.string();
          break;

        case 9:
          message.numParticipants = reader.uint32();
          break;

        case 10:
          message.activeRecording = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      sid: isSet$1(object.sid) ? String(object.sid) : "",
      name: isSet$1(object.name) ? String(object.name) : "",
      emptyTimeout: isSet$1(object.emptyTimeout) ? Number(object.emptyTimeout) : 0,
      maxParticipants: isSet$1(object.maxParticipants) ? Number(object.maxParticipants) : 0,
      creationTime: isSet$1(object.creationTime) ? Number(object.creationTime) : 0,
      turnPassword: isSet$1(object.turnPassword) ? String(object.turnPassword) : "",
      enabledCodecs: Array.isArray(object === null || object === void 0 ? void 0 : object.enabledCodecs) ? object.enabledCodecs.map(e => Codec.fromJSON(e)) : [],
      metadata: isSet$1(object.metadata) ? String(object.metadata) : "",
      numParticipants: isSet$1(object.numParticipants) ? Number(object.numParticipants) : 0,
      activeRecording: isSet$1(object.activeRecording) ? Boolean(object.activeRecording) : false
    };
  },

  toJSON(message) {
    const obj = {};
    message.sid !== undefined && (obj.sid = message.sid);
    message.name !== undefined && (obj.name = message.name);
    message.emptyTimeout !== undefined && (obj.emptyTimeout = Math.round(message.emptyTimeout));
    message.maxParticipants !== undefined && (obj.maxParticipants = Math.round(message.maxParticipants));
    message.creationTime !== undefined && (obj.creationTime = Math.round(message.creationTime));
    message.turnPassword !== undefined && (obj.turnPassword = message.turnPassword);

    if (message.enabledCodecs) {
      obj.enabledCodecs = message.enabledCodecs.map(e => e ? Codec.toJSON(e) : undefined);
    } else {
      obj.enabledCodecs = [];
    }

    message.metadata !== undefined && (obj.metadata = message.metadata);
    message.numParticipants !== undefined && (obj.numParticipants = Math.round(message.numParticipants));
    message.activeRecording !== undefined && (obj.activeRecording = message.activeRecording);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;

    const message = createBaseRoom();
    message.sid = (_a = object.sid) !== null && _a !== void 0 ? _a : "";
    message.name = (_b = object.name) !== null && _b !== void 0 ? _b : "";
    message.emptyTimeout = (_c = object.emptyTimeout) !== null && _c !== void 0 ? _c : 0;
    message.maxParticipants = (_d = object.maxParticipants) !== null && _d !== void 0 ? _d : 0;
    message.creationTime = (_e = object.creationTime) !== null && _e !== void 0 ? _e : 0;
    message.turnPassword = (_f = object.turnPassword) !== null && _f !== void 0 ? _f : "";
    message.enabledCodecs = ((_g = object.enabledCodecs) === null || _g === void 0 ? void 0 : _g.map(e => Codec.fromPartial(e))) || [];
    message.metadata = (_h = object.metadata) !== null && _h !== void 0 ? _h : "";
    message.numParticipants = (_j = object.numParticipants) !== null && _j !== void 0 ? _j : 0;
    message.activeRecording = (_k = object.activeRecording) !== null && _k !== void 0 ? _k : false;
    return message;
  }

};

function createBaseCodec() {
  return {
    mime: "",
    fmtpLine: ""
  };
}

const Codec = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.mime !== "") {
      writer.uint32(10).string(message.mime);
    }

    if (message.fmtpLine !== "") {
      writer.uint32(18).string(message.fmtpLine);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCodec();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.mime = reader.string();
          break;

        case 2:
          message.fmtpLine = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      mime: isSet$1(object.mime) ? String(object.mime) : "",
      fmtpLine: isSet$1(object.fmtpLine) ? String(object.fmtpLine) : ""
    };
  },

  toJSON(message) {
    const obj = {};
    message.mime !== undefined && (obj.mime = message.mime);
    message.fmtpLine !== undefined && (obj.fmtpLine = message.fmtpLine);
    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseCodec();
    message.mime = (_a = object.mime) !== null && _a !== void 0 ? _a : "";
    message.fmtpLine = (_b = object.fmtpLine) !== null && _b !== void 0 ? _b : "";
    return message;
  }

};

function createBaseParticipantPermission() {
  return {
    canSubscribe: false,
    canPublish: false,
    canPublishData: false,
    hidden: false,
    recorder: false
  };
}

const ParticipantPermission = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.canSubscribe === true) {
      writer.uint32(8).bool(message.canSubscribe);
    }

    if (message.canPublish === true) {
      writer.uint32(16).bool(message.canPublish);
    }

    if (message.canPublishData === true) {
      writer.uint32(24).bool(message.canPublishData);
    }

    if (message.hidden === true) {
      writer.uint32(56).bool(message.hidden);
    }

    if (message.recorder === true) {
      writer.uint32(64).bool(message.recorder);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseParticipantPermission();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.canSubscribe = reader.bool();
          break;

        case 2:
          message.canPublish = reader.bool();
          break;

        case 3:
          message.canPublishData = reader.bool();
          break;

        case 7:
          message.hidden = reader.bool();
          break;

        case 8:
          message.recorder = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      canSubscribe: isSet$1(object.canSubscribe) ? Boolean(object.canSubscribe) : false,
      canPublish: isSet$1(object.canPublish) ? Boolean(object.canPublish) : false,
      canPublishData: isSet$1(object.canPublishData) ? Boolean(object.canPublishData) : false,
      hidden: isSet$1(object.hidden) ? Boolean(object.hidden) : false,
      recorder: isSet$1(object.recorder) ? Boolean(object.recorder) : false
    };
  },

  toJSON(message) {
    const obj = {};
    message.canSubscribe !== undefined && (obj.canSubscribe = message.canSubscribe);
    message.canPublish !== undefined && (obj.canPublish = message.canPublish);
    message.canPublishData !== undefined && (obj.canPublishData = message.canPublishData);
    message.hidden !== undefined && (obj.hidden = message.hidden);
    message.recorder !== undefined && (obj.recorder = message.recorder);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e;

    const message = createBaseParticipantPermission();
    message.canSubscribe = (_a = object.canSubscribe) !== null && _a !== void 0 ? _a : false;
    message.canPublish = (_b = object.canPublish) !== null && _b !== void 0 ? _b : false;
    message.canPublishData = (_c = object.canPublishData) !== null && _c !== void 0 ? _c : false;
    message.hidden = (_d = object.hidden) !== null && _d !== void 0 ? _d : false;
    message.recorder = (_e = object.recorder) !== null && _e !== void 0 ? _e : false;
    return message;
  }

};

function createBaseParticipantInfo() {
  return {
    sid: "",
    identity: "",
    state: 0,
    tracks: [],
    metadata: "",
    joinedAt: 0,
    name: "",
    version: 0,
    permission: undefined,
    region: "",
    isPublisher: false
  };
}

const ParticipantInfo = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.sid !== "") {
      writer.uint32(10).string(message.sid);
    }

    if (message.identity !== "") {
      writer.uint32(18).string(message.identity);
    }

    if (message.state !== 0) {
      writer.uint32(24).int32(message.state);
    }

    for (const v of message.tracks) {
      TrackInfo.encode(v, writer.uint32(34).fork()).ldelim();
    }

    if (message.metadata !== "") {
      writer.uint32(42).string(message.metadata);
    }

    if (message.joinedAt !== 0) {
      writer.uint32(48).int64(message.joinedAt);
    }

    if (message.name !== "") {
      writer.uint32(74).string(message.name);
    }

    if (message.version !== 0) {
      writer.uint32(80).uint32(message.version);
    }

    if (message.permission !== undefined) {
      ParticipantPermission.encode(message.permission, writer.uint32(90).fork()).ldelim();
    }

    if (message.region !== "") {
      writer.uint32(98).string(message.region);
    }

    if (message.isPublisher === true) {
      writer.uint32(104).bool(message.isPublisher);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseParticipantInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.sid = reader.string();
          break;

        case 2:
          message.identity = reader.string();
          break;

        case 3:
          message.state = reader.int32();
          break;

        case 4:
          message.tracks.push(TrackInfo.decode(reader, reader.uint32()));
          break;

        case 5:
          message.metadata = reader.string();
          break;

        case 6:
          message.joinedAt = longToNumber$1(reader.int64());
          break;

        case 9:
          message.name = reader.string();
          break;

        case 10:
          message.version = reader.uint32();
          break;

        case 11:
          message.permission = ParticipantPermission.decode(reader, reader.uint32());
          break;

        case 12:
          message.region = reader.string();
          break;

        case 13:
          message.isPublisher = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      sid: isSet$1(object.sid) ? String(object.sid) : "",
      identity: isSet$1(object.identity) ? String(object.identity) : "",
      state: isSet$1(object.state) ? participantInfo_StateFromJSON(object.state) : 0,
      tracks: Array.isArray(object === null || object === void 0 ? void 0 : object.tracks) ? object.tracks.map(e => TrackInfo.fromJSON(e)) : [],
      metadata: isSet$1(object.metadata) ? String(object.metadata) : "",
      joinedAt: isSet$1(object.joinedAt) ? Number(object.joinedAt) : 0,
      name: isSet$1(object.name) ? String(object.name) : "",
      version: isSet$1(object.version) ? Number(object.version) : 0,
      permission: isSet$1(object.permission) ? ParticipantPermission.fromJSON(object.permission) : undefined,
      region: isSet$1(object.region) ? String(object.region) : "",
      isPublisher: isSet$1(object.isPublisher) ? Boolean(object.isPublisher) : false
    };
  },

  toJSON(message) {
    const obj = {};
    message.sid !== undefined && (obj.sid = message.sid);
    message.identity !== undefined && (obj.identity = message.identity);
    message.state !== undefined && (obj.state = participantInfo_StateToJSON(message.state));

    if (message.tracks) {
      obj.tracks = message.tracks.map(e => e ? TrackInfo.toJSON(e) : undefined);
    } else {
      obj.tracks = [];
    }

    message.metadata !== undefined && (obj.metadata = message.metadata);
    message.joinedAt !== undefined && (obj.joinedAt = Math.round(message.joinedAt));
    message.name !== undefined && (obj.name = message.name);
    message.version !== undefined && (obj.version = Math.round(message.version));
    message.permission !== undefined && (obj.permission = message.permission ? ParticipantPermission.toJSON(message.permission) : undefined);
    message.region !== undefined && (obj.region = message.region);
    message.isPublisher !== undefined && (obj.isPublisher = message.isPublisher);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;

    const message = createBaseParticipantInfo();
    message.sid = (_a = object.sid) !== null && _a !== void 0 ? _a : "";
    message.identity = (_b = object.identity) !== null && _b !== void 0 ? _b : "";
    message.state = (_c = object.state) !== null && _c !== void 0 ? _c : 0;
    message.tracks = ((_d = object.tracks) === null || _d === void 0 ? void 0 : _d.map(e => TrackInfo.fromPartial(e))) || [];
    message.metadata = (_e = object.metadata) !== null && _e !== void 0 ? _e : "";
    message.joinedAt = (_f = object.joinedAt) !== null && _f !== void 0 ? _f : 0;
    message.name = (_g = object.name) !== null && _g !== void 0 ? _g : "";
    message.version = (_h = object.version) !== null && _h !== void 0 ? _h : 0;
    message.permission = object.permission !== undefined && object.permission !== null ? ParticipantPermission.fromPartial(object.permission) : undefined;
    message.region = (_j = object.region) !== null && _j !== void 0 ? _j : "";
    message.isPublisher = (_k = object.isPublisher) !== null && _k !== void 0 ? _k : false;
    return message;
  }

};

function createBaseSimulcastCodecInfo() {
  return {
    mimeType: "",
    mid: "",
    cid: "",
    layers: []
  };
}

const SimulcastCodecInfo = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.mimeType !== "") {
      writer.uint32(10).string(message.mimeType);
    }

    if (message.mid !== "") {
      writer.uint32(18).string(message.mid);
    }

    if (message.cid !== "") {
      writer.uint32(26).string(message.cid);
    }

    for (const v of message.layers) {
      VideoLayer.encode(v, writer.uint32(34).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSimulcastCodecInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.mimeType = reader.string();
          break;

        case 2:
          message.mid = reader.string();
          break;

        case 3:
          message.cid = reader.string();
          break;

        case 4:
          message.layers.push(VideoLayer.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      mimeType: isSet$1(object.mimeType) ? String(object.mimeType) : "",
      mid: isSet$1(object.mid) ? String(object.mid) : "",
      cid: isSet$1(object.cid) ? String(object.cid) : "",
      layers: Array.isArray(object === null || object === void 0 ? void 0 : object.layers) ? object.layers.map(e => VideoLayer.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};
    message.mimeType !== undefined && (obj.mimeType = message.mimeType);
    message.mid !== undefined && (obj.mid = message.mid);
    message.cid !== undefined && (obj.cid = message.cid);

    if (message.layers) {
      obj.layers = message.layers.map(e => e ? VideoLayer.toJSON(e) : undefined);
    } else {
      obj.layers = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d;

    const message = createBaseSimulcastCodecInfo();
    message.mimeType = (_a = object.mimeType) !== null && _a !== void 0 ? _a : "";
    message.mid = (_b = object.mid) !== null && _b !== void 0 ? _b : "";
    message.cid = (_c = object.cid) !== null && _c !== void 0 ? _c : "";
    message.layers = ((_d = object.layers) === null || _d === void 0 ? void 0 : _d.map(e => VideoLayer.fromPartial(e))) || [];
    return message;
  }

};

function createBaseTrackInfo() {
  return {
    sid: "",
    type: 0,
    name: "",
    muted: false,
    width: 0,
    height: 0,
    simulcast: false,
    disableDtx: false,
    source: 0,
    layers: [],
    mimeType: "",
    mid: "",
    codecs: []
  };
}

const TrackInfo = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.sid !== "") {
      writer.uint32(10).string(message.sid);
    }

    if (message.type !== 0) {
      writer.uint32(16).int32(message.type);
    }

    if (message.name !== "") {
      writer.uint32(26).string(message.name);
    }

    if (message.muted === true) {
      writer.uint32(32).bool(message.muted);
    }

    if (message.width !== 0) {
      writer.uint32(40).uint32(message.width);
    }

    if (message.height !== 0) {
      writer.uint32(48).uint32(message.height);
    }

    if (message.simulcast === true) {
      writer.uint32(56).bool(message.simulcast);
    }

    if (message.disableDtx === true) {
      writer.uint32(64).bool(message.disableDtx);
    }

    if (message.source !== 0) {
      writer.uint32(72).int32(message.source);
    }

    for (const v of message.layers) {
      VideoLayer.encode(v, writer.uint32(82).fork()).ldelim();
    }

    if (message.mimeType !== "") {
      writer.uint32(90).string(message.mimeType);
    }

    if (message.mid !== "") {
      writer.uint32(98).string(message.mid);
    }

    for (const v of message.codecs) {
      SimulcastCodecInfo.encode(v, writer.uint32(106).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrackInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.sid = reader.string();
          break;

        case 2:
          message.type = reader.int32();
          break;

        case 3:
          message.name = reader.string();
          break;

        case 4:
          message.muted = reader.bool();
          break;

        case 5:
          message.width = reader.uint32();
          break;

        case 6:
          message.height = reader.uint32();
          break;

        case 7:
          message.simulcast = reader.bool();
          break;

        case 8:
          message.disableDtx = reader.bool();
          break;

        case 9:
          message.source = reader.int32();
          break;

        case 10:
          message.layers.push(VideoLayer.decode(reader, reader.uint32()));
          break;

        case 11:
          message.mimeType = reader.string();
          break;

        case 12:
          message.mid = reader.string();
          break;

        case 13:
          message.codecs.push(SimulcastCodecInfo.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      sid: isSet$1(object.sid) ? String(object.sid) : "",
      type: isSet$1(object.type) ? trackTypeFromJSON(object.type) : 0,
      name: isSet$1(object.name) ? String(object.name) : "",
      muted: isSet$1(object.muted) ? Boolean(object.muted) : false,
      width: isSet$1(object.width) ? Number(object.width) : 0,
      height: isSet$1(object.height) ? Number(object.height) : 0,
      simulcast: isSet$1(object.simulcast) ? Boolean(object.simulcast) : false,
      disableDtx: isSet$1(object.disableDtx) ? Boolean(object.disableDtx) : false,
      source: isSet$1(object.source) ? trackSourceFromJSON(object.source) : 0,
      layers: Array.isArray(object === null || object === void 0 ? void 0 : object.layers) ? object.layers.map(e => VideoLayer.fromJSON(e)) : [],
      mimeType: isSet$1(object.mimeType) ? String(object.mimeType) : "",
      mid: isSet$1(object.mid) ? String(object.mid) : "",
      codecs: Array.isArray(object === null || object === void 0 ? void 0 : object.codecs) ? object.codecs.map(e => SimulcastCodecInfo.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};
    message.sid !== undefined && (obj.sid = message.sid);
    message.type !== undefined && (obj.type = trackTypeToJSON(message.type));
    message.name !== undefined && (obj.name = message.name);
    message.muted !== undefined && (obj.muted = message.muted);
    message.width !== undefined && (obj.width = Math.round(message.width));
    message.height !== undefined && (obj.height = Math.round(message.height));
    message.simulcast !== undefined && (obj.simulcast = message.simulcast);
    message.disableDtx !== undefined && (obj.disableDtx = message.disableDtx);
    message.source !== undefined && (obj.source = trackSourceToJSON(message.source));

    if (message.layers) {
      obj.layers = message.layers.map(e => e ? VideoLayer.toJSON(e) : undefined);
    } else {
      obj.layers = [];
    }

    message.mimeType !== undefined && (obj.mimeType = message.mimeType);
    message.mid !== undefined && (obj.mid = message.mid);

    if (message.codecs) {
      obj.codecs = message.codecs.map(e => e ? SimulcastCodecInfo.toJSON(e) : undefined);
    } else {
      obj.codecs = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;

    const message = createBaseTrackInfo();
    message.sid = (_a = object.sid) !== null && _a !== void 0 ? _a : "";
    message.type = (_b = object.type) !== null && _b !== void 0 ? _b : 0;
    message.name = (_c = object.name) !== null && _c !== void 0 ? _c : "";
    message.muted = (_d = object.muted) !== null && _d !== void 0 ? _d : false;
    message.width = (_e = object.width) !== null && _e !== void 0 ? _e : 0;
    message.height = (_f = object.height) !== null && _f !== void 0 ? _f : 0;
    message.simulcast = (_g = object.simulcast) !== null && _g !== void 0 ? _g : false;
    message.disableDtx = (_h = object.disableDtx) !== null && _h !== void 0 ? _h : false;
    message.source = (_j = object.source) !== null && _j !== void 0 ? _j : 0;
    message.layers = ((_k = object.layers) === null || _k === void 0 ? void 0 : _k.map(e => VideoLayer.fromPartial(e))) || [];
    message.mimeType = (_l = object.mimeType) !== null && _l !== void 0 ? _l : "";
    message.mid = (_m = object.mid) !== null && _m !== void 0 ? _m : "";
    message.codecs = ((_o = object.codecs) === null || _o === void 0 ? void 0 : _o.map(e => SimulcastCodecInfo.fromPartial(e))) || [];
    return message;
  }

};

function createBaseVideoLayer() {
  return {
    quality: 0,
    width: 0,
    height: 0,
    bitrate: 0,
    ssrc: 0
  };
}

const VideoLayer = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.quality !== 0) {
      writer.uint32(8).int32(message.quality);
    }

    if (message.width !== 0) {
      writer.uint32(16).uint32(message.width);
    }

    if (message.height !== 0) {
      writer.uint32(24).uint32(message.height);
    }

    if (message.bitrate !== 0) {
      writer.uint32(32).uint32(message.bitrate);
    }

    if (message.ssrc !== 0) {
      writer.uint32(40).uint32(message.ssrc);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVideoLayer();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.quality = reader.int32();
          break;

        case 2:
          message.width = reader.uint32();
          break;

        case 3:
          message.height = reader.uint32();
          break;

        case 4:
          message.bitrate = reader.uint32();
          break;

        case 5:
          message.ssrc = reader.uint32();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      quality: isSet$1(object.quality) ? videoQualityFromJSON(object.quality) : 0,
      width: isSet$1(object.width) ? Number(object.width) : 0,
      height: isSet$1(object.height) ? Number(object.height) : 0,
      bitrate: isSet$1(object.bitrate) ? Number(object.bitrate) : 0,
      ssrc: isSet$1(object.ssrc) ? Number(object.ssrc) : 0
    };
  },

  toJSON(message) {
    const obj = {};
    message.quality !== undefined && (obj.quality = videoQualityToJSON(message.quality));
    message.width !== undefined && (obj.width = Math.round(message.width));
    message.height !== undefined && (obj.height = Math.round(message.height));
    message.bitrate !== undefined && (obj.bitrate = Math.round(message.bitrate));
    message.ssrc !== undefined && (obj.ssrc = Math.round(message.ssrc));
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e;

    const message = createBaseVideoLayer();
    message.quality = (_a = object.quality) !== null && _a !== void 0 ? _a : 0;
    message.width = (_b = object.width) !== null && _b !== void 0 ? _b : 0;
    message.height = (_c = object.height) !== null && _c !== void 0 ? _c : 0;
    message.bitrate = (_d = object.bitrate) !== null && _d !== void 0 ? _d : 0;
    message.ssrc = (_e = object.ssrc) !== null && _e !== void 0 ? _e : 0;
    return message;
  }

};

function createBaseDataPacket() {
  return {
    kind: 0,
    value: undefined
  };
}

const DataPacket = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    var _a, _b;

    if (message.kind !== 0) {
      writer.uint32(8).int32(message.kind);
    }

    if (((_a = message.value) === null || _a === void 0 ? void 0 : _a.$case) === "user") {
      UserPacket.encode(message.value.user, writer.uint32(18).fork()).ldelim();
    }

    if (((_b = message.value) === null || _b === void 0 ? void 0 : _b.$case) === "speaker") {
      ActiveSpeakerUpdate.encode(message.value.speaker, writer.uint32(26).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDataPacket();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.kind = reader.int32();
          break;

        case 2:
          message.value = {
            $case: "user",
            user: UserPacket.decode(reader, reader.uint32())
          };
          break;

        case 3:
          message.value = {
            $case: "speaker",
            speaker: ActiveSpeakerUpdate.decode(reader, reader.uint32())
          };
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      kind: isSet$1(object.kind) ? dataPacket_KindFromJSON(object.kind) : 0,
      value: isSet$1(object.user) ? {
        $case: "user",
        user: UserPacket.fromJSON(object.user)
      } : isSet$1(object.speaker) ? {
        $case: "speaker",
        speaker: ActiveSpeakerUpdate.fromJSON(object.speaker)
      } : undefined
    };
  },

  toJSON(message) {
    var _a, _b, _c, _d, _e, _f;

    const obj = {};
    message.kind !== undefined && (obj.kind = dataPacket_KindToJSON(message.kind));
    ((_a = message.value) === null || _a === void 0 ? void 0 : _a.$case) === "user" && (obj.user = ((_b = message.value) === null || _b === void 0 ? void 0 : _b.user) ? UserPacket.toJSON((_c = message.value) === null || _c === void 0 ? void 0 : _c.user) : undefined);
    ((_d = message.value) === null || _d === void 0 ? void 0 : _d.$case) === "speaker" && (obj.speaker = ((_e = message.value) === null || _e === void 0 ? void 0 : _e.speaker) ? ActiveSpeakerUpdate.toJSON((_f = message.value) === null || _f === void 0 ? void 0 : _f.speaker) : undefined);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g;

    const message = createBaseDataPacket();
    message.kind = (_a = object.kind) !== null && _a !== void 0 ? _a : 0;

    if (((_b = object.value) === null || _b === void 0 ? void 0 : _b.$case) === "user" && ((_c = object.value) === null || _c === void 0 ? void 0 : _c.user) !== undefined && ((_d = object.value) === null || _d === void 0 ? void 0 : _d.user) !== null) {
      message.value = {
        $case: "user",
        user: UserPacket.fromPartial(object.value.user)
      };
    }

    if (((_e = object.value) === null || _e === void 0 ? void 0 : _e.$case) === "speaker" && ((_f = object.value) === null || _f === void 0 ? void 0 : _f.speaker) !== undefined && ((_g = object.value) === null || _g === void 0 ? void 0 : _g.speaker) !== null) {
      message.value = {
        $case: "speaker",
        speaker: ActiveSpeakerUpdate.fromPartial(object.value.speaker)
      };
    }

    return message;
  }

};

function createBaseActiveSpeakerUpdate() {
  return {
    speakers: []
  };
}

const ActiveSpeakerUpdate = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    for (const v of message.speakers) {
      SpeakerInfo.encode(v, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseActiveSpeakerUpdate();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.speakers.push(SpeakerInfo.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      speakers: Array.isArray(object === null || object === void 0 ? void 0 : object.speakers) ? object.speakers.map(e => SpeakerInfo.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};

    if (message.speakers) {
      obj.speakers = message.speakers.map(e => e ? SpeakerInfo.toJSON(e) : undefined);
    } else {
      obj.speakers = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a;

    const message = createBaseActiveSpeakerUpdate();
    message.speakers = ((_a = object.speakers) === null || _a === void 0 ? void 0 : _a.map(e => SpeakerInfo.fromPartial(e))) || [];
    return message;
  }

};

function createBaseSpeakerInfo() {
  return {
    sid: "",
    level: 0,
    active: false
  };
}

const SpeakerInfo = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.sid !== "") {
      writer.uint32(10).string(message.sid);
    }

    if (message.level !== 0) {
      writer.uint32(21).float(message.level);
    }

    if (message.active === true) {
      writer.uint32(24).bool(message.active);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSpeakerInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.sid = reader.string();
          break;

        case 2:
          message.level = reader.float();
          break;

        case 3:
          message.active = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      sid: isSet$1(object.sid) ? String(object.sid) : "",
      level: isSet$1(object.level) ? Number(object.level) : 0,
      active: isSet$1(object.active) ? Boolean(object.active) : false
    };
  },

  toJSON(message) {
    const obj = {};
    message.sid !== undefined && (obj.sid = message.sid);
    message.level !== undefined && (obj.level = message.level);
    message.active !== undefined && (obj.active = message.active);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseSpeakerInfo();
    message.sid = (_a = object.sid) !== null && _a !== void 0 ? _a : "";
    message.level = (_b = object.level) !== null && _b !== void 0 ? _b : 0;
    message.active = (_c = object.active) !== null && _c !== void 0 ? _c : false;
    return message;
  }

};

function createBaseUserPacket() {
  return {
    participantSid: "",
    payload: new Uint8Array(),
    destinationSids: []
  };
}

const UserPacket = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.participantSid !== "") {
      writer.uint32(10).string(message.participantSid);
    }

    if (message.payload.length !== 0) {
      writer.uint32(18).bytes(message.payload);
    }

    for (const v of message.destinationSids) {
      writer.uint32(26).string(v);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUserPacket();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.participantSid = reader.string();
          break;

        case 2:
          message.payload = reader.bytes();
          break;

        case 3:
          message.destinationSids.push(reader.string());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      participantSid: isSet$1(object.participantSid) ? String(object.participantSid) : "",
      payload: isSet$1(object.payload) ? bytesFromBase64(object.payload) : new Uint8Array(),
      destinationSids: Array.isArray(object === null || object === void 0 ? void 0 : object.destinationSids) ? object.destinationSids.map(e => String(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};
    message.participantSid !== undefined && (obj.participantSid = message.participantSid);
    message.payload !== undefined && (obj.payload = base64FromBytes(message.payload !== undefined ? message.payload : new Uint8Array()));

    if (message.destinationSids) {
      obj.destinationSids = message.destinationSids.map(e => e);
    } else {
      obj.destinationSids = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseUserPacket();
    message.participantSid = (_a = object.participantSid) !== null && _a !== void 0 ? _a : "";
    message.payload = (_b = object.payload) !== null && _b !== void 0 ? _b : new Uint8Array();
    message.destinationSids = ((_c = object.destinationSids) === null || _c === void 0 ? void 0 : _c.map(e => e)) || [];
    return message;
  }

};

function createBaseParticipantTracks() {
  return {
    participantSid: "",
    trackSids: []
  };
}

const ParticipantTracks = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.participantSid !== "") {
      writer.uint32(10).string(message.participantSid);
    }

    for (const v of message.trackSids) {
      writer.uint32(18).string(v);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseParticipantTracks();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.participantSid = reader.string();
          break;

        case 2:
          message.trackSids.push(reader.string());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      participantSid: isSet$1(object.participantSid) ? String(object.participantSid) : "",
      trackSids: Array.isArray(object === null || object === void 0 ? void 0 : object.trackSids) ? object.trackSids.map(e => String(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};
    message.participantSid !== undefined && (obj.participantSid = message.participantSid);

    if (message.trackSids) {
      obj.trackSids = message.trackSids.map(e => e);
    } else {
      obj.trackSids = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseParticipantTracks();
    message.participantSid = (_a = object.participantSid) !== null && _a !== void 0 ? _a : "";
    message.trackSids = ((_b = object.trackSids) === null || _b === void 0 ? void 0 : _b.map(e => e)) || [];
    return message;
  }

};

function createBaseServerInfo() {
  return {
    edition: 0,
    version: "",
    protocol: 0,
    region: "",
    nodeId: "",
    debugInfo: ""
  };
}

const ServerInfo = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.edition !== 0) {
      writer.uint32(8).int32(message.edition);
    }

    if (message.version !== "") {
      writer.uint32(18).string(message.version);
    }

    if (message.protocol !== 0) {
      writer.uint32(24).int32(message.protocol);
    }

    if (message.region !== "") {
      writer.uint32(34).string(message.region);
    }

    if (message.nodeId !== "") {
      writer.uint32(42).string(message.nodeId);
    }

    if (message.debugInfo !== "") {
      writer.uint32(50).string(message.debugInfo);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.edition = reader.int32();
          break;

        case 2:
          message.version = reader.string();
          break;

        case 3:
          message.protocol = reader.int32();
          break;

        case 4:
          message.region = reader.string();
          break;

        case 5:
          message.nodeId = reader.string();
          break;

        case 6:
          message.debugInfo = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      edition: isSet$1(object.edition) ? serverInfo_EditionFromJSON(object.edition) : 0,
      version: isSet$1(object.version) ? String(object.version) : "",
      protocol: isSet$1(object.protocol) ? Number(object.protocol) : 0,
      region: isSet$1(object.region) ? String(object.region) : "",
      nodeId: isSet$1(object.nodeId) ? String(object.nodeId) : "",
      debugInfo: isSet$1(object.debugInfo) ? String(object.debugInfo) : ""
    };
  },

  toJSON(message) {
    const obj = {};
    message.edition !== undefined && (obj.edition = serverInfo_EditionToJSON(message.edition));
    message.version !== undefined && (obj.version = message.version);
    message.protocol !== undefined && (obj.protocol = Math.round(message.protocol));
    message.region !== undefined && (obj.region = message.region);
    message.nodeId !== undefined && (obj.nodeId = message.nodeId);
    message.debugInfo !== undefined && (obj.debugInfo = message.debugInfo);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f;

    const message = createBaseServerInfo();
    message.edition = (_a = object.edition) !== null && _a !== void 0 ? _a : 0;
    message.version = (_b = object.version) !== null && _b !== void 0 ? _b : "";
    message.protocol = (_c = object.protocol) !== null && _c !== void 0 ? _c : 0;
    message.region = (_d = object.region) !== null && _d !== void 0 ? _d : "";
    message.nodeId = (_e = object.nodeId) !== null && _e !== void 0 ? _e : "";
    message.debugInfo = (_f = object.debugInfo) !== null && _f !== void 0 ? _f : "";
    return message;
  }

};

function createBaseClientInfo() {
  return {
    sdk: 0,
    version: "",
    protocol: 0,
    os: "",
    osVersion: "",
    deviceModel: "",
    browser: "",
    browserVersion: "",
    address: "",
    network: ""
  };
}

const ClientInfo = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.sdk !== 0) {
      writer.uint32(8).int32(message.sdk);
    }

    if (message.version !== "") {
      writer.uint32(18).string(message.version);
    }

    if (message.protocol !== 0) {
      writer.uint32(24).int32(message.protocol);
    }

    if (message.os !== "") {
      writer.uint32(34).string(message.os);
    }

    if (message.osVersion !== "") {
      writer.uint32(42).string(message.osVersion);
    }

    if (message.deviceModel !== "") {
      writer.uint32(50).string(message.deviceModel);
    }

    if (message.browser !== "") {
      writer.uint32(58).string(message.browser);
    }

    if (message.browserVersion !== "") {
      writer.uint32(66).string(message.browserVersion);
    }

    if (message.address !== "") {
      writer.uint32(74).string(message.address);
    }

    if (message.network !== "") {
      writer.uint32(82).string(message.network);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClientInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.sdk = reader.int32();
          break;

        case 2:
          message.version = reader.string();
          break;

        case 3:
          message.protocol = reader.int32();
          break;

        case 4:
          message.os = reader.string();
          break;

        case 5:
          message.osVersion = reader.string();
          break;

        case 6:
          message.deviceModel = reader.string();
          break;

        case 7:
          message.browser = reader.string();
          break;

        case 8:
          message.browserVersion = reader.string();
          break;

        case 9:
          message.address = reader.string();
          break;

        case 10:
          message.network = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      sdk: isSet$1(object.sdk) ? clientInfo_SDKFromJSON(object.sdk) : 0,
      version: isSet$1(object.version) ? String(object.version) : "",
      protocol: isSet$1(object.protocol) ? Number(object.protocol) : 0,
      os: isSet$1(object.os) ? String(object.os) : "",
      osVersion: isSet$1(object.osVersion) ? String(object.osVersion) : "",
      deviceModel: isSet$1(object.deviceModel) ? String(object.deviceModel) : "",
      browser: isSet$1(object.browser) ? String(object.browser) : "",
      browserVersion: isSet$1(object.browserVersion) ? String(object.browserVersion) : "",
      address: isSet$1(object.address) ? String(object.address) : "",
      network: isSet$1(object.network) ? String(object.network) : ""
    };
  },

  toJSON(message) {
    const obj = {};
    message.sdk !== undefined && (obj.sdk = clientInfo_SDKToJSON(message.sdk));
    message.version !== undefined && (obj.version = message.version);
    message.protocol !== undefined && (obj.protocol = Math.round(message.protocol));
    message.os !== undefined && (obj.os = message.os);
    message.osVersion !== undefined && (obj.osVersion = message.osVersion);
    message.deviceModel !== undefined && (obj.deviceModel = message.deviceModel);
    message.browser !== undefined && (obj.browser = message.browser);
    message.browserVersion !== undefined && (obj.browserVersion = message.browserVersion);
    message.address !== undefined && (obj.address = message.address);
    message.network !== undefined && (obj.network = message.network);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;

    const message = createBaseClientInfo();
    message.sdk = (_a = object.sdk) !== null && _a !== void 0 ? _a : 0;
    message.version = (_b = object.version) !== null && _b !== void 0 ? _b : "";
    message.protocol = (_c = object.protocol) !== null && _c !== void 0 ? _c : 0;
    message.os = (_d = object.os) !== null && _d !== void 0 ? _d : "";
    message.osVersion = (_e = object.osVersion) !== null && _e !== void 0 ? _e : "";
    message.deviceModel = (_f = object.deviceModel) !== null && _f !== void 0 ? _f : "";
    message.browser = (_g = object.browser) !== null && _g !== void 0 ? _g : "";
    message.browserVersion = (_h = object.browserVersion) !== null && _h !== void 0 ? _h : "";
    message.address = (_j = object.address) !== null && _j !== void 0 ? _j : "";
    message.network = (_k = object.network) !== null && _k !== void 0 ? _k : "";
    return message;
  }

};

function createBaseClientConfiguration() {
  return {
    video: undefined,
    screen: undefined,
    resumeConnection: 0,
    disabledCodecs: undefined,
    forceRelay: 0
  };
}

const ClientConfiguration = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.video !== undefined) {
      VideoConfiguration.encode(message.video, writer.uint32(10).fork()).ldelim();
    }

    if (message.screen !== undefined) {
      VideoConfiguration.encode(message.screen, writer.uint32(18).fork()).ldelim();
    }

    if (message.resumeConnection !== 0) {
      writer.uint32(24).int32(message.resumeConnection);
    }

    if (message.disabledCodecs !== undefined) {
      DisabledCodecs.encode(message.disabledCodecs, writer.uint32(34).fork()).ldelim();
    }

    if (message.forceRelay !== 0) {
      writer.uint32(40).int32(message.forceRelay);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClientConfiguration();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.video = VideoConfiguration.decode(reader, reader.uint32());
          break;

        case 2:
          message.screen = VideoConfiguration.decode(reader, reader.uint32());
          break;

        case 3:
          message.resumeConnection = reader.int32();
          break;

        case 4:
          message.disabledCodecs = DisabledCodecs.decode(reader, reader.uint32());
          break;

        case 5:
          message.forceRelay = reader.int32();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      video: isSet$1(object.video) ? VideoConfiguration.fromJSON(object.video) : undefined,
      screen: isSet$1(object.screen) ? VideoConfiguration.fromJSON(object.screen) : undefined,
      resumeConnection: isSet$1(object.resumeConnection) ? clientConfigSettingFromJSON(object.resumeConnection) : 0,
      disabledCodecs: isSet$1(object.disabledCodecs) ? DisabledCodecs.fromJSON(object.disabledCodecs) : undefined,
      forceRelay: isSet$1(object.forceRelay) ? clientConfigSettingFromJSON(object.forceRelay) : 0
    };
  },

  toJSON(message) {
    const obj = {};
    message.video !== undefined && (obj.video = message.video ? VideoConfiguration.toJSON(message.video) : undefined);
    message.screen !== undefined && (obj.screen = message.screen ? VideoConfiguration.toJSON(message.screen) : undefined);
    message.resumeConnection !== undefined && (obj.resumeConnection = clientConfigSettingToJSON(message.resumeConnection));
    message.disabledCodecs !== undefined && (obj.disabledCodecs = message.disabledCodecs ? DisabledCodecs.toJSON(message.disabledCodecs) : undefined);
    message.forceRelay !== undefined && (obj.forceRelay = clientConfigSettingToJSON(message.forceRelay));
    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseClientConfiguration();
    message.video = object.video !== undefined && object.video !== null ? VideoConfiguration.fromPartial(object.video) : undefined;
    message.screen = object.screen !== undefined && object.screen !== null ? VideoConfiguration.fromPartial(object.screen) : undefined;
    message.resumeConnection = (_a = object.resumeConnection) !== null && _a !== void 0 ? _a : 0;
    message.disabledCodecs = object.disabledCodecs !== undefined && object.disabledCodecs !== null ? DisabledCodecs.fromPartial(object.disabledCodecs) : undefined;
    message.forceRelay = (_b = object.forceRelay) !== null && _b !== void 0 ? _b : 0;
    return message;
  }

};

function createBaseVideoConfiguration() {
  return {
    hardwareEncoder: 0
  };
}

const VideoConfiguration = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.hardwareEncoder !== 0) {
      writer.uint32(8).int32(message.hardwareEncoder);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVideoConfiguration();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.hardwareEncoder = reader.int32();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      hardwareEncoder: isSet$1(object.hardwareEncoder) ? clientConfigSettingFromJSON(object.hardwareEncoder) : 0
    };
  },

  toJSON(message) {
    const obj = {};
    message.hardwareEncoder !== undefined && (obj.hardwareEncoder = clientConfigSettingToJSON(message.hardwareEncoder));
    return obj;
  },

  fromPartial(object) {
    var _a;

    const message = createBaseVideoConfiguration();
    message.hardwareEncoder = (_a = object.hardwareEncoder) !== null && _a !== void 0 ? _a : 0;
    return message;
  }

};

function createBaseDisabledCodecs() {
  return {
    codecs: []
  };
}

const DisabledCodecs = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    for (const v of message.codecs) {
      Codec.encode(v, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDisabledCodecs();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.codecs.push(Codec.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      codecs: Array.isArray(object === null || object === void 0 ? void 0 : object.codecs) ? object.codecs.map(e => Codec.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};

    if (message.codecs) {
      obj.codecs = message.codecs.map(e => e ? Codec.toJSON(e) : undefined);
    } else {
      obj.codecs = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a;

    const message = createBaseDisabledCodecs();
    message.codecs = ((_a = object.codecs) === null || _a === void 0 ? void 0 : _a.map(e => Codec.fromPartial(e))) || [];
    return message;
  }

};

var globalThis$2 = (() => {
  if (typeof globalThis$2 !== "undefined") {
    return globalThis$2;
  }

  if (typeof self !== "undefined") {
    return self;
  }

  if (typeof window !== "undefined") {
    return window;
  }

  if (typeof global !== "undefined") {
    return global;
  }

  throw "Unable to locate global object";
})();

function bytesFromBase64(b64) {
  if (globalThis$2.Buffer) {
    return Uint8Array.from(globalThis$2.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis$2.atob(b64);
    const arr = new Uint8Array(bin.length);

    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }

    return arr;
  }
}

function base64FromBytes(arr) {
  if (globalThis$2.Buffer) {
    return globalThis$2.Buffer.from(arr).toString("base64");
  } else {
    const bin = [];
    arr.forEach(byte => {
      bin.push(String.fromCharCode(byte));
    });
    return globalThis$2.btoa(bin.join(""));
  }
}

function longToNumber$1(long) {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new globalThis$2.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }

  return long.toNumber();
}

if (_m0.util.Long !== long) {
  _m0.util.Long = long;

  _m0.configure();
}

function isSet$1(value) {
  return value !== null && value !== undefined;
}

function _asyncIterator(iterable) {
  var method,
      async,
      sync,
      retry = 2;

  for ("undefined" != typeof Symbol && (async = Symbol.asyncIterator, sync = Symbol.iterator); retry--;) {
    if (async && null != (method = iterable[async])) return method.call(iterable);
    if (sync && null != (method = iterable[sync])) return new AsyncFromSyncIterator(method.call(iterable));
    async = "@@asyncIterator", sync = "@@iterator";
  }

  throw new TypeError("Object is not async iterable");
}

function AsyncFromSyncIterator(s) {
  function AsyncFromSyncIteratorContinuation(r) {
    if (Object(r) !== r) return Promise.reject(new TypeError(r + " is not an object."));
    var done = r.done;
    return Promise.resolve(r.value).then(function (value) {
      return {
        value: value,
        done: done
      };
    });
  }

  return AsyncFromSyncIterator = function (s) {
    this.s = s, this.n = s.next;
  }, AsyncFromSyncIterator.prototype = {
    s: null,
    n: null,
    next: function () {
      return AsyncFromSyncIteratorContinuation(this.n.apply(this.s, arguments));
    },
    return: function (value) {
      var ret = this.s.return;
      return void 0 === ret ? Promise.resolve({
        value: value,
        done: !0
      }) : AsyncFromSyncIteratorContinuation(ret.apply(this.s, arguments));
    },
    throw: function (value) {
      var thr = this.s.return;
      return void 0 === thr ? Promise.reject(value) : AsyncFromSyncIteratorContinuation(thr.apply(this.s, arguments));
    }
  }, new AsyncFromSyncIterator(s);
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

/* eslint-disable */
var SignalTarget;

(function (SignalTarget) {
  SignalTarget[SignalTarget["PUBLISHER"] = 0] = "PUBLISHER";
  SignalTarget[SignalTarget["SUBSCRIBER"] = 1] = "SUBSCRIBER";
  SignalTarget[SignalTarget["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(SignalTarget || (SignalTarget = {}));

function signalTargetFromJSON(object) {
  switch (object) {
    case 0:
    case "PUBLISHER":
      return SignalTarget.PUBLISHER;

    case 1:
    case "SUBSCRIBER":
      return SignalTarget.SUBSCRIBER;

    case -1:
    case "UNRECOGNIZED":
    default:
      return SignalTarget.UNRECOGNIZED;
  }
}
function signalTargetToJSON(object) {
  switch (object) {
    case SignalTarget.PUBLISHER:
      return "PUBLISHER";

    case SignalTarget.SUBSCRIBER:
      return "SUBSCRIBER";

    case SignalTarget.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var StreamState;

(function (StreamState) {
  StreamState[StreamState["ACTIVE"] = 0] = "ACTIVE";
  StreamState[StreamState["PAUSED"] = 1] = "PAUSED";
  StreamState[StreamState["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(StreamState || (StreamState = {}));

function streamStateFromJSON(object) {
  switch (object) {
    case 0:
    case "ACTIVE":
      return StreamState.ACTIVE;

    case 1:
    case "PAUSED":
      return StreamState.PAUSED;

    case -1:
    case "UNRECOGNIZED":
    default:
      return StreamState.UNRECOGNIZED;
  }
}
function streamStateToJSON(object) {
  switch (object) {
    case StreamState.ACTIVE:
      return "ACTIVE";

    case StreamState.PAUSED:
      return "PAUSED";

    case StreamState.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}
var CandidateProtocol;

(function (CandidateProtocol) {
  CandidateProtocol[CandidateProtocol["UDP"] = 0] = "UDP";
  CandidateProtocol[CandidateProtocol["TCP"] = 1] = "TCP";
  CandidateProtocol[CandidateProtocol["TLS"] = 2] = "TLS";
  CandidateProtocol[CandidateProtocol["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(CandidateProtocol || (CandidateProtocol = {}));

function candidateProtocolFromJSON(object) {
  switch (object) {
    case 0:
    case "UDP":
      return CandidateProtocol.UDP;

    case 1:
    case "TCP":
      return CandidateProtocol.TCP;

    case 2:
    case "TLS":
      return CandidateProtocol.TLS;

    case -1:
    case "UNRECOGNIZED":
    default:
      return CandidateProtocol.UNRECOGNIZED;
  }
}
function candidateProtocolToJSON(object) {
  switch (object) {
    case CandidateProtocol.UDP:
      return "UDP";

    case CandidateProtocol.TCP:
      return "TCP";

    case CandidateProtocol.TLS:
      return "TLS";

    case CandidateProtocol.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

function createBaseSignalRequest() {
  return {
    message: undefined
  };
}

const SignalRequest = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;

    if (((_a = message.message) === null || _a === void 0 ? void 0 : _a.$case) === "offer") {
      SessionDescription.encode(message.message.offer, writer.uint32(10).fork()).ldelim();
    }

    if (((_b = message.message) === null || _b === void 0 ? void 0 : _b.$case) === "answer") {
      SessionDescription.encode(message.message.answer, writer.uint32(18).fork()).ldelim();
    }

    if (((_c = message.message) === null || _c === void 0 ? void 0 : _c.$case) === "trickle") {
      TrickleRequest.encode(message.message.trickle, writer.uint32(26).fork()).ldelim();
    }

    if (((_d = message.message) === null || _d === void 0 ? void 0 : _d.$case) === "addTrack") {
      AddTrackRequest.encode(message.message.addTrack, writer.uint32(34).fork()).ldelim();
    }

    if (((_e = message.message) === null || _e === void 0 ? void 0 : _e.$case) === "mute") {
      MuteTrackRequest.encode(message.message.mute, writer.uint32(42).fork()).ldelim();
    }

    if (((_f = message.message) === null || _f === void 0 ? void 0 : _f.$case) === "subscription") {
      UpdateSubscription.encode(message.message.subscription, writer.uint32(50).fork()).ldelim();
    }

    if (((_g = message.message) === null || _g === void 0 ? void 0 : _g.$case) === "trackSetting") {
      UpdateTrackSettings.encode(message.message.trackSetting, writer.uint32(58).fork()).ldelim();
    }

    if (((_h = message.message) === null || _h === void 0 ? void 0 : _h.$case) === "leave") {
      LeaveRequest.encode(message.message.leave, writer.uint32(66).fork()).ldelim();
    }

    if (((_j = message.message) === null || _j === void 0 ? void 0 : _j.$case) === "updateLayers") {
      UpdateVideoLayers.encode(message.message.updateLayers, writer.uint32(82).fork()).ldelim();
    }

    if (((_k = message.message) === null || _k === void 0 ? void 0 : _k.$case) === "subscriptionPermission") {
      SubscriptionPermission.encode(message.message.subscriptionPermission, writer.uint32(90).fork()).ldelim();
    }

    if (((_l = message.message) === null || _l === void 0 ? void 0 : _l.$case) === "syncState") {
      SyncState.encode(message.message.syncState, writer.uint32(98).fork()).ldelim();
    }

    if (((_m = message.message) === null || _m === void 0 ? void 0 : _m.$case) === "simulate") {
      SimulateScenario.encode(message.message.simulate, writer.uint32(106).fork()).ldelim();
    }

    if (((_o = message.message) === null || _o === void 0 ? void 0 : _o.$case) === "ping") {
      writer.uint32(112).int64(message.message.ping);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignalRequest();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.message = {
            $case: "offer",
            offer: SessionDescription.decode(reader, reader.uint32())
          };
          break;

        case 2:
          message.message = {
            $case: "answer",
            answer: SessionDescription.decode(reader, reader.uint32())
          };
          break;

        case 3:
          message.message = {
            $case: "trickle",
            trickle: TrickleRequest.decode(reader, reader.uint32())
          };
          break;

        case 4:
          message.message = {
            $case: "addTrack",
            addTrack: AddTrackRequest.decode(reader, reader.uint32())
          };
          break;

        case 5:
          message.message = {
            $case: "mute",
            mute: MuteTrackRequest.decode(reader, reader.uint32())
          };
          break;

        case 6:
          message.message = {
            $case: "subscription",
            subscription: UpdateSubscription.decode(reader, reader.uint32())
          };
          break;

        case 7:
          message.message = {
            $case: "trackSetting",
            trackSetting: UpdateTrackSettings.decode(reader, reader.uint32())
          };
          break;

        case 8:
          message.message = {
            $case: "leave",
            leave: LeaveRequest.decode(reader, reader.uint32())
          };
          break;

        case 10:
          message.message = {
            $case: "updateLayers",
            updateLayers: UpdateVideoLayers.decode(reader, reader.uint32())
          };
          break;

        case 11:
          message.message = {
            $case: "subscriptionPermission",
            subscriptionPermission: SubscriptionPermission.decode(reader, reader.uint32())
          };
          break;

        case 12:
          message.message = {
            $case: "syncState",
            syncState: SyncState.decode(reader, reader.uint32())
          };
          break;

        case 13:
          message.message = {
            $case: "simulate",
            simulate: SimulateScenario.decode(reader, reader.uint32())
          };
          break;

        case 14:
          message.message = {
            $case: "ping",
            ping: longToNumber(reader.int64())
          };
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      message: isSet(object.offer) ? {
        $case: "offer",
        offer: SessionDescription.fromJSON(object.offer)
      } : isSet(object.answer) ? {
        $case: "answer",
        answer: SessionDescription.fromJSON(object.answer)
      } : isSet(object.trickle) ? {
        $case: "trickle",
        trickle: TrickleRequest.fromJSON(object.trickle)
      } : isSet(object.addTrack) ? {
        $case: "addTrack",
        addTrack: AddTrackRequest.fromJSON(object.addTrack)
      } : isSet(object.mute) ? {
        $case: "mute",
        mute: MuteTrackRequest.fromJSON(object.mute)
      } : isSet(object.subscription) ? {
        $case: "subscription",
        subscription: UpdateSubscription.fromJSON(object.subscription)
      } : isSet(object.trackSetting) ? {
        $case: "trackSetting",
        trackSetting: UpdateTrackSettings.fromJSON(object.trackSetting)
      } : isSet(object.leave) ? {
        $case: "leave",
        leave: LeaveRequest.fromJSON(object.leave)
      } : isSet(object.updateLayers) ? {
        $case: "updateLayers",
        updateLayers: UpdateVideoLayers.fromJSON(object.updateLayers)
      } : isSet(object.subscriptionPermission) ? {
        $case: "subscriptionPermission",
        subscriptionPermission: SubscriptionPermission.fromJSON(object.subscriptionPermission)
      } : isSet(object.syncState) ? {
        $case: "syncState",
        syncState: SyncState.fromJSON(object.syncState)
      } : isSet(object.simulate) ? {
        $case: "simulate",
        simulate: SimulateScenario.fromJSON(object.simulate)
      } : isSet(object.ping) ? {
        $case: "ping",
        ping: Number(object.ping)
      } : undefined
    };
  },

  toJSON(message) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13;

    const obj = {};
    ((_a = message.message) === null || _a === void 0 ? void 0 : _a.$case) === "offer" && (obj.offer = ((_b = message.message) === null || _b === void 0 ? void 0 : _b.offer) ? SessionDescription.toJSON((_c = message.message) === null || _c === void 0 ? void 0 : _c.offer) : undefined);
    ((_d = message.message) === null || _d === void 0 ? void 0 : _d.$case) === "answer" && (obj.answer = ((_e = message.message) === null || _e === void 0 ? void 0 : _e.answer) ? SessionDescription.toJSON((_f = message.message) === null || _f === void 0 ? void 0 : _f.answer) : undefined);
    ((_g = message.message) === null || _g === void 0 ? void 0 : _g.$case) === "trickle" && (obj.trickle = ((_h = message.message) === null || _h === void 0 ? void 0 : _h.trickle) ? TrickleRequest.toJSON((_j = message.message) === null || _j === void 0 ? void 0 : _j.trickle) : undefined);
    ((_k = message.message) === null || _k === void 0 ? void 0 : _k.$case) === "addTrack" && (obj.addTrack = ((_l = message.message) === null || _l === void 0 ? void 0 : _l.addTrack) ? AddTrackRequest.toJSON((_m = message.message) === null || _m === void 0 ? void 0 : _m.addTrack) : undefined);
    ((_o = message.message) === null || _o === void 0 ? void 0 : _o.$case) === "mute" && (obj.mute = ((_p = message.message) === null || _p === void 0 ? void 0 : _p.mute) ? MuteTrackRequest.toJSON((_q = message.message) === null || _q === void 0 ? void 0 : _q.mute) : undefined);
    ((_r = message.message) === null || _r === void 0 ? void 0 : _r.$case) === "subscription" && (obj.subscription = ((_s = message.message) === null || _s === void 0 ? void 0 : _s.subscription) ? UpdateSubscription.toJSON((_t = message.message) === null || _t === void 0 ? void 0 : _t.subscription) : undefined);
    ((_u = message.message) === null || _u === void 0 ? void 0 : _u.$case) === "trackSetting" && (obj.trackSetting = ((_v = message.message) === null || _v === void 0 ? void 0 : _v.trackSetting) ? UpdateTrackSettings.toJSON((_w = message.message) === null || _w === void 0 ? void 0 : _w.trackSetting) : undefined);
    ((_x = message.message) === null || _x === void 0 ? void 0 : _x.$case) === "leave" && (obj.leave = ((_y = message.message) === null || _y === void 0 ? void 0 : _y.leave) ? LeaveRequest.toJSON((_z = message.message) === null || _z === void 0 ? void 0 : _z.leave) : undefined);
    ((_0 = message.message) === null || _0 === void 0 ? void 0 : _0.$case) === "updateLayers" && (obj.updateLayers = ((_1 = message.message) === null || _1 === void 0 ? void 0 : _1.updateLayers) ? UpdateVideoLayers.toJSON((_2 = message.message) === null || _2 === void 0 ? void 0 : _2.updateLayers) : undefined);
    ((_3 = message.message) === null || _3 === void 0 ? void 0 : _3.$case) === "subscriptionPermission" && (obj.subscriptionPermission = ((_4 = message.message) === null || _4 === void 0 ? void 0 : _4.subscriptionPermission) ? SubscriptionPermission.toJSON((_5 = message.message) === null || _5 === void 0 ? void 0 : _5.subscriptionPermission) : undefined);
    ((_6 = message.message) === null || _6 === void 0 ? void 0 : _6.$case) === "syncState" && (obj.syncState = ((_7 = message.message) === null || _7 === void 0 ? void 0 : _7.syncState) ? SyncState.toJSON((_8 = message.message) === null || _8 === void 0 ? void 0 : _8.syncState) : undefined);
    ((_9 = message.message) === null || _9 === void 0 ? void 0 : _9.$case) === "simulate" && (obj.simulate = ((_10 = message.message) === null || _10 === void 0 ? void 0 : _10.simulate) ? SimulateScenario.toJSON((_11 = message.message) === null || _11 === void 0 ? void 0 : _11.simulate) : undefined);
    ((_12 = message.message) === null || _12 === void 0 ? void 0 : _12.$case) === "ping" && (obj.ping = Math.round((_13 = message.message) === null || _13 === void 0 ? void 0 : _13.ping));
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14;

    const message = createBaseSignalRequest();

    if (((_a = object.message) === null || _a === void 0 ? void 0 : _a.$case) === "offer" && ((_b = object.message) === null || _b === void 0 ? void 0 : _b.offer) !== undefined && ((_c = object.message) === null || _c === void 0 ? void 0 : _c.offer) !== null) {
      message.message = {
        $case: "offer",
        offer: SessionDescription.fromPartial(object.message.offer)
      };
    }

    if (((_d = object.message) === null || _d === void 0 ? void 0 : _d.$case) === "answer" && ((_e = object.message) === null || _e === void 0 ? void 0 : _e.answer) !== undefined && ((_f = object.message) === null || _f === void 0 ? void 0 : _f.answer) !== null) {
      message.message = {
        $case: "answer",
        answer: SessionDescription.fromPartial(object.message.answer)
      };
    }

    if (((_g = object.message) === null || _g === void 0 ? void 0 : _g.$case) === "trickle" && ((_h = object.message) === null || _h === void 0 ? void 0 : _h.trickle) !== undefined && ((_j = object.message) === null || _j === void 0 ? void 0 : _j.trickle) !== null) {
      message.message = {
        $case: "trickle",
        trickle: TrickleRequest.fromPartial(object.message.trickle)
      };
    }

    if (((_k = object.message) === null || _k === void 0 ? void 0 : _k.$case) === "addTrack" && ((_l = object.message) === null || _l === void 0 ? void 0 : _l.addTrack) !== undefined && ((_m = object.message) === null || _m === void 0 ? void 0 : _m.addTrack) !== null) {
      message.message = {
        $case: "addTrack",
        addTrack: AddTrackRequest.fromPartial(object.message.addTrack)
      };
    }

    if (((_o = object.message) === null || _o === void 0 ? void 0 : _o.$case) === "mute" && ((_p = object.message) === null || _p === void 0 ? void 0 : _p.mute) !== undefined && ((_q = object.message) === null || _q === void 0 ? void 0 : _q.mute) !== null) {
      message.message = {
        $case: "mute",
        mute: MuteTrackRequest.fromPartial(object.message.mute)
      };
    }

    if (((_r = object.message) === null || _r === void 0 ? void 0 : _r.$case) === "subscription" && ((_s = object.message) === null || _s === void 0 ? void 0 : _s.subscription) !== undefined && ((_t = object.message) === null || _t === void 0 ? void 0 : _t.subscription) !== null) {
      message.message = {
        $case: "subscription",
        subscription: UpdateSubscription.fromPartial(object.message.subscription)
      };
    }

    if (((_u = object.message) === null || _u === void 0 ? void 0 : _u.$case) === "trackSetting" && ((_v = object.message) === null || _v === void 0 ? void 0 : _v.trackSetting) !== undefined && ((_w = object.message) === null || _w === void 0 ? void 0 : _w.trackSetting) !== null) {
      message.message = {
        $case: "trackSetting",
        trackSetting: UpdateTrackSettings.fromPartial(object.message.trackSetting)
      };
    }

    if (((_x = object.message) === null || _x === void 0 ? void 0 : _x.$case) === "leave" && ((_y = object.message) === null || _y === void 0 ? void 0 : _y.leave) !== undefined && ((_z = object.message) === null || _z === void 0 ? void 0 : _z.leave) !== null) {
      message.message = {
        $case: "leave",
        leave: LeaveRequest.fromPartial(object.message.leave)
      };
    }

    if (((_0 = object.message) === null || _0 === void 0 ? void 0 : _0.$case) === "updateLayers" && ((_1 = object.message) === null || _1 === void 0 ? void 0 : _1.updateLayers) !== undefined && ((_2 = object.message) === null || _2 === void 0 ? void 0 : _2.updateLayers) !== null) {
      message.message = {
        $case: "updateLayers",
        updateLayers: UpdateVideoLayers.fromPartial(object.message.updateLayers)
      };
    }

    if (((_3 = object.message) === null || _3 === void 0 ? void 0 : _3.$case) === "subscriptionPermission" && ((_4 = object.message) === null || _4 === void 0 ? void 0 : _4.subscriptionPermission) !== undefined && ((_5 = object.message) === null || _5 === void 0 ? void 0 : _5.subscriptionPermission) !== null) {
      message.message = {
        $case: "subscriptionPermission",
        subscriptionPermission: SubscriptionPermission.fromPartial(object.message.subscriptionPermission)
      };
    }

    if (((_6 = object.message) === null || _6 === void 0 ? void 0 : _6.$case) === "syncState" && ((_7 = object.message) === null || _7 === void 0 ? void 0 : _7.syncState) !== undefined && ((_8 = object.message) === null || _8 === void 0 ? void 0 : _8.syncState) !== null) {
      message.message = {
        $case: "syncState",
        syncState: SyncState.fromPartial(object.message.syncState)
      };
    }

    if (((_9 = object.message) === null || _9 === void 0 ? void 0 : _9.$case) === "simulate" && ((_10 = object.message) === null || _10 === void 0 ? void 0 : _10.simulate) !== undefined && ((_11 = object.message) === null || _11 === void 0 ? void 0 : _11.simulate) !== null) {
      message.message = {
        $case: "simulate",
        simulate: SimulateScenario.fromPartial(object.message.simulate)
      };
    }

    if (((_12 = object.message) === null || _12 === void 0 ? void 0 : _12.$case) === "ping" && ((_13 = object.message) === null || _13 === void 0 ? void 0 : _13.ping) !== undefined && ((_14 = object.message) === null || _14 === void 0 ? void 0 : _14.ping) !== null) {
      message.message = {
        $case: "ping",
        ping: object.message.ping
      };
    }

    return message;
  }

};

function createBaseSignalResponse() {
  return {
    message: undefined
  };
}

const SignalResponse = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;

    if (((_a = message.message) === null || _a === void 0 ? void 0 : _a.$case) === "join") {
      JoinResponse.encode(message.message.join, writer.uint32(10).fork()).ldelim();
    }

    if (((_b = message.message) === null || _b === void 0 ? void 0 : _b.$case) === "answer") {
      SessionDescription.encode(message.message.answer, writer.uint32(18).fork()).ldelim();
    }

    if (((_c = message.message) === null || _c === void 0 ? void 0 : _c.$case) === "offer") {
      SessionDescription.encode(message.message.offer, writer.uint32(26).fork()).ldelim();
    }

    if (((_d = message.message) === null || _d === void 0 ? void 0 : _d.$case) === "trickle") {
      TrickleRequest.encode(message.message.trickle, writer.uint32(34).fork()).ldelim();
    }

    if (((_e = message.message) === null || _e === void 0 ? void 0 : _e.$case) === "update") {
      ParticipantUpdate.encode(message.message.update, writer.uint32(42).fork()).ldelim();
    }

    if (((_f = message.message) === null || _f === void 0 ? void 0 : _f.$case) === "trackPublished") {
      TrackPublishedResponse.encode(message.message.trackPublished, writer.uint32(50).fork()).ldelim();
    }

    if (((_g = message.message) === null || _g === void 0 ? void 0 : _g.$case) === "leave") {
      LeaveRequest.encode(message.message.leave, writer.uint32(66).fork()).ldelim();
    }

    if (((_h = message.message) === null || _h === void 0 ? void 0 : _h.$case) === "mute") {
      MuteTrackRequest.encode(message.message.mute, writer.uint32(74).fork()).ldelim();
    }

    if (((_j = message.message) === null || _j === void 0 ? void 0 : _j.$case) === "speakersChanged") {
      SpeakersChanged.encode(message.message.speakersChanged, writer.uint32(82).fork()).ldelim();
    }

    if (((_k = message.message) === null || _k === void 0 ? void 0 : _k.$case) === "roomUpdate") {
      RoomUpdate.encode(message.message.roomUpdate, writer.uint32(90).fork()).ldelim();
    }

    if (((_l = message.message) === null || _l === void 0 ? void 0 : _l.$case) === "connectionQuality") {
      ConnectionQualityUpdate.encode(message.message.connectionQuality, writer.uint32(98).fork()).ldelim();
    }

    if (((_m = message.message) === null || _m === void 0 ? void 0 : _m.$case) === "streamStateUpdate") {
      StreamStateUpdate.encode(message.message.streamStateUpdate, writer.uint32(106).fork()).ldelim();
    }

    if (((_o = message.message) === null || _o === void 0 ? void 0 : _o.$case) === "subscribedQualityUpdate") {
      SubscribedQualityUpdate.encode(message.message.subscribedQualityUpdate, writer.uint32(114).fork()).ldelim();
    }

    if (((_p = message.message) === null || _p === void 0 ? void 0 : _p.$case) === "subscriptionPermissionUpdate") {
      SubscriptionPermissionUpdate.encode(message.message.subscriptionPermissionUpdate, writer.uint32(122).fork()).ldelim();
    }

    if (((_q = message.message) === null || _q === void 0 ? void 0 : _q.$case) === "refreshToken") {
      writer.uint32(130).string(message.message.refreshToken);
    }

    if (((_r = message.message) === null || _r === void 0 ? void 0 : _r.$case) === "trackUnpublished") {
      TrackUnpublishedResponse.encode(message.message.trackUnpublished, writer.uint32(138).fork()).ldelim();
    }

    if (((_s = message.message) === null || _s === void 0 ? void 0 : _s.$case) === "pong") {
      writer.uint32(144).int64(message.message.pong);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignalResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.message = {
            $case: "join",
            join: JoinResponse.decode(reader, reader.uint32())
          };
          break;

        case 2:
          message.message = {
            $case: "answer",
            answer: SessionDescription.decode(reader, reader.uint32())
          };
          break;

        case 3:
          message.message = {
            $case: "offer",
            offer: SessionDescription.decode(reader, reader.uint32())
          };
          break;

        case 4:
          message.message = {
            $case: "trickle",
            trickle: TrickleRequest.decode(reader, reader.uint32())
          };
          break;

        case 5:
          message.message = {
            $case: "update",
            update: ParticipantUpdate.decode(reader, reader.uint32())
          };
          break;

        case 6:
          message.message = {
            $case: "trackPublished",
            trackPublished: TrackPublishedResponse.decode(reader, reader.uint32())
          };
          break;

        case 8:
          message.message = {
            $case: "leave",
            leave: LeaveRequest.decode(reader, reader.uint32())
          };
          break;

        case 9:
          message.message = {
            $case: "mute",
            mute: MuteTrackRequest.decode(reader, reader.uint32())
          };
          break;

        case 10:
          message.message = {
            $case: "speakersChanged",
            speakersChanged: SpeakersChanged.decode(reader, reader.uint32())
          };
          break;

        case 11:
          message.message = {
            $case: "roomUpdate",
            roomUpdate: RoomUpdate.decode(reader, reader.uint32())
          };
          break;

        case 12:
          message.message = {
            $case: "connectionQuality",
            connectionQuality: ConnectionQualityUpdate.decode(reader, reader.uint32())
          };
          break;

        case 13:
          message.message = {
            $case: "streamStateUpdate",
            streamStateUpdate: StreamStateUpdate.decode(reader, reader.uint32())
          };
          break;

        case 14:
          message.message = {
            $case: "subscribedQualityUpdate",
            subscribedQualityUpdate: SubscribedQualityUpdate.decode(reader, reader.uint32())
          };
          break;

        case 15:
          message.message = {
            $case: "subscriptionPermissionUpdate",
            subscriptionPermissionUpdate: SubscriptionPermissionUpdate.decode(reader, reader.uint32())
          };
          break;

        case 16:
          message.message = {
            $case: "refreshToken",
            refreshToken: reader.string()
          };
          break;

        case 17:
          message.message = {
            $case: "trackUnpublished",
            trackUnpublished: TrackUnpublishedResponse.decode(reader, reader.uint32())
          };
          break;

        case 18:
          message.message = {
            $case: "pong",
            pong: longToNumber(reader.int64())
          };
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      message: isSet(object.join) ? {
        $case: "join",
        join: JoinResponse.fromJSON(object.join)
      } : isSet(object.answer) ? {
        $case: "answer",
        answer: SessionDescription.fromJSON(object.answer)
      } : isSet(object.offer) ? {
        $case: "offer",
        offer: SessionDescription.fromJSON(object.offer)
      } : isSet(object.trickle) ? {
        $case: "trickle",
        trickle: TrickleRequest.fromJSON(object.trickle)
      } : isSet(object.update) ? {
        $case: "update",
        update: ParticipantUpdate.fromJSON(object.update)
      } : isSet(object.trackPublished) ? {
        $case: "trackPublished",
        trackPublished: TrackPublishedResponse.fromJSON(object.trackPublished)
      } : isSet(object.leave) ? {
        $case: "leave",
        leave: LeaveRequest.fromJSON(object.leave)
      } : isSet(object.mute) ? {
        $case: "mute",
        mute: MuteTrackRequest.fromJSON(object.mute)
      } : isSet(object.speakersChanged) ? {
        $case: "speakersChanged",
        speakersChanged: SpeakersChanged.fromJSON(object.speakersChanged)
      } : isSet(object.roomUpdate) ? {
        $case: "roomUpdate",
        roomUpdate: RoomUpdate.fromJSON(object.roomUpdate)
      } : isSet(object.connectionQuality) ? {
        $case: "connectionQuality",
        connectionQuality: ConnectionQualityUpdate.fromJSON(object.connectionQuality)
      } : isSet(object.streamStateUpdate) ? {
        $case: "streamStateUpdate",
        streamStateUpdate: StreamStateUpdate.fromJSON(object.streamStateUpdate)
      } : isSet(object.subscribedQualityUpdate) ? {
        $case: "subscribedQualityUpdate",
        subscribedQualityUpdate: SubscribedQualityUpdate.fromJSON(object.subscribedQualityUpdate)
      } : isSet(object.subscriptionPermissionUpdate) ? {
        $case: "subscriptionPermissionUpdate",
        subscriptionPermissionUpdate: SubscriptionPermissionUpdate.fromJSON(object.subscriptionPermissionUpdate)
      } : isSet(object.refreshToken) ? {
        $case: "refreshToken",
        refreshToken: String(object.refreshToken)
      } : isSet(object.trackUnpublished) ? {
        $case: "trackUnpublished",
        trackUnpublished: TrackUnpublishedResponse.fromJSON(object.trackUnpublished)
      } : isSet(object.pong) ? {
        $case: "pong",
        pong: Number(object.pong)
      } : undefined
    };
  },

  toJSON(message) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24;

    const obj = {};
    ((_a = message.message) === null || _a === void 0 ? void 0 : _a.$case) === "join" && (obj.join = ((_b = message.message) === null || _b === void 0 ? void 0 : _b.join) ? JoinResponse.toJSON((_c = message.message) === null || _c === void 0 ? void 0 : _c.join) : undefined);
    ((_d = message.message) === null || _d === void 0 ? void 0 : _d.$case) === "answer" && (obj.answer = ((_e = message.message) === null || _e === void 0 ? void 0 : _e.answer) ? SessionDescription.toJSON((_f = message.message) === null || _f === void 0 ? void 0 : _f.answer) : undefined);
    ((_g = message.message) === null || _g === void 0 ? void 0 : _g.$case) === "offer" && (obj.offer = ((_h = message.message) === null || _h === void 0 ? void 0 : _h.offer) ? SessionDescription.toJSON((_j = message.message) === null || _j === void 0 ? void 0 : _j.offer) : undefined);
    ((_k = message.message) === null || _k === void 0 ? void 0 : _k.$case) === "trickle" && (obj.trickle = ((_l = message.message) === null || _l === void 0 ? void 0 : _l.trickle) ? TrickleRequest.toJSON((_m = message.message) === null || _m === void 0 ? void 0 : _m.trickle) : undefined);
    ((_o = message.message) === null || _o === void 0 ? void 0 : _o.$case) === "update" && (obj.update = ((_p = message.message) === null || _p === void 0 ? void 0 : _p.update) ? ParticipantUpdate.toJSON((_q = message.message) === null || _q === void 0 ? void 0 : _q.update) : undefined);
    ((_r = message.message) === null || _r === void 0 ? void 0 : _r.$case) === "trackPublished" && (obj.trackPublished = ((_s = message.message) === null || _s === void 0 ? void 0 : _s.trackPublished) ? TrackPublishedResponse.toJSON((_t = message.message) === null || _t === void 0 ? void 0 : _t.trackPublished) : undefined);
    ((_u = message.message) === null || _u === void 0 ? void 0 : _u.$case) === "leave" && (obj.leave = ((_v = message.message) === null || _v === void 0 ? void 0 : _v.leave) ? LeaveRequest.toJSON((_w = message.message) === null || _w === void 0 ? void 0 : _w.leave) : undefined);
    ((_x = message.message) === null || _x === void 0 ? void 0 : _x.$case) === "mute" && (obj.mute = ((_y = message.message) === null || _y === void 0 ? void 0 : _y.mute) ? MuteTrackRequest.toJSON((_z = message.message) === null || _z === void 0 ? void 0 : _z.mute) : undefined);
    ((_0 = message.message) === null || _0 === void 0 ? void 0 : _0.$case) === "speakersChanged" && (obj.speakersChanged = ((_1 = message.message) === null || _1 === void 0 ? void 0 : _1.speakersChanged) ? SpeakersChanged.toJSON((_2 = message.message) === null || _2 === void 0 ? void 0 : _2.speakersChanged) : undefined);
    ((_3 = message.message) === null || _3 === void 0 ? void 0 : _3.$case) === "roomUpdate" && (obj.roomUpdate = ((_4 = message.message) === null || _4 === void 0 ? void 0 : _4.roomUpdate) ? RoomUpdate.toJSON((_5 = message.message) === null || _5 === void 0 ? void 0 : _5.roomUpdate) : undefined);
    ((_6 = message.message) === null || _6 === void 0 ? void 0 : _6.$case) === "connectionQuality" && (obj.connectionQuality = ((_7 = message.message) === null || _7 === void 0 ? void 0 : _7.connectionQuality) ? ConnectionQualityUpdate.toJSON((_8 = message.message) === null || _8 === void 0 ? void 0 : _8.connectionQuality) : undefined);
    ((_9 = message.message) === null || _9 === void 0 ? void 0 : _9.$case) === "streamStateUpdate" && (obj.streamStateUpdate = ((_10 = message.message) === null || _10 === void 0 ? void 0 : _10.streamStateUpdate) ? StreamStateUpdate.toJSON((_11 = message.message) === null || _11 === void 0 ? void 0 : _11.streamStateUpdate) : undefined);
    ((_12 = message.message) === null || _12 === void 0 ? void 0 : _12.$case) === "subscribedQualityUpdate" && (obj.subscribedQualityUpdate = ((_13 = message.message) === null || _13 === void 0 ? void 0 : _13.subscribedQualityUpdate) ? SubscribedQualityUpdate.toJSON((_14 = message.message) === null || _14 === void 0 ? void 0 : _14.subscribedQualityUpdate) : undefined);
    ((_15 = message.message) === null || _15 === void 0 ? void 0 : _15.$case) === "subscriptionPermissionUpdate" && (obj.subscriptionPermissionUpdate = ((_16 = message.message) === null || _16 === void 0 ? void 0 : _16.subscriptionPermissionUpdate) ? SubscriptionPermissionUpdate.toJSON((_17 = message.message) === null || _17 === void 0 ? void 0 : _17.subscriptionPermissionUpdate) : undefined);
    ((_18 = message.message) === null || _18 === void 0 ? void 0 : _18.$case) === "refreshToken" && (obj.refreshToken = (_19 = message.message) === null || _19 === void 0 ? void 0 : _19.refreshToken);
    ((_20 = message.message) === null || _20 === void 0 ? void 0 : _20.$case) === "trackUnpublished" && (obj.trackUnpublished = ((_21 = message.message) === null || _21 === void 0 ? void 0 : _21.trackUnpublished) ? TrackUnpublishedResponse.toJSON((_22 = message.message) === null || _22 === void 0 ? void 0 : _22.trackUnpublished) : undefined);
    ((_23 = message.message) === null || _23 === void 0 ? void 0 : _23.$case) === "pong" && (obj.pong = Math.round((_24 = message.message) === null || _24 === void 0 ? void 0 : _24.pong));
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26;

    const message = createBaseSignalResponse();

    if (((_a = object.message) === null || _a === void 0 ? void 0 : _a.$case) === "join" && ((_b = object.message) === null || _b === void 0 ? void 0 : _b.join) !== undefined && ((_c = object.message) === null || _c === void 0 ? void 0 : _c.join) !== null) {
      message.message = {
        $case: "join",
        join: JoinResponse.fromPartial(object.message.join)
      };
    }

    if (((_d = object.message) === null || _d === void 0 ? void 0 : _d.$case) === "answer" && ((_e = object.message) === null || _e === void 0 ? void 0 : _e.answer) !== undefined && ((_f = object.message) === null || _f === void 0 ? void 0 : _f.answer) !== null) {
      message.message = {
        $case: "answer",
        answer: SessionDescription.fromPartial(object.message.answer)
      };
    }

    if (((_g = object.message) === null || _g === void 0 ? void 0 : _g.$case) === "offer" && ((_h = object.message) === null || _h === void 0 ? void 0 : _h.offer) !== undefined && ((_j = object.message) === null || _j === void 0 ? void 0 : _j.offer) !== null) {
      message.message = {
        $case: "offer",
        offer: SessionDescription.fromPartial(object.message.offer)
      };
    }

    if (((_k = object.message) === null || _k === void 0 ? void 0 : _k.$case) === "trickle" && ((_l = object.message) === null || _l === void 0 ? void 0 : _l.trickle) !== undefined && ((_m = object.message) === null || _m === void 0 ? void 0 : _m.trickle) !== null) {
      message.message = {
        $case: "trickle",
        trickle: TrickleRequest.fromPartial(object.message.trickle)
      };
    }

    if (((_o = object.message) === null || _o === void 0 ? void 0 : _o.$case) === "update" && ((_p = object.message) === null || _p === void 0 ? void 0 : _p.update) !== undefined && ((_q = object.message) === null || _q === void 0 ? void 0 : _q.update) !== null) {
      message.message = {
        $case: "update",
        update: ParticipantUpdate.fromPartial(object.message.update)
      };
    }

    if (((_r = object.message) === null || _r === void 0 ? void 0 : _r.$case) === "trackPublished" && ((_s = object.message) === null || _s === void 0 ? void 0 : _s.trackPublished) !== undefined && ((_t = object.message) === null || _t === void 0 ? void 0 : _t.trackPublished) !== null) {
      message.message = {
        $case: "trackPublished",
        trackPublished: TrackPublishedResponse.fromPartial(object.message.trackPublished)
      };
    }

    if (((_u = object.message) === null || _u === void 0 ? void 0 : _u.$case) === "leave" && ((_v = object.message) === null || _v === void 0 ? void 0 : _v.leave) !== undefined && ((_w = object.message) === null || _w === void 0 ? void 0 : _w.leave) !== null) {
      message.message = {
        $case: "leave",
        leave: LeaveRequest.fromPartial(object.message.leave)
      };
    }

    if (((_x = object.message) === null || _x === void 0 ? void 0 : _x.$case) === "mute" && ((_y = object.message) === null || _y === void 0 ? void 0 : _y.mute) !== undefined && ((_z = object.message) === null || _z === void 0 ? void 0 : _z.mute) !== null) {
      message.message = {
        $case: "mute",
        mute: MuteTrackRequest.fromPartial(object.message.mute)
      };
    }

    if (((_0 = object.message) === null || _0 === void 0 ? void 0 : _0.$case) === "speakersChanged" && ((_1 = object.message) === null || _1 === void 0 ? void 0 : _1.speakersChanged) !== undefined && ((_2 = object.message) === null || _2 === void 0 ? void 0 : _2.speakersChanged) !== null) {
      message.message = {
        $case: "speakersChanged",
        speakersChanged: SpeakersChanged.fromPartial(object.message.speakersChanged)
      };
    }

    if (((_3 = object.message) === null || _3 === void 0 ? void 0 : _3.$case) === "roomUpdate" && ((_4 = object.message) === null || _4 === void 0 ? void 0 : _4.roomUpdate) !== undefined && ((_5 = object.message) === null || _5 === void 0 ? void 0 : _5.roomUpdate) !== null) {
      message.message = {
        $case: "roomUpdate",
        roomUpdate: RoomUpdate.fromPartial(object.message.roomUpdate)
      };
    }

    if (((_6 = object.message) === null || _6 === void 0 ? void 0 : _6.$case) === "connectionQuality" && ((_7 = object.message) === null || _7 === void 0 ? void 0 : _7.connectionQuality) !== undefined && ((_8 = object.message) === null || _8 === void 0 ? void 0 : _8.connectionQuality) !== null) {
      message.message = {
        $case: "connectionQuality",
        connectionQuality: ConnectionQualityUpdate.fromPartial(object.message.connectionQuality)
      };
    }

    if (((_9 = object.message) === null || _9 === void 0 ? void 0 : _9.$case) === "streamStateUpdate" && ((_10 = object.message) === null || _10 === void 0 ? void 0 : _10.streamStateUpdate) !== undefined && ((_11 = object.message) === null || _11 === void 0 ? void 0 : _11.streamStateUpdate) !== null) {
      message.message = {
        $case: "streamStateUpdate",
        streamStateUpdate: StreamStateUpdate.fromPartial(object.message.streamStateUpdate)
      };
    }

    if (((_12 = object.message) === null || _12 === void 0 ? void 0 : _12.$case) === "subscribedQualityUpdate" && ((_13 = object.message) === null || _13 === void 0 ? void 0 : _13.subscribedQualityUpdate) !== undefined && ((_14 = object.message) === null || _14 === void 0 ? void 0 : _14.subscribedQualityUpdate) !== null) {
      message.message = {
        $case: "subscribedQualityUpdate",
        subscribedQualityUpdate: SubscribedQualityUpdate.fromPartial(object.message.subscribedQualityUpdate)
      };
    }

    if (((_15 = object.message) === null || _15 === void 0 ? void 0 : _15.$case) === "subscriptionPermissionUpdate" && ((_16 = object.message) === null || _16 === void 0 ? void 0 : _16.subscriptionPermissionUpdate) !== undefined && ((_17 = object.message) === null || _17 === void 0 ? void 0 : _17.subscriptionPermissionUpdate) !== null) {
      message.message = {
        $case: "subscriptionPermissionUpdate",
        subscriptionPermissionUpdate: SubscriptionPermissionUpdate.fromPartial(object.message.subscriptionPermissionUpdate)
      };
    }

    if (((_18 = object.message) === null || _18 === void 0 ? void 0 : _18.$case) === "refreshToken" && ((_19 = object.message) === null || _19 === void 0 ? void 0 : _19.refreshToken) !== undefined && ((_20 = object.message) === null || _20 === void 0 ? void 0 : _20.refreshToken) !== null) {
      message.message = {
        $case: "refreshToken",
        refreshToken: object.message.refreshToken
      };
    }

    if (((_21 = object.message) === null || _21 === void 0 ? void 0 : _21.$case) === "trackUnpublished" && ((_22 = object.message) === null || _22 === void 0 ? void 0 : _22.trackUnpublished) !== undefined && ((_23 = object.message) === null || _23 === void 0 ? void 0 : _23.trackUnpublished) !== null) {
      message.message = {
        $case: "trackUnpublished",
        trackUnpublished: TrackUnpublishedResponse.fromPartial(object.message.trackUnpublished)
      };
    }

    if (((_24 = object.message) === null || _24 === void 0 ? void 0 : _24.$case) === "pong" && ((_25 = object.message) === null || _25 === void 0 ? void 0 : _25.pong) !== undefined && ((_26 = object.message) === null || _26 === void 0 ? void 0 : _26.pong) !== null) {
      message.message = {
        $case: "pong",
        pong: object.message.pong
      };
    }

    return message;
  }

};

function createBaseSimulcastCodec() {
  return {
    codec: "",
    cid: "",
    enableSimulcastLayers: false
  };
}

const SimulcastCodec = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.codec !== "") {
      writer.uint32(10).string(message.codec);
    }

    if (message.cid !== "") {
      writer.uint32(18).string(message.cid);
    }

    if (message.enableSimulcastLayers === true) {
      writer.uint32(24).bool(message.enableSimulcastLayers);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSimulcastCodec();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.codec = reader.string();
          break;

        case 2:
          message.cid = reader.string();
          break;

        case 3:
          message.enableSimulcastLayers = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      codec: isSet(object.codec) ? String(object.codec) : "",
      cid: isSet(object.cid) ? String(object.cid) : "",
      enableSimulcastLayers: isSet(object.enableSimulcastLayers) ? Boolean(object.enableSimulcastLayers) : false
    };
  },

  toJSON(message) {
    const obj = {};
    message.codec !== undefined && (obj.codec = message.codec);
    message.cid !== undefined && (obj.cid = message.cid);
    message.enableSimulcastLayers !== undefined && (obj.enableSimulcastLayers = message.enableSimulcastLayers);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseSimulcastCodec();
    message.codec = (_a = object.codec) !== null && _a !== void 0 ? _a : "";
    message.cid = (_b = object.cid) !== null && _b !== void 0 ? _b : "";
    message.enableSimulcastLayers = (_c = object.enableSimulcastLayers) !== null && _c !== void 0 ? _c : false;
    return message;
  }

};

function createBaseAddTrackRequest() {
  return {
    cid: "",
    name: "",
    type: 0,
    width: 0,
    height: 0,
    muted: false,
    disableDtx: false,
    source: 0,
    layers: [],
    simulcastCodecs: [],
    sid: ""
  };
}

const AddTrackRequest = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.cid !== "") {
      writer.uint32(10).string(message.cid);
    }

    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }

    if (message.type !== 0) {
      writer.uint32(24).int32(message.type);
    }

    if (message.width !== 0) {
      writer.uint32(32).uint32(message.width);
    }

    if (message.height !== 0) {
      writer.uint32(40).uint32(message.height);
    }

    if (message.muted === true) {
      writer.uint32(48).bool(message.muted);
    }

    if (message.disableDtx === true) {
      writer.uint32(56).bool(message.disableDtx);
    }

    if (message.source !== 0) {
      writer.uint32(64).int32(message.source);
    }

    for (const v of message.layers) {
      VideoLayer.encode(v, writer.uint32(74).fork()).ldelim();
    }

    for (const v of message.simulcastCodecs) {
      SimulcastCodec.encode(v, writer.uint32(82).fork()).ldelim();
    }

    if (message.sid !== "") {
      writer.uint32(90).string(message.sid);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddTrackRequest();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.cid = reader.string();
          break;

        case 2:
          message.name = reader.string();
          break;

        case 3:
          message.type = reader.int32();
          break;

        case 4:
          message.width = reader.uint32();
          break;

        case 5:
          message.height = reader.uint32();
          break;

        case 6:
          message.muted = reader.bool();
          break;

        case 7:
          message.disableDtx = reader.bool();
          break;

        case 8:
          message.source = reader.int32();
          break;

        case 9:
          message.layers.push(VideoLayer.decode(reader, reader.uint32()));
          break;

        case 10:
          message.simulcastCodecs.push(SimulcastCodec.decode(reader, reader.uint32()));
          break;

        case 11:
          message.sid = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      cid: isSet(object.cid) ? String(object.cid) : "",
      name: isSet(object.name) ? String(object.name) : "",
      type: isSet(object.type) ? trackTypeFromJSON(object.type) : 0,
      width: isSet(object.width) ? Number(object.width) : 0,
      height: isSet(object.height) ? Number(object.height) : 0,
      muted: isSet(object.muted) ? Boolean(object.muted) : false,
      disableDtx: isSet(object.disableDtx) ? Boolean(object.disableDtx) : false,
      source: isSet(object.source) ? trackSourceFromJSON(object.source) : 0,
      layers: Array.isArray(object === null || object === void 0 ? void 0 : object.layers) ? object.layers.map(e => VideoLayer.fromJSON(e)) : [],
      simulcastCodecs: Array.isArray(object === null || object === void 0 ? void 0 : object.simulcastCodecs) ? object.simulcastCodecs.map(e => SimulcastCodec.fromJSON(e)) : [],
      sid: isSet(object.sid) ? String(object.sid) : ""
    };
  },

  toJSON(message) {
    const obj = {};
    message.cid !== undefined && (obj.cid = message.cid);
    message.name !== undefined && (obj.name = message.name);
    message.type !== undefined && (obj.type = trackTypeToJSON(message.type));
    message.width !== undefined && (obj.width = Math.round(message.width));
    message.height !== undefined && (obj.height = Math.round(message.height));
    message.muted !== undefined && (obj.muted = message.muted);
    message.disableDtx !== undefined && (obj.disableDtx = message.disableDtx);
    message.source !== undefined && (obj.source = trackSourceToJSON(message.source));

    if (message.layers) {
      obj.layers = message.layers.map(e => e ? VideoLayer.toJSON(e) : undefined);
    } else {
      obj.layers = [];
    }

    if (message.simulcastCodecs) {
      obj.simulcastCodecs = message.simulcastCodecs.map(e => e ? SimulcastCodec.toJSON(e) : undefined);
    } else {
      obj.simulcastCodecs = [];
    }

    message.sid !== undefined && (obj.sid = message.sid);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;

    const message = createBaseAddTrackRequest();
    message.cid = (_a = object.cid) !== null && _a !== void 0 ? _a : "";
    message.name = (_b = object.name) !== null && _b !== void 0 ? _b : "";
    message.type = (_c = object.type) !== null && _c !== void 0 ? _c : 0;
    message.width = (_d = object.width) !== null && _d !== void 0 ? _d : 0;
    message.height = (_e = object.height) !== null && _e !== void 0 ? _e : 0;
    message.muted = (_f = object.muted) !== null && _f !== void 0 ? _f : false;
    message.disableDtx = (_g = object.disableDtx) !== null && _g !== void 0 ? _g : false;
    message.source = (_h = object.source) !== null && _h !== void 0 ? _h : 0;
    message.layers = ((_j = object.layers) === null || _j === void 0 ? void 0 : _j.map(e => VideoLayer.fromPartial(e))) || [];
    message.simulcastCodecs = ((_k = object.simulcastCodecs) === null || _k === void 0 ? void 0 : _k.map(e => SimulcastCodec.fromPartial(e))) || [];
    message.sid = (_l = object.sid) !== null && _l !== void 0 ? _l : "";
    return message;
  }

};

function createBaseTrickleRequest() {
  return {
    candidateInit: "",
    target: 0
  };
}

const TrickleRequest = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.candidateInit !== "") {
      writer.uint32(10).string(message.candidateInit);
    }

    if (message.target !== 0) {
      writer.uint32(16).int32(message.target);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrickleRequest();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.candidateInit = reader.string();
          break;

        case 2:
          message.target = reader.int32();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      candidateInit: isSet(object.candidateInit) ? String(object.candidateInit) : "",
      target: isSet(object.target) ? signalTargetFromJSON(object.target) : 0
    };
  },

  toJSON(message) {
    const obj = {};
    message.candidateInit !== undefined && (obj.candidateInit = message.candidateInit);
    message.target !== undefined && (obj.target = signalTargetToJSON(message.target));
    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseTrickleRequest();
    message.candidateInit = (_a = object.candidateInit) !== null && _a !== void 0 ? _a : "";
    message.target = (_b = object.target) !== null && _b !== void 0 ? _b : 0;
    return message;
  }

};

function createBaseMuteTrackRequest() {
  return {
    sid: "",
    muted: false
  };
}

const MuteTrackRequest = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.sid !== "") {
      writer.uint32(10).string(message.sid);
    }

    if (message.muted === true) {
      writer.uint32(16).bool(message.muted);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMuteTrackRequest();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.sid = reader.string();
          break;

        case 2:
          message.muted = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      sid: isSet(object.sid) ? String(object.sid) : "",
      muted: isSet(object.muted) ? Boolean(object.muted) : false
    };
  },

  toJSON(message) {
    const obj = {};
    message.sid !== undefined && (obj.sid = message.sid);
    message.muted !== undefined && (obj.muted = message.muted);
    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseMuteTrackRequest();
    message.sid = (_a = object.sid) !== null && _a !== void 0 ? _a : "";
    message.muted = (_b = object.muted) !== null && _b !== void 0 ? _b : false;
    return message;
  }

};

function createBaseJoinResponse() {
  return {
    room: undefined,
    participant: undefined,
    otherParticipants: [],
    serverVersion: "",
    iceServers: [],
    subscriberPrimary: false,
    alternativeUrl: "",
    clientConfiguration: undefined,
    serverRegion: "",
    pingTimeout: 0,
    pingInterval: 0,
    serverInfo: undefined
  };
}

const JoinResponse = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.room !== undefined) {
      Room$1.encode(message.room, writer.uint32(10).fork()).ldelim();
    }

    if (message.participant !== undefined) {
      ParticipantInfo.encode(message.participant, writer.uint32(18).fork()).ldelim();
    }

    for (const v of message.otherParticipants) {
      ParticipantInfo.encode(v, writer.uint32(26).fork()).ldelim();
    }

    if (message.serverVersion !== "") {
      writer.uint32(34).string(message.serverVersion);
    }

    for (const v of message.iceServers) {
      ICEServer.encode(v, writer.uint32(42).fork()).ldelim();
    }

    if (message.subscriberPrimary === true) {
      writer.uint32(48).bool(message.subscriberPrimary);
    }

    if (message.alternativeUrl !== "") {
      writer.uint32(58).string(message.alternativeUrl);
    }

    if (message.clientConfiguration !== undefined) {
      ClientConfiguration.encode(message.clientConfiguration, writer.uint32(66).fork()).ldelim();
    }

    if (message.serverRegion !== "") {
      writer.uint32(74).string(message.serverRegion);
    }

    if (message.pingTimeout !== 0) {
      writer.uint32(80).int32(message.pingTimeout);
    }

    if (message.pingInterval !== 0) {
      writer.uint32(88).int32(message.pingInterval);
    }

    if (message.serverInfo !== undefined) {
      ServerInfo.encode(message.serverInfo, writer.uint32(98).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseJoinResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.room = Room$1.decode(reader, reader.uint32());
          break;

        case 2:
          message.participant = ParticipantInfo.decode(reader, reader.uint32());
          break;

        case 3:
          message.otherParticipants.push(ParticipantInfo.decode(reader, reader.uint32()));
          break;

        case 4:
          message.serverVersion = reader.string();
          break;

        case 5:
          message.iceServers.push(ICEServer.decode(reader, reader.uint32()));
          break;

        case 6:
          message.subscriberPrimary = reader.bool();
          break;

        case 7:
          message.alternativeUrl = reader.string();
          break;

        case 8:
          message.clientConfiguration = ClientConfiguration.decode(reader, reader.uint32());
          break;

        case 9:
          message.serverRegion = reader.string();
          break;

        case 10:
          message.pingTimeout = reader.int32();
          break;

        case 11:
          message.pingInterval = reader.int32();
          break;

        case 12:
          message.serverInfo = ServerInfo.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      room: isSet(object.room) ? Room$1.fromJSON(object.room) : undefined,
      participant: isSet(object.participant) ? ParticipantInfo.fromJSON(object.participant) : undefined,
      otherParticipants: Array.isArray(object === null || object === void 0 ? void 0 : object.otherParticipants) ? object.otherParticipants.map(e => ParticipantInfo.fromJSON(e)) : [],
      serverVersion: isSet(object.serverVersion) ? String(object.serverVersion) : "",
      iceServers: Array.isArray(object === null || object === void 0 ? void 0 : object.iceServers) ? object.iceServers.map(e => ICEServer.fromJSON(e)) : [],
      subscriberPrimary: isSet(object.subscriberPrimary) ? Boolean(object.subscriberPrimary) : false,
      alternativeUrl: isSet(object.alternativeUrl) ? String(object.alternativeUrl) : "",
      clientConfiguration: isSet(object.clientConfiguration) ? ClientConfiguration.fromJSON(object.clientConfiguration) : undefined,
      serverRegion: isSet(object.serverRegion) ? String(object.serverRegion) : "",
      pingTimeout: isSet(object.pingTimeout) ? Number(object.pingTimeout) : 0,
      pingInterval: isSet(object.pingInterval) ? Number(object.pingInterval) : 0,
      serverInfo: isSet(object.serverInfo) ? ServerInfo.fromJSON(object.serverInfo) : undefined
    };
  },

  toJSON(message) {
    const obj = {};
    message.room !== undefined && (obj.room = message.room ? Room$1.toJSON(message.room) : undefined);
    message.participant !== undefined && (obj.participant = message.participant ? ParticipantInfo.toJSON(message.participant) : undefined);

    if (message.otherParticipants) {
      obj.otherParticipants = message.otherParticipants.map(e => e ? ParticipantInfo.toJSON(e) : undefined);
    } else {
      obj.otherParticipants = [];
    }

    message.serverVersion !== undefined && (obj.serverVersion = message.serverVersion);

    if (message.iceServers) {
      obj.iceServers = message.iceServers.map(e => e ? ICEServer.toJSON(e) : undefined);
    } else {
      obj.iceServers = [];
    }

    message.subscriberPrimary !== undefined && (obj.subscriberPrimary = message.subscriberPrimary);
    message.alternativeUrl !== undefined && (obj.alternativeUrl = message.alternativeUrl);
    message.clientConfiguration !== undefined && (obj.clientConfiguration = message.clientConfiguration ? ClientConfiguration.toJSON(message.clientConfiguration) : undefined);
    message.serverRegion !== undefined && (obj.serverRegion = message.serverRegion);
    message.pingTimeout !== undefined && (obj.pingTimeout = Math.round(message.pingTimeout));
    message.pingInterval !== undefined && (obj.pingInterval = Math.round(message.pingInterval));
    message.serverInfo !== undefined && (obj.serverInfo = message.serverInfo ? ServerInfo.toJSON(message.serverInfo) : undefined);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h;

    const message = createBaseJoinResponse();
    message.room = object.room !== undefined && object.room !== null ? Room$1.fromPartial(object.room) : undefined;
    message.participant = object.participant !== undefined && object.participant !== null ? ParticipantInfo.fromPartial(object.participant) : undefined;
    message.otherParticipants = ((_a = object.otherParticipants) === null || _a === void 0 ? void 0 : _a.map(e => ParticipantInfo.fromPartial(e))) || [];
    message.serverVersion = (_b = object.serverVersion) !== null && _b !== void 0 ? _b : "";
    message.iceServers = ((_c = object.iceServers) === null || _c === void 0 ? void 0 : _c.map(e => ICEServer.fromPartial(e))) || [];
    message.subscriberPrimary = (_d = object.subscriberPrimary) !== null && _d !== void 0 ? _d : false;
    message.alternativeUrl = (_e = object.alternativeUrl) !== null && _e !== void 0 ? _e : "";
    message.clientConfiguration = object.clientConfiguration !== undefined && object.clientConfiguration !== null ? ClientConfiguration.fromPartial(object.clientConfiguration) : undefined;
    message.serverRegion = (_f = object.serverRegion) !== null && _f !== void 0 ? _f : "";
    message.pingTimeout = (_g = object.pingTimeout) !== null && _g !== void 0 ? _g : 0;
    message.pingInterval = (_h = object.pingInterval) !== null && _h !== void 0 ? _h : 0;
    message.serverInfo = object.serverInfo !== undefined && object.serverInfo !== null ? ServerInfo.fromPartial(object.serverInfo) : undefined;
    return message;
  }

};

function createBaseTrackPublishedResponse() {
  return {
    cid: "",
    track: undefined
  };
}

const TrackPublishedResponse = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.cid !== "") {
      writer.uint32(10).string(message.cid);
    }

    if (message.track !== undefined) {
      TrackInfo.encode(message.track, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrackPublishedResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.cid = reader.string();
          break;

        case 2:
          message.track = TrackInfo.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      cid: isSet(object.cid) ? String(object.cid) : "",
      track: isSet(object.track) ? TrackInfo.fromJSON(object.track) : undefined
    };
  },

  toJSON(message) {
    const obj = {};
    message.cid !== undefined && (obj.cid = message.cid);
    message.track !== undefined && (obj.track = message.track ? TrackInfo.toJSON(message.track) : undefined);
    return obj;
  },

  fromPartial(object) {
    var _a;

    const message = createBaseTrackPublishedResponse();
    message.cid = (_a = object.cid) !== null && _a !== void 0 ? _a : "";
    message.track = object.track !== undefined && object.track !== null ? TrackInfo.fromPartial(object.track) : undefined;
    return message;
  }

};

function createBaseTrackUnpublishedResponse() {
  return {
    trackSid: ""
  };
}

const TrackUnpublishedResponse = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.trackSid !== "") {
      writer.uint32(10).string(message.trackSid);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrackUnpublishedResponse();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.trackSid = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      trackSid: isSet(object.trackSid) ? String(object.trackSid) : ""
    };
  },

  toJSON(message) {
    const obj = {};
    message.trackSid !== undefined && (obj.trackSid = message.trackSid);
    return obj;
  },

  fromPartial(object) {
    var _a;

    const message = createBaseTrackUnpublishedResponse();
    message.trackSid = (_a = object.trackSid) !== null && _a !== void 0 ? _a : "";
    return message;
  }

};

function createBaseSessionDescription() {
  return {
    type: "",
    sdp: ""
  };
}

const SessionDescription = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }

    if (message.sdp !== "") {
      writer.uint32(18).string(message.sdp);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSessionDescription();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.type = reader.string();
          break;

        case 2:
          message.sdp = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      type: isSet(object.type) ? String(object.type) : "",
      sdp: isSet(object.sdp) ? String(object.sdp) : ""
    };
  },

  toJSON(message) {
    const obj = {};
    message.type !== undefined && (obj.type = message.type);
    message.sdp !== undefined && (obj.sdp = message.sdp);
    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseSessionDescription();
    message.type = (_a = object.type) !== null && _a !== void 0 ? _a : "";
    message.sdp = (_b = object.sdp) !== null && _b !== void 0 ? _b : "";
    return message;
  }

};

function createBaseParticipantUpdate() {
  return {
    participants: []
  };
}

const ParticipantUpdate = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    for (const v of message.participants) {
      ParticipantInfo.encode(v, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseParticipantUpdate();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.participants.push(ParticipantInfo.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      participants: Array.isArray(object === null || object === void 0 ? void 0 : object.participants) ? object.participants.map(e => ParticipantInfo.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};

    if (message.participants) {
      obj.participants = message.participants.map(e => e ? ParticipantInfo.toJSON(e) : undefined);
    } else {
      obj.participants = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a;

    const message = createBaseParticipantUpdate();
    message.participants = ((_a = object.participants) === null || _a === void 0 ? void 0 : _a.map(e => ParticipantInfo.fromPartial(e))) || [];
    return message;
  }

};

function createBaseUpdateSubscription() {
  return {
    trackSids: [],
    subscribe: false,
    participantTracks: []
  };
}

const UpdateSubscription = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    for (const v of message.trackSids) {
      writer.uint32(10).string(v);
    }

    if (message.subscribe === true) {
      writer.uint32(16).bool(message.subscribe);
    }

    for (const v of message.participantTracks) {
      ParticipantTracks.encode(v, writer.uint32(26).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateSubscription();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.trackSids.push(reader.string());
          break;

        case 2:
          message.subscribe = reader.bool();
          break;

        case 3:
          message.participantTracks.push(ParticipantTracks.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      trackSids: Array.isArray(object === null || object === void 0 ? void 0 : object.trackSids) ? object.trackSids.map(e => String(e)) : [],
      subscribe: isSet(object.subscribe) ? Boolean(object.subscribe) : false,
      participantTracks: Array.isArray(object === null || object === void 0 ? void 0 : object.participantTracks) ? object.participantTracks.map(e => ParticipantTracks.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};

    if (message.trackSids) {
      obj.trackSids = message.trackSids.map(e => e);
    } else {
      obj.trackSids = [];
    }

    message.subscribe !== undefined && (obj.subscribe = message.subscribe);

    if (message.participantTracks) {
      obj.participantTracks = message.participantTracks.map(e => e ? ParticipantTracks.toJSON(e) : undefined);
    } else {
      obj.participantTracks = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseUpdateSubscription();
    message.trackSids = ((_a = object.trackSids) === null || _a === void 0 ? void 0 : _a.map(e => e)) || [];
    message.subscribe = (_b = object.subscribe) !== null && _b !== void 0 ? _b : false;
    message.participantTracks = ((_c = object.participantTracks) === null || _c === void 0 ? void 0 : _c.map(e => ParticipantTracks.fromPartial(e))) || [];
    return message;
  }

};

function createBaseUpdateTrackSettings() {
  return {
    trackSids: [],
    disabled: false,
    quality: 0,
    width: 0,
    height: 0
  };
}

const UpdateTrackSettings = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    for (const v of message.trackSids) {
      writer.uint32(10).string(v);
    }

    if (message.disabled === true) {
      writer.uint32(24).bool(message.disabled);
    }

    if (message.quality !== 0) {
      writer.uint32(32).int32(message.quality);
    }

    if (message.width !== 0) {
      writer.uint32(40).uint32(message.width);
    }

    if (message.height !== 0) {
      writer.uint32(48).uint32(message.height);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateTrackSettings();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.trackSids.push(reader.string());
          break;

        case 3:
          message.disabled = reader.bool();
          break;

        case 4:
          message.quality = reader.int32();
          break;

        case 5:
          message.width = reader.uint32();
          break;

        case 6:
          message.height = reader.uint32();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      trackSids: Array.isArray(object === null || object === void 0 ? void 0 : object.trackSids) ? object.trackSids.map(e => String(e)) : [],
      disabled: isSet(object.disabled) ? Boolean(object.disabled) : false,
      quality: isSet(object.quality) ? videoQualityFromJSON(object.quality) : 0,
      width: isSet(object.width) ? Number(object.width) : 0,
      height: isSet(object.height) ? Number(object.height) : 0
    };
  },

  toJSON(message) {
    const obj = {};

    if (message.trackSids) {
      obj.trackSids = message.trackSids.map(e => e);
    } else {
      obj.trackSids = [];
    }

    message.disabled !== undefined && (obj.disabled = message.disabled);
    message.quality !== undefined && (obj.quality = videoQualityToJSON(message.quality));
    message.width !== undefined && (obj.width = Math.round(message.width));
    message.height !== undefined && (obj.height = Math.round(message.height));
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e;

    const message = createBaseUpdateTrackSettings();
    message.trackSids = ((_a = object.trackSids) === null || _a === void 0 ? void 0 : _a.map(e => e)) || [];
    message.disabled = (_b = object.disabled) !== null && _b !== void 0 ? _b : false;
    message.quality = (_c = object.quality) !== null && _c !== void 0 ? _c : 0;
    message.width = (_d = object.width) !== null && _d !== void 0 ? _d : 0;
    message.height = (_e = object.height) !== null && _e !== void 0 ? _e : 0;
    return message;
  }

};

function createBaseLeaveRequest() {
  return {
    canReconnect: false,
    reason: 0
  };
}

const LeaveRequest = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.canReconnect === true) {
      writer.uint32(8).bool(message.canReconnect);
    }

    if (message.reason !== 0) {
      writer.uint32(16).int32(message.reason);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLeaveRequest();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.canReconnect = reader.bool();
          break;

        case 2:
          message.reason = reader.int32();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      canReconnect: isSet(object.canReconnect) ? Boolean(object.canReconnect) : false,
      reason: isSet(object.reason) ? disconnectReasonFromJSON(object.reason) : 0
    };
  },

  toJSON(message) {
    const obj = {};
    message.canReconnect !== undefined && (obj.canReconnect = message.canReconnect);
    message.reason !== undefined && (obj.reason = disconnectReasonToJSON(message.reason));
    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseLeaveRequest();
    message.canReconnect = (_a = object.canReconnect) !== null && _a !== void 0 ? _a : false;
    message.reason = (_b = object.reason) !== null && _b !== void 0 ? _b : 0;
    return message;
  }

};

function createBaseUpdateVideoLayers() {
  return {
    trackSid: "",
    layers: []
  };
}

const UpdateVideoLayers = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.trackSid !== "") {
      writer.uint32(10).string(message.trackSid);
    }

    for (const v of message.layers) {
      VideoLayer.encode(v, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateVideoLayers();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.trackSid = reader.string();
          break;

        case 2:
          message.layers.push(VideoLayer.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      trackSid: isSet(object.trackSid) ? String(object.trackSid) : "",
      layers: Array.isArray(object === null || object === void 0 ? void 0 : object.layers) ? object.layers.map(e => VideoLayer.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};
    message.trackSid !== undefined && (obj.trackSid = message.trackSid);

    if (message.layers) {
      obj.layers = message.layers.map(e => e ? VideoLayer.toJSON(e) : undefined);
    } else {
      obj.layers = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseUpdateVideoLayers();
    message.trackSid = (_a = object.trackSid) !== null && _a !== void 0 ? _a : "";
    message.layers = ((_b = object.layers) === null || _b === void 0 ? void 0 : _b.map(e => VideoLayer.fromPartial(e))) || [];
    return message;
  }

};

function createBaseICEServer() {
  return {
    urls: [],
    username: "",
    credential: ""
  };
}

const ICEServer = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    for (const v of message.urls) {
      writer.uint32(10).string(v);
    }

    if (message.username !== "") {
      writer.uint32(18).string(message.username);
    }

    if (message.credential !== "") {
      writer.uint32(26).string(message.credential);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseICEServer();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.urls.push(reader.string());
          break;

        case 2:
          message.username = reader.string();
          break;

        case 3:
          message.credential = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      urls: Array.isArray(object === null || object === void 0 ? void 0 : object.urls) ? object.urls.map(e => String(e)) : [],
      username: isSet(object.username) ? String(object.username) : "",
      credential: isSet(object.credential) ? String(object.credential) : ""
    };
  },

  toJSON(message) {
    const obj = {};

    if (message.urls) {
      obj.urls = message.urls.map(e => e);
    } else {
      obj.urls = [];
    }

    message.username !== undefined && (obj.username = message.username);
    message.credential !== undefined && (obj.credential = message.credential);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseICEServer();
    message.urls = ((_a = object.urls) === null || _a === void 0 ? void 0 : _a.map(e => e)) || [];
    message.username = (_b = object.username) !== null && _b !== void 0 ? _b : "";
    message.credential = (_c = object.credential) !== null && _c !== void 0 ? _c : "";
    return message;
  }

};

function createBaseSpeakersChanged() {
  return {
    speakers: []
  };
}

const SpeakersChanged = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    for (const v of message.speakers) {
      SpeakerInfo.encode(v, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSpeakersChanged();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.speakers.push(SpeakerInfo.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      speakers: Array.isArray(object === null || object === void 0 ? void 0 : object.speakers) ? object.speakers.map(e => SpeakerInfo.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};

    if (message.speakers) {
      obj.speakers = message.speakers.map(e => e ? SpeakerInfo.toJSON(e) : undefined);
    } else {
      obj.speakers = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a;

    const message = createBaseSpeakersChanged();
    message.speakers = ((_a = object.speakers) === null || _a === void 0 ? void 0 : _a.map(e => SpeakerInfo.fromPartial(e))) || [];
    return message;
  }

};

function createBaseRoomUpdate() {
  return {
    room: undefined
  };
}

const RoomUpdate = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.room !== undefined) {
      Room$1.encode(message.room, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRoomUpdate();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.room = Room$1.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      room: isSet(object.room) ? Room$1.fromJSON(object.room) : undefined
    };
  },

  toJSON(message) {
    const obj = {};
    message.room !== undefined && (obj.room = message.room ? Room$1.toJSON(message.room) : undefined);
    return obj;
  },

  fromPartial(object) {
    const message = createBaseRoomUpdate();
    message.room = object.room !== undefined && object.room !== null ? Room$1.fromPartial(object.room) : undefined;
    return message;
  }

};

function createBaseConnectionQualityInfo() {
  return {
    participantSid: "",
    quality: 0,
    score: 0
  };
}

const ConnectionQualityInfo = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.participantSid !== "") {
      writer.uint32(10).string(message.participantSid);
    }

    if (message.quality !== 0) {
      writer.uint32(16).int32(message.quality);
    }

    if (message.score !== 0) {
      writer.uint32(29).float(message.score);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectionQualityInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.participantSid = reader.string();
          break;

        case 2:
          message.quality = reader.int32();
          break;

        case 3:
          message.score = reader.float();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      participantSid: isSet(object.participantSid) ? String(object.participantSid) : "",
      quality: isSet(object.quality) ? connectionQualityFromJSON(object.quality) : 0,
      score: isSet(object.score) ? Number(object.score) : 0
    };
  },

  toJSON(message) {
    const obj = {};
    message.participantSid !== undefined && (obj.participantSid = message.participantSid);
    message.quality !== undefined && (obj.quality = connectionQualityToJSON(message.quality));
    message.score !== undefined && (obj.score = message.score);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseConnectionQualityInfo();
    message.participantSid = (_a = object.participantSid) !== null && _a !== void 0 ? _a : "";
    message.quality = (_b = object.quality) !== null && _b !== void 0 ? _b : 0;
    message.score = (_c = object.score) !== null && _c !== void 0 ? _c : 0;
    return message;
  }

};

function createBaseConnectionQualityUpdate() {
  return {
    updates: []
  };
}

const ConnectionQualityUpdate = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    for (const v of message.updates) {
      ConnectionQualityInfo.encode(v, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectionQualityUpdate();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.updates.push(ConnectionQualityInfo.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      updates: Array.isArray(object === null || object === void 0 ? void 0 : object.updates) ? object.updates.map(e => ConnectionQualityInfo.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};

    if (message.updates) {
      obj.updates = message.updates.map(e => e ? ConnectionQualityInfo.toJSON(e) : undefined);
    } else {
      obj.updates = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a;

    const message = createBaseConnectionQualityUpdate();
    message.updates = ((_a = object.updates) === null || _a === void 0 ? void 0 : _a.map(e => ConnectionQualityInfo.fromPartial(e))) || [];
    return message;
  }

};

function createBaseStreamStateInfo() {
  return {
    participantSid: "",
    trackSid: "",
    state: 0
  };
}

const StreamStateInfo = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.participantSid !== "") {
      writer.uint32(10).string(message.participantSid);
    }

    if (message.trackSid !== "") {
      writer.uint32(18).string(message.trackSid);
    }

    if (message.state !== 0) {
      writer.uint32(24).int32(message.state);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStreamStateInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.participantSid = reader.string();
          break;

        case 2:
          message.trackSid = reader.string();
          break;

        case 3:
          message.state = reader.int32();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      participantSid: isSet(object.participantSid) ? String(object.participantSid) : "",
      trackSid: isSet(object.trackSid) ? String(object.trackSid) : "",
      state: isSet(object.state) ? streamStateFromJSON(object.state) : 0
    };
  },

  toJSON(message) {
    const obj = {};
    message.participantSid !== undefined && (obj.participantSid = message.participantSid);
    message.trackSid !== undefined && (obj.trackSid = message.trackSid);
    message.state !== undefined && (obj.state = streamStateToJSON(message.state));
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseStreamStateInfo();
    message.participantSid = (_a = object.participantSid) !== null && _a !== void 0 ? _a : "";
    message.trackSid = (_b = object.trackSid) !== null && _b !== void 0 ? _b : "";
    message.state = (_c = object.state) !== null && _c !== void 0 ? _c : 0;
    return message;
  }

};

function createBaseStreamStateUpdate() {
  return {
    streamStates: []
  };
}

const StreamStateUpdate = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    for (const v of message.streamStates) {
      StreamStateInfo.encode(v, writer.uint32(10).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStreamStateUpdate();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.streamStates.push(StreamStateInfo.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      streamStates: Array.isArray(object === null || object === void 0 ? void 0 : object.streamStates) ? object.streamStates.map(e => StreamStateInfo.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};

    if (message.streamStates) {
      obj.streamStates = message.streamStates.map(e => e ? StreamStateInfo.toJSON(e) : undefined);
    } else {
      obj.streamStates = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a;

    const message = createBaseStreamStateUpdate();
    message.streamStates = ((_a = object.streamStates) === null || _a === void 0 ? void 0 : _a.map(e => StreamStateInfo.fromPartial(e))) || [];
    return message;
  }

};

function createBaseSubscribedQuality() {
  return {
    quality: 0,
    enabled: false
  };
}

const SubscribedQuality = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.quality !== 0) {
      writer.uint32(8).int32(message.quality);
    }

    if (message.enabled === true) {
      writer.uint32(16).bool(message.enabled);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribedQuality();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.quality = reader.int32();
          break;

        case 2:
          message.enabled = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      quality: isSet(object.quality) ? videoQualityFromJSON(object.quality) : 0,
      enabled: isSet(object.enabled) ? Boolean(object.enabled) : false
    };
  },

  toJSON(message) {
    const obj = {};
    message.quality !== undefined && (obj.quality = videoQualityToJSON(message.quality));
    message.enabled !== undefined && (obj.enabled = message.enabled);
    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseSubscribedQuality();
    message.quality = (_a = object.quality) !== null && _a !== void 0 ? _a : 0;
    message.enabled = (_b = object.enabled) !== null && _b !== void 0 ? _b : false;
    return message;
  }

};

function createBaseSubscribedCodec() {
  return {
    codec: "",
    qualities: []
  };
}

const SubscribedCodec = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.codec !== "") {
      writer.uint32(10).string(message.codec);
    }

    for (const v of message.qualities) {
      SubscribedQuality.encode(v, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribedCodec();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.codec = reader.string();
          break;

        case 2:
          message.qualities.push(SubscribedQuality.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      codec: isSet(object.codec) ? String(object.codec) : "",
      qualities: Array.isArray(object === null || object === void 0 ? void 0 : object.qualities) ? object.qualities.map(e => SubscribedQuality.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};
    message.codec !== undefined && (obj.codec = message.codec);

    if (message.qualities) {
      obj.qualities = message.qualities.map(e => e ? SubscribedQuality.toJSON(e) : undefined);
    } else {
      obj.qualities = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseSubscribedCodec();
    message.codec = (_a = object.codec) !== null && _a !== void 0 ? _a : "";
    message.qualities = ((_b = object.qualities) === null || _b === void 0 ? void 0 : _b.map(e => SubscribedQuality.fromPartial(e))) || [];
    return message;
  }

};

function createBaseSubscribedQualityUpdate() {
  return {
    trackSid: "",
    subscribedQualities: [],
    subscribedCodecs: []
  };
}

const SubscribedQualityUpdate = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.trackSid !== "") {
      writer.uint32(10).string(message.trackSid);
    }

    for (const v of message.subscribedQualities) {
      SubscribedQuality.encode(v, writer.uint32(18).fork()).ldelim();
    }

    for (const v of message.subscribedCodecs) {
      SubscribedCodec.encode(v, writer.uint32(26).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribedQualityUpdate();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.trackSid = reader.string();
          break;

        case 2:
          message.subscribedQualities.push(SubscribedQuality.decode(reader, reader.uint32()));
          break;

        case 3:
          message.subscribedCodecs.push(SubscribedCodec.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      trackSid: isSet(object.trackSid) ? String(object.trackSid) : "",
      subscribedQualities: Array.isArray(object === null || object === void 0 ? void 0 : object.subscribedQualities) ? object.subscribedQualities.map(e => SubscribedQuality.fromJSON(e)) : [],
      subscribedCodecs: Array.isArray(object === null || object === void 0 ? void 0 : object.subscribedCodecs) ? object.subscribedCodecs.map(e => SubscribedCodec.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};
    message.trackSid !== undefined && (obj.trackSid = message.trackSid);

    if (message.subscribedQualities) {
      obj.subscribedQualities = message.subscribedQualities.map(e => e ? SubscribedQuality.toJSON(e) : undefined);
    } else {
      obj.subscribedQualities = [];
    }

    if (message.subscribedCodecs) {
      obj.subscribedCodecs = message.subscribedCodecs.map(e => e ? SubscribedCodec.toJSON(e) : undefined);
    } else {
      obj.subscribedCodecs = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseSubscribedQualityUpdate();
    message.trackSid = (_a = object.trackSid) !== null && _a !== void 0 ? _a : "";
    message.subscribedQualities = ((_b = object.subscribedQualities) === null || _b === void 0 ? void 0 : _b.map(e => SubscribedQuality.fromPartial(e))) || [];
    message.subscribedCodecs = ((_c = object.subscribedCodecs) === null || _c === void 0 ? void 0 : _c.map(e => SubscribedCodec.fromPartial(e))) || [];
    return message;
  }

};

function createBaseTrackPermission() {
  return {
    participantSid: "",
    allTracks: false,
    trackSids: [],
    participantIdentity: ""
  };
}

const TrackPermission = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.participantSid !== "") {
      writer.uint32(10).string(message.participantSid);
    }

    if (message.allTracks === true) {
      writer.uint32(16).bool(message.allTracks);
    }

    for (const v of message.trackSids) {
      writer.uint32(26).string(v);
    }

    if (message.participantIdentity !== "") {
      writer.uint32(34).string(message.participantIdentity);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrackPermission();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.participantSid = reader.string();
          break;

        case 2:
          message.allTracks = reader.bool();
          break;

        case 3:
          message.trackSids.push(reader.string());
          break;

        case 4:
          message.participantIdentity = reader.string();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      participantSid: isSet(object.participantSid) ? String(object.participantSid) : "",
      allTracks: isSet(object.allTracks) ? Boolean(object.allTracks) : false,
      trackSids: Array.isArray(object === null || object === void 0 ? void 0 : object.trackSids) ? object.trackSids.map(e => String(e)) : [],
      participantIdentity: isSet(object.participantIdentity) ? String(object.participantIdentity) : ""
    };
  },

  toJSON(message) {
    const obj = {};
    message.participantSid !== undefined && (obj.participantSid = message.participantSid);
    message.allTracks !== undefined && (obj.allTracks = message.allTracks);

    if (message.trackSids) {
      obj.trackSids = message.trackSids.map(e => e);
    } else {
      obj.trackSids = [];
    }

    message.participantIdentity !== undefined && (obj.participantIdentity = message.participantIdentity);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d;

    const message = createBaseTrackPermission();
    message.participantSid = (_a = object.participantSid) !== null && _a !== void 0 ? _a : "";
    message.allTracks = (_b = object.allTracks) !== null && _b !== void 0 ? _b : false;
    message.trackSids = ((_c = object.trackSids) === null || _c === void 0 ? void 0 : _c.map(e => e)) || [];
    message.participantIdentity = (_d = object.participantIdentity) !== null && _d !== void 0 ? _d : "";
    return message;
  }

};

function createBaseSubscriptionPermission() {
  return {
    allParticipants: false,
    trackPermissions: []
  };
}

const SubscriptionPermission = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.allParticipants === true) {
      writer.uint32(8).bool(message.allParticipants);
    }

    for (const v of message.trackPermissions) {
      TrackPermission.encode(v, writer.uint32(18).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscriptionPermission();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.allParticipants = reader.bool();
          break;

        case 2:
          message.trackPermissions.push(TrackPermission.decode(reader, reader.uint32()));
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      allParticipants: isSet(object.allParticipants) ? Boolean(object.allParticipants) : false,
      trackPermissions: Array.isArray(object === null || object === void 0 ? void 0 : object.trackPermissions) ? object.trackPermissions.map(e => TrackPermission.fromJSON(e)) : []
    };
  },

  toJSON(message) {
    const obj = {};
    message.allParticipants !== undefined && (obj.allParticipants = message.allParticipants);

    if (message.trackPermissions) {
      obj.trackPermissions = message.trackPermissions.map(e => e ? TrackPermission.toJSON(e) : undefined);
    } else {
      obj.trackPermissions = [];
    }

    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseSubscriptionPermission();
    message.allParticipants = (_a = object.allParticipants) !== null && _a !== void 0 ? _a : false;
    message.trackPermissions = ((_b = object.trackPermissions) === null || _b === void 0 ? void 0 : _b.map(e => TrackPermission.fromPartial(e))) || [];
    return message;
  }

};

function createBaseSubscriptionPermissionUpdate() {
  return {
    participantSid: "",
    trackSid: "",
    allowed: false
  };
}

const SubscriptionPermissionUpdate = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.participantSid !== "") {
      writer.uint32(10).string(message.participantSid);
    }

    if (message.trackSid !== "") {
      writer.uint32(18).string(message.trackSid);
    }

    if (message.allowed === true) {
      writer.uint32(24).bool(message.allowed);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscriptionPermissionUpdate();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.participantSid = reader.string();
          break;

        case 2:
          message.trackSid = reader.string();
          break;

        case 3:
          message.allowed = reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      participantSid: isSet(object.participantSid) ? String(object.participantSid) : "",
      trackSid: isSet(object.trackSid) ? String(object.trackSid) : "",
      allowed: isSet(object.allowed) ? Boolean(object.allowed) : false
    };
  },

  toJSON(message) {
    const obj = {};
    message.participantSid !== undefined && (obj.participantSid = message.participantSid);
    message.trackSid !== undefined && (obj.trackSid = message.trackSid);
    message.allowed !== undefined && (obj.allowed = message.allowed);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseSubscriptionPermissionUpdate();
    message.participantSid = (_a = object.participantSid) !== null && _a !== void 0 ? _a : "";
    message.trackSid = (_b = object.trackSid) !== null && _b !== void 0 ? _b : "";
    message.allowed = (_c = object.allowed) !== null && _c !== void 0 ? _c : false;
    return message;
  }

};

function createBaseSyncState() {
  return {
    answer: undefined,
    subscription: undefined,
    publishTracks: [],
    dataChannels: [],
    offer: undefined
  };
}

const SyncState = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.answer !== undefined) {
      SessionDescription.encode(message.answer, writer.uint32(10).fork()).ldelim();
    }

    if (message.subscription !== undefined) {
      UpdateSubscription.encode(message.subscription, writer.uint32(18).fork()).ldelim();
    }

    for (const v of message.publishTracks) {
      TrackPublishedResponse.encode(v, writer.uint32(26).fork()).ldelim();
    }

    for (const v of message.dataChannels) {
      DataChannelInfo.encode(v, writer.uint32(34).fork()).ldelim();
    }

    if (message.offer !== undefined) {
      SessionDescription.encode(message.offer, writer.uint32(42).fork()).ldelim();
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncState();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.answer = SessionDescription.decode(reader, reader.uint32());
          break;

        case 2:
          message.subscription = UpdateSubscription.decode(reader, reader.uint32());
          break;

        case 3:
          message.publishTracks.push(TrackPublishedResponse.decode(reader, reader.uint32()));
          break;

        case 4:
          message.dataChannels.push(DataChannelInfo.decode(reader, reader.uint32()));
          break;

        case 5:
          message.offer = SessionDescription.decode(reader, reader.uint32());
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      answer: isSet(object.answer) ? SessionDescription.fromJSON(object.answer) : undefined,
      subscription: isSet(object.subscription) ? UpdateSubscription.fromJSON(object.subscription) : undefined,
      publishTracks: Array.isArray(object === null || object === void 0 ? void 0 : object.publishTracks) ? object.publishTracks.map(e => TrackPublishedResponse.fromJSON(e)) : [],
      dataChannels: Array.isArray(object === null || object === void 0 ? void 0 : object.dataChannels) ? object.dataChannels.map(e => DataChannelInfo.fromJSON(e)) : [],
      offer: isSet(object.offer) ? SessionDescription.fromJSON(object.offer) : undefined
    };
  },

  toJSON(message) {
    const obj = {};
    message.answer !== undefined && (obj.answer = message.answer ? SessionDescription.toJSON(message.answer) : undefined);
    message.subscription !== undefined && (obj.subscription = message.subscription ? UpdateSubscription.toJSON(message.subscription) : undefined);

    if (message.publishTracks) {
      obj.publishTracks = message.publishTracks.map(e => e ? TrackPublishedResponse.toJSON(e) : undefined);
    } else {
      obj.publishTracks = [];
    }

    if (message.dataChannels) {
      obj.dataChannels = message.dataChannels.map(e => e ? DataChannelInfo.toJSON(e) : undefined);
    } else {
      obj.dataChannels = [];
    }

    message.offer !== undefined && (obj.offer = message.offer ? SessionDescription.toJSON(message.offer) : undefined);
    return obj;
  },

  fromPartial(object) {
    var _a, _b;

    const message = createBaseSyncState();
    message.answer = object.answer !== undefined && object.answer !== null ? SessionDescription.fromPartial(object.answer) : undefined;
    message.subscription = object.subscription !== undefined && object.subscription !== null ? UpdateSubscription.fromPartial(object.subscription) : undefined;
    message.publishTracks = ((_a = object.publishTracks) === null || _a === void 0 ? void 0 : _a.map(e => TrackPublishedResponse.fromPartial(e))) || [];
    message.dataChannels = ((_b = object.dataChannels) === null || _b === void 0 ? void 0 : _b.map(e => DataChannelInfo.fromPartial(e))) || [];
    message.offer = object.offer !== undefined && object.offer !== null ? SessionDescription.fromPartial(object.offer) : undefined;
    return message;
  }

};

function createBaseDataChannelInfo() {
  return {
    label: "",
    id: 0,
    target: 0
  };
}

const DataChannelInfo = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    if (message.label !== "") {
      writer.uint32(10).string(message.label);
    }

    if (message.id !== 0) {
      writer.uint32(16).uint32(message.id);
    }

    if (message.target !== 0) {
      writer.uint32(24).int32(message.target);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDataChannelInfo();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.label = reader.string();
          break;

        case 2:
          message.id = reader.uint32();
          break;

        case 3:
          message.target = reader.int32();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      label: isSet(object.label) ? String(object.label) : "",
      id: isSet(object.id) ? Number(object.id) : 0,
      target: isSet(object.target) ? signalTargetFromJSON(object.target) : 0
    };
  },

  toJSON(message) {
    const obj = {};
    message.label !== undefined && (obj.label = message.label);
    message.id !== undefined && (obj.id = Math.round(message.id));
    message.target !== undefined && (obj.target = signalTargetToJSON(message.target));
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c;

    const message = createBaseDataChannelInfo();
    message.label = (_a = object.label) !== null && _a !== void 0 ? _a : "";
    message.id = (_b = object.id) !== null && _b !== void 0 ? _b : 0;
    message.target = (_c = object.target) !== null && _c !== void 0 ? _c : 0;
    return message;
  }

};

function createBaseSimulateScenario() {
  return {
    scenario: undefined
  };
}

const SimulateScenario = {
  encode(message) {
    let writer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _m0.Writer.create();

    var _a, _b, _c, _d, _e;

    if (((_a = message.scenario) === null || _a === void 0 ? void 0 : _a.$case) === "speakerUpdate") {
      writer.uint32(8).int32(message.scenario.speakerUpdate);
    }

    if (((_b = message.scenario) === null || _b === void 0 ? void 0 : _b.$case) === "nodeFailure") {
      writer.uint32(16).bool(message.scenario.nodeFailure);
    }

    if (((_c = message.scenario) === null || _c === void 0 ? void 0 : _c.$case) === "migration") {
      writer.uint32(24).bool(message.scenario.migration);
    }

    if (((_d = message.scenario) === null || _d === void 0 ? void 0 : _d.$case) === "serverLeave") {
      writer.uint32(32).bool(message.scenario.serverLeave);
    }

    if (((_e = message.scenario) === null || _e === void 0 ? void 0 : _e.$case) === "switchCandidateProtocol") {
      writer.uint32(40).int32(message.scenario.switchCandidateProtocol);
    }

    return writer;
  },

  decode(input, length) {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSimulateScenario();

    while (reader.pos < end) {
      const tag = reader.uint32();

      switch (tag >>> 3) {
        case 1:
          message.scenario = {
            $case: "speakerUpdate",
            speakerUpdate: reader.int32()
          };
          break;

        case 2:
          message.scenario = {
            $case: "nodeFailure",
            nodeFailure: reader.bool()
          };
          break;

        case 3:
          message.scenario = {
            $case: "migration",
            migration: reader.bool()
          };
          break;

        case 4:
          message.scenario = {
            $case: "serverLeave",
            serverLeave: reader.bool()
          };
          break;

        case 5:
          message.scenario = {
            $case: "switchCandidateProtocol",
            switchCandidateProtocol: reader.int32()
          };
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }

    return message;
  },

  fromJSON(object) {
    return {
      scenario: isSet(object.speakerUpdate) ? {
        $case: "speakerUpdate",
        speakerUpdate: Number(object.speakerUpdate)
      } : isSet(object.nodeFailure) ? {
        $case: "nodeFailure",
        nodeFailure: Boolean(object.nodeFailure)
      } : isSet(object.migration) ? {
        $case: "migration",
        migration: Boolean(object.migration)
      } : isSet(object.serverLeave) ? {
        $case: "serverLeave",
        serverLeave: Boolean(object.serverLeave)
      } : isSet(object.switchCandidateProtocol) ? {
        $case: "switchCandidateProtocol",
        switchCandidateProtocol: candidateProtocolFromJSON(object.switchCandidateProtocol)
      } : undefined
    };
  },

  toJSON(message) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;

    const obj = {};
    ((_a = message.scenario) === null || _a === void 0 ? void 0 : _a.$case) === "speakerUpdate" && (obj.speakerUpdate = Math.round((_b = message.scenario) === null || _b === void 0 ? void 0 : _b.speakerUpdate));
    ((_c = message.scenario) === null || _c === void 0 ? void 0 : _c.$case) === "nodeFailure" && (obj.nodeFailure = (_d = message.scenario) === null || _d === void 0 ? void 0 : _d.nodeFailure);
    ((_e = message.scenario) === null || _e === void 0 ? void 0 : _e.$case) === "migration" && (obj.migration = (_f = message.scenario) === null || _f === void 0 ? void 0 : _f.migration);
    ((_g = message.scenario) === null || _g === void 0 ? void 0 : _g.$case) === "serverLeave" && (obj.serverLeave = (_h = message.scenario) === null || _h === void 0 ? void 0 : _h.serverLeave);
    ((_j = message.scenario) === null || _j === void 0 ? void 0 : _j.$case) === "switchCandidateProtocol" && (obj.switchCandidateProtocol = ((_k = message.scenario) === null || _k === void 0 ? void 0 : _k.switchCandidateProtocol) !== undefined ? candidateProtocolToJSON((_l = message.scenario) === null || _l === void 0 ? void 0 : _l.switchCandidateProtocol) : undefined);
    return obj;
  },

  fromPartial(object) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;

    const message = createBaseSimulateScenario();

    if (((_a = object.scenario) === null || _a === void 0 ? void 0 : _a.$case) === "speakerUpdate" && ((_b = object.scenario) === null || _b === void 0 ? void 0 : _b.speakerUpdate) !== undefined && ((_c = object.scenario) === null || _c === void 0 ? void 0 : _c.speakerUpdate) !== null) {
      message.scenario = {
        $case: "speakerUpdate",
        speakerUpdate: object.scenario.speakerUpdate
      };
    }

    if (((_d = object.scenario) === null || _d === void 0 ? void 0 : _d.$case) === "nodeFailure" && ((_e = object.scenario) === null || _e === void 0 ? void 0 : _e.nodeFailure) !== undefined && ((_f = object.scenario) === null || _f === void 0 ? void 0 : _f.nodeFailure) !== null) {
      message.scenario = {
        $case: "nodeFailure",
        nodeFailure: object.scenario.nodeFailure
      };
    }

    if (((_g = object.scenario) === null || _g === void 0 ? void 0 : _g.$case) === "migration" && ((_h = object.scenario) === null || _h === void 0 ? void 0 : _h.migration) !== undefined && ((_j = object.scenario) === null || _j === void 0 ? void 0 : _j.migration) !== null) {
      message.scenario = {
        $case: "migration",
        migration: object.scenario.migration
      };
    }

    if (((_k = object.scenario) === null || _k === void 0 ? void 0 : _k.$case) === "serverLeave" && ((_l = object.scenario) === null || _l === void 0 ? void 0 : _l.serverLeave) !== undefined && ((_m = object.scenario) === null || _m === void 0 ? void 0 : _m.serverLeave) !== null) {
      message.scenario = {
        $case: "serverLeave",
        serverLeave: object.scenario.serverLeave
      };
    }

    if (((_o = object.scenario) === null || _o === void 0 ? void 0 : _o.$case) === "switchCandidateProtocol" && ((_p = object.scenario) === null || _p === void 0 ? void 0 : _p.switchCandidateProtocol) !== undefined && ((_q = object.scenario) === null || _q === void 0 ? void 0 : _q.switchCandidateProtocol) !== null) {
      message.scenario = {
        $case: "switchCandidateProtocol",
        switchCandidateProtocol: object.scenario.switchCandidateProtocol
      };
    }

    return message;
  }

};

var globalThis$1 = (() => {
  if (typeof globalThis$1 !== "undefined") {
    return globalThis$1;
  }

  if (typeof self !== "undefined") {
    return self;
  }

  if (typeof window !== "undefined") {
    return window;
  }

  if (typeof global !== "undefined") {
    return global;
  }

  throw "Unable to locate global object";
})();

function longToNumber(long) {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new globalThis$1.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }

  return long.toNumber();
}

if (_m0.util.Long !== long) {
  _m0.util.Long = long;

  _m0.configure();
}

function isSet(value) {
  return value !== null && value !== undefined;
}

class LivekitError extends Error {
  constructor(code, message) {
    super(message || 'an error has occured');
    this.code = code;
  }

}
class ConnectionError extends LivekitError {
  constructor(message) {
    super(1, message);
  }

}
class TrackInvalidError extends LivekitError {
  constructor(message) {
    super(20, message !== null && message !== void 0 ? message : 'track is invalid');
  }

}
class UnsupportedServer extends LivekitError {
  constructor(message) {
    super(10, message !== null && message !== void 0 ? message : 'unsupported server');
  }

}
class UnexpectedConnectionState extends LivekitError {
  constructor(message) {
    super(12, message !== null && message !== void 0 ? message : 'unexpected connection state');
  }

}
class NegotiationError extends LivekitError {
  constructor(message) {
    super(13, message !== null && message !== void 0 ? message : 'unable to negotiate');
  }

}
var MediaDeviceFailure;

(function (MediaDeviceFailure) {
  // user rejected permissions
  MediaDeviceFailure["PermissionDenied"] = "PermissionDenied"; // device is not available

  MediaDeviceFailure["NotFound"] = "NotFound"; // device is in use. On Windows, only a single tab may get access to a device at a time.

  MediaDeviceFailure["DeviceInUse"] = "DeviceInUse";
  MediaDeviceFailure["Other"] = "Other";
})(MediaDeviceFailure || (MediaDeviceFailure = {}));

(function (MediaDeviceFailure) {
  function getFailure(error) {
    if (error && 'name' in error) {
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return MediaDeviceFailure.NotFound;
      }

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return MediaDeviceFailure.PermissionDenied;
      }

      if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        return MediaDeviceFailure.DeviceInUse;
      }

      return MediaDeviceFailure.Other;
    }
  }

  MediaDeviceFailure.getFailure = getFailure;
})(MediaDeviceFailure || (MediaDeviceFailure = {}));

/**
 * Events are the primary way LiveKit notifies your application of changes.
 *
 * The following are events emitted by [[Room]], listen to room events like
 *
 * ```typescript
 * room.on(RoomEvent.TrackPublished, (track, publication, participant) => {})
 * ```
 */
var RoomEvent;

(function (RoomEvent) {
  /**
   * When the connection to the server has been established
   */
  RoomEvent["Connected"] = "connected";
  /**
   * When the connection to the server has been interrupted and it's attempting
   * to reconnect.
   */

  RoomEvent["Reconnecting"] = "reconnecting";
  /**
   * Fires when a reconnection has been successful.
   */

  RoomEvent["Reconnected"] = "reconnected";
  /**
   * When disconnected from room. This fires when room.disconnect() is called or
   * when an unrecoverable connection issue had occured
   */

  RoomEvent["Disconnected"] = "disconnected";
  /**
   * Whenever the connection state of the room changes
   *
   * args: ([[ConnectionState]])
   */

  RoomEvent["ConnectionStateChanged"] = "connectionStateChanged";
  /**
   * @deprecated StateChanged has been renamed to ConnectionStateChanged
   */

  RoomEvent["StateChanged"] = "connectionStateChanged";
  /**
   * When input or output devices on the machine have changed.
   */

  RoomEvent["MediaDevicesChanged"] = "mediaDevicesChanged";
  /**
   * When a [[RemoteParticipant]] joins *after* the local
   * participant. It will not emit events for participants that are already
   * in the room
   *
   * args: ([[RemoteParticipant]])
   */

  RoomEvent["ParticipantConnected"] = "participantConnected";
  /**
   * When a [[RemoteParticipant]] leaves *after* the local
   * participant has joined.
   *
   * args: ([[RemoteParticipant]])
   */

  RoomEvent["ParticipantDisconnected"] = "participantDisconnected";
  /**
   * When a new track is published to room *after* the local
   * participant has joined. It will not fire for tracks that are already published.
   *
   * A track published doesn't mean the participant has subscribed to it. It's
   * simply reflecting the state of the room.
   *
   * args: ([[RemoteTrackPublication]], [[RemoteParticipant]])
   */

  RoomEvent["TrackPublished"] = "trackPublished";
  /**
   * The [[LocalParticipant]] has subscribed to a new track. This event will **always**
   * fire as long as new tracks are ready for use.
   *
   * args: ([[RemoteTrack]], [[RemoteTrackPublication]], [[RemoteParticipant]])
   */

  RoomEvent["TrackSubscribed"] = "trackSubscribed";
  /**
   * Could not subscribe to a track
   *
   * args: (track sid, [[RemoteParticipant]])
   */

  RoomEvent["TrackSubscriptionFailed"] = "trackSubscriptionFailed";
  /**
   * A [[RemoteParticipant]] has unpublished a track
   *
   * args: ([[RemoteTrackPublication]], [[RemoteParticipant]])
   */

  RoomEvent["TrackUnpublished"] = "trackUnpublished";
  /**
   * A subscribed track is no longer available. Clients should listen to this
   * event and ensure they detach tracks.
   *
   * args: ([[Track]], [[RemoteTrackPublication]], [[RemoteParticipant]])
   */

  RoomEvent["TrackUnsubscribed"] = "trackUnsubscribed";
  /**
   * A track that was muted, fires on both [[RemoteParticipant]]s and [[LocalParticipant]]
   *
   * args: ([[TrackPublication]], [[Participant]])
   */

  RoomEvent["TrackMuted"] = "trackMuted";
  /**
   * A track that was unmuted, fires on both [[RemoteParticipant]]s and [[LocalParticipant]]
   *
   * args: ([[TrackPublication]], [[Participant]])
   */

  RoomEvent["TrackUnmuted"] = "trackUnmuted";
  /**
   * A local track was published successfully. This event is helpful to know
   * when to update your local UI with the newly published track.
   *
   * args: ([[LocalTrackPublication]], [[LocalParticipant]])
   */

  RoomEvent["LocalTrackPublished"] = "localTrackPublished";
  /**
   * A local track was unpublished. This event is helpful to know when to remove
   * the local track from your UI.
   *
   * When a user stops sharing their screen by pressing "End" on the browser UI,
   * this event will also fire.
   *
   * args: ([[LocalTrackPublication]], [[LocalParticipant]])
   */

  RoomEvent["LocalTrackUnpublished"] = "localTrackUnpublished";
  /**
   * Active speakers changed. List of speakers are ordered by their audio level.
   * loudest speakers first. This will include the LocalParticipant too.
   *
   * Speaker updates are sent only to the publishing participant and their subscribers.
   *
   * args: (Array<[[Participant]]>)
   */

  RoomEvent["ActiveSpeakersChanged"] = "activeSpeakersChanged";
  /**
   * Participant metadata is a simple way for app-specific state to be pushed to
   * all users.
   * When RoomService.UpdateParticipantMetadata is called to change a participant's
   * state, *all*  participants in the room will fire this event.
   *
   * args: (prevMetadata: string, [[Participant]])
   *
   */

  RoomEvent["ParticipantMetadataChanged"] = "participantMetadataChanged";
  /**
   * Room metadata is a simple way for app-specific state to be pushed to
   * all users.
   * When RoomService.UpdateRoomMetadata is called to change a room's state,
   * *all*  participants in the room will fire this event.
   *
   * args: (string)
   */

  RoomEvent["RoomMetadataChanged"] = "roomMetadataChanged";
  /**
   * Data received from another participant.
   * Data packets provides the ability to use LiveKit to send/receive arbitrary payloads.
   * All participants in the room will receive the messages sent to the room.
   *
   * args: (payload: Uint8Array, participant: [[Participant]], kind: [[DataPacket_Kind]])
   */

  RoomEvent["DataReceived"] = "dataReceived";
  /**
   * Connection quality was changed for a Participant. It'll receive updates
   * from the local participant, as well as any [[RemoteParticipant]]s that we are
   * subscribed to.
   *
   * args: (connectionQuality: [[ConnectionQuality]], participant: [[Participant]])
   */

  RoomEvent["ConnectionQualityChanged"] = "connectionQualityChanged";
  /**
   * StreamState indicates if a subscribed (remote) track has been paused by the SFU
   * (typically this happens because of subscriber's bandwidth constraints)
   *
   * When bandwidth conditions allow, the track will be resumed automatically.
   * TrackStreamStateChanged will also be emitted when that happens.
   *
   * args: (pub: [[RemoteTrackPublication]], streamState: [[Track.StreamState]],
   *        participant: [[RemoteParticipant]])
   */

  RoomEvent["TrackStreamStateChanged"] = "trackStreamStateChanged";
  /**
   * One of subscribed tracks have changed its permissions for the current
   * participant. If permission was revoked, then the track will no longer
   * be subscribed. If permission was granted, a TrackSubscribed event will
   * be emitted.
   *
   * args: (pub: [[RemoteTrackPublication]],
   *        status: [[TrackPublication.SubscriptionStatus]],
   *        participant: [[RemoteParticipant]])
   */

  RoomEvent["TrackSubscriptionPermissionChanged"] = "trackSubscriptionPermissionChanged";
  /**
   * One of subscribed tracks have changed its status for the current
   * participant.
   *
   * args: (pub: [[RemoteTrackPublication]],
   *        status: [[TrackPublication.SubscriptionStatus]],
   *        participant: [[RemoteParticipant]])
   */

  RoomEvent["TrackSubscriptionStatusChanged"] = "trackSubscriptionStatusChanged";
  /**
   * LiveKit will attempt to autoplay all audio tracks when you attach them to
   * audio elements. However, if that fails, we'll notify you via AudioPlaybackStatusChanged.
   * `Room.canPlayAudio` will indicate if audio playback is permitted.
   */

  RoomEvent["AudioPlaybackStatusChanged"] = "audioPlaybackChanged";
  /**
   * When we have encountered an error while attempting to create a track.
   * The errors take place in getUserMedia().
   * Use MediaDeviceFailure.getFailure(error) to get the reason of failure.
   * [[LocalParticipant.lastCameraError]] and [[LocalParticipant.lastMicrophoneError]]
   * will indicate if it had an error while creating the audio or video track respectively.
   *
   * args: (error: Error)
   */

  RoomEvent["MediaDevicesError"] = "mediaDevicesError";
  /**
   * A participant's permission has changed. Currently only fired on LocalParticipant.
   * args: (prevPermissions: [[ParticipantPermission]], participant: [[Participant]])
   */

  RoomEvent["ParticipantPermissionsChanged"] = "participantPermissionsChanged";
  /**
   * Signal connected, can publish tracks.
   */

  RoomEvent["SignalConnected"] = "signalConnected";
})(RoomEvent || (RoomEvent = {}));

var ParticipantEvent;

(function (ParticipantEvent) {
  /**
   * When a new track is published to room *after* the local
   * participant has joined. It will not fire for tracks that are already published.
   *
   * A track published doesn't mean the participant has subscribed to it. It's
   * simply reflecting the state of the room.
   *
   * args: ([[RemoteTrackPublication]])
   */
  ParticipantEvent["TrackPublished"] = "trackPublished";
  /**
   * Successfully subscribed to the [[RemoteParticipant]]'s track.
   * This event will **always** fire as long as new tracks are ready for use.
   *
   * args: ([[RemoteTrack]], [[RemoteTrackPublication]])
   */

  ParticipantEvent["TrackSubscribed"] = "trackSubscribed";
  /**
   * Could not subscribe to a track
   *
   * args: (track sid)
   */

  ParticipantEvent["TrackSubscriptionFailed"] = "trackSubscriptionFailed";
  /**
   * A [[RemoteParticipant]] has unpublished a track
   *
   * args: ([[RemoteTrackPublication]])
   */

  ParticipantEvent["TrackUnpublished"] = "trackUnpublished";
  /**
   * A subscribed track is no longer available. Clients should listen to this
   * event and ensure they detach tracks.
   *
   * args: ([[RemoteTrack]], [[RemoteTrackPublication]])
   */

  ParticipantEvent["TrackUnsubscribed"] = "trackUnsubscribed";
  /**
   * A track that was muted, fires on both [[RemoteParticipant]]s and [[LocalParticipant]]
   *
   * args: ([[TrackPublication]])
   */

  ParticipantEvent["TrackMuted"] = "trackMuted";
  /**
   * A track that was unmuted, fires on both [[RemoteParticipant]]s and [[LocalParticipant]]
   *
   * args: ([[TrackPublication]])
   */

  ParticipantEvent["TrackUnmuted"] = "trackUnmuted";
  /**
   * A local track was published successfully. This event is helpful to know
   * when to update your local UI with the newly published track.
   *
   * args: ([[LocalTrackPublication]])
   */

  ParticipantEvent["LocalTrackPublished"] = "localTrackPublished";
  /**
   * A local track was unpublished. This event is helpful to know when to remove
   * the local track from your UI.
   *
   * When a user stops sharing their screen by pressing "End" on the browser UI,
   * this event will also fire.
   *
   * args: ([[LocalTrackPublication]])
   */

  ParticipantEvent["LocalTrackUnpublished"] = "localTrackUnpublished";
  /**
   * Participant metadata is a simple way for app-specific state to be pushed to
   * all users.
   * When RoomService.UpdateParticipantMetadata is called to change a participant's
   * state, *all*  participants in the room will fire this event.
   * To access the current metadata, see [[Participant.metadata]].
   *
   * args: (prevMetadata: string)
   *
   */

  ParticipantEvent["ParticipantMetadataChanged"] = "participantMetadataChanged";
  /**
   * Data received from this participant as sender.
   * Data packets provides the ability to use LiveKit to send/receive arbitrary payloads.
   * All participants in the room will receive the messages sent to the room.
   *
   * args: (payload: Uint8Array, kind: [[DataPacket_Kind]])
   */

  ParticipantEvent["DataReceived"] = "dataReceived";
  /**
   * Has speaking status changed for the current participant
   *
   * args: (speaking: boolean)
   */

  ParticipantEvent["IsSpeakingChanged"] = "isSpeakingChanged";
  /**
   * Connection quality was changed for a Participant. It'll receive updates
   * from the local participant, as well as any [[RemoteParticipant]]s that we are
   * subscribed to.
   *
   * args: (connectionQuality: [[ConnectionQuality]])
   */

  ParticipantEvent["ConnectionQualityChanged"] = "connectionQualityChanged";
  /**
   * StreamState indicates if a subscribed track has been paused by the SFU
   * (typically this happens because of subscriber's bandwidth constraints)
   *
   * When bandwidth conditions allow, the track will be resumed automatically.
   * TrackStreamStateChanged will also be emitted when that happens.
   *
   * args: (pub: [[RemoteTrackPublication]], streamState: [[Track.StreamState]])
   */

  ParticipantEvent["TrackStreamStateChanged"] = "trackStreamStateChanged";
  /**
   * One of subscribed tracks have changed its permissions for the current
   * participant. If permission was revoked, then the track will no longer
   * be subscribed. If permission was granted, a TrackSubscribed event will
   * be emitted.
   *
   * args: (pub: [[RemoteTrackPublication]],
   *        status: [[TrackPublication.SubscriptionStatus]])
   */

  ParticipantEvent["TrackSubscriptionPermissionChanged"] = "trackSubscriptionPermissionChanged";
  /**
   * One of the remote participants publications has changed its subscription status.
   *
   */

  ParticipantEvent["TrackSubscriptionStatusChanged"] = "trackSubscriptionStatusChanged"; // fired only on LocalParticipant

  /** @internal */

  ParticipantEvent["MediaDevicesError"] = "mediaDevicesError";
  /**
   * A participant's permission has changed. Currently only fired on LocalParticipant.
   * args: (prevPermissions: [[ParticipantPermission]])
   */

  ParticipantEvent["ParticipantPermissionsChanged"] = "participantPermissionsChanged";
})(ParticipantEvent || (ParticipantEvent = {}));
/** @internal */


var EngineEvent;

(function (EngineEvent) {
  EngineEvent["TransportsCreated"] = "transportsCreated";
  EngineEvent["Connected"] = "connected";
  EngineEvent["Disconnected"] = "disconnected";
  EngineEvent["Resuming"] = "resuming";
  EngineEvent["Resumed"] = "resumed";
  EngineEvent["Restarting"] = "restarting";
  EngineEvent["Restarted"] = "restarted";
  EngineEvent["SignalResumed"] = "signalResumed";
  EngineEvent["MediaTrackAdded"] = "mediaTrackAdded";
  EngineEvent["ActiveSpeakersUpdate"] = "activeSpeakersUpdate";
  EngineEvent["DataPacketReceived"] = "dataPacketReceived";
})(EngineEvent || (EngineEvent = {}));

var TrackEvent;

(function (TrackEvent) {
  TrackEvent["Message"] = "message";
  TrackEvent["Muted"] = "muted";
  TrackEvent["Unmuted"] = "unmuted";
  TrackEvent["Ended"] = "ended";
  TrackEvent["Subscribed"] = "subscribed";
  TrackEvent["Unsubscribed"] = "unsubscribed";
  /** @internal */

  TrackEvent["UpdateSettings"] = "updateSettings";
  /** @internal */

  TrackEvent["UpdateSubscription"] = "updateSubscription";
  /** @internal */

  TrackEvent["AudioPlaybackStarted"] = "audioPlaybackStarted";
  /** @internal */

  TrackEvent["AudioPlaybackFailed"] = "audioPlaybackFailed";
  /**
   * @internal
   * Only fires on LocalAudioTrack instances
   */

  TrackEvent["AudioSilenceDetected"] = "audioSilenceDetected";
  /** @internal */

  TrackEvent["VisibilityChanged"] = "visibilityChanged";
  /** @internal */

  TrackEvent["VideoDimensionsChanged"] = "videoDimensionsChanged";
  /** @internal */

  TrackEvent["ElementAttached"] = "elementAttached";
  /** @internal */

  TrackEvent["ElementDetached"] = "elementDetached";
  /**
   * @internal
   * Only fires on LocalTracks
   */

  TrackEvent["UpstreamPaused"] = "upstreamPaused";
  /**
   * @internal
   * Only fires on LocalTracks
   */

  TrackEvent["UpstreamResumed"] = "upstreamResumed";
  /**
   * @internal
   * Fires on RemoteTrackPublication
   */

  TrackEvent["SubscriptionPermissionChanged"] = "subscriptionPermissionChanged";
  /**
   * Fires on RemoteTrackPublication
   */

  TrackEvent["SubscriptionStatusChanged"] = "subscriptionStatusChanged";
})(TrackEvent || (TrackEvent = {}));

const monitorFrequency = 2000;
function computeBitrate(currentStats, prevStats) {
  if (!prevStats) {
    return 0;
  }

  let bytesNow;
  let bytesPrev;

  if ('bytesReceived' in currentStats) {
    bytesNow = currentStats.bytesReceived;
    bytesPrev = prevStats.bytesReceived;
  } else if ('bytesSent' in currentStats) {
    bytesNow = currentStats.bytesSent;
    bytesPrev = prevStats.bytesSent;
  }

  if (bytesNow === undefined || bytesPrev === undefined || currentStats.timestamp === undefined || prevStats.timestamp === undefined) {
    return 0;
  }

  return (bytesNow - bytesPrev) * 8 * 1000 / (currentStats.timestamp - prevStats.timestamp);
}

var uaParser = {exports: {}};

(function (module, exports) {
  /////////////////////////////////////////////////////////////////////////////////

  /* UAParser.js v1.0.2
     Copyright © 2012-2021 Faisal Salman <f@faisalman.com>
     MIT License */

  /*
  Detect Browser, Engine, OS, CPU, and Device type/model from User-Agent data.
  Supports browser & node.js environment. 
  Demo   : https://faisalman.github.io/ua-parser-js
  Source : https://github.com/faisalman/ua-parser-js */
  /////////////////////////////////////////////////////////////////////////////////
  (function (window, undefined$1) {
    // Constants
    /////////////

    var LIBVERSION = '1.0.2',
        EMPTY = '',
        UNKNOWN = '?',
        FUNC_TYPE = 'function',
        UNDEF_TYPE = 'undefined',
        OBJ_TYPE = 'object',
        STR_TYPE = 'string',
        MAJOR = 'major',
        MODEL = 'model',
        NAME = 'name',
        TYPE = 'type',
        VENDOR = 'vendor',
        VERSION = 'version',
        ARCHITECTURE = 'architecture',
        CONSOLE = 'console',
        MOBILE = 'mobile',
        TABLET = 'tablet',
        SMARTTV = 'smarttv',
        WEARABLE = 'wearable',
        EMBEDDED = 'embedded',
        UA_MAX_LENGTH = 255;
    var AMAZON = 'Amazon',
        APPLE = 'Apple',
        ASUS = 'ASUS',
        BLACKBERRY = 'BlackBerry',
        BROWSER = 'Browser',
        CHROME = 'Chrome',
        EDGE = 'Edge',
        FIREFOX = 'Firefox',
        GOOGLE = 'Google',
        HUAWEI = 'Huawei',
        LG = 'LG',
        MICROSOFT = 'Microsoft',
        MOTOROLA = 'Motorola',
        OPERA = 'Opera',
        SAMSUNG = 'Samsung',
        SONY = 'Sony',
        XIAOMI = 'Xiaomi',
        ZEBRA = 'Zebra',
        FACEBOOK = 'Facebook'; ///////////
    // Helper
    //////////

    var extend = function (regexes, extensions) {
      var mergedRegexes = {};

      for (var i in regexes) {
        if (extensions[i] && extensions[i].length % 2 === 0) {
          mergedRegexes[i] = extensions[i].concat(regexes[i]);
        } else {
          mergedRegexes[i] = regexes[i];
        }
      }

      return mergedRegexes;
    },
        enumerize = function (arr) {
      var enums = {};

      for (var i = 0; i < arr.length; i++) {
        enums[arr[i].toUpperCase()] = arr[i];
      }

      return enums;
    },
        has = function (str1, str2) {
      return typeof str1 === STR_TYPE ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
    },
        lowerize = function (str) {
      return str.toLowerCase();
    },
        majorize = function (version) {
      return typeof version === STR_TYPE ? version.replace(/[^\d\.]/g, EMPTY).split('.')[0] : undefined$1;
    },
        trim = function (str, len) {
      if (typeof str === STR_TYPE) {
        str = str.replace(/^\s\s*/, EMPTY).replace(/\s\s*$/, EMPTY);
        return typeof len === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
      }
    }; ///////////////
    // Map helper
    //////////////


    var rgxMapper = function (ua, arrays) {
      var i = 0,
          j,
          k,
          p,
          q,
          matches,
          match; // loop through all regexes maps

      while (i < arrays.length && !matches) {
        var regex = arrays[i],
            // even sequence (0,2,4,..)
        props = arrays[i + 1]; // odd sequence (1,3,5,..)

        j = k = 0; // try matching uastring with regexes

        while (j < regex.length && !matches) {
          matches = regex[j++].exec(ua);

          if (!!matches) {
            for (p = 0; p < props.length; p++) {
              match = matches[++k];
              q = props[p]; // check if given property is actually array

              if (typeof q === OBJ_TYPE && q.length > 0) {
                if (q.length === 2) {
                  if (typeof q[1] == FUNC_TYPE) {
                    // assign modified match
                    this[q[0]] = q[1].call(this, match);
                  } else {
                    // assign given value, ignore regex match
                    this[q[0]] = q[1];
                  }
                } else if (q.length === 3) {
                  // check whether function or regex
                  if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                    // call function (usually string mapper)
                    this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined$1;
                  } else {
                    // sanitize match using given regex
                    this[q[0]] = match ? match.replace(q[1], q[2]) : undefined$1;
                  }
                } else if (q.length === 4) {
                  this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined$1;
                }
              } else {
                this[q] = match ? match : undefined$1;
              }
            }
          }
        }

        i += 2;
      }
    },
        strMapper = function (str, map) {
      for (var i in map) {
        // check if current value is array
        if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
          for (var j = 0; j < map[i].length; j++) {
            if (has(map[i][j], str)) {
              return i === UNKNOWN ? undefined$1 : i;
            }
          }
        } else if (has(map[i], str)) {
          return i === UNKNOWN ? undefined$1 : i;
        }
      }

      return str;
    }; ///////////////
    // String map
    //////////////
    // Safari < 3.0


    var oldSafariMap = {
      '1.0': '/8',
      '1.2': '/1',
      '1.3': '/3',
      '2.0': '/412',
      '2.0.2': '/416',
      '2.0.3': '/417',
      '2.0.4': '/419',
      '?': '/'
    },
        windowsVersionMap = {
      'ME': '4.90',
      'NT 3.11': 'NT3.51',
      'NT 4.0': 'NT4.0',
      '2000': 'NT 5.0',
      'XP': ['NT 5.1', 'NT 5.2'],
      'Vista': 'NT 6.0',
      '7': 'NT 6.1',
      '8': 'NT 6.2',
      '8.1': 'NT 6.3',
      '10': ['NT 6.4', 'NT 10.0'],
      'RT': 'ARM'
    }; //////////////
    // Regex map
    /////////////

    var regexes = {
      browser: [[/\b(?:crmo|crios)\/([\w\.]+)/i // Chrome for Android/iOS
      ], [VERSION, [NAME, 'Chrome']], [/edg(?:e|ios|a)?\/([\w\.]+)/i // Microsoft Edge
      ], [VERSION, [NAME, 'Edge']], [// Presto based
      /(opera mini)\/([-\w\.]+)/i, // Opera Mini
      /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i, // Opera Mobi/Tablet
      /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i // Opera
      ], [NAME, VERSION], [/opios[\/ ]+([\w\.]+)/i // Opera mini on iphone >= 8.0
      ], [VERSION, [NAME, OPERA + ' Mini']], [/\bopr\/([\w\.]+)/i // Opera Webkit
      ], [VERSION, [NAME, OPERA]], [// Mixed
      /(kindle)\/([\w\.]+)/i, // Kindle
      /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i, // Lunascape/Maxthon/Netfront/Jasmine/Blazer
      // Trident based
      /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i, // Avant/IEMobile/SlimBrowser
      /(ba?idubrowser)[\/ ]?([\w\.]+)/i, // Baidu Browser
      /(?:ms|\()(ie) ([\w\.]+)/i, // Internet Explorer
      // Webkit/KHTML based                                               // Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
      /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq)\/([-\w\.]+)/i, // Rekonq/Puffin/Brave/Whale/QQBrowserLite/QQ, aka ShouQ
      /(weibo)__([\d\.]+)/i // Weibo
      ], [NAME, VERSION], [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i // UCBrowser
      ], [VERSION, [NAME, 'UC' + BROWSER]], [/\bqbcore\/([\w\.]+)/i // WeChat Desktop for Windows Built-in Browser
      ], [VERSION, [NAME, 'WeChat(Win) Desktop']], [/micromessenger\/([\w\.]+)/i // WeChat
      ], [VERSION, [NAME, 'WeChat']], [/konqueror\/([\w\.]+)/i // Konqueror
      ], [VERSION, [NAME, 'Konqueror']], [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i // IE11
      ], [VERSION, [NAME, 'IE']], [/yabrowser\/([\w\.]+)/i // Yandex
      ], [VERSION, [NAME, 'Yandex']], [/(avast|avg)\/([\w\.]+)/i // Avast/AVG Secure Browser
      ], [[NAME, /(.+)/, '$1 Secure ' + BROWSER], VERSION], [/\bfocus\/([\w\.]+)/i // Firefox Focus
      ], [VERSION, [NAME, FIREFOX + ' Focus']], [/\bopt\/([\w\.]+)/i // Opera Touch
      ], [VERSION, [NAME, OPERA + ' Touch']], [/coc_coc\w+\/([\w\.]+)/i // Coc Coc Browser
      ], [VERSION, [NAME, 'Coc Coc']], [/dolfin\/([\w\.]+)/i // Dolphin
      ], [VERSION, [NAME, 'Dolphin']], [/coast\/([\w\.]+)/i // Opera Coast
      ], [VERSION, [NAME, OPERA + ' Coast']], [/miuibrowser\/([\w\.]+)/i // MIUI Browser
      ], [VERSION, [NAME, 'MIUI ' + BROWSER]], [/fxios\/([-\w\.]+)/i // Firefox for iOS
      ], [VERSION, [NAME, FIREFOX]], [/\bqihu|(qi?ho?o?|360)browser/i // 360
      ], [[NAME, '360 ' + BROWSER]], [/(oculus|samsung|sailfish)browser\/([\w\.]+)/i], [[NAME, /(.+)/, '$1 ' + BROWSER], VERSION], [// Oculus/Samsung/Sailfish Browser
      /(comodo_dragon)\/([\w\.]+)/i // Comodo Dragon
      ], [[NAME, /_/g, ' '], VERSION], [/(electron)\/([\w\.]+) safari/i, // Electron-based App
      /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i, // Tesla
      /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i // QQBrowser/Baidu App/2345 Browser
      ], [NAME, VERSION], [/(metasr)[\/ ]?([\w\.]+)/i, // SouGouBrowser
      /(lbbrowser)/i // LieBao Browser
      ], [NAME], [// WebView
      /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i // Facebook App for iOS & Android
      ], [[NAME, FACEBOOK], VERSION], [/safari (line)\/([\w\.]+)/i, // Line App for iOS
      /\b(line)\/([\w\.]+)\/iab/i, // Line App for Android
      /(chromium|instagram)[\/ ]([-\w\.]+)/i // Chromium/Instagram
      ], [NAME, VERSION], [/\bgsa\/([\w\.]+) .*safari\//i // Google Search Appliance on iOS
      ], [VERSION, [NAME, 'GSA']], [/headlesschrome(?:\/([\w\.]+)| )/i // Chrome Headless
      ], [VERSION, [NAME, CHROME + ' Headless']], [/ wv\).+(chrome)\/([\w\.]+)/i // Chrome WebView
      ], [[NAME, CHROME + ' WebView'], VERSION], [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i // Android Browser
      ], [VERSION, [NAME, 'Android ' + BROWSER]], [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i // Chrome/OmniWeb/Arora/Tizen/Nokia
      ], [NAME, VERSION], [/version\/([\w\.]+) .*mobile\/\w+ (safari)/i // Mobile Safari
      ], [VERSION, [NAME, 'Mobile Safari']], [/version\/([\w\.]+) .*(mobile ?safari|safari)/i // Safari & Safari Mobile
      ], [VERSION, NAME], [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i // Safari < 3.0
      ], [NAME, [VERSION, strMapper, oldSafariMap]], [/(webkit|khtml)\/([\w\.]+)/i], [NAME, VERSION], [// Gecko based
      /(navigator|netscape\d?)\/([-\w\.]+)/i // Netscape
      ], [[NAME, 'Netscape'], VERSION], [/mobile vr; rv:([\w\.]+)\).+firefox/i // Firefox Reality
      ], [VERSION, [NAME, FIREFOX + ' Reality']], [/ekiohf.+(flow)\/([\w\.]+)/i, // Flow
      /(swiftfox)/i, // Swiftfox
      /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i, // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror/Klar
      /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i, // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
      /(firefox)\/([\w\.]+)/i, // Other Firefox-based
      /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i, // Mozilla
      // Other
      /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i, // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir/Obigo/Mosaic/Go/ICE/UP.Browser
      /(links) \(([\w\.]+)/i // Links
      ], [NAME, VERSION]],
      cpu: [[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i // AMD64 (x64)
      ], [[ARCHITECTURE, 'amd64']], [/(ia32(?=;))/i // IA32 (quicktime)
      ], [[ARCHITECTURE, lowerize]], [/((?:i[346]|x)86)[;\)]/i // IA32 (x86)
      ], [[ARCHITECTURE, 'ia32']], [/\b(aarch64|arm(v?8e?l?|_?64))\b/i // ARM64
      ], [[ARCHITECTURE, 'arm64']], [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i // ARMHF
      ], [[ARCHITECTURE, 'armhf']], [// PocketPC mistakenly identified as PowerPC
      /windows (ce|mobile); ppc;/i], [[ARCHITECTURE, 'arm']], [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i // PowerPC
      ], [[ARCHITECTURE, /ower/, EMPTY, lowerize]], [/(sun4\w)[;\)]/i // SPARC
      ], [[ARCHITECTURE, 'sparc']], [/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
      ], [[ARCHITECTURE, lowerize]]],
      device: [[//////////////////////////
      // MOBILES & TABLETS
      // Ordered by popularity
      /////////////////////////
      // Samsung
      /\b(sch-i[89]0\d|shw-m380s|sm-[pt]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i], [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]], [/\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i], [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]], [// Apple
      /\((ip(?:hone|od)[\w ]*);/i // iPod/iPhone
      ], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [/\((ipad);[-\w\),; ]+apple/i, // iPad
      /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [// Huawei
      /\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i], [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]], [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}-[atu]?[ln][01259x][012359][an]?)\b(?!.+d\/s)/i], [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]], [// Xiaomi
      /\b(poco[\w ]+)(?: bui|\))/i, // Xiaomi POCO
      /\b; (\w+) build\/hm\1/i, // Xiaomi Hongmi 'numeric' models
      /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i, // Xiaomi Hongmi
      /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i, // Xiaomi Redmi
      /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i // Xiaomi Mi
      ], [[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, MOBILE]], [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i // Mi Pad tablets
      ], [[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, TABLET]], [// OPPO
      /; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i], [MODEL, [VENDOR, 'OPPO'], [TYPE, MOBILE]], [// Vivo
      /vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i], [MODEL, [VENDOR, 'Vivo'], [TYPE, MOBILE]], [// Realme
      /\b(rmx[12]\d{3})(?: bui|;|\))/i], [MODEL, [VENDOR, 'Realme'], [TYPE, MOBILE]], [// Motorola
      /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i, /\bmot(?:orola)?[- ](\w*)/i, /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i], [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]], [/\b(mz60\d|xoom[2 ]{0,2}) build\//i], [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]], [// LG
      /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i], [MODEL, [VENDOR, LG], [TYPE, TABLET]], [/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i, /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i, /\blg-?([\d\w]+) bui/i], [MODEL, [VENDOR, LG], [TYPE, MOBILE]], [// Lenovo
      /(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [// Nokia
      /(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i], [[MODEL, /_/g, ' '], [VENDOR, 'Nokia'], [TYPE, MOBILE]], [// Google
      /(pixel c)\b/i // Google Pixel C
      ], [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]], [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i // Google Pixel
      ], [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]], [// Sony
      /droid.+ ([c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i], [MODEL, [VENDOR, SONY], [TYPE, MOBILE]], [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i], [[MODEL, 'Xperia Tablet'], [VENDOR, SONY], [TYPE, TABLET]], [// OnePlus
      / (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [// Amazon
      /(alexa)webm/i, /(kf[a-z]{2}wi)( bui|\))/i, // Kindle Fire without Silk
      /(kf[a-z]+)( bui|\)).+silk\//i // Kindle Fire HD
      ], [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]], [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i // Fire Phone
      ], [[MODEL, /(.+)/g, 'Fire Phone $1'], [VENDOR, AMAZON], [TYPE, MOBILE]], [// BlackBerry
      /(playbook);[-\w\),; ]+(rim)/i // BlackBerry PlayBook
      ], [MODEL, VENDOR, [TYPE, TABLET]], [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i // BlackBerry 10
      ], [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]], [// Asus
      /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i], [MODEL, [VENDOR, ASUS], [TYPE, TABLET]], [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i], [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]], [// HTC
      /(nexus 9)/i // HTC Nexus 9
      ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i, // HTC
      // ZTE
      /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i, /(alcatel|geeksphone|nexian|panasonic|sony)[-_ ]?([-\w]*)/i // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
      ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [// Acer
      /droid.+; ([ab][1-7]-?[0178a]\d\d?)/i], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [// Meizu
      /droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i], [MODEL, [VENDOR, 'Meizu'], [TYPE, MOBILE]], [// Sharp
      /\b(sh-?[altvz]?\d\d[a-ekm]?)/i], [MODEL, [VENDOR, 'Sharp'], [TYPE, MOBILE]], [// MIXED
      /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i, // BlackBerry/BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
      /(hp) ([\w ]+\w)/i, // HP iPAQ
      /(asus)-?(\w+)/i, // Asus
      /(microsoft); (lumia[\w ]+)/i, // Microsoft Lumia
      /(lenovo)[-_ ]?([-\w]+)/i, // Lenovo
      /(jolla)/i, // Jolla
      /(oppo) ?([\w ]+) bui/i // OPPO
      ], [VENDOR, MODEL, [TYPE, MOBILE]], [/(archos) (gamepad2?)/i, // Archos
      /(hp).+(touchpad(?!.+tablet)|tablet)/i, // HP TouchPad
      /(kindle)\/([\w\.]+)/i, // Kindle
      /(nook)[\w ]+build\/(\w+)/i, // Nook
      /(dell) (strea[kpr\d ]*[\dko])/i, // Dell Streak
      /(le[- ]+pan)[- ]+(\w{1,9}) bui/i, // Le Pan Tablets
      /(trinity)[- ]*(t\d{3}) bui/i, // Trinity Tablets
      /(gigaset)[- ]+(q\w{1,9}) bui/i, // Gigaset Tablets
      /(vodafone) ([\w ]+)(?:\)| bui)/i // Vodafone
      ], [VENDOR, MODEL, [TYPE, TABLET]], [/(surface duo)/i // Surface Duo
      ], [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]], [/droid [\d\.]+; (fp\du?)(?: b|\))/i // Fairphone
      ], [MODEL, [VENDOR, 'Fairphone'], [TYPE, MOBILE]], [/(u304aa)/i // AT&T
      ], [MODEL, [VENDOR, 'AT&T'], [TYPE, MOBILE]], [/\bsie-(\w*)/i // Siemens
      ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [/\b(rct\w+) b/i // RCA Tablets
      ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [/\b(venue[\d ]{2,7}) b/i // Dell Venue Tablets
      ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [/\b(q(?:mv|ta)\w+) b/i // Verizon Tablet
      ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i // Barnes & Noble Tablet
      ], [MODEL, [VENDOR, 'Barnes & Noble'], [TYPE, TABLET]], [/\b(tm\d{3}\w+) b/i], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [/\b(k88) b/i // ZTE K Series Tablet
      ], [MODEL, [VENDOR, 'ZTE'], [TYPE, TABLET]], [/\b(nx\d{3}j) b/i // ZTE Nubia
      ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [/\b(gen\d{3}) b.+49h/i // Swiss GEN Mobile
      ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [/\b(zur\d{3}) b/i // Swiss ZUR Tablet
      ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [/\b((zeki)?tb.*\b) b/i // Zeki Tablets
      ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i // Dragon Touch Tablet
      ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [/\b(ns-?\w{0,9}) b/i // Insignia Tablets
      ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [/\b((nxa|next)-?\w{0,9}) b/i // NextBook Tablets
      ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i // Voice Xtreme Phones
      ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [/\b(lvtel\-)?(v1[12]) b/i // LvTel Phones
      ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [/\b(ph-1) /i // Essential PH-1
      ], [MODEL, [VENDOR, 'Essential'], [TYPE, MOBILE]], [/\b(v(100md|700na|7011|917g).*\b) b/i // Envizen Tablets
      ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [/\b(trio[-\w\. ]+) b/i // MachSpeed Tablets
      ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [/\btu_(1491) b/i // Rotor Tablets
      ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [/(shield[\w ]+) b/i // Nvidia Shield Tablets
      ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, TABLET]], [/(sprint) (\w+)/i // Sprint Phones
      ], [VENDOR, MODEL, [TYPE, MOBILE]], [/(kin\.[onetw]{3})/i // Microsoft Kin
      ], [[MODEL, /\./g, ' '], [VENDOR, MICROSOFT], [TYPE, MOBILE]], [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i // Zebra
      ], [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]], [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i], [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]], [///////////////////
      // CONSOLES
      ///////////////////
      /(ouya)/i, // Ouya
      /(nintendo) ([wids3utch]+)/i // Nintendo
      ], [VENDOR, MODEL, [TYPE, CONSOLE]], [/droid.+; (shield) bui/i // Nvidia
      ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [/(playstation [345portablevi]+)/i // Playstation
      ], [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]], [/\b(xbox(?: one)?(?!; xbox))[\); ]/i // Microsoft Xbox
      ], [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]], [///////////////////
      // SMARTTVS
      ///////////////////
      /smart-tv.+(samsung)/i // Samsung
      ], [VENDOR, [TYPE, SMARTTV]], [/hbbtv.+maple;(\d+)/i], [[MODEL, /^/, 'SmartTV'], [VENDOR, SAMSUNG], [TYPE, SMARTTV]], [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i // LG SmartTV
      ], [[VENDOR, LG], [TYPE, SMARTTV]], [/(apple) ?tv/i // Apple TV
      ], [VENDOR, [MODEL, APPLE + ' TV'], [TYPE, SMARTTV]], [/crkey/i // Google Chromecast
      ], [[MODEL, CHROME + 'cast'], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [/droid.+aft(\w)( bui|\))/i // Fire TV
      ], [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]], [/\(dtv[\);].+(aquos)/i // Sharp
      ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, // Roku
      /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i // HbbTV devices
      ], [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]], [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i // SmartTV from Unidentified Vendors
      ], [[TYPE, SMARTTV]], [///////////////////
      // WEARABLES
      ///////////////////
      /((pebble))app/i // Pebble
      ], [VENDOR, MODEL, [TYPE, WEARABLE]], [/droid.+; (glass) \d/i // Google Glass
      ], [MODEL, [VENDOR, GOOGLE], [TYPE, WEARABLE]], [/droid.+; (wt63?0{2,3})\)/i], [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]], [/(quest( 2)?)/i // Oculus Quest
      ], [MODEL, [VENDOR, FACEBOOK], [TYPE, WEARABLE]], [///////////////////
      // EMBEDDED
      ///////////////////
      /(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i // Tesla
      ], [VENDOR, [TYPE, EMBEDDED]], [////////////////////
      // MIXED (GENERIC)
      ///////////////////
      /droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i // Android Phones from Unidentified Vendors
      ], [MODEL, [TYPE, MOBILE]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i // Android Tablets from Unidentified Vendors
      ], [MODEL, [TYPE, TABLET]], [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i // Unidentifiable Tablet
      ], [[TYPE, TABLET]], [/(phone|mobile(?:[;\/]| safari)|pda(?=.+windows ce))/i // Unidentifiable Mobile
      ], [[TYPE, MOBILE]], [/(android[-\w\. ]{0,9});.+buil/i // Generic Android Device
      ], [MODEL, [VENDOR, 'Generic']]],
      engine: [[/windows.+ edge\/([\w\.]+)/i // EdgeHTML
      ], [VERSION, [NAME, EDGE + 'HTML']], [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i // Blink
      ], [VERSION, [NAME, 'Blink']], [/(presto)\/([\w\.]+)/i, // Presto
      /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna
      /ekioh(flow)\/([\w\.]+)/i, // Flow
      /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i, // KHTML/Tasman/Links
      /(icab)[\/ ]([23]\.[\d\.]+)/i // iCab
      ], [NAME, VERSION], [/rv\:([\w\.]{1,9})\b.+(gecko)/i // Gecko
      ], [VERSION, NAME]],
      os: [[// Windows
      /microsoft (windows) (vista|xp)/i // Windows (iTunes)
      ], [NAME, VERSION], [/(windows) nt 6\.2; (arm)/i, // Windows RT
      /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i, // Windows Phone
      /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i], [NAME, [VERSION, strMapper, windowsVersionMap]], [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i], [[NAME, 'Windows'], [VERSION, strMapper, windowsVersionMap]], [// iOS/macOS
      /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, // iOS
      /cfnetwork\/.+darwin/i], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i // Mac OS
      ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [// Mobile OSes
      /droid ([\w\.]+)\b.+(android[- ]x86)/i // Android-x86
      ], [VERSION, NAME], [// Android/WebOS/QNX/Bada/RIM/Maemo/MeeGo/Sailfish OS
      /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i, /(blackberry)\w*\/([\w\.]*)/i, // Blackberry
      /(tizen|kaios)[\/ ]([\w\.]+)/i, // Tizen/KaiOS
      /\((series40);/i // Series 40
      ], [NAME, VERSION], [/\(bb(10);/i // BlackBerry 10
      ], [VERSION, [NAME, BLACKBERRY]], [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i // Symbian
      ], [VERSION, [NAME, 'Symbian']], [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i // Firefox OS
      ], [VERSION, [NAME, FIREFOX + ' OS']], [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i // WebOS
      ], [VERSION, [NAME, 'webOS']], [// Google Chromecast
      /crkey\/([\d\.]+)/i // Google Chromecast
      ], [VERSION, [NAME, CHROME + 'cast']], [/(cros) [\w]+ ([\w\.]+\w)/i // Chromium OS
      ], [[NAME, 'Chromium OS'], VERSION], [// Console
      /(nintendo|playstation) ([wids345portablevuch]+)/i, // Nintendo/Playstation
      /(xbox); +xbox ([^\);]+)/i, // Microsoft Xbox (360, One, X, S, Series X, Series S)
      // Other
      /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i, // Joli/Palm
      /(mint)[\/\(\) ]?(\w*)/i, // Mint
      /(mageia|vectorlinux)[; ]/i, // Mageia/VectorLinux
      /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i, // Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware/Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus/Raspbian/Plan9/Minix/RISCOS/Contiki/Deepin/Manjaro/elementary/Sabayon/Linspire
      /(hurd|linux) ?([\w\.]*)/i, // Hurd/Linux
      /(gnu) ?([\w\.]*)/i, // GNU
      /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, // FreeBSD/NetBSD/OpenBSD/PC-BSD/GhostBSD/DragonFly
      /(haiku) (\w+)/i // Haiku
      ], [NAME, VERSION], [/(sunos) ?([\w\.\d]*)/i // Solaris
      ], [[NAME, 'Solaris'], VERSION], [/((?:open)?solaris)[-\/ ]?([\w\.]*)/i, // Solaris
      /(aix) ((\d)(?=\.|\)| )[\w\.])*/i, // AIX
      /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i, // BeOS/OS2/AmigaOS/MorphOS/OpenVMS/Fuchsia/HP-UX
      /(unix) ?([\w\.]*)/i // UNIX
      ], [NAME, VERSION]]
    }; /////////////////
    // Constructor
    ////////////////

    var UAParser = function (ua, extensions) {
      if (typeof ua === OBJ_TYPE) {
        extensions = ua;
        ua = undefined$1;
      }

      if (!(this instanceof UAParser)) {
        return new UAParser(ua, extensions).getResult();
      }

      var _ua = ua || (typeof window !== UNDEF_TYPE && window.navigator && window.navigator.userAgent ? window.navigator.userAgent : EMPTY);

      var _rgxmap = extensions ? extend(regexes, extensions) : regexes;

      this.getBrowser = function () {
        var _browser = {};
        _browser[NAME] = undefined$1;
        _browser[VERSION] = undefined$1;
        rgxMapper.call(_browser, _ua, _rgxmap.browser);
        _browser.major = majorize(_browser.version);
        return _browser;
      };

      this.getCPU = function () {
        var _cpu = {};
        _cpu[ARCHITECTURE] = undefined$1;
        rgxMapper.call(_cpu, _ua, _rgxmap.cpu);
        return _cpu;
      };

      this.getDevice = function () {
        var _device = {};
        _device[VENDOR] = undefined$1;
        _device[MODEL] = undefined$1;
        _device[TYPE] = undefined$1;
        rgxMapper.call(_device, _ua, _rgxmap.device);
        return _device;
      };

      this.getEngine = function () {
        var _engine = {};
        _engine[NAME] = undefined$1;
        _engine[VERSION] = undefined$1;
        rgxMapper.call(_engine, _ua, _rgxmap.engine);
        return _engine;
      };

      this.getOS = function () {
        var _os = {};
        _os[NAME] = undefined$1;
        _os[VERSION] = undefined$1;
        rgxMapper.call(_os, _ua, _rgxmap.os);
        return _os;
      };

      this.getResult = function () {
        return {
          ua: this.getUA(),
          browser: this.getBrowser(),
          engine: this.getEngine(),
          os: this.getOS(),
          device: this.getDevice(),
          cpu: this.getCPU()
        };
      };

      this.getUA = function () {
        return _ua;
      };

      this.setUA = function (ua) {
        _ua = typeof ua === STR_TYPE && ua.length > UA_MAX_LENGTH ? trim(ua, UA_MAX_LENGTH) : ua;
        return this;
      };

      this.setUA(_ua);
      return this;
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = enumerize([NAME, VERSION, MAJOR]);
    UAParser.CPU = enumerize([ARCHITECTURE]);
    UAParser.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
    UAParser.ENGINE = UAParser.OS = enumerize([NAME, VERSION]); ///////////
    // Export
    //////////
    // check js environment

    {
      // nodejs env
      if (module.exports) {
        exports = module.exports = UAParser;
      }

      exports.UAParser = UAParser;
    } // jQuery/Zepto specific (optional)
    // Note:
    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
    //   and we should catch that.


    var $ = typeof window !== UNDEF_TYPE && (window.jQuery || window.Zepto);

    if ($ && !$.ua) {
      var parser = new UAParser();
      $.ua = parser.getResult();

      $.ua.get = function () {
        return parser.getUA();
      };

      $.ua.set = function (ua) {
        parser.setUA(ua);
        var result = parser.getResult();

        for (var prop in result) {
          $.ua[prop] = result[prop];
        }
      };
    }
  })(typeof window === 'object' ? window : commonjsGlobal);
})(uaParser, uaParser.exports);

var UAParser = uaParser.exports;

var version$1 = "1.3.3";

const version = version$1;
const protocolVersion = 8;

const separator = '|';
function unpackStreamId(packed) {
  const parts = packed.split(separator);

  if (parts.length > 1) {
    return [parts[0], packed.substr(parts[0].length + 1)];
  }

  return [packed, ''];
}
async function sleep(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}
/** @internal */

function supportsTransceiver() {
  return 'addTransceiver' in RTCPeerConnection.prototype;
}
/** @internal */

function supportsAddTrack() {
  return 'addTrack' in RTCPeerConnection.prototype;
}
const setCodecPreferencesVersions = {
  Chrome: '100',
  Chromium: '100',
  Safari: '15',
  Firefox: '100',
  Edge: '100',
  Brave: '1.40'
};
function supportsSetCodecPreferences(transceiver) {
  if (!isWeb()) {
    return false;
  }

  if (!('setCodecPreferences' in transceiver)) {
    return false;
  }

  const uap = UAParser();

  if (!uap.browser.name || !uap.browser.version) {
    // version is required
    return false;
  }

  const v = setCodecPreferencesVersions[uap.browser.name];

  if (v) {
    return compareVersions(uap.browser.version, v) >= 0;
  }

  return false;
}
function isFireFox() {
  if (!isWeb()) return false;
  return navigator.userAgent.indexOf('Firefox') !== -1;
}
function isSafari() {
  if (!isWeb()) return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}
function isMobile() {
  if (!isWeb()) return false;
  return /Tablet|iPad|Mobile|Android|BlackBerry/.test(navigator.userAgent);
}
function isWeb() {
  return typeof document !== 'undefined';
}
function compareVersions(v1, v2) {
  const parts1 = v1.split('.');
  const parts2 = v2.split('.');
  const k = Math.min(v1.length, v2.length);

  for (let i = 0; i < k; ++i) {
    const p1 = parseInt(parts1[i], 10);
    const p2 = parseInt(parts2[i], 10);
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return parts1.length == parts2.length ? 0 : parts1.length < parts2.length ? -1 : 1;
}

function roDispatchCallback(entries) {
  for (const entry of entries) {
    entry.target.handleResize(entry);
  }
}

function ioDispatchCallback(entries) {
  for (const entry of entries) {
    entry.target.handleVisibilityChanged(entry);
  }
}

let resizeObserver = null;
const getResizeObserver = () => {
  if (!resizeObserver) resizeObserver = new ResizeObserver(roDispatchCallback);
  return resizeObserver;
};
let intersectionObserver = null;
const getIntersectionObserver = () => {
  if (!intersectionObserver) intersectionObserver = new IntersectionObserver(ioDispatchCallback, {
    root: document,
    rootMargin: '0px'
  });
  return intersectionObserver;
};
function getClientInfo() {
  const info = ClientInfo.fromPartial({
    sdk: ClientInfo_SDK.JS,
    protocol: protocolVersion,
    version
  });
  return info;
}
let emptyVideoStreamTrack;
function getEmptyVideoStreamTrack() {
  var _a;

  if (!emptyVideoStreamTrack) {
    const canvas = document.createElement('canvas'); // the canvas size is set to 16, because electron apps seem to fail with smaller values

    canvas.width = 16;
    canvas.height = 16;
    (_a = canvas.getContext('2d')) === null || _a === void 0 ? void 0 : _a.fillRect(0, 0, canvas.width, canvas.height); // @ts-ignore

    const emptyStream = canvas.captureStream();
    [emptyVideoStreamTrack] = emptyStream.getTracks();

    if (!emptyVideoStreamTrack) {
      throw Error('Could not get empty media stream video track');
    }

    emptyVideoStreamTrack.enabled = false;
  }

  return emptyVideoStreamTrack;
}
let emptyAudioStreamTrack;
function getEmptyAudioStreamTrack() {
  if (!emptyAudioStreamTrack) {
    // implementation adapted from https://blog.mozilla.org/webrtc/warm-up-with-replacetrack/
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = ctx.createMediaStreamDestination();
    oscillator.connect(dst);
    oscillator.start();
    [emptyAudioStreamTrack] = dst.stream.getAudioTracks();

    if (!emptyAudioStreamTrack) {
      throw Error('Could not get empty media stream audio track');
    }

    emptyAudioStreamTrack.enabled = false;
  }

  return emptyAudioStreamTrack;
}
class Future {
  constructor(futureBase, onFinally) {
    this.onFinally = onFinally;
    this.promise = new Promise(async (resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;

      if (futureBase) {
        await futureBase(resolve, reject);
      }
    }).finally(() => {
      var _a;

      return (_a = this.onFinally) === null || _a === void 0 ? void 0 : _a.call(this);
    });
  }

}

class Queue {
  /**
   * @class Queue
   * 
   * Priority queue with rate limiting<br>
   * See the medium article:<br>
   * https://mmomtchev.medium.com/parallelizing-download-loops-in-js-with-async-await-queue-670420880cd6
   * 
   * @param {number} [_maxConcurrent=1] Number of tasks allowed to run simultaneously
   * @param {number} [_minCycle=0] Minimum number of milliseconds between two consecutive tasks
   */
  constructor(_maxConcurrent, _minCycle) {
    this.maxConcurrent = _maxConcurrent || 1;
    this.minCycle = _minCycle || 0;
    this.queueRunning = [];
    this.queueWaiting = {};
    this.lastRun = 0;
  }
  /** @private */


  dequeue(hash) {
    const q = this.queueRunning;
    const idx = q.findIndex(x => x.hash === hash);
    if (idx == -1) throw 'queue desync';
    const o = q[idx];
    q.splice(idx, 1);
    return o;
  }
  /** @private */


  getFirstWaiting() {
    for (let p of Object.keys(this.queueWaiting).sort((a, b) => a - b)) if (this.queueWaiting[p] !== undefined && this.queueWaiting[p].length > 0) return this.queueWaiting[p];

    return undefined;
  }
  /**
   * Signal that the task `hash` has finished.<br>
   * Frees its slot in the queue
   * 
   * @method end
   * @param {any} hash Unique hash identifying the task, Symbol() works very well
   */


  end(hash) {
    const me = this.dequeue(hash);
    me.resolve();
    /* Choose the next task to run and unblock its promise */

    const q = this.getFirstWaiting();

    if (q !== undefined) {
      const next = q.shift();
      next.resolve();
    }
  }
  /**
   * Wait for a slot in the queue
   * 
   * @method wait
   * @param {any} hash Unique hash identifying the task
   * @param {number} [priority=0] Optional priority, -1 is higher priority than 1
   * @return {Promise<void>} Resolved when the task is ready to run
   */


  async wait(hash, _priority) {
    const priority = _priority === undefined ? 0 : _priority;
    /* Us on the queue */

    let me = {
      hash,
      priority
    };
    /* Create priorities on the fly */

    if (this.queueWaiting[priority] == undefined) this.queueWaiting[priority] = [];
    /* Are we allowed to run? */

    if (this.queueRunning.length >= this.maxConcurrent) {
      /* This promise will be unlocked from the outside */

      /* and it cannot reject */
      me.promise = new Promise(resolve => {
        me.resolve = resolve;
      });
      /* Get in the line */

      this.queueWaiting[priority].push(me);
      await me.promise;
    }

    this.queueRunning.push(me);
    me.promise = new Promise(resolve => {
      me.resolve = resolve;
    });
    /* Wait if it is too soon */

    while (Date.now() - this.lastRun < this.minCycle) {
      await new Promise(resolve => setTimeout(resolve, this.minCycle - Date.now() + this.lastRun));
    }

    this.lastRun = Date.now();
  }
  /**
   * Run a job (equivalent to calling Queue.wait(), fn() and then Queue.end())<br>
   * fn can be both synchronous or asynchronous function
   * 
   * @method run
   * @param {Function} fn The job
   * @param {number} [priority=0] Optional priority, -1 is higher priority than 1
   * @return {Promise<any>} Resolved when the task has finished with the return value of fn
   */


  run(job, _priority) {
    const priority = _priority === undefined ? 0 : _priority;
    const id = Symbol();
    return this.wait(id, priority).then(() => job()).finally(() => {
      this.end(id);
    });
  }
  /**
   * @interface QueueStats {running: number, waiting: number, last: number}
   */

  /**
   * Return the number of running and waiting jobs
   * 
   * @method stat
   * @return {QueueStats} running, waiting, last
   */


  stat() {
    return {
      running: this.queueRunning.length,
      waiting: Object.keys(this.queueWaiting).reduce((t, x) => t += this.queueWaiting[x].length, 0),
      last: this.lastRun
    };
  }
  /**
   * Returns a promise that resolves when the queue is empty
   * 
   * @method flush
   * @return {Promise<void>}
   */


  async flush() {
    /* Aways wait on the lowest priority in the queue */
    while (this.stat().waiting > 0) {
      for (let p of Object.keys(this.queueWaiting).sort((a, b) => b - a)) {
        const qp = this.queueWaiting[p];

        if (qp !== undefined && qp.length > 0) {
          await qp[qp.length - 1].promise;
        }
      }
    }
    /* And then finish on the running queue */


    while (this.queueRunning.length > 0) {
      await Promise.allSettled(this.queueRunning.map(x => x.promise));
    }
  }

}

const defaultId = 'default';
class DeviceManager {
  static getInstance() {
    if (this.instance === undefined) {
      this.instance = new DeviceManager();
    }

    return this.instance;
  }

  async getDevices(kind) {
    let requestPermissions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    var _a;

    if (((_a = DeviceManager.userMediaPromiseMap) === null || _a === void 0 ? void 0 : _a.size) > 0) {
      livekitLogger.debug('awaiting getUserMedia promise');

      try {
        if (kind) {
          await DeviceManager.userMediaPromiseMap.get(kind);
        } else {
          await Promise.all(DeviceManager.userMediaPromiseMap.values());
        }
      } catch (e) {
        livekitLogger.warn('error waiting for media permissons');
      }
    }

    let devices = await navigator.mediaDevices.enumerateDevices();

    if (requestPermissions && kind && ( // for safari we need to skip this check, as otherwise it will re-acquire user media and fail on iOS https://bugs.webkit.org/show_bug.cgi?id=179363
    !DeviceManager.userMediaPromiseMap.get(kind) || !isSafari())) {
      const isDummyDeviceOrEmpty = devices.length === 0 || devices.some(device => {
        const noLabel = device.label === '';
        const isRelevant = kind ? device.kind === kind : true;
        return noLabel && isRelevant;
      });

      if (isDummyDeviceOrEmpty) {
        const permissionsToAcquire = {
          video: kind !== 'audioinput' && kind !== 'audiooutput',
          audio: kind !== 'videoinput'
        };
        const stream = await navigator.mediaDevices.getUserMedia(permissionsToAcquire);
        devices = await navigator.mediaDevices.enumerateDevices();
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    }

    if (kind) {
      devices = devices.filter(device => device.kind === kind);
    } // Chrome returns 'default' devices, we would filter them out, but put the default
    // device at first
    // we would only do this if there are more than 1 device though


    if (devices.length > 1 && devices[0].deviceId === defaultId) {
      // find another device with matching group id, and move that to 0
      const defaultDevice = devices[0];

      for (let i = 1; i < devices.length; i += 1) {
        if (devices[i].groupId === defaultDevice.groupId) {
          const temp = devices[0];
          devices[0] = devices[i];
          devices[i] = temp;
          break;
        }
      }

      return devices.filter(device => device !== defaultDevice);
    }

    return devices;
  }

  async normalizeDeviceId(kind, deviceId, groupId) {
    if (deviceId !== defaultId) {
      return deviceId;
    } // resolve actual device id if it's 'default': Chrome returns it when no
    // device has been chosen


    const devices = await this.getDevices(kind);
    const device = devices.find(d => d.groupId === groupId && d.deviceId !== defaultId);
    return device === null || device === void 0 ? void 0 : device.deviceId;
  }

}
DeviceManager.mediaDeviceKinds = ['audioinput', 'audiooutput', 'videoinput'];
DeviceManager.userMediaPromiseMap = new Map();

var events = {exports: {}};

var R = typeof Reflect === 'object' ? Reflect : null;
var ReflectApply = R && typeof R.apply === 'function' ? R.apply : function ReflectApply(target, receiver, args) {
  return Function.prototype.apply.call(target, receiver, args);
};
var ReflectOwnKeys;

if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
};

function EventEmitter() {
  EventEmitter.init.call(this);
}

events.exports = EventEmitter;
events.exports.once = once; // Backwards-compat with node 0.10.x

EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined; // By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.

var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function () {
    return defaultMaxListeners;
  },
  set: function (arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }

    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function () {
  if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}; // Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.


EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }

  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];

  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);

  var doError = type === 'error';
  var events = this._events;
  if (events !== undefined) doError = doError && events.error === undefined;else if (!doError) return false; // If there is no 'error' event listener then throw.

  if (doError) {
    var er;
    if (args.length > 0) er = args[0];

    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    } // At least give some kind of context to the user


    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];
  if (handler === undefined) return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);

    for (var i = 0; i < len; ++i) ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;
  checkListener(listener);
  events = target._events;

  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type, listener.listener ? listener.listener : listener); // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object

      events = target._events;
    }

    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] : [existing, listener]; // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    } // Check for listener leak


    m = _getMaxListeners(target);

    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true; // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax

      var w = new Error('Possible EventEmitter memory leak detected. ' + existing.length + ' ' + String(type) + ' listeners ' + 'added. Use emitter.setMaxListeners() to ' + 'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener = function prependListener(type, listener) {
  return _addListener(this, type, listener, true);
};

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0) return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = {
    fired: false,
    wrapFn: undefined,
    target: target,
    type: type,
    listener: listener
  };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
  checkListener(listener);
  this.prependListener(type, _onceWrap(this, type, listener));
  return this;
}; // Emits a 'removeListener' event if and only if the listener was removed.


EventEmitter.prototype.removeListener = function removeListener(type, listener) {
  var list, events, position, i, originalListener;
  checkListener(listener);
  events = this._events;
  if (events === undefined) return this;
  list = events[type];
  if (list === undefined) return this;

  if (list === listener || list.listener === listener) {
    if (--this._eventsCount === 0) this._events = Object.create(null);else {
      delete events[type];
      if (events.removeListener) this.emit('removeListener', type, list.listener || listener);
    }
  } else if (typeof list !== 'function') {
    position = -1;

    for (i = list.length - 1; i >= 0; i--) {
      if (list[i] === listener || list[i].listener === listener) {
        originalListener = list[i].listener;
        position = i;
        break;
      }
    }

    if (position < 0) return this;
    if (position === 0) list.shift();else {
      spliceOne(list, position);
    }
    if (list.length === 1) events[type] = list[0];
    if (events.removeListener !== undefined) this.emit('removeListener', type, originalListener || listener);
  }

  return this;
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
  var listeners, events, i;
  events = this._events;
  if (events === undefined) return this; // not listening for removeListener, no need to emit

  if (events.removeListener === undefined) {
    if (arguments.length === 0) {
      this._events = Object.create(null);
      this._eventsCount = 0;
    } else if (events[type] !== undefined) {
      if (--this._eventsCount === 0) this._events = Object.create(null);else delete events[type];
    }

    return this;
  } // emit removeListener for all listeners on all events


  if (arguments.length === 0) {
    var keys = Object.keys(events);
    var key;

    for (i = 0; i < keys.length; ++i) {
      key = keys[i];
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }

    this.removeAllListeners('removeListener');
    this._events = Object.create(null);
    this._eventsCount = 0;
    return this;
  }

  listeners = events[type];

  if (typeof listeners === 'function') {
    this.removeListener(type, listeners);
  } else if (listeners !== undefined) {
    // LIFO order
    for (i = listeners.length - 1; i >= 0; i--) {
      this.removeListener(type, listeners[i]);
    }
  }

  return this;
};

function _listeners(target, type, unwrap) {
  var events = target._events;
  if (events === undefined) return [];
  var evlistener = events[type];
  if (evlistener === undefined) return [];
  if (typeof evlistener === 'function') return unwrap ? [evlistener.listener || evlistener] : [evlistener];
  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function (emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;

function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);

  for (var i = 0; i < n; ++i) copy[i] = arr[i];

  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++) list[index] = list[index + 1];

  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);

  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }

  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }

      resolve([].slice.call(arguments));
    }
    eventTargetAgnosticAddListener(emitter, name, resolver, {
      once: true
    });

    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, {
        once: true
      });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }

      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

const BACKGROUND_REACTION_DELAY = 5000; // keep old audio elements when detached, we would re-use them since on iOS
// Safari tracks which audio elements have been "blessed" by the user.

const recycledElements = [];
class Track extends events.exports.EventEmitter {
  constructor(mediaTrack, kind) {
    super();
    this.attachedElements = [];
    this.isMuted = false;
    /**
     * indicates current state of stream
     */

    this.streamState = Track.StreamState.Active;
    this._currentBitrate = 0;

    this.appVisibilityChangedListener = () => {
      if (this.backgroundTimeout) {
        clearTimeout(this.backgroundTimeout);
      } // delay app visibility update if it goes to hidden
      // update immediately if it comes back to focus


      if (document.visibilityState === 'hidden') {
        this.backgroundTimeout = setTimeout(() => this.handleAppVisibilityChanged(), BACKGROUND_REACTION_DELAY);
      } else {
        this.handleAppVisibilityChanged();
      }
    };

    this.kind = kind;
    this._mediaStreamTrack = mediaTrack;
    this._mediaStreamID = mediaTrack.id;
    this.source = Track.Source.Unknown;

    if (isWeb()) {
      this.isInBackground = document.visibilityState === 'hidden';
      document.addEventListener('visibilitychange', this.appVisibilityChangedListener);
    } else {
      this.isInBackground = false;
    }
  }
  /** current receive bits per second */


  get currentBitrate() {
    return this._currentBitrate;
  }

  get mediaStreamTrack() {
    return this._mediaStreamTrack;
  }
  /**
   * @internal
   * used for keep mediaStream's first id, since it's id might change
   * if we disable/enable a track
   */


  get mediaStreamID() {
    return this._mediaStreamID;
  }

  attach(element) {
    let elementType = 'audio';

    if (this.kind === Track.Kind.Video) {
      elementType = 'video';
    }

    if (!element) {
      if (elementType === 'audio') {
        recycledElements.forEach(e => {
          if (e.parentElement === null && !element) {
            element = e;
          }
        });

        if (element) {
          // remove it from pool
          recycledElements.splice(recycledElements.indexOf(element), 1);
        }
      }

      if (!element) {
        element = document.createElement(elementType);
      }
    }

    if (!this.attachedElements.includes(element)) {
      this.attachedElements.push(element);
    } // even if we believe it's already attached to the element, it's possible
    // the element's srcObject was set to something else out of band.
    // we'll want to re-attach it in that case


    attachToElement(this._mediaStreamTrack, element);

    if (element instanceof HTMLAudioElement) {
      // manually play audio to detect audio playback status
      element.play().then(() => {
        this.emit(TrackEvent.AudioPlaybackStarted);
      }).catch(e => {
        this.emit(TrackEvent.AudioPlaybackFailed, e);
      });
    }

    this.emit(TrackEvent.ElementAttached, element);
    return element;
  }

  detach(element) {
    // detach from a single element
    if (element) {
      detachTrack(this._mediaStreamTrack, element);
      const idx = this.attachedElements.indexOf(element);

      if (idx >= 0) {
        this.attachedElements.splice(idx, 1);
        this.recycleElement(element);
        this.emit(TrackEvent.ElementDetached, element);
      }

      return element;
    }

    const detached = [];
    this.attachedElements.forEach(elm => {
      detachTrack(this._mediaStreamTrack, elm);
      detached.push(elm);
      this.recycleElement(elm);
      this.emit(TrackEvent.ElementDetached, elm);
    }); // remove all tracks

    this.attachedElements = [];
    return detached;
  }

  stop() {
    this.stopMonitor();

    this._mediaStreamTrack.stop();

    if (isWeb()) {
      document.removeEventListener('visibilitychange', this.appVisibilityChangedListener);
    }
  }

  enable() {
    this._mediaStreamTrack.enabled = true;
  }

  disable() {
    this._mediaStreamTrack.enabled = false;
  }
  /* @internal */


  stopMonitor() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
  }

  recycleElement(element) {
    if (element instanceof HTMLAudioElement) {
      // we only need to re-use a single element
      let shouldCache = true;
      element.pause();
      recycledElements.forEach(e => {
        if (!e.parentElement) {
          shouldCache = false;
        }
      });

      if (shouldCache) {
        recycledElements.push(element);
      }
    }
  }

  async handleAppVisibilityChanged() {
    this.isInBackground = document.visibilityState === 'hidden';
  }

}
/** @internal */

function attachToElement(track, element) {
  let mediaStream;

  if (element.srcObject instanceof MediaStream) {
    mediaStream = element.srcObject;
  } else {
    mediaStream = new MediaStream();
  } // check if track matches existing track


  let existingTracks;

  if (track.kind === 'audio') {
    existingTracks = mediaStream.getAudioTracks();
  } else {
    existingTracks = mediaStream.getVideoTracks();
  }

  if (!existingTracks.includes(track)) {
    existingTracks.forEach(et => {
      mediaStream.removeTrack(et);
    });
    mediaStream.addTrack(track);
  } // avoid flicker


  if (element.srcObject !== mediaStream) {
    element.srcObject = mediaStream;

    if ((isSafari() || isFireFox()) && element instanceof HTMLVideoElement) {
      // Firefox also has a timing issue where video doesn't actually get attached unless
      // performed out-of-band
      // Safari 15 has a bug where in certain layouts, video element renders
      // black until the page is resized or other changes take place.
      // Resetting the src triggers it to render.
      // https://developer.apple.com/forums/thread/690523
      setTimeout(() => {
        element.srcObject = mediaStream; // Safari 15 sometimes fails to start a video
        // when the window is backgrounded before the first frame is drawn
        // manually calling play here seems to fix that

        element.play().catch(() => {
          /* do nothing */
        });
      }, 0);
    }
  }

  element.autoplay = true;

  if (element instanceof HTMLVideoElement) {
    element.playsInline = true;
  }
}
/** @internal */

function detachTrack(track, element) {
  if (element.srcObject instanceof MediaStream) {
    const mediaStream = element.srcObject;
    mediaStream.removeTrack(track);

    if (mediaStream.getTracks().length > 0) {
      element.srcObject = mediaStream;
    } else {
      element.srcObject = null;
    }
  }
}

(function (Track) {
  let Kind;

  (function (Kind) {
    Kind["Audio"] = "audio";
    Kind["Video"] = "video";
    Kind["Unknown"] = "unknown";
  })(Kind = Track.Kind || (Track.Kind = {}));

  let Source;

  (function (Source) {
    Source["Camera"] = "camera";
    Source["Microphone"] = "microphone";
    Source["ScreenShare"] = "screen_share";
    Source["ScreenShareAudio"] = "screen_share_audio";
    Source["Unknown"] = "unknown";
  })(Source = Track.Source || (Track.Source = {}));

  let StreamState$1;

  (function (StreamState) {
    StreamState["Active"] = "active";
    StreamState["Paused"] = "paused";
    StreamState["Unknown"] = "unknown";
  })(StreamState$1 = Track.StreamState || (Track.StreamState = {}));
  /** @internal */


  function kindToProto(k) {
    switch (k) {
      case Kind.Audio:
        return TrackType.AUDIO;

      case Kind.Video:
        return TrackType.VIDEO;

      default:
        return TrackType.UNRECOGNIZED;
    }
  }

  Track.kindToProto = kindToProto;
  /** @internal */

  function kindFromProto(t) {
    switch (t) {
      case TrackType.AUDIO:
        return Kind.Audio;

      case TrackType.VIDEO:
        return Kind.Video;

      default:
        return Kind.Unknown;
    }
  }

  Track.kindFromProto = kindFromProto;
  /** @internal */

  function sourceToProto(s) {
    switch (s) {
      case Source.Camera:
        return TrackSource.CAMERA;

      case Source.Microphone:
        return TrackSource.MICROPHONE;

      case Source.ScreenShare:
        return TrackSource.SCREEN_SHARE;

      case Source.ScreenShareAudio:
        return TrackSource.SCREEN_SHARE_AUDIO;

      default:
        return TrackSource.UNRECOGNIZED;
    }
  }

  Track.sourceToProto = sourceToProto;
  /** @internal */

  function sourceFromProto(s) {
    switch (s) {
      case TrackSource.CAMERA:
        return Source.Camera;

      case TrackSource.MICROPHONE:
        return Source.Microphone;

      case TrackSource.SCREEN_SHARE:
        return Source.ScreenShare;

      case TrackSource.SCREEN_SHARE_AUDIO:
        return Source.ScreenShareAudio;

      default:
        return Source.Unknown;
    }
  }

  Track.sourceFromProto = sourceFromProto;
  /** @internal */

  function streamStateFromProto(s) {
    switch (s) {
      case StreamState.ACTIVE:
        return StreamState$1.Active;

      case StreamState.PAUSED:
        return StreamState$1.Paused;

      default:
        return StreamState$1.Unknown;
    }
  }

  Track.streamStateFromProto = streamStateFromProto;
})(Track || (Track = {}));

class LocalTrack extends Track {
  constructor(mediaTrack, kind, constraints) {
    let userProvidedTrack = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    super(mediaTrack, kind);
    this._isUpstreamPaused = false;

    this.handleEnded = () => {
      if (this.isInBackground) {
        this.reacquireTrack = true;
      }

      this.emit(TrackEvent.Ended, this);
    };

    this._mediaStreamTrack.addEventListener('ended', this.handleEnded);

    this.constraints = constraints !== null && constraints !== void 0 ? constraints : mediaTrack.getConstraints();
    this.reacquireTrack = false;
    this.providedByUser = userProvidedTrack;
    this.muteQueue = new Queue();
  }

  get id() {
    return this._mediaStreamTrack.id;
  }

  get dimensions() {
    if (this.kind !== Track.Kind.Video) {
      return undefined;
    }

    const {
      width,
      height
    } = this._mediaStreamTrack.getSettings();

    if (width && height) {
      return {
        width,
        height
      };
    }

    return undefined;
  }

  get isUpstreamPaused() {
    return this._isUpstreamPaused;
  }

  get isUserProvided() {
    return this.providedByUser;
  }
  /**
   * @returns DeviceID of the device that is currently being used for this track
   */


  async getDeviceId() {
    // screen share doesn't have a usable device id
    if (this.source === Track.Source.ScreenShare) {
      return;
    }

    const {
      deviceId,
      groupId
    } = this._mediaStreamTrack.getSettings();

    const kind = this.kind === Track.Kind.Audio ? 'audioinput' : 'videoinput';
    return DeviceManager.getInstance().normalizeDeviceId(kind, deviceId, groupId);
  }

  async mute() {
    this.setTrackMuted(true);
    return this;
  }

  async unmute() {
    this.setTrackMuted(false);
    return this;
  }

  async replaceTrack(track) {
    let userProvidedTrack = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (!this.sender) {
      throw new TrackInvalidError('unable to replace an unpublished track');
    } // detach


    this.attachedElements.forEach(el => {
      detachTrack(this._mediaStreamTrack, el);
    });

    this._mediaStreamTrack.removeEventListener('ended', this.handleEnded); // on Safari, the old audio track must be stopped before attempting to acquire
    // the new track, otherwise the new track will stop with
    // 'A MediaStreamTrack ended due to a capture failure`


    if (!this.providedByUser) {
      this._mediaStreamTrack.stop();
    }

    track.addEventListener('ended', this.handleEnded);
    livekitLogger.debug('replace MediaStreamTrack');

    if (this.sender) {
      await this.sender.replaceTrack(track);
    }

    this._mediaStreamTrack = track;
    await this.resumeUpstream();
    this.attachedElements.forEach(el => {
      attachToElement(track, el);
    });
    this.mediaStream = new MediaStream([track]);
    this.providedByUser = userProvidedTrack;
    return this;
  }

  async restart(constraints) {
    if (!constraints) {
      constraints = this.constraints;
    }

    livekitLogger.debug('restarting track with constraints', constraints);
    const streamConstraints = {
      audio: false,
      video: false
    };

    if (this.kind === Track.Kind.Video) {
      streamConstraints.video = constraints;
    } else {
      streamConstraints.audio = constraints;
    } // detach


    this.attachedElements.forEach(el => {
      detachTrack(this._mediaStreamTrack, el);
    });

    this._mediaStreamTrack.removeEventListener('ended', this.handleEnded); // on Safari, the old audio track must be stopped before attempting to acquire
    // the new track, otherwise the new track will stop with
    // 'A MediaStreamTrack ended due to a capture failure`


    this._mediaStreamTrack.stop(); // create new track and attach


    const mediaStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
    const newTrack = mediaStream.getTracks()[0];
    newTrack.addEventListener('ended', this.handleEnded);
    livekitLogger.debug('re-acquired MediaStreamTrack');

    if (this.sender) {
      // Track can be restarted after it's unpublished
      await this.sender.replaceTrack(newTrack);
    }

    this._mediaStreamTrack = newTrack;
    await this.resumeUpstream();
    this.attachedElements.forEach(el => {
      attachToElement(newTrack, el);
    });
    this.mediaStream = mediaStream;
    this.constraints = constraints;
    return this;
  }

  setTrackMuted(muted) {
    livekitLogger.debug("setting ".concat(this.kind, " track ").concat(muted ? 'muted' : 'unmuted'));

    if (this.isMuted === muted && this._mediaStreamTrack.enabled !== muted) {
      return;
    }

    this.isMuted = muted;
    this._mediaStreamTrack.enabled = !muted;
    this.emit(muted ? TrackEvent.Muted : TrackEvent.Unmuted, this);
  }

  get needsReAcquisition() {
    return this._mediaStreamTrack.readyState !== 'live' || this._mediaStreamTrack.muted || !this._mediaStreamTrack.enabled || this.reacquireTrack;
  }

  async handleAppVisibilityChanged() {
    await super.handleAppVisibilityChanged();
    if (!isMobile()) return;
    livekitLogger.debug("visibility changed, is in Background: ".concat(this.isInBackground));

    if (!this.isInBackground && this.needsReAcquisition && !this.isUserProvided && !this.isMuted) {
      livekitLogger.debug("track needs to be reaquired, restarting ".concat(this.source));
      await this.restart();
      this.reacquireTrack = false;
    }
  }

  async pauseUpstream() {
    this.muteQueue.run(async () => {
      if (this._isUpstreamPaused === true) {
        return;
      }

      if (!this.sender) {
        livekitLogger.warn('unable to pause upstream for an unpublished track');
        return;
      }

      this._isUpstreamPaused = true;
      this.emit(TrackEvent.UpstreamPaused, this);
      const emptyTrack = this.kind === Track.Kind.Audio ? getEmptyAudioStreamTrack() : getEmptyVideoStreamTrack();
      await this.sender.replaceTrack(emptyTrack);
    });
  }

  async resumeUpstream() {
    this.muteQueue.run(async () => {
      if (this._isUpstreamPaused === false) {
        return;
      }

      if (!this.sender) {
        livekitLogger.warn('unable to resume upstream for an unpublished track');
        return;
      }

      this._isUpstreamPaused = false;
      this.emit(TrackEvent.UpstreamResumed, this);
      await this.sender.replaceTrack(this._mediaStreamTrack);
    });
  }

}

function mergeDefaultOptions(options, audioDefaults, videoDefaults) {
  const opts = _objectSpread2({}, options);

  if (opts.audio === true) opts.audio = {};
  if (opts.video === true) opts.video = {}; // use defaults

  if (opts.audio) {
    mergeObjectWithoutOverwriting(opts.audio, audioDefaults);
  }

  if (opts.video) {
    mergeObjectWithoutOverwriting(opts.video, videoDefaults);
  }

  return opts;
}

function mergeObjectWithoutOverwriting(mainObject, objectToMerge) {
  Object.keys(objectToMerge).forEach(key => {
    if (mainObject[key] === undefined) mainObject[key] = objectToMerge[key];
  });
  return mainObject;
}

function constraintsForOptions(options) {
  const constraints = {};

  if (options.video) {
    // default video options
    if (typeof options.video === 'object') {
      const videoOptions = {};
      const target = videoOptions;
      const source = options.video;
      Object.keys(source).forEach(key => {
        switch (key) {
          case 'resolution':
            // flatten VideoResolution fields
            mergeObjectWithoutOverwriting(target, source.resolution);
            break;

          default:
            target[key] = source[key];
        }
      });
      constraints.video = videoOptions;
    } else {
      constraints.video = options.video;
    }
  } else {
    constraints.video = false;
  }

  if (options.audio) {
    if (typeof options.audio === 'object') {
      constraints.audio = options.audio;
    } else {
      constraints.audio = true;
    }
  } else {
    constraints.audio = false;
  }

  return constraints;
}
/**
 * This function detects silence on a given [[Track]] instance.
 * Returns true if the track seems to be entirely silent.
 */

async function detectSilence(track) {
  let timeOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;
  const ctx = getNewAudioContext();

  if (ctx) {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const source = ctx.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
    source.connect(analyser);
    await sleep(timeOffset);
    analyser.getByteTimeDomainData(dataArray);
    const someNoise = dataArray.some(sample => sample !== 128 && sample !== 0);
    ctx.close();
    return !someNoise;
  }

  return false;
}
/**
 * @internal
 */

function getNewAudioContext() {
  // @ts-ignore
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (AudioContext) {
    return new AudioContext();
  }
}

class LocalAudioTrack extends LocalTrack {
  constructor(mediaTrack, constraints) {
    let userProvidedTrack = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    super(mediaTrack, Track.Kind.Audio, constraints, userProvidedTrack);
    /** @internal */

    this.stopOnMute = false;

    this.monitorSender = async () => {
      if (!this.sender) {
        this._currentBitrate = 0;
        return;
      }

      let stats;

      try {
        stats = await this.getSenderStats();
      } catch (e) {
        livekitLogger.error('could not get audio sender stats', {
          error: e
        });
        return;
      }

      if (stats && this.prevStats) {
        this._currentBitrate = computeBitrate(stats, this.prevStats);
      }

      this.prevStats = stats;
    };

    this.checkForSilence();
  }

  async setDeviceId(deviceId) {
    if (this.constraints.deviceId === deviceId) {
      return;
    }

    this.constraints.deviceId = deviceId;

    if (!this.isMuted) {
      await this.restartTrack();
    }
  }

  async mute() {
    await this.muteQueue.run(async () => {
      // disabled special handling as it will cause BT headsets to switch communication modes
      if (this.source === Track.Source.Microphone && this.stopOnMute && !this.isUserProvided) {
        livekitLogger.debug('stopping mic track'); // also stop the track, so that microphone indicator is turned off

        this._mediaStreamTrack.stop();
      }

      await super.mute();
    });
    return this;
  }

  async unmute() {
    await this.muteQueue.run(async () => {
      if (this.source === Track.Source.Microphone && this.stopOnMute && !this.isUserProvided) {
        livekitLogger.debug('reacquiring mic track');
        await this.restartTrack();
      }

      await super.unmute();
    });
    return this;
  }

  async restartTrack(options) {
    let constraints;

    if (options) {
      const streamConstraints = constraintsForOptions({
        audio: options
      });

      if (typeof streamConstraints.audio !== 'boolean') {
        constraints = streamConstraints.audio;
      }
    }

    await this.restart(constraints);
  }

  async restart(constraints) {
    const track = await super.restart(constraints);
    this.checkForSilence();
    return track;
  }
  /* @internal */


  startMonitor() {
    if (!isWeb()) {
      return;
    }

    if (this.monitorInterval) {
      return;
    }

    this.monitorInterval = setInterval(() => {
      this.monitorSender();
    }, monitorFrequency);
  }

  async getSenderStats() {
    if (!this.sender) {
      return undefined;
    }

    const stats = await this.sender.getStats();
    let audioStats;
    stats.forEach(v => {
      if (v.type === 'outbound-rtp') {
        audioStats = {
          type: 'audio',
          streamId: v.id,
          packetsSent: v.packetsSent,
          packetsLost: v.packetsLost,
          bytesSent: v.bytesSent,
          timestamp: v.timestamp,
          roundTripTime: v.roundTripTime,
          jitter: v.jitter
        };
      }
    });
    return audioStats;
  }

  async checkForSilence() {
    const trackIsSilent = await detectSilence(this);

    if (trackIsSilent) {
      if (!this.isMuted) {
        livekitLogger.warn('silence detected on local audio track');
      }

      this.emit(TrackEvent.AudioSilenceDetected);
    }
  }

}

const refreshSubscribedCodecAfterNewCodec = 5000;
class LocalVideoTrack extends LocalTrack {
  constructor(mediaTrack, constraints) {
    let userProvidedTrack = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    super(mediaTrack, Track.Kind.Video, constraints, userProvidedTrack);
    /* @internal */

    this.simulcastCodecs = new Map();

    this.monitorSender = async () => {
      if (!this.sender) {
        this._currentBitrate = 0;
        return;
      }

      let stats;

      try {
        stats = await this.getSenderStats();
      } catch (e) {
        livekitLogger.error('could not get audio sender stats', {
          error: e
        });
        return;
      }

      const statsMap = new Map(stats.map(s => [s.rid, s]));

      if (this.prevStats) {
        let totalBitrate = 0;
        statsMap.forEach((s, key) => {
          var _a;

          const prev = (_a = this.prevStats) === null || _a === void 0 ? void 0 : _a.get(key);
          totalBitrate += computeBitrate(s, prev);
        });
        this._currentBitrate = totalBitrate;
      }

      this.prevStats = statsMap;
    };
  }

  get isSimulcast() {
    if (this.sender && this.sender.getParameters().encodings.length > 1) {
      return true;
    }

    return false;
  }
  /* @internal */


  startMonitor(signalClient) {
    var _a;

    this.signalClient = signalClient;

    if (!isWeb()) {
      return;
    } // save original encodings
    // TODO : merge simulcast tracks stats


    const params = (_a = this.sender) === null || _a === void 0 ? void 0 : _a.getParameters();

    if (params) {
      this.encodings = params.encodings;
    }

    if (this.monitorInterval) {
      return;
    }

    this.monitorInterval = setInterval(() => {
      this.monitorSender();
    }, monitorFrequency);
  }

  stop() {
    this._mediaStreamTrack.getConstraints();

    this.simulcastCodecs.forEach(trackInfo => {
      trackInfo.mediaStreamTrack.stop();
    });
    super.stop();
  }

  async mute() {
    await this.muteQueue.run(async () => {
      if (this.source === Track.Source.Camera && !this.isUserProvided) {
        livekitLogger.debug('stopping camera track'); // also stop the track, so that camera indicator is turned off

        this._mediaStreamTrack.stop();
      }

      await super.mute();
    });
    return this;
  }

  async unmute() {
    await this.muteQueue.run(async () => {
      if (this.source === Track.Source.Camera && !this.isUserProvided) {
        livekitLogger.debug('reacquiring camera track');
        await this.restartTrack();
      }

      await super.unmute();
    });
    return this;
  }

  async getSenderStats() {
    if (!this.sender) {
      return [];
    }

    const items = [];
    const stats = await this.sender.getStats();
    stats.forEach(v => {
      var _a;

      if (v.type === 'outbound-rtp') {
        const vs = {
          type: 'video',
          streamId: v.id,
          frameHeight: v.frameHeight,
          frameWidth: v.frameWidth,
          firCount: v.firCount,
          pliCount: v.pliCount,
          nackCount: v.nackCount,
          packetsSent: v.packetsSent,
          bytesSent: v.bytesSent,
          framesSent: v.framesSent,
          timestamp: v.timestamp,
          rid: (_a = v.rid) !== null && _a !== void 0 ? _a : v.id,
          retransmittedPacketsSent: v.retransmittedPacketsSent,
          qualityLimitationReason: v.qualityLimitationReason,
          qualityLimitationResolutionChanges: v.qualityLimitationResolutionChanges
        }; // locate the appropriate remote-inbound-rtp item

        const r = stats.get(v.remoteId);

        if (r) {
          vs.jitter = r.jitter;
          vs.packetsLost = r.packetsLost;
          vs.roundTripTime = r.roundTripTime;
        }

        items.push(vs);
      }
    });
    return items;
  }

  setPublishingQuality(maxQuality) {
    const qualities = [];

    for (let q = VideoQuality.LOW; q <= VideoQuality.HIGH; q += 1) {
      qualities.push({
        quality: q,
        enabled: q <= maxQuality
      });
    }

    livekitLogger.debug("setting publishing quality. max quality ".concat(maxQuality));
    this.setPublishingLayers(qualities);
  }

  async setDeviceId(deviceId) {
    if (this.constraints.deviceId === deviceId) {
      return;
    }

    this.constraints.deviceId = deviceId; // when video is muted, underlying media stream track is stopped and
    // will be restarted later

    if (!this.isMuted) {
      await this.restartTrack();
    }
  }

  async restartTrack(options) {
    let constraints;

    if (options) {
      const streamConstraints = constraintsForOptions({
        video: options
      });

      if (typeof streamConstraints.video !== 'boolean') {
        constraints = streamConstraints.video;
      }
    }

    await this.restart(constraints);
  }

  addSimulcastTrack(codec, encodings) {
    if (this.simulcastCodecs.has(codec)) {
      throw new Error("".concat(codec, " already added"));
    }

    const simulcastCodecInfo = {
      codec,
      mediaStreamTrack: this.mediaStreamTrack.clone(),
      sender: undefined,
      encodings
    };
    this.simulcastCodecs.set(codec, simulcastCodecInfo);
    return simulcastCodecInfo;
  }

  setSimulcastTrackSender(codec, sender) {
    const simulcastCodecInfo = this.simulcastCodecs.get(codec);

    if (!simulcastCodecInfo) {
      return;
    }

    simulcastCodecInfo.sender = sender; // browser will reenable disabled codec/layers after new codec has been published,
    // so refresh subscribedCodecs after publish a new codec

    setTimeout(() => {
      if (this.subscribedCodecs) {
        this.setPublishingCodecs(this.subscribedCodecs);
      }
    }, refreshSubscribedCodecAfterNewCodec);
  }
  /**
   * @internal
   * Sets codecs that should be publishing
   */


  async setPublishingCodecs(codecs) {
    livekitLogger.debug('setting publishing codecs', {
      codecs,
      currentCodec: this.codec
    }); // only enable simulcast codec for preference codec setted

    if (!this.codec && codecs.length > 0) {
      await this.setPublishingLayers(codecs[0].qualities);
      return [];
    }

    this.subscribedCodecs = codecs;
    const newCodecs = [];
    var _iteratorAbruptCompletion = false;
    var _didIteratorError = false;

    var _iteratorError;

    try {
      for (var _iterator = _asyncIterator(codecs), _step; _iteratorAbruptCompletion = !(_step = await _iterator.next()).done; _iteratorAbruptCompletion = false) {
        const codec = _step.value;

        if (!this.codec || this.codec === codec.codec) {
          await this.setPublishingLayers(codec.qualities);
        } else {
          const simulcastCodecInfo = this.simulcastCodecs.get(codec.codec);
          livekitLogger.debug("try setPublishingCodec for ".concat(codec.codec), simulcastCodecInfo);

          if (!simulcastCodecInfo || !simulcastCodecInfo.sender) {
            for (const q of codec.qualities) {
              if (q.enabled) {
                newCodecs.push(codec.codec);
                break;
              }
            }
          } else if (simulcastCodecInfo.encodings) {
            livekitLogger.debug("try setPublishingLayersForSender ".concat(codec.codec));
            await setPublishingLayersForSender(simulcastCodecInfo.sender, simulcastCodecInfo.encodings, codec.qualities);
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (_iteratorAbruptCompletion && _iterator.return != null) {
          await _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return newCodecs;
  }
  /**
   * @internal
   * Sets layers that should be publishing
   */


  async setPublishingLayers(qualities) {
    livekitLogger.debug('setting publishing layers', qualities);

    if (!this.sender || !this.encodings) {
      return;
    }

    await setPublishingLayersForSender(this.sender, this.encodings, qualities);
  }

  async handleAppVisibilityChanged() {
    await super.handleAppVisibilityChanged();
    if (!isMobile()) return;

    if (this.isInBackground && this.source === Track.Source.Camera) {
      this._mediaStreamTrack.enabled = false;
    }
  }

}

async function setPublishingLayersForSender(sender, senderEncodings, qualities) {
  livekitLogger.debug('setPublishingLayersForSender', {
    sender,
    qualities,
    senderEncodings
  });
  const params = sender.getParameters();
  const {
    encodings
  } = params;

  if (!encodings) {
    return;
  }

  if (encodings.length !== senderEncodings.length) {
    livekitLogger.warn('cannot set publishing layers, encodings mismatch');
    return;
  }

  let hasChanged = false;
  encodings.forEach((encoding, idx) => {
    var _a;

    let rid = (_a = encoding.rid) !== null && _a !== void 0 ? _a : '';

    if (rid === '') {
      rid = 'q';
    }

    const quality = videoQualityForRid(rid);
    const subscribedQuality = qualities.find(q => q.quality === quality);

    if (!subscribedQuality) {
      return;
    }

    if (encoding.active !== subscribedQuality.enabled) {
      hasChanged = true;
      encoding.active = subscribedQuality.enabled;
      livekitLogger.debug("setting layer ".concat(subscribedQuality.quality, " to ").concat(encoding.active ? 'enabled' : 'disabled')); // FireFox does not support setting encoding.active to false, so we
      // have a workaround of lowering its bitrate and resolution to the min.

      if (isFireFox()) {
        if (subscribedQuality.enabled) {
          encoding.scaleResolutionDownBy = senderEncodings[idx].scaleResolutionDownBy;
          encoding.maxBitrate = senderEncodings[idx].maxBitrate;
          /* @ts-ignore */

          encoding.maxFrameRate = senderEncodings[idx].maxFrameRate;
        } else {
          encoding.scaleResolutionDownBy = 4;
          encoding.maxBitrate = 10;
          /* @ts-ignore */

          encoding.maxFrameRate = 2;
        }
      }
    }
  });

  if (hasChanged) {
    params.encodings = encodings;
    await sender.setParameters(params);
  }
}

function videoQualityForRid(rid) {
  switch (rid) {
    case 'f':
      return VideoQuality.HIGH;

    case 'h':
      return VideoQuality.MEDIUM;

    case 'q':
      return VideoQuality.LOW;

    default:
      return VideoQuality.UNRECOGNIZED;
  }
}
function videoLayersFromEncodings(width, height, encodings) {
  // default to a single layer, HQ
  if (!encodings) {
    return [{
      quality: VideoQuality.HIGH,
      width,
      height,
      bitrate: 0,
      ssrc: 0
    }];
  }

  return encodings.map(encoding => {
    var _a, _b, _c;

    const scale = (_a = encoding.scaleResolutionDownBy) !== null && _a !== void 0 ? _a : 1;
    let quality = videoQualityForRid((_b = encoding.rid) !== null && _b !== void 0 ? _b : '');

    if (quality === VideoQuality.UNRECOGNIZED && encodings.length === 1) {
      quality = VideoQuality.HIGH;
    }

    return {
      quality,
      width: width / scale,
      height: height / scale,
      bitrate: (_c = encoding.maxBitrate) !== null && _c !== void 0 ? _c : 0,
      ssrc: 0
    };
  });
}

class RemoteTrack extends Track {
  constructor(mediaTrack, sid, kind, receiver) {
    super(mediaTrack, kind);
    this.sid = sid;
    this.receiver = receiver;
  }
  /** @internal */


  setMuted(muted) {
    if (this.isMuted !== muted) {
      this.isMuted = muted;
      this._mediaStreamTrack.enabled = !muted;
      this.emit(muted ? TrackEvent.Muted : TrackEvent.Unmuted, this);
    }
  }
  /** @internal */


  setMediaStream(stream) {
    // this is needed to determine when the track is finished
    // we send each track down in its own MediaStream, so we can assume the
    // current track is the only one that can be removed.
    this.mediaStream = stream;

    stream.onremovetrack = () => {
      this.receiver = undefined;
      this._currentBitrate = 0;
      this.emit(TrackEvent.Ended, this);
    };
  }

  start() {
    this.startMonitor(); // use `enabled` of track to enable re-use of transceiver

    super.enable();
  }

  stop() {
    this.stopMonitor(); // use `enabled` of track to enable re-use of transceiver

    super.disable();
  }
  /* @internal */


  startMonitor() {
    if (!this.monitorInterval) {
      this.monitorInterval = setInterval(() => this.monitorReceiver(), monitorFrequency);
    }
  }

}

class RemoteAudioTrack extends RemoteTrack {
  constructor(mediaTrack, sid, receiver) {
    super(mediaTrack, sid, Track.Kind.Audio, receiver);

    this.monitorReceiver = async () => {
      if (!this.receiver) {
        this._currentBitrate = 0;
        return;
      }

      const stats = await this.getReceiverStats();

      if (stats && this.prevStats && this.receiver) {
        this._currentBitrate = computeBitrate(stats, this.prevStats);
      }

      this.prevStats = stats;
    };
  }
  /**
   * sets the volume for all attached audio elements
   */


  setVolume(volume) {
    for (const el of this.attachedElements) {
      el.volume = volume;
    }

    this.elementVolume = volume;
  }
  /**
   * gets the volume of attached audio elements (loudest)
   */


  getVolume() {
    if (this.elementVolume) {
      return this.elementVolume;
    }

    let highestVolume = 0;
    this.attachedElements.forEach(element => {
      if (element.volume > highestVolume) {
        highestVolume = element.volume;
      }
    });
    return highestVolume;
  }

  attach(element) {
    if (!element) {
      element = super.attach();
    } else {
      super.attach(element);
    }

    if (this.elementVolume) {
      element.volume = this.elementVolume;
    }

    return element;
  }

  async getReceiverStats() {
    if (!this.receiver) {
      return;
    }

    const stats = await this.receiver.getStats();
    let receiverStats;
    stats.forEach(v => {
      if (v.type === 'inbound-rtp') {
        receiverStats = {
          type: 'audio',
          timestamp: v.timestamp,
          jitter: v.jitter,
          bytesReceived: v.bytesReceived,
          concealedSamples: v.concealedSamples,
          concealmentEvents: v.concealmentEvents,
          silentConcealedSamples: v.silentConcealedSamples,
          silentConcealmentEvents: v.silentConcealmentEvents,
          totalAudioEnergy: v.totalAudioEnergy,
          totalSamplesDuration: v.totalSamplesDuration
        };
      }
    });
    return receiverStats;
  }

}

function r(r, e, n) {
  var i, t, o;
  void 0 === e && (e = 50), void 0 === n && (n = {});
  var a = null != (i = n.isImmediate) && i,
      u = null != (t = n.callback) && t,
      c = n.maxWait,
      v = Date.now(),
      l = [];

  function f() {
    if (void 0 !== c) {
      var r = Date.now() - v;
      if (r + e >= c) return c - r;
    }

    return e;
  }

  var d = function () {
    var e = [].slice.call(arguments),
        n = this;
    return new Promise(function (i, t) {
      var c = a && void 0 === o;

      if (void 0 !== o && clearTimeout(o), o = setTimeout(function () {
        if (o = void 0, v = Date.now(), !a) {
          var i = r.apply(n, e);
          u && u(i), l.forEach(function (r) {
            return (0, r.resolve)(i);
          }), l = [];
        }
      }, f()), c) {
        var d = r.apply(n, e);
        return u && u(d), i(d);
      }

      l.push({
        resolve: i,
        reject: t
      });
    });
  };

  return d.cancel = function (r) {
    void 0 !== o && clearTimeout(o), l.forEach(function (e) {
      return (0, e.reject)(r);
    }), l = [];
  }, d;
}

const REACTION_DELAY = 100;
class RemoteVideoTrack extends RemoteTrack {
  constructor(mediaTrack, sid, receiver, adaptiveStreamSettings) {
    super(mediaTrack, sid, Track.Kind.Video, receiver);
    this.elementInfos = [];
    this.hasUsedAttach = false;

    this.monitorReceiver = async () => {
      if (!this.receiver) {
        this._currentBitrate = 0;
        return;
      }

      const stats = await this.getReceiverStats();

      if (stats && this.prevStats && this.receiver) {
        this._currentBitrate = computeBitrate(stats, this.prevStats);
      }

      this.prevStats = stats;
    };

    this.debouncedHandleResize = r(() => {
      this.updateDimensions();
    }, REACTION_DELAY);
    this.adaptiveStreamSettings = adaptiveStreamSettings;

    if (this.isAdaptiveStream) {
      this.streamState = Track.StreamState.Paused;
    }
  }

  get isAdaptiveStream() {
    return this.adaptiveStreamSettings !== undefined;
  }

  get mediaStreamTrack() {
    if (this.isAdaptiveStream && !this.hasUsedAttach) {
      livekitLogger.warn('When using adaptiveStream, you need to use remoteVideoTrack.attach() to add the track to a HTMLVideoElement, otherwise your video tracks might never start');
    }

    return this._mediaStreamTrack;
  }
  /** @internal */


  setMuted(muted) {
    super.setMuted(muted);
    this.attachedElements.forEach(element => {
      // detach or attach
      if (muted) {
        detachTrack(this._mediaStreamTrack, element);
      } else {
        attachToElement(this._mediaStreamTrack, element);
      }
    });
  }

  attach(element) {
    if (!element) {
      element = super.attach();
    } else {
      super.attach(element);
    } // It's possible attach is called multiple times on an element. When that's
    // the case, we'd want to avoid adding duplicate elementInfos


    if (this.adaptiveStreamSettings && this.elementInfos.find(info => info.element === element) === undefined) {
      const elementInfo = new HTMLElementInfo(element);
      this.observeElementInfo(elementInfo);
    }

    this.hasUsedAttach = true;
    return element;
  }
  /**
   * Observe an ElementInfo for changes when adaptive streaming.
   * @param elementInfo
   * @internal
   */


  observeElementInfo(elementInfo) {
    if (this.adaptiveStreamSettings && this.elementInfos.find(info => info === elementInfo) === undefined) {
      elementInfo.handleResize = () => {
        this.debouncedHandleResize();
      };

      elementInfo.handleVisibilityChanged = () => {
        this.updateVisibility();
      };

      this.elementInfos.push(elementInfo);
      elementInfo.observe(); // trigger the first resize update cycle
      // if the tab is backgrounded, the initial resize event does not fire until
      // the tab comes into focus for the first time.

      this.debouncedHandleResize();
      this.updateVisibility();
    } else {
      livekitLogger.warn('visibility resize observer not triggered');
    }
  }
  /**
   * Stop observing an ElementInfo for changes.
   * @param elementInfo
   * @internal
   */


  stopObservingElementInfo(elementInfo) {
    const stopElementInfos = this.elementInfos.filter(info => info === elementInfo);

    for (const info of stopElementInfos) {
      info.stopObserving();
    }

    this.elementInfos = this.elementInfos.filter(info => info !== elementInfo);
    this.updateVisibility();
  }

  detach(element) {
    let detachedElements = [];

    if (element) {
      this.stopObservingElement(element);
      return super.detach(element);
    }

    detachedElements = super.detach();

    for (const e of detachedElements) {
      this.stopObservingElement(e);
    }

    return detachedElements;
  }
  /** @internal */


  getDecoderImplementation() {
    var _a;

    return (_a = this.prevStats) === null || _a === void 0 ? void 0 : _a.decoderImplementation;
  }

  async getReceiverStats() {
    if (!this.receiver) {
      return;
    }

    const stats = await this.receiver.getStats();
    let receiverStats;
    stats.forEach(v => {
      if (v.type === 'inbound-rtp') {
        receiverStats = {
          type: 'video',
          framesDecoded: v.framesDecoded,
          framesDropped: v.framesDropped,
          framesReceived: v.framesReceived,
          packetsReceived: v.packetsReceived,
          packetsLost: v.packetsLost,
          frameWidth: v.frameWidth,
          frameHeight: v.frameHeight,
          pliCount: v.pliCount,
          firCount: v.firCount,
          nackCount: v.nackCount,
          jitter: v.jitter,
          timestamp: v.timestamp,
          bytesReceived: v.bytesReceived,
          decoderImplementation: v.decoderImplementation
        };
      }
    });
    return receiverStats;
  }

  stopObservingElement(element) {
    const stopElementInfos = this.elementInfos.filter(info => info.element === element);

    for (const info of stopElementInfos) {
      info.stopObserving();
    }

    this.elementInfos = this.elementInfos.filter(info => info.element !== element);
  }

  async handleAppVisibilityChanged() {
    await super.handleAppVisibilityChanged();
    if (!this.isAdaptiveStream) return;
    this.updateVisibility();
  }

  updateVisibility() {
    var _a, _b;

    const lastVisibilityChange = this.elementInfos.reduce((prev, info) => Math.max(prev, info.visibilityChangedAt || 0), 0);
    const backgroundPause = ((_b = (_a = this.adaptiveStreamSettings) === null || _a === void 0 ? void 0 : _a.pauseVideoInBackground) !== null && _b !== void 0 ? _b : true // default to true
    ) ? this.isInBackground : false;
    const isVisible = this.elementInfos.some(info => info.visible) && !backgroundPause;

    if (this.lastVisible === isVisible) {
      return;
    }

    if (!isVisible && Date.now() - lastVisibilityChange < REACTION_DELAY) {
      // delay hidden events
      setTimeout(() => {
        this.updateVisibility();
      }, REACTION_DELAY);
      return;
    }

    this.lastVisible = isVisible;
    this.emit(TrackEvent.VisibilityChanged, isVisible, this);
  }

  updateDimensions() {
    var _a, _b, _c, _d;

    let maxWidth = 0;
    let maxHeight = 0;

    for (const info of this.elementInfos) {
      const pixelDensity = (_b = (_a = this.adaptiveStreamSettings) === null || _a === void 0 ? void 0 : _a.pixelDensity) !== null && _b !== void 0 ? _b : 1;
      const pixelDensityValue = pixelDensity === 'screen' ? window.devicePixelRatio : pixelDensity;
      const currentElementWidth = info.width() * pixelDensityValue;
      const currentElementHeight = info.height() * pixelDensityValue;

      if (currentElementWidth + currentElementHeight > maxWidth + maxHeight) {
        maxWidth = currentElementWidth;
        maxHeight = currentElementHeight;
      }
    }

    if (((_c = this.lastDimensions) === null || _c === void 0 ? void 0 : _c.width) === maxWidth && ((_d = this.lastDimensions) === null || _d === void 0 ? void 0 : _d.height) === maxHeight) {
      return;
    }

    this.lastDimensions = {
      width: maxWidth,
      height: maxHeight
    };
    this.emit(TrackEvent.VideoDimensionsChanged, this.lastDimensions, this);
  }

}

class HTMLElementInfo {
  constructor(element, visible) {
    this.onVisibilityChanged = entry => {
      var _a;

      const {
        target,
        isIntersecting
      } = entry;

      if (target === this.element) {
        this.visible = isIntersecting;
        this.visibilityChangedAt = Date.now();
        (_a = this.handleVisibilityChanged) === null || _a === void 0 ? void 0 : _a.call(this);
      }
    };

    this.element = element;
    this.visible = visible !== null && visible !== void 0 ? visible : isElementInViewport(element);
    this.visibilityChangedAt = 0;
  }

  width() {
    return this.element.clientWidth;
  }

  height() {
    return this.element.clientHeight;
  }

  observe() {
    this.element.handleResize = () => {
      var _a;

      (_a = this.handleResize) === null || _a === void 0 ? void 0 : _a.call(this);
    };

    this.element.handleVisibilityChanged = this.onVisibilityChanged;
    getIntersectionObserver().observe(this.element);
    getResizeObserver().observe(this.element);
  }

  stopObserving() {
    var _a, _b;

    (_a = getIntersectionObserver()) === null || _a === void 0 ? void 0 : _a.unobserve(this.element);
    (_b = getResizeObserver()) === null || _b === void 0 ? void 0 : _b.unobserve(this.element);
  }

} // does not account for occlusion by other elements


function isElementInViewport(el) {
  let top = el.offsetTop;
  let left = el.offsetLeft;
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  const {
    hidden
  } = el;
  const {
    opacity,
    display
  } = getComputedStyle(el);

  while (el.offsetParent) {
    el = el.offsetParent;
    top += el.offsetTop;
    left += el.offsetLeft;
  }

  return top < window.pageYOffset + window.innerHeight && left < window.pageXOffset + window.innerWidth && top + height > window.pageYOffset && left + width > window.pageXOffset && !hidden && (opacity !== '' ? parseFloat(opacity) > 0 : true) && display !== 'none';
}

class TrackPublication extends events.exports.EventEmitter {
  constructor(kind, id, name) {
    super();
    this.metadataMuted = false;

    this.handleMuted = () => {
      this.emit(TrackEvent.Muted);
    };

    this.handleUnmuted = () => {
      this.emit(TrackEvent.Unmuted);
    };

    this.kind = kind;
    this.trackSid = id;
    this.trackName = name;
    this.source = Track.Source.Unknown;
  }
  /** @internal */


  setTrack(track) {
    if (this.track) {
      this.track.off(TrackEvent.Muted, this.handleMuted);
      this.track.off(TrackEvent.Unmuted, this.handleUnmuted);
    }

    this.track = track;

    if (track) {
      // forward events
      track.on(TrackEvent.Muted, this.handleMuted);
      track.on(TrackEvent.Unmuted, this.handleUnmuted);
    }
  }

  get isMuted() {
    return this.metadataMuted;
  }

  get isEnabled() {
    return true;
  }

  get isSubscribed() {
    return this.track !== undefined;
  }
  /**
   * an [AudioTrack] if this publication holds an audio track
   */


  get audioTrack() {
    if (this.track instanceof LocalAudioTrack || this.track instanceof RemoteAudioTrack) {
      return this.track;
    }
  }
  /**
   * an [VideoTrack] if this publication holds a video track
   */


  get videoTrack() {
    if (this.track instanceof LocalVideoTrack || this.track instanceof RemoteVideoTrack) {
      return this.track;
    }
  }
  /** @internal */


  updateInfo(info) {
    this.trackSid = info.sid;
    this.trackName = info.name;
    this.source = Track.sourceFromProto(info.source);
    this.mimeType = info.mimeType;

    if (this.kind === Track.Kind.Video && info.width > 0) {
      this.dimensions = {
        width: info.width,
        height: info.height
      };
      this.simulcasted = info.simulcast;
    }

    this.trackInfo = info;
    livekitLogger.trace('update publication info', {
      info
    });
  }

}

(function (TrackPublication) {

  (function (SubscriptionStatus) {
    SubscriptionStatus["Subscribed"] = "subscribed";
    SubscriptionStatus["NotAllowed"] = "not_allowed";
    SubscriptionStatus["Unsubscribed"] = "unsubscribed";
    SubscriptionStatus["Desired"] = "desired";
  })(TrackPublication.SubscriptionStatus || (TrackPublication.SubscriptionStatus = {}));

  (function (PermissionStatus) {
    PermissionStatus["Allowed"] = "allowed";
    PermissionStatus["NotAllowed"] = "not_allowed";
  })(TrackPublication.PermissionStatus || (TrackPublication.PermissionStatus = {}));
})(TrackPublication || (TrackPublication = {}));

class LocalTrackPublication extends TrackPublication {
  constructor(kind, ti, track) {
    super(kind, ti.sid, ti.name);
    this.track = undefined;

    this.handleTrackEnded = () => {
      this.emit(TrackEvent.Ended);
    };

    this.updateInfo(ti);
    this.setTrack(track);
  }

  get isUpstreamPaused() {
    var _a;

    return (_a = this.track) === null || _a === void 0 ? void 0 : _a.isUpstreamPaused;
  }

  setTrack(track) {
    if (this.track) {
      this.track.off(TrackEvent.Ended, this.handleTrackEnded);
    }

    super.setTrack(track);

    if (track) {
      track.on(TrackEvent.Ended, this.handleTrackEnded);
    }
  }

  get isMuted() {
    if (this.track) {
      return this.track.isMuted;
    }

    return super.isMuted;
  }

  get audioTrack() {
    return super.audioTrack;
  }

  get videoTrack() {
    return super.videoTrack;
  }
  /**
   * Mute the track associated with this publication
   */


  async mute() {
    var _a;

    return (_a = this.track) === null || _a === void 0 ? void 0 : _a.mute();
  }
  /**
   * Unmute track associated with this publication
   */


  async unmute() {
    var _a;

    return (_a = this.track) === null || _a === void 0 ? void 0 : _a.unmute();
  }
  /**
   * Pauses the media stream track associated with this publication from being sent to the server
   * and signals "muted" event to other participants
   * Useful if you want to pause the stream without pausing the local media stream track
   */


  async pauseUpstream() {
    var _a;

    await ((_a = this.track) === null || _a === void 0 ? void 0 : _a.pauseUpstream());
  }
  /**
   * Resumes sending the media stream track associated with this publication to the server after a call to [[pauseUpstream()]]
   * and signals "unmuted" event to other participants (unless the track is explicitly muted)
   */


  async resumeUpstream() {
    var _a;

    await ((_a = this.track) === null || _a === void 0 ? void 0 : _a.resumeUpstream());
  }

}

class VideoPreset {
  constructor(width, height, maxBitrate, maxFramerate) {
    this.width = width;
    this.height = height;
    this.encoding = {
      maxBitrate,
      maxFramerate
    };
  }

  get resolution() {
    return {
      width: this.width,
      height: this.height,
      frameRate: this.encoding.maxFramerate,
      aspectRatio: this.width / this.height
    };
  }

}
const backupCodecs = ['vp8', 'h264'];
function isBackupCodec(codec) {
  return !!backupCodecs.find(backup => backup === codec);
}
var AudioPresets;

(function (AudioPresets) {
  AudioPresets.telephone = {
    maxBitrate: 12000
  };
  AudioPresets.speech = {
    maxBitrate: 20000
  };
  AudioPresets.music = {
    maxBitrate: 32000
  };
})(AudioPresets || (AudioPresets = {}));
/**
 * Sane presets for video resolution/encoding
 */


const VideoPresets = {
  h90: new VideoPreset(160, 90, 60000, 15),
  h180: new VideoPreset(320, 180, 120000, 15),
  h216: new VideoPreset(384, 216, 180000, 15),
  h360: new VideoPreset(640, 360, 300000, 20),
  h540: new VideoPreset(960, 540, 600000, 25),
  h720: new VideoPreset(1280, 720, 1700000, 30),
  h1080: new VideoPreset(1920, 1080, 3000000, 30),
  h1440: new VideoPreset(2560, 1440, 5000000, 30),
  h2160: new VideoPreset(3840, 2160, 8000000, 30)
};
/**
 * Four by three presets
 */

const VideoPresets43 = {
  h120: new VideoPreset(160, 120, 80000, 15),
  h180: new VideoPreset(240, 180, 100000, 15),
  h240: new VideoPreset(320, 240, 150000, 15),
  h360: new VideoPreset(480, 360, 225000, 20),
  h480: new VideoPreset(640, 480, 300000, 20),
  h540: new VideoPreset(720, 540, 450000, 25),
  h720: new VideoPreset(960, 720, 1500000, 30),
  h1080: new VideoPreset(1440, 1080, 2500000, 30),
  h1440: new VideoPreset(1920, 1440, 3500000, 30)
};
const ScreenSharePresets = {
  h360fps3: new VideoPreset(640, 360, 200000, 3),
  h720fps5: new VideoPreset(1280, 720, 400000, 5),
  h720fps15: new VideoPreset(1280, 720, 1000000, 15),
  h1080fps15: new VideoPreset(1920, 1080, 1500000, 15),
  h1080fps30: new VideoPreset(1920, 1080, 3000000, 30)
};

var ConnectionQuality;

(function (ConnectionQuality) {
  ConnectionQuality["Excellent"] = "excellent";
  ConnectionQuality["Good"] = "good";
  ConnectionQuality["Poor"] = "poor";
  ConnectionQuality["Unknown"] = "unknown";
})(ConnectionQuality || (ConnectionQuality = {}));

function qualityFromProto(q) {
  switch (q) {
    case ConnectionQuality$1.EXCELLENT:
      return ConnectionQuality.Excellent;

    case ConnectionQuality$1.GOOD:
      return ConnectionQuality.Good;

    case ConnectionQuality$1.POOR:
      return ConnectionQuality.Poor;

    default:
      return ConnectionQuality.Unknown;
  }
}

class Participant extends events.exports.EventEmitter {
  /** @internal */
  constructor(sid, identity, name, metadata) {
    super();
    /** audio level between 0-1.0, 1 being loudest, 0 being softest */

    this.audioLevel = 0;
    /** if participant is currently speaking */

    this.isSpeaking = false;
    this._connectionQuality = ConnectionQuality.Unknown;
    this.sid = sid;
    this.identity = identity;
    this.name = name;
    this.metadata = metadata;
    this.audioTracks = new Map();
    this.videoTracks = new Map();
    this.tracks = new Map();
  }

  getTracks() {
    return Array.from(this.tracks.values());
  }
  /**
   * Finds the first track that matches the source filter, for example, getting
   * the user's camera track with getTrackBySource(Track.Source.Camera).
   * @param source
   * @returns
   */


  getTrack(source) {
    if (source === Track.Source.Unknown) {
      return;
    }

    for (const [, pub] of this.tracks) {
      if (pub.source === source) {
        return pub;
      }

      if (pub.source === Track.Source.Unknown) {
        if (source === Track.Source.Microphone && pub.kind === Track.Kind.Audio && pub.trackName !== 'screen') {
          return pub;
        }

        if (source === Track.Source.Camera && pub.kind === Track.Kind.Video && pub.trackName !== 'screen') {
          return pub;
        }

        if (source === Track.Source.ScreenShare && pub.kind === Track.Kind.Video && pub.trackName === 'screen') {
          return pub;
        }

        if (source === Track.Source.ScreenShareAudio && pub.kind === Track.Kind.Audio && pub.trackName === 'screen') {
          return pub;
        }
      }
    }
  }
  /**
   * Finds the first track that matches the track's name.
   * @param name
   * @returns
   */


  getTrackByName(name) {
    for (const [, pub] of this.tracks) {
      if (pub.trackName === name) {
        return pub;
      }
    }
  }

  get connectionQuality() {
    return this._connectionQuality;
  }

  get isCameraEnabled() {
    var _a;

    const track = this.getTrack(Track.Source.Camera);
    return !((_a = track === null || track === void 0 ? void 0 : track.isMuted) !== null && _a !== void 0 ? _a : true);
  }

  get isMicrophoneEnabled() {
    var _a;

    const track = this.getTrack(Track.Source.Microphone);
    return !((_a = track === null || track === void 0 ? void 0 : track.isMuted) !== null && _a !== void 0 ? _a : true);
  }

  get isScreenShareEnabled() {
    const track = this.getTrack(Track.Source.ScreenShare);
    return !!track;
  }
  /** when participant joined the room */


  get joinedAt() {
    if (this.participantInfo) {
      return new Date(this.participantInfo.joinedAt * 1000);
    }

    return new Date();
  }
  /** @internal */


  updateInfo(info) {
    this.identity = info.identity;
    this.sid = info.sid;
    this.name = info.name;
    this.setMetadata(info.metadata);

    if (info.permission) {
      this.setPermissions(info.permission);
    } // set this last so setMetadata can detect changes


    this.participantInfo = info;
    livekitLogger.trace('update participant info', {
      info
    });
  }
  /** @internal */


  setMetadata(md) {
    const changed = this.metadata !== md;
    const prevMetadata = this.metadata;
    this.metadata = md;

    if (changed) {
      this.emit(ParticipantEvent.ParticipantMetadataChanged, prevMetadata);
    }
  }
  /** @internal */


  setPermissions(permissions) {
    var _a, _b, _c, _d, _e;

    const changed = permissions.canPublish !== ((_a = this.permissions) === null || _a === void 0 ? void 0 : _a.canPublish) || permissions.canSubscribe !== ((_b = this.permissions) === null || _b === void 0 ? void 0 : _b.canSubscribe) || permissions.canPublishData !== ((_c = this.permissions) === null || _c === void 0 ? void 0 : _c.canPublishData) || permissions.hidden !== ((_d = this.permissions) === null || _d === void 0 ? void 0 : _d.hidden) || permissions.recorder !== ((_e = this.permissions) === null || _e === void 0 ? void 0 : _e.recorder);
    this.permissions = permissions;
    return changed;
  }
  /** @internal */


  setIsSpeaking(speaking) {
    if (speaking === this.isSpeaking) {
      return;
    }

    this.isSpeaking = speaking;

    if (speaking) {
      this.lastSpokeAt = new Date();
    }

    this.emit(ParticipantEvent.IsSpeakingChanged, speaking);
  }
  /** @internal */


  setConnectionQuality(q) {
    const prevQuality = this._connectionQuality;
    this._connectionQuality = qualityFromProto(q);

    if (prevQuality !== this._connectionQuality) {
      this.emit(ParticipantEvent.ConnectionQualityChanged, this._connectionQuality);
    }
  }

  addTrackPublication(publication) {
    // forward publication driven events
    publication.on(TrackEvent.Muted, () => {
      this.emit(ParticipantEvent.TrackMuted, publication);
    });
    publication.on(TrackEvent.Unmuted, () => {
      this.emit(ParticipantEvent.TrackUnmuted, publication);
    });
    const pub = publication;

    if (pub.track) {
      pub.track.sid = publication.trackSid;
    }

    this.tracks.set(publication.trackSid, publication);

    switch (publication.kind) {
      case Track.Kind.Audio:
        this.audioTracks.set(publication.trackSid, publication);
        break;

      case Track.Kind.Video:
        this.videoTracks.set(publication.trackSid, publication);
        break;
    }
  }

}

function trackPermissionToProto(perms) {
  var _a, _b, _c;

  if (!perms.participantSid && !perms.participantIdentity) {
    throw new Error('Invalid track permission, must provide at least one of participantIdentity and participantSid');
  }

  return {
    participantIdentity: (_a = perms.participantIdentity) !== null && _a !== void 0 ? _a : '',
    participantSid: (_b = perms.participantSid) !== null && _b !== void 0 ? _b : '',
    allTracks: (_c = perms.allowAll) !== null && _c !== void 0 ? _c : false,
    trackSids: perms.allowedTrackSids || []
  };
}

/** @internal */

function mediaTrackToLocalTrack(mediaStreamTrack, constraints) {
  switch (mediaStreamTrack.kind) {
    case 'audio':
      return new LocalAudioTrack(mediaStreamTrack, constraints, false);

    case 'video':
      return new LocalVideoTrack(mediaStreamTrack, constraints, false);

    default:
      throw new TrackInvalidError("unsupported track type: ".concat(mediaStreamTrack.kind));
  }
}
/* @internal */

const presets169 = Object.values(VideoPresets);
/* @internal */

const presets43 = Object.values(VideoPresets43);
/* @internal */

const presetsScreenShare = Object.values(ScreenSharePresets);
/* @internal */

const defaultSimulcastPresets169 = [VideoPresets.h180, VideoPresets.h360];
/* @internal */

const defaultSimulcastPresets43 = [VideoPresets43.h180, VideoPresets43.h360];
/* @internal */

const computeDefaultScreenShareSimulcastPresets = fromPreset => {
  const layers = [{
    scaleResolutionDownBy: 2,
    fps: 3
  }];
  return layers.map(t => {
    var _a;

    return new VideoPreset(Math.floor(fromPreset.width / t.scaleResolutionDownBy), Math.floor(fromPreset.height / t.scaleResolutionDownBy), Math.max(150000, Math.floor(fromPreset.encoding.maxBitrate / (t.scaleResolutionDownBy ** 2 * (((_a = fromPreset.encoding.maxFramerate) !== null && _a !== void 0 ? _a : 30) / t.fps)))), t.fps);
  });
}; // /**
//  *
//  * @internal
//  * @experimental
//  */
// const computeDefaultMultiCodecSimulcastEncodings = (width: number, height: number) => {
//   // use vp8 as a default
//   const vp8 = determineAppropriateEncoding(false, width, height);
//   const vp9 = { ...vp8, maxBitrate: vp8.maxBitrate * 0.9 };
//   const h264 = { ...vp8, maxBitrate: vp8.maxBitrate * 1.1 };
//   const av1 = { ...vp8, maxBitrate: vp8.maxBitrate * 0.7 };
//   return {
//     vp8,
//     vp9,
//     h264,
//     av1,
//   };
// };

const videoRids = ['q', 'h', 'f'];
/* @internal */

function computeVideoEncodings(isScreenShare, width, height, options) {
  var _a, _b;

  let videoEncoding = options === null || options === void 0 ? void 0 : options.videoEncoding;

  if (isScreenShare) {
    videoEncoding = options === null || options === void 0 ? void 0 : options.screenShareEncoding;
  }

  const useSimulcast = options === null || options === void 0 ? void 0 : options.simulcast;
  const scalabilityMode = options === null || options === void 0 ? void 0 : options.scalabilityMode;
  const videoCodec = options === null || options === void 0 ? void 0 : options.videoCodec;

  if (!videoEncoding && !useSimulcast && !scalabilityMode || !width || !height) {
    // when we aren't simulcasting or svc, will need to return a single encoding without
    // capping bandwidth. we always require a encoding for dynacast
    return [{}];
  }

  if (!videoEncoding) {
    // find the right encoding based on width/height
    videoEncoding = determineAppropriateEncoding(isScreenShare, width, height, videoCodec);
    livekitLogger.debug('using video encoding', videoEncoding);
  }

  const original = new VideoPreset(width, height, videoEncoding.maxBitrate, videoEncoding.maxFramerate);

  if (scalabilityMode && videoCodec === 'av1') {
    livekitLogger.debug("using svc with scalabilityMode ".concat(scalabilityMode));
    const encodings = []; // svc use first encoding as the original, so we sort encoding from high to low

    switch (scalabilityMode) {
      case 'L3T3':
        for (let i = 0; i < 3; i += 1) {
          encodings.push({
            rid: videoRids[2 - i],
            scaleResolutionDownBy: 2 ** i,
            maxBitrate: videoEncoding.maxBitrate / 3 ** i,

            /* @ts-ignore */
            maxFramerate: original.encoding.maxFramerate,

            /* @ts-ignore */
            scalabilityMode: 'L3T3'
          });
        }

        livekitLogger.debug('encodings', encodings);
        return encodings;

      default:
        // TODO : support other scalability modes
        throw new Error("unsupported scalabilityMode: ".concat(scalabilityMode));
    }
  }

  if (!useSimulcast) {
    return [videoEncoding];
  }

  let presets = [];

  if (isScreenShare) {
    presets = (_a = sortPresets(options === null || options === void 0 ? void 0 : options.screenShareSimulcastLayers)) !== null && _a !== void 0 ? _a : defaultSimulcastLayers(isScreenShare, original);
  } else {
    presets = (_b = sortPresets(options === null || options === void 0 ? void 0 : options.videoSimulcastLayers)) !== null && _b !== void 0 ? _b : defaultSimulcastLayers(isScreenShare, original);
  }

  let midPreset;

  if (presets.length > 0) {
    const lowPreset = presets[0];

    if (presets.length > 1) {
      [, midPreset] = presets;
    } // NOTE:
    //   1. Ordering of these encodings is important. Chrome seems
    //      to use the index into encodings to decide which layer
    //      to disable when CPU constrained.
    //      So encodings should be ordered in increasing spatial
    //      resolution order.
    //   2. ion-sfu translates rids into layers. So, all encodings
    //      should have the base layer `q` and then more added
    //      based on other conditions.


    const size = Math.max(width, height);

    if (size >= 960 && midPreset) {
      return encodingsFromPresets(width, height, [lowPreset, midPreset, original]);
    }

    if (size >= 480) {
      return encodingsFromPresets(width, height, [lowPreset, original]);
    }
  }

  return encodingsFromPresets(width, height, [original]);
}
function computeTrackBackupEncodings(track, videoCodec, opts) {
  var _a, _b, _c, _d;

  if (!opts.backupCodec || opts.backupCodec.codec === opts.videoCodec) {
    // backup codec publishing is disabled
    return;
  }

  if (videoCodec !== opts.backupCodec.codec) {
    livekitLogger.warn('requested a different codec than specified as backup', {
      serverRequested: videoCodec,
      backup: opts.backupCodec.codec
    });
  }

  opts.videoCodec = videoCodec; // use backup encoding setting as videoEncoding for backup codec publishing

  opts.videoEncoding = opts.backupCodec.encoding;
  const settings = track.mediaStreamTrack.getSettings();
  const width = (_a = settings.width) !== null && _a !== void 0 ? _a : (_b = track.dimensions) === null || _b === void 0 ? void 0 : _b.width;
  const height = (_c = settings.height) !== null && _c !== void 0 ? _c : (_d = track.dimensions) === null || _d === void 0 ? void 0 : _d.height;
  const encodings = computeVideoEncodings(track.source === Track.Source.ScreenShare, width, height, opts);
  return encodings;
}
/* @internal */

function determineAppropriateEncoding(isScreenShare, width, height, codec) {
  const presets = presetsForResolution(isScreenShare, width, height);
  let {
    encoding
  } = presets[0]; // handle portrait by swapping dimensions

  const size = Math.max(width, height);

  for (let i = 0; i < presets.length; i += 1) {
    const preset = presets[i];
    encoding = preset.encoding;

    if (preset.width >= size) {
      break;
    }
  } // presets are based on the assumption of vp8 as a codec
  // for other codecs we adjust the maxBitrate if no specific videoEncoding has been provided
  // TODO make the bitrate multipliers configurable per codec


  if (codec) {
    switch (codec) {
      case 'av1':
        encoding.maxBitrate = encoding.maxBitrate * 0.7;
        break;
    }
  }

  return encoding;
}
/* @internal */

function presetsForResolution(isScreenShare, width, height) {
  if (isScreenShare) {
    return presetsScreenShare;
  }

  const aspect = width > height ? width / height : height / width;

  if (Math.abs(aspect - 16.0 / 9) < Math.abs(aspect - 4.0 / 3)) {
    return presets169;
  }

  return presets43;
}
/* @internal */

function defaultSimulcastLayers(isScreenShare, original) {
  if (isScreenShare) {
    return computeDefaultScreenShareSimulcastPresets(original);
  }

  const {
    width,
    height
  } = original;
  const aspect = width > height ? width / height : height / width;

  if (Math.abs(aspect - 16.0 / 9) < Math.abs(aspect - 4.0 / 3)) {
    return defaultSimulcastPresets169;
  }

  return defaultSimulcastPresets43;
} // presets should be ordered by low, medium, high

function encodingsFromPresets(width, height, presets) {
  const encodings = [];
  presets.forEach((preset, idx) => {
    if (idx >= videoRids.length) {
      return;
    }

    const size = Math.min(width, height);
    const rid = videoRids[idx];
    encodings.push({
      rid,
      scaleResolutionDownBy: size / Math.min(preset.width, preset.height),
      maxBitrate: preset.encoding.maxBitrate,

      /* @ts-ignore */
      maxFramerate: preset.encoding.maxFramerate
    });
  });
  return encodings;
}
/** @internal */


function sortPresets(presets) {
  if (!presets) return;
  return presets.sort((a, b) => {
    const {
      encoding: aEnc
    } = a;
    const {
      encoding: bEnc
    } = b;

    if (aEnc.maxBitrate > bEnc.maxBitrate) {
      return 1;
    }

    if (aEnc.maxBitrate < bEnc.maxBitrate) return -1;

    if (aEnc.maxBitrate === bEnc.maxBitrate && aEnc.maxFramerate && bEnc.maxFramerate) {
      return aEnc.maxFramerate > bEnc.maxFramerate ? 1 : -1;
    }

    return 0;
  });
}

class RemoteTrackPublication extends TrackPublication {
  constructor(kind, id, name, autoSubscribe) {
    super(kind, id, name);
    this.track = undefined;
    /** @internal */

    this.allowed = true;
    this.disabled = false;
    this.currentVideoQuality = VideoQuality.HIGH;

    this.handleEnded = track => {
      this.setTrack(undefined);
      this.emit(TrackEvent.Ended, track);
    };

    this.handleVisibilityChange = visible => {
      livekitLogger.debug("adaptivestream video visibility ".concat(this.trackSid, ", visible=").concat(visible), {
        trackSid: this.trackSid
      });
      this.disabled = !visible;
      this.emitTrackUpdate();
    };

    this.handleVideoDimensionsChange = dimensions => {
      livekitLogger.debug("adaptivestream video dimensions ".concat(dimensions.width, "x").concat(dimensions.height), {
        trackSid: this.trackSid
      });
      this.videoDimensions = dimensions;
      this.emitTrackUpdate();
    };

    this.subscribed = autoSubscribe;
  }
  /**
   * Subscribe or unsubscribe to this remote track
   * @param subscribed true to subscribe to a track, false to unsubscribe
   */


  setSubscribed(subscribed) {
    const prevStatus = this.subscriptionStatus;
    const prevPermission = this.permissionStatus;
    this.subscribed = subscribed; // reset allowed status when desired subscription state changes
    // server will notify client via signal message if it's not allowed

    if (subscribed) {
      this.allowed = true;
    }

    const sub = {
      trackSids: [this.trackSid],
      subscribe: this.subscribed,
      participantTracks: [{
        // sending an empty participant id since TrackPublication doesn't keep it
        // this is filled in by the participant that receives this message
        participantSid: '',
        trackSids: [this.trackSid]
      }]
    };
    this.emit(TrackEvent.UpdateSubscription, sub);
    this.emitSubscriptionUpdateIfChanged(prevStatus);
    this.emitPermissionUpdateIfChanged(prevStatus, prevPermission);
  }

  get subscriptionStatus() {
    if (!this.allowed && this.subscribed === true) {
      return TrackPublication.SubscriptionStatus.NotAllowed;
    }

    if (this.subscribed === false) {
      return TrackPublication.SubscriptionStatus.Unsubscribed;
    }

    if (!super.isSubscribed) {
      return TrackPublication.SubscriptionStatus.Desired;
    }

    return TrackPublication.SubscriptionStatus.Subscribed;
  }

  get permissionStatus() {
    return this.allowed ? TrackPublication.PermissionStatus.Allowed : TrackPublication.PermissionStatus.NotAllowed;
  }
  /**
   * Returns true if track is subscribed, and ready for playback
   */


  get isSubscribed() {
    if (this.subscribed === false) {
      return false;
    }

    return super.isSubscribed;
  } // returns client's desire to subscribe to a track, also true if autoSubscribe is enabled


  get isDesired() {
    return this.subscribed !== false;
  }

  get isEnabled() {
    return !this.disabled;
  }
  /**
   * disable server from sending down data for this track. this is useful when
   * the participant is off screen, you may disable streaming down their video
   * to reduce bandwidth requirements
   * @param enabled
   */


  setEnabled(enabled) {
    if (!this.isManualOperationAllowed() || this.disabled === !enabled) {
      return;
    }

    this.disabled = !enabled;
    this.emitTrackUpdate();
  }
  /**
   * for tracks that support simulcasting, adjust subscribed quality
   *
   * This indicates the highest quality the client can accept. if network
   * bandwidth does not allow, server will automatically reduce quality to
   * optimize for uninterrupted video
   */


  setVideoQuality(quality) {
    if (!this.isManualOperationAllowed() || this.currentVideoQuality === quality) {
      return;
    }

    this.currentVideoQuality = quality;
    this.videoDimensions = undefined;
    this.emitTrackUpdate();
  }

  setVideoDimensions(dimensions) {
    var _a, _b;

    if (!this.isManualOperationAllowed()) {
      return;
    }

    if (((_a = this.videoDimensions) === null || _a === void 0 ? void 0 : _a.width) === dimensions.width && ((_b = this.videoDimensions) === null || _b === void 0 ? void 0 : _b.height) === dimensions.height) {
      return;
    }

    if (this.track instanceof RemoteVideoTrack) {
      this.videoDimensions = dimensions;
    }

    this.currentVideoQuality = undefined;
    this.emitTrackUpdate();
  }

  get videoQuality() {
    return this.currentVideoQuality;
  }
  /** @internal */


  setTrack(track) {
    const prevStatus = this.subscriptionStatus;
    const prevPermission = this.permissionStatus;
    const prevTrack = this.track;

    if (prevTrack === track) {
      return;
    }

    if (prevTrack) {
      // unregister listener
      prevTrack.off(TrackEvent.VideoDimensionsChanged, this.handleVideoDimensionsChange);
      prevTrack.off(TrackEvent.VisibilityChanged, this.handleVisibilityChange);
      prevTrack.off(TrackEvent.Ended, this.handleEnded);
      prevTrack.detach();
      this.emit(TrackEvent.Unsubscribed, prevTrack);
    }

    super.setTrack(track);

    if (track) {
      track.sid = this.trackSid;
      track.on(TrackEvent.VideoDimensionsChanged, this.handleVideoDimensionsChange);
      track.on(TrackEvent.VisibilityChanged, this.handleVisibilityChange);
      track.on(TrackEvent.Ended, this.handleEnded);
      this.emit(TrackEvent.Subscribed, track);
    }

    this.emitPermissionUpdateIfChanged(prevStatus, prevPermission);
    this.emitSubscriptionUpdateIfChanged(prevStatus);
  }
  /** @internal */


  setAllowed(allowed) {
    const prevStatus = this.subscriptionStatus;
    const prevPermission = this.permissionStatus;
    this.allowed = allowed;
    this.emitPermissionUpdateIfChanged(prevStatus, prevPermission);
    this.emitSubscriptionUpdateIfChanged(prevStatus);
  }
  /** @internal */


  updateInfo(info) {
    var _a;

    super.updateInfo(info);
    this.metadataMuted = info.muted;
    (_a = this.track) === null || _a === void 0 ? void 0 : _a.setMuted(info.muted);
  }

  emitSubscriptionUpdateIfChanged(previousStatus) {
    const currentStatus = this.subscriptionStatus;

    if (previousStatus === currentStatus) {
      return;
    }

    this.emit(TrackEvent.SubscriptionStatusChanged, currentStatus, previousStatus);
  }

  emitPermissionUpdateIfChanged(previousSubscriptionStatus, previousPermissionStatus) {
    const currentPermissionStatus = this.permissionStatus;

    if ((previousPermissionStatus === currentPermissionStatus || this.subscriptionStatus === TrackPublication.SubscriptionStatus.Desired) && previousSubscriptionStatus !== TrackPublication.SubscriptionStatus.Desired) {
      return;
    } // emitting subscription status instead of permission status to not break 1.0 API


    this.emit(TrackEvent.SubscriptionPermissionChanged, this.subscriptionStatus, previousSubscriptionStatus);
  }

  isManualOperationAllowed() {
    if (this.isAdaptiveStream) {
      livekitLogger.warn('adaptive stream is enabled, cannot change track settings', {
        trackSid: this.trackSid
      });
      return false;
    }

    if (!this.isSubscribed) {
      livekitLogger.warn('cannot update track settings when not subscribed', {
        trackSid: this.trackSid
      });
      return false;
    }

    return true;
  }

  get isAdaptiveStream() {
    return this.track instanceof RemoteVideoTrack && this.track.isAdaptiveStream;
  }
  /* @internal */


  emitTrackUpdate() {
    const settings = UpdateTrackSettings.fromPartial({
      trackSids: [this.trackSid],
      disabled: this.disabled
    });

    if (this.videoDimensions) {
      settings.width = this.videoDimensions.width;
      settings.height = this.videoDimensions.height;
    } else if (this.currentVideoQuality !== undefined) {
      settings.quality = this.currentVideoQuality;
    } else {
      // defaults to high quality
      settings.quality = VideoQuality.HIGH;
    }

    this.emit(TrackEvent.UpdateSettings, settings);
  }

}

class RemoteParticipant extends Participant {
  /** @internal */
  constructor(signalClient, sid, identity, name, metadata) {
    super(sid, identity || '', name, metadata);
    this.signalClient = signalClient;
    this.tracks = new Map();
    this.audioTracks = new Map();
    this.videoTracks = new Map();
  }
  /** @internal */


  static fromParticipantInfo(signalClient, pi) {
    return new RemoteParticipant(signalClient, pi.sid, pi.identity, pi.name, pi.metadata);
  }

  addTrackPublication(publication) {
    super.addTrackPublication(publication); // register action events

    publication.on(TrackEvent.UpdateSettings, settings => {
      livekitLogger.debug('send update settings', settings);
      this.signalClient.sendUpdateTrackSettings(settings);
    });
    publication.on(TrackEvent.UpdateSubscription, sub => {
      sub.participantTracks.forEach(pt => {
        pt.participantSid = this.sid;
      });
      this.signalClient.sendUpdateSubscription(sub);
    });
    publication.on(TrackEvent.SubscriptionPermissionChanged, status => {
      this.emit(ParticipantEvent.TrackSubscriptionPermissionChanged, publication, status);
    });
    publication.on(TrackEvent.SubscriptionStatusChanged, status => {
      this.emit(ParticipantEvent.TrackSubscriptionStatusChanged, publication, status);
    });
    publication.on(TrackEvent.Subscribed, track => {
      this.emit(ParticipantEvent.TrackSubscribed, track, publication);
    });
    publication.on(TrackEvent.Unsubscribed, previousTrack => {
      this.emit(ParticipantEvent.TrackUnsubscribed, previousTrack, publication);
    });
  }

  getTrack(source) {
    const track = super.getTrack(source);

    if (track) {
      return track;
    }
  }

  getTrackByName(name) {
    const track = super.getTrackByName(name);

    if (track) {
      return track;
    }
  }
  /**
   * sets the volume on the participant's microphone track
   * if no track exists the volume will be applied when the microphone track is added
   */


  setVolume(volume) {
    this.volume = volume;
    const audioPublication = this.getTrack(Track.Source.Microphone);

    if (audioPublication && audioPublication.track) {
      audioPublication.track.setVolume(volume);
    }
  }
  /**
   * gets the volume on the participant's microphone track
   */


  getVolume() {
    const audioPublication = this.getTrack(Track.Source.Microphone);

    if (audioPublication && audioPublication.track) {
      return audioPublication.track.getVolume();
    }

    return this.volume;
  }
  /** @internal */


  addSubscribedMediaTrack(mediaTrack, sid, mediaStream, receiver, adaptiveStreamSettings, triesLeft) {
    // find the track publication
    // it's possible for the media track to arrive before participant info
    let publication = this.getTrackPublication(sid); // it's also possible that the browser didn't honor our original track id
    // FireFox would use its own local uuid instead of server track id

    if (!publication) {
      if (!sid.startsWith('TR')) {
        // find the first track that matches type
        this.tracks.forEach(p => {
          if (!publication && mediaTrack.kind === p.kind.toString()) {
            publication = p;
          }
        });
      }
    } // when we couldn't locate the track, it's possible that the metadata hasn't
    // yet arrived. Wait a bit longer for it to arrive, or fire an error


    if (!publication) {
      if (triesLeft === 0) {
        livekitLogger.error('could not find published track', {
          participant: this.sid,
          trackSid: sid
        });
        this.emit(ParticipantEvent.TrackSubscriptionFailed, sid);
        return;
      }

      if (triesLeft === undefined) triesLeft = 20;
      setTimeout(() => {
        this.addSubscribedMediaTrack(mediaTrack, sid, mediaStream, receiver, adaptiveStreamSettings, triesLeft - 1);
      }, 150);
      return;
    }

    const isVideo = mediaTrack.kind === 'video';
    let track;

    if (isVideo) {
      track = new RemoteVideoTrack(mediaTrack, sid, receiver, adaptiveStreamSettings);
    } else {
      track = new RemoteAudioTrack(mediaTrack, sid, receiver);
    } // set track info


    track.source = publication.source; // keep publication's muted status

    track.isMuted = publication.isMuted;
    track.setMediaStream(mediaStream);
    track.start();
    publication.setTrack(track); // set participant volume on new microphone tracks

    if (this.volume !== undefined && track instanceof RemoteAudioTrack && track.source === Track.Source.Microphone) {
      track.setVolume(this.volume);
    }

    return publication;
  }
  /** @internal */


  get hasMetadata() {
    return !!this.participantInfo;
  }

  getTrackPublication(sid) {
    return this.tracks.get(sid);
  }
  /** @internal */


  updateInfo(info) {
    super.updateInfo(info); // we are getting a list of all available tracks, reconcile in here
    // and send out events for changes
    // reconcile track publications, publish events only if metadata is already there
    // i.e. changes since the local participant has joined

    const validTracks = new Map();
    const newTracks = new Map();
    info.tracks.forEach(ti => {
      var _a;

      let publication = this.getTrackPublication(ti.sid);

      if (!publication) {
        // new publication
        const kind = Track.kindFromProto(ti.type);

        if (!kind) {
          return;
        }

        publication = new RemoteTrackPublication(kind, ti.sid, ti.name, (_a = this.signalClient.connectOptions) === null || _a === void 0 ? void 0 : _a.autoSubscribe);
        publication.updateInfo(ti);
        newTracks.set(ti.sid, publication);
        const existingTrackOfSource = Array.from(this.tracks.values()).find(publishedTrack => publishedTrack.source === (publication === null || publication === void 0 ? void 0 : publication.source));

        if (existingTrackOfSource) {
          livekitLogger.warn("received a second track publication for ".concat(this.identity, " with the same source: ").concat(publication.source), {
            oldTrack: existingTrackOfSource,
            newTrack: publication,
            participant: this,
            participantInfo: info
          });
        }

        this.addTrackPublication(publication);
      } else {
        publication.updateInfo(ti);
      }

      validTracks.set(ti.sid, publication);
    }); // always emit events for new publications, Room will not forward them unless it's ready

    newTracks.forEach(publication => {
      this.emit(ParticipantEvent.TrackPublished, publication);
    }); // detect removed tracks

    this.tracks.forEach(publication => {
      if (!validTracks.has(publication.trackSid)) {
        livekitLogger.trace('detected removed track on remote participant, unpublishing', {
          publication,
          participantSid: this.sid
        });
        this.unpublishTrack(publication.trackSid, true);
      }
    });
  }
  /** @internal */


  unpublishTrack(sid, sendUnpublish) {
    const publication = this.tracks.get(sid);

    if (!publication) {
      return;
    }

    this.tracks.delete(sid); // remove from the right type map

    switch (publication.kind) {
      case Track.Kind.Audio:
        this.audioTracks.delete(sid);
        break;

      case Track.Kind.Video:
        this.videoTracks.delete(sid);
        break;
    } // also send unsubscribe, if track is actively subscribed


    const {
      track
    } = publication;

    if (track) {
      track.stop();
      publication.setTrack(undefined);
    }

    if (sendUnpublish) {
      this.emit(ParticipantEvent.TrackUnpublished, publication);
    }
  }
  /** @internal */


  emit(event) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    livekitLogger.trace('participant event', {
      participant: this.sid,
      event,
      args
    });
    return super.emit(event, ...args);
  }

}

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

let logDisabled_ = true;
let deprecationWarnings_ = true;
/**
 * Extract browser version out of the provided user agent string.
 *
 * @param {!string} uastring userAgent string.
 * @param {!string} expr Regular expression used as match criteria.
 * @param {!number} pos position in the version string to be returned.
 * @return {!number} browser version.
 */

function extractVersion(uastring, expr, pos) {
  const match = uastring.match(expr);
  return match && match.length >= pos && parseInt(match[pos], 10);
} // Wraps the peerconnection event eventNameToWrap in a function
// which returns the modified event object (or false to prevent
// the event).

function wrapPeerConnectionEvent(window, eventNameToWrap, wrapper) {
  if (!window.RTCPeerConnection) {
    return;
  }

  const proto = window.RTCPeerConnection.prototype;
  const nativeAddEventListener = proto.addEventListener;

  proto.addEventListener = function (nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap) {
      return nativeAddEventListener.apply(this, arguments);
    }

    const wrappedCallback = e => {
      const modifiedEvent = wrapper(e);

      if (modifiedEvent) {
        if (cb.handleEvent) {
          cb.handleEvent(modifiedEvent);
        } else {
          cb(modifiedEvent);
        }
      }
    };

    this._eventMap = this._eventMap || {};

    if (!this._eventMap[eventNameToWrap]) {
      this._eventMap[eventNameToWrap] = new Map();
    }

    this._eventMap[eventNameToWrap].set(cb, wrappedCallback);

    return nativeAddEventListener.apply(this, [nativeEventName, wrappedCallback]);
  };

  const nativeRemoveEventListener = proto.removeEventListener;

  proto.removeEventListener = function (nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap || !this._eventMap || !this._eventMap[eventNameToWrap]) {
      return nativeRemoveEventListener.apply(this, arguments);
    }

    if (!this._eventMap[eventNameToWrap].has(cb)) {
      return nativeRemoveEventListener.apply(this, arguments);
    }

    const unwrappedCb = this._eventMap[eventNameToWrap].get(cb);

    this._eventMap[eventNameToWrap].delete(cb);

    if (this._eventMap[eventNameToWrap].size === 0) {
      delete this._eventMap[eventNameToWrap];
    }

    if (Object.keys(this._eventMap).length === 0) {
      delete this._eventMap;
    }

    return nativeRemoveEventListener.apply(this, [nativeEventName, unwrappedCb]);
  };

  Object.defineProperty(proto, 'on' + eventNameToWrap, {
    get() {
      return this['_on' + eventNameToWrap];
    },

    set(cb) {
      if (this['_on' + eventNameToWrap]) {
        this.removeEventListener(eventNameToWrap, this['_on' + eventNameToWrap]);
        delete this['_on' + eventNameToWrap];
      }

      if (cb) {
        this.addEventListener(eventNameToWrap, this['_on' + eventNameToWrap] = cb);
      }
    },

    enumerable: true,
    configurable: true
  });
}
function disableLog(bool) {
  if (typeof bool !== 'boolean') {
    return new Error('Argument type: ' + typeof bool + '. Please use a boolean.');
  }

  logDisabled_ = bool;
  return bool ? 'adapter.js logging disabled' : 'adapter.js logging enabled';
}
/**
 * Disable or enable deprecation warnings
 * @param {!boolean} bool set to true to disable warnings.
 */

function disableWarnings(bool) {
  if (typeof bool !== 'boolean') {
    return new Error('Argument type: ' + typeof bool + '. Please use a boolean.');
  }

  deprecationWarnings_ = !bool;
  return 'adapter.js deprecation warnings ' + (bool ? 'disabled' : 'enabled');
}
function log() {
  if (typeof window === 'object') {
    if (logDisabled_) {
      return;
    }

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log.apply(console, arguments);
    }
  }
}
/**
 * Shows a deprecation warning suggesting the modern and spec-compatible API.
 */

function deprecated(oldMethod, newMethod) {
  if (!deprecationWarnings_) {
    return;
  }

  console.warn(oldMethod + ' is deprecated, please use ' + newMethod + ' instead.');
}
/**
 * Browser detector.
 *
 * @return {object} result containing browser and version
 *     properties.
 */

function detectBrowser(window) {
  // Returned result object.
  const result = {
    browser: null,
    version: null
  }; // Fail early if it's not a browser

  if (typeof window === 'undefined' || !window.navigator) {
    result.browser = 'Not a browser.';
    return result;
  }

  const {
    navigator
  } = window;

  if (navigator.mozGetUserMedia) {
    // Firefox.
    result.browser = 'firefox';
    result.version = extractVersion(navigator.userAgent, /Firefox\/(\d+)\./, 1);
  } else if (navigator.webkitGetUserMedia || window.isSecureContext === false && window.webkitRTCPeerConnection && !window.RTCIceGatherer) {
    // Chrome, Chromium, Webview, Opera.
    // Version matches Chrome/WebRTC version.
    // Chrome 74 removed webkitGetUserMedia on http as well so we need the
    // more complicated fallback to webkitRTCPeerConnection.
    result.browser = 'chrome';
    result.version = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
  } else if (window.RTCPeerConnection && navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) {
    // Safari.
    result.browser = 'safari';
    result.version = extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1);
    result.supportsUnifiedPlan = window.RTCRtpTransceiver && 'currentDirection' in window.RTCRtpTransceiver.prototype;
  } else {
    // Default fallthrough: not supported.
    result.browser = 'Not a supported browser.';
    return result;
  }

  return result;
}
/**
 * Checks if something is an object.
 *
 * @param {*} val The something you want to check.
 * @return true if val is an object, false otherwise.
 */

function isObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
}
/**
 * Remove all empty objects and undefined values
 * from a nested object -- an enhanced and vanilla version
 * of Lodash's `compact`.
 */


function compactObject(data) {
  if (!isObject(data)) {
    return data;
  }

  return Object.keys(data).reduce(function (accumulator, key) {
    const isObj = isObject(data[key]);
    const value = isObj ? compactObject(data[key]) : data[key];
    const isEmptyObject = isObj && !Object.keys(value).length;

    if (value === undefined || isEmptyObject) {
      return accumulator;
    }

    return Object.assign(accumulator, {
      [key]: value
    });
  }, {});
}
/* iterates the stats graph recursively. */

function walkStats(stats, base, resultSet) {
  if (!base || resultSet.has(base.id)) {
    return;
  }

  resultSet.set(base.id, base);
  Object.keys(base).forEach(name => {
    if (name.endsWith('Id')) {
      walkStats(stats, stats.get(base[name]), resultSet);
    } else if (name.endsWith('Ids')) {
      base[name].forEach(id => {
        walkStats(stats, stats.get(id), resultSet);
      });
    }
  });
}
/* filter getStats for a sender/receiver track. */

function filterStats(result, track, outbound) {
  const streamStatsType = outbound ? 'outbound-rtp' : 'inbound-rtp';
  const filteredResult = new Map();

  if (track === null) {
    return filteredResult;
  }

  const trackStats = [];
  result.forEach(value => {
    if (value.type === 'track' && value.trackIdentifier === track.id) {
      trackStats.push(value);
    }
  });
  trackStats.forEach(trackStat => {
    result.forEach(stats => {
      if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
        walkStats(result, stats, filteredResult);
      }
    });
  });
  return filteredResult;
}

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
const logging = log;
function shimGetUserMedia$2(window, browserDetails) {
  const navigator = window && window.navigator;

  if (!navigator.mediaDevices) {
    return;
  }

  const constraintsToChrome_ = function (c) {
    if (typeof c !== 'object' || c.mandatory || c.optional) {
      return c;
    }

    const cc = {};
    Object.keys(c).forEach(key => {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }

      const r = typeof c[key] === 'object' ? c[key] : {
        ideal: c[key]
      };

      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }

      const oldname_ = function (prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }

        return name === 'deviceId' ? 'sourceId' : name;
      };

      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        let oc = {};

        if (typeof r.ideal === 'number') {
          oc[oldname_('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }

      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(mix => {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });

    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }

    return cc;
  };

  const shimConstraints_ = function (constraints, func) {
    if (browserDetails.version >= 61) {
      return func(constraints);
    }

    constraints = JSON.parse(JSON.stringify(constraints));

    if (constraints && typeof constraints.audio === 'object') {
      const remap = function (obj, a, b) {
        if (a in obj && !(b in obj)) {
          obj[b] = obj[a];
          delete obj[a];
        }
      };

      constraints = JSON.parse(JSON.stringify(constraints));
      remap(constraints.audio, 'autoGainControl', 'googAutoGainControl');
      remap(constraints.audio, 'noiseSuppression', 'googNoiseSuppression');
      constraints.audio = constraintsToChrome_(constraints.audio);
    }

    if (constraints && typeof constraints.video === 'object') {
      // Shim facingMode for mobile & surface pro.
      let face = constraints.video.facingMode;
      face = face && (typeof face === 'object' ? face : {
        ideal: face
      });
      const getSupportedFacingModeLies = browserDetails.version < 66;

      if (face && (face.exact === 'user' || face.exact === 'environment' || face.ideal === 'user' || face.ideal === 'environment') && !(navigator.mediaDevices.getSupportedConstraints && navigator.mediaDevices.getSupportedConstraints().facingMode && !getSupportedFacingModeLies)) {
        delete constraints.video.facingMode;
        let matches;

        if (face.exact === 'environment' || face.ideal === 'environment') {
          matches = ['back', 'rear'];
        } else if (face.exact === 'user' || face.ideal === 'user') {
          matches = ['front'];
        }

        if (matches) {
          // Look for matches in label, or use last cam for back (typical).
          return navigator.mediaDevices.enumerateDevices().then(devices => {
            devices = devices.filter(d => d.kind === 'videoinput');
            let dev = devices.find(d => matches.some(match => d.label.toLowerCase().includes(match)));

            if (!dev && devices.length && matches.includes('back')) {
              dev = devices[devices.length - 1]; // more likely the back cam
            }

            if (dev) {
              constraints.video.deviceId = face.exact ? {
                exact: dev.deviceId
              } : {
                ideal: dev.deviceId
              };
            }

            constraints.video = constraintsToChrome_(constraints.video);
            logging('chrome: ' + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }

      constraints.video = constraintsToChrome_(constraints.video);
    }

    logging('chrome: ' + JSON.stringify(constraints));
    return func(constraints);
  };

  const shimError_ = function (e) {
    if (browserDetails.version >= 64) {
      return e;
    }

    return {
      name: {
        PermissionDeniedError: 'NotAllowedError',
        PermissionDismissedError: 'NotAllowedError',
        InvalidStateError: 'NotAllowedError',
        DevicesNotFoundError: 'NotFoundError',
        ConstraintNotSatisfiedError: 'OverconstrainedError',
        TrackStartError: 'NotReadableError',
        MediaDeviceFailedDueToShutdown: 'NotAllowedError',
        MediaDeviceKillSwitchOn: 'NotAllowedError',
        TabCaptureError: 'AbortError',
        ScreenCaptureError: 'AbortError',
        DeviceCaptureError: 'AbortError'
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraint || e.constraintName,

      toString() {
        return this.name + (this.message && ': ') + this.message;
      }

    };
  };

  const getUserMedia_ = function (constraints, onSuccess, onError) {
    shimConstraints_(constraints, c => {
      navigator.webkitGetUserMedia(c, onSuccess, e => {
        if (onError) {
          onError(shimError_(e));
        }
      });
    });
  };

  navigator.getUserMedia = getUserMedia_.bind(navigator); // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
  // function which returns a Promise, it does not accept spec-style
  // constraints.

  if (navigator.mediaDevices.getUserMedia) {
    const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

    navigator.mediaDevices.getUserMedia = function (cs) {
      return shimConstraints_(cs, c => origGetUserMedia(c).then(stream => {
        if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
          stream.getTracks().forEach(track => {
            track.stop();
          });
          throw new DOMException('', 'NotFoundError');
        }

        return stream;
      }, e => Promise.reject(shimError_(e))));
    };
  }
}

/*
 *  Copyright (c) 2018 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

function shimGetDisplayMedia$1(window, getSourceId) {
  if (window.navigator.mediaDevices && 'getDisplayMedia' in window.navigator.mediaDevices) {
    return;
  }

  if (!window.navigator.mediaDevices) {
    return;
  } // getSourceId is a function that returns a promise resolving with
  // the sourceId of the screen/window/tab to be shared.


  if (typeof getSourceId !== 'function') {
    console.error('shimGetDisplayMedia: getSourceId argument is not ' + 'a function');
    return;
  }

  window.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
    return getSourceId(constraints).then(sourceId => {
      const widthSpecified = constraints.video && constraints.video.width;
      const heightSpecified = constraints.video && constraints.video.height;
      const frameRateSpecified = constraints.video && constraints.video.frameRate;
      constraints.video = {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          maxFrameRate: frameRateSpecified || 3
        }
      };

      if (widthSpecified) {
        constraints.video.mandatory.maxWidth = widthSpecified;
      }

      if (heightSpecified) {
        constraints.video.mandatory.maxHeight = heightSpecified;
      }

      return window.navigator.mediaDevices.getUserMedia(constraints);
    });
  };
}

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
function shimMediaStream(window) {
  window.MediaStream = window.MediaStream || window.webkitMediaStream;
}
function shimOnTrack$1(window) {
  if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
      get() {
        return this._ontrack;
      },

      set(f) {
        if (this._ontrack) {
          this.removeEventListener('track', this._ontrack);
        }

        this.addEventListener('track', this._ontrack = f);
      },

      enumerable: true,
      configurable: true
    });
    const origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;

    window.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      if (!this._ontrackpoly) {
        this._ontrackpoly = e => {
          // onaddstream does not fire when a track is added to an existing
          // stream. But stream.onaddtrack is implemented so we use that.
          e.stream.addEventListener('addtrack', te => {
            let receiver;

            if (window.RTCPeerConnection.prototype.getReceivers) {
              receiver = this.getReceivers().find(r => r.track && r.track.id === te.track.id);
            } else {
              receiver = {
                track: te.track
              };
            }

            const event = new Event('track');
            event.track = te.track;
            event.receiver = receiver;
            event.transceiver = {
              receiver
            };
            event.streams = [e.stream];
            this.dispatchEvent(event);
          });
          e.stream.getTracks().forEach(track => {
            let receiver;

            if (window.RTCPeerConnection.prototype.getReceivers) {
              receiver = this.getReceivers().find(r => r.track && r.track.id === track.id);
            } else {
              receiver = {
                track
              };
            }

            const event = new Event('track');
            event.track = track;
            event.receiver = receiver;
            event.transceiver = {
              receiver
            };
            event.streams = [e.stream];
            this.dispatchEvent(event);
          });
        };

        this.addEventListener('addstream', this._ontrackpoly);
      }

      return origSetRemoteDescription.apply(this, arguments);
    };
  } else {
    // even if RTCRtpTransceiver is in window, it is only used and
    // emitted in unified-plan. Unfortunately this means we need
    // to unconditionally wrap the event.
    wrapPeerConnectionEvent(window, 'track', e => {
      if (!e.transceiver) {
        Object.defineProperty(e, 'transceiver', {
          value: {
            receiver: e.receiver
          }
        });
      }

      return e;
    });
  }
}
function shimGetSendersWithDtmf(window) {
  // Overrides addTrack/removeTrack, depends on shimAddTrackRemoveTrack.
  if (typeof window === 'object' && window.RTCPeerConnection && !('getSenders' in window.RTCPeerConnection.prototype) && 'createDTMFSender' in window.RTCPeerConnection.prototype) {
    const shimSenderWithDtmf = function (pc, track) {
      return {
        track,

        get dtmf() {
          if (this._dtmf === undefined) {
            if (track.kind === 'audio') {
              this._dtmf = pc.createDTMFSender(track);
            } else {
              this._dtmf = null;
            }
          }

          return this._dtmf;
        },

        _pc: pc
      };
    }; // augment addTrack when getSenders is not available.


    if (!window.RTCPeerConnection.prototype.getSenders) {
      window.RTCPeerConnection.prototype.getSenders = function getSenders() {
        this._senders = this._senders || [];
        return this._senders.slice(); // return a copy of the internal state.
      };

      const origAddTrack = window.RTCPeerConnection.prototype.addTrack;

      window.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
        let sender = origAddTrack.apply(this, arguments);

        if (!sender) {
          sender = shimSenderWithDtmf(this, track);

          this._senders.push(sender);
        }

        return sender;
      };

      const origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;

      window.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
        origRemoveTrack.apply(this, arguments);

        const idx = this._senders.indexOf(sender);

        if (idx !== -1) {
          this._senders.splice(idx, 1);
        }
      };
    }

    const origAddStream = window.RTCPeerConnection.prototype.addStream;

    window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      this._senders = this._senders || [];
      origAddStream.apply(this, [stream]);
      stream.getTracks().forEach(track => {
        this._senders.push(shimSenderWithDtmf(this, track));
      });
    };

    const origRemoveStream = window.RTCPeerConnection.prototype.removeStream;

    window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      this._senders = this._senders || [];
      origRemoveStream.apply(this, [stream]);
      stream.getTracks().forEach(track => {
        const sender = this._senders.find(s => s.track === track);

        if (sender) {
          // remove sender
          this._senders.splice(this._senders.indexOf(sender), 1);
        }
      });
    };
  } else if (typeof window === 'object' && window.RTCPeerConnection && 'getSenders' in window.RTCPeerConnection.prototype && 'createDTMFSender' in window.RTCPeerConnection.prototype && window.RTCRtpSender && !('dtmf' in window.RTCRtpSender.prototype)) {
    const origGetSenders = window.RTCPeerConnection.prototype.getSenders;

    window.RTCPeerConnection.prototype.getSenders = function getSenders() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach(sender => sender._pc = this);
      return senders;
    };

    Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
      get() {
        if (this._dtmf === undefined) {
          if (this.track.kind === 'audio') {
            this._dtmf = this._pc.createDTMFSender(this.track);
          } else {
            this._dtmf = null;
          }
        }

        return this._dtmf;
      }

    });
  }
}
function shimGetStats(window) {
  if (!window.RTCPeerConnection) {
    return;
  }

  const origGetStats = window.RTCPeerConnection.prototype.getStats;

  window.RTCPeerConnection.prototype.getStats = function getStats() {
    const [selector, onSucc, onErr] = arguments; // If selector is a function then we are in the old style stats so just
    // pass back the original getStats format to avoid breaking old users.

    if (arguments.length > 0 && typeof selector === 'function') {
      return origGetStats.apply(this, arguments);
    } // When spec-style getStats is supported, return those when called with
    // either no arguments or the selector argument is null.


    if (origGetStats.length === 0 && (arguments.length === 0 || typeof selector !== 'function')) {
      return origGetStats.apply(this, []);
    }

    const fixChromeStats_ = function (response) {
      const standardReport = {};
      const reports = response.result();
      reports.forEach(report => {
        const standardStats = {
          id: report.id,
          timestamp: report.timestamp,
          type: {
            localcandidate: 'local-candidate',
            remotecandidate: 'remote-candidate'
          }[report.type] || report.type
        };
        report.names().forEach(name => {
          standardStats[name] = report.stat(name);
        });
        standardReport[standardStats.id] = standardStats;
      });
      return standardReport;
    }; // shim getStats with maplike support


    const makeMapStats = function (stats) {
      return new Map(Object.keys(stats).map(key => [key, stats[key]]));
    };

    if (arguments.length >= 2) {
      const successCallbackWrapper_ = function (response) {
        onSucc(makeMapStats(fixChromeStats_(response)));
      };

      return origGetStats.apply(this, [successCallbackWrapper_, selector]);
    } // promise-support


    return new Promise((resolve, reject) => {
      origGetStats.apply(this, [function (response) {
        resolve(makeMapStats(fixChromeStats_(response)));
      }, reject]);
    }).then(onSucc, onErr);
  };
}
function shimSenderReceiverGetStats(window) {
  if (!(typeof window === 'object' && window.RTCPeerConnection && window.RTCRtpSender && window.RTCRtpReceiver)) {
    return;
  } // shim sender stats.


  if (!('getStats' in window.RTCRtpSender.prototype)) {
    const origGetSenders = window.RTCPeerConnection.prototype.getSenders;

    if (origGetSenders) {
      window.RTCPeerConnection.prototype.getSenders = function getSenders() {
        const senders = origGetSenders.apply(this, []);
        senders.forEach(sender => sender._pc = this);
        return senders;
      };
    }

    const origAddTrack = window.RTCPeerConnection.prototype.addTrack;

    if (origAddTrack) {
      window.RTCPeerConnection.prototype.addTrack = function addTrack() {
        const sender = origAddTrack.apply(this, arguments);
        sender._pc = this;
        return sender;
      };
    }

    window.RTCRtpSender.prototype.getStats = function getStats() {
      const sender = this;
      return this._pc.getStats().then(result =>
      /* Note: this will include stats of all senders that
       *   send a track with the same id as sender.track as
       *   it is not possible to identify the RTCRtpSender.
       */
      filterStats(result, sender.track, true));
    };
  } // shim receiver stats.


  if (!('getStats' in window.RTCRtpReceiver.prototype)) {
    const origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;

    if (origGetReceivers) {
      window.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
        const receivers = origGetReceivers.apply(this, []);
        receivers.forEach(receiver => receiver._pc = this);
        return receivers;
      };
    }

    wrapPeerConnectionEvent(window, 'track', e => {
      e.receiver._pc = e.srcElement;
      return e;
    });

    window.RTCRtpReceiver.prototype.getStats = function getStats() {
      const receiver = this;
      return this._pc.getStats().then(result => filterStats(result, receiver.track, false));
    };
  }

  if (!('getStats' in window.RTCRtpSender.prototype && 'getStats' in window.RTCRtpReceiver.prototype)) {
    return;
  } // shim RTCPeerConnection.getStats(track).


  const origGetStats = window.RTCPeerConnection.prototype.getStats;

  window.RTCPeerConnection.prototype.getStats = function getStats() {
    if (arguments.length > 0 && arguments[0] instanceof window.MediaStreamTrack) {
      const track = arguments[0];
      let sender;
      let receiver;
      let err;
      this.getSenders().forEach(s => {
        if (s.track === track) {
          if (sender) {
            err = true;
          } else {
            sender = s;
          }
        }
      });
      this.getReceivers().forEach(r => {
        if (r.track === track) {
          if (receiver) {
            err = true;
          } else {
            receiver = r;
          }
        }

        return r.track === track;
      });

      if (err || sender && receiver) {
        return Promise.reject(new DOMException('There are more than one sender or receiver for the track.', 'InvalidAccessError'));
      } else if (sender) {
        return sender.getStats();
      } else if (receiver) {
        return receiver.getStats();
      }

      return Promise.reject(new DOMException('There is no sender or receiver for the track.', 'InvalidAccessError'));
    }

    return origGetStats.apply(this, arguments);
  };
}
function shimAddTrackRemoveTrackWithNative(window) {
  // shim addTrack/removeTrack with native variants in order to make
  // the interactions with legacy getLocalStreams behave as in other browsers.
  // Keeps a mapping stream.id => [stream, rtpsenders...]
  window.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    return Object.keys(this._shimmedLocalStreams).map(streamId => this._shimmedLocalStreams[streamId][0]);
  };

  const origAddTrack = window.RTCPeerConnection.prototype.addTrack;

  window.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
    if (!stream) {
      return origAddTrack.apply(this, arguments);
    }

    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    const sender = origAddTrack.apply(this, arguments);

    if (!this._shimmedLocalStreams[stream.id]) {
      this._shimmedLocalStreams[stream.id] = [stream, sender];
    } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
      this._shimmedLocalStreams[stream.id].push(sender);
    }

    return sender;
  };

  const origAddStream = window.RTCPeerConnection.prototype.addStream;

  window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    stream.getTracks().forEach(track => {
      const alreadyExists = this.getSenders().find(s => s.track === track);

      if (alreadyExists) {
        throw new DOMException('Track already exists.', 'InvalidAccessError');
      }
    });
    const existingSenders = this.getSenders();
    origAddStream.apply(this, arguments);
    const newSenders = this.getSenders().filter(newSender => existingSenders.indexOf(newSender) === -1);
    this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
  };

  const origRemoveStream = window.RTCPeerConnection.prototype.removeStream;

  window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    delete this._shimmedLocalStreams[stream.id];
    return origRemoveStream.apply(this, arguments);
  };

  const origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;

  window.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};

    if (sender) {
      Object.keys(this._shimmedLocalStreams).forEach(streamId => {
        const idx = this._shimmedLocalStreams[streamId].indexOf(sender);

        if (idx !== -1) {
          this._shimmedLocalStreams[streamId].splice(idx, 1);
        }

        if (this._shimmedLocalStreams[streamId].length === 1) {
          delete this._shimmedLocalStreams[streamId];
        }
      });
    }

    return origRemoveTrack.apply(this, arguments);
  };
}
function shimAddTrackRemoveTrack(window, browserDetails) {
  if (!window.RTCPeerConnection) {
    return;
  } // shim addTrack and removeTrack.


  if (window.RTCPeerConnection.prototype.addTrack && browserDetails.version >= 65) {
    return shimAddTrackRemoveTrackWithNative(window);
  } // also shim pc.getLocalStreams when addTrack is shimmed
  // to return the original streams.


  const origGetLocalStreams = window.RTCPeerConnection.prototype.getLocalStreams;

  window.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
    const nativeStreams = origGetLocalStreams.apply(this);
    this._reverseStreams = this._reverseStreams || {};
    return nativeStreams.map(stream => this._reverseStreams[stream.id]);
  };

  const origAddStream = window.RTCPeerConnection.prototype.addStream;

  window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    stream.getTracks().forEach(track => {
      const alreadyExists = this.getSenders().find(s => s.track === track);

      if (alreadyExists) {
        throw new DOMException('Track already exists.', 'InvalidAccessError');
      }
    }); // Add identity mapping for consistency with addTrack.
    // Unless this is being used with a stream from addTrack.

    if (!this._reverseStreams[stream.id]) {
      const newStream = new window.MediaStream(stream.getTracks());
      this._streams[stream.id] = newStream;
      this._reverseStreams[newStream.id] = stream;
      stream = newStream;
    }

    origAddStream.apply(this, [stream]);
  };

  const origRemoveStream = window.RTCPeerConnection.prototype.removeStream;

  window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    origRemoveStream.apply(this, [this._streams[stream.id] || stream]);
    delete this._reverseStreams[this._streams[stream.id] ? this._streams[stream.id].id : stream.id];
    delete this._streams[stream.id];
  };

  window.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
    if (this.signalingState === 'closed') {
      throw new DOMException('The RTCPeerConnection\'s signalingState is \'closed\'.', 'InvalidStateError');
    }

    const streams = [].slice.call(arguments, 1);

    if (streams.length !== 1 || !streams[0].getTracks().find(t => t === track)) {
      // this is not fully correct but all we can manage without
      // [[associated MediaStreams]] internal slot.
      throw new DOMException('The adapter.js addTrack polyfill only supports a single ' + ' stream which is associated with the specified track.', 'NotSupportedError');
    }

    const alreadyExists = this.getSenders().find(s => s.track === track);

    if (alreadyExists) {
      throw new DOMException('Track already exists.', 'InvalidAccessError');
    }

    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    const oldStream = this._streams[stream.id];

    if (oldStream) {
      // this is using odd Chrome behaviour, use with caution:
      // https://bugs.chromium.org/p/webrtc/issues/detail?id=7815
      // Note: we rely on the high-level addTrack/dtmf shim to
      // create the sender with a dtmf sender.
      oldStream.addTrack(track); // Trigger ONN async.

      Promise.resolve().then(() => {
        this.dispatchEvent(new Event('negotiationneeded'));
      });
    } else {
      const newStream = new window.MediaStream([track]);
      this._streams[stream.id] = newStream;
      this._reverseStreams[newStream.id] = stream;
      this.addStream(newStream);
    }

    return this.getSenders().find(s => s.track === track);
  }; // replace the internal stream id with the external one and
  // vice versa.


  function replaceInternalStreamId(pc, description) {
    let sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach(internalId => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(internalStream.id, 'g'), externalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp
    });
  }

  function replaceExternalStreamId(pc, description) {
    let sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach(internalId => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(externalStream.id, 'g'), internalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp
    });
  }

  ['createOffer', 'createAnswer'].forEach(function (method) {
    const nativeMethod = window.RTCPeerConnection.prototype[method];
    const methodObj = {
      [method]() {
        const args = arguments;
        const isLegacyCall = arguments.length && typeof arguments[0] === 'function';

        if (isLegacyCall) {
          return nativeMethod.apply(this, [description => {
            const desc = replaceInternalStreamId(this, description);
            args[0].apply(null, [desc]);
          }, err => {
            if (args[1]) {
              args[1].apply(null, err);
            }
          }, arguments[2]]);
        }

        return nativeMethod.apply(this, arguments).then(description => replaceInternalStreamId(this, description));
      }

    };
    window.RTCPeerConnection.prototype[method] = methodObj[method];
  });
  const origSetLocalDescription = window.RTCPeerConnection.prototype.setLocalDescription;

  window.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
    if (!arguments.length || !arguments[0].type) {
      return origSetLocalDescription.apply(this, arguments);
    }

    arguments[0] = replaceExternalStreamId(this, arguments[0]);
    return origSetLocalDescription.apply(this, arguments);
  }; // TODO: mangle getStats: https://w3c.github.io/webrtc-stats/#dom-rtcmediastreamstats-streamidentifier


  const origLocalDescription = Object.getOwnPropertyDescriptor(window.RTCPeerConnection.prototype, 'localDescription');
  Object.defineProperty(window.RTCPeerConnection.prototype, 'localDescription', {
    get() {
      const description = origLocalDescription.get.apply(this);

      if (description.type === '') {
        return description;
      }

      return replaceInternalStreamId(this, description);
    }

  });

  window.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
    if (this.signalingState === 'closed') {
      throw new DOMException('The RTCPeerConnection\'s signalingState is \'closed\'.', 'InvalidStateError');
    } // We can not yet check for sender instanceof RTCRtpSender
    // since we shim RTPSender. So we check if sender._pc is set.


    if (!sender._pc) {
      throw new DOMException('Argument 1 of RTCPeerConnection.removeTrack ' + 'does not implement interface RTCRtpSender.', 'TypeError');
    }

    const isLocal = sender._pc === this;

    if (!isLocal) {
      throw new DOMException('Sender was not created by this connection.', 'InvalidAccessError');
    } // Search for the native stream the senders track belongs to.


    this._streams = this._streams || {};
    let stream;
    Object.keys(this._streams).forEach(streamid => {
      const hasTrack = this._streams[streamid].getTracks().find(track => sender.track === track);

      if (hasTrack) {
        stream = this._streams[streamid];
      }
    });

    if (stream) {
      if (stream.getTracks().length === 1) {
        // if this is the last track of the stream, remove the stream. This
        // takes care of any shimmed _senders.
        this.removeStream(this._reverseStreams[stream.id]);
      } else {
        // relying on the same odd chrome behaviour as above.
        stream.removeTrack(sender.track);
      }

      this.dispatchEvent(new Event('negotiationneeded'));
    }
  };
}
function shimPeerConnection$1(window, browserDetails) {
  if (!window.RTCPeerConnection && window.webkitRTCPeerConnection) {
    // very basic support for old versions.
    window.RTCPeerConnection = window.webkitRTCPeerConnection;
  }

  if (!window.RTCPeerConnection) {
    return;
  } // shim implicit creation of RTCSessionDescription/RTCIceCandidate


  if (browserDetails.version < 53) {
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'].forEach(function (method) {
      const nativeMethod = window.RTCPeerConnection.prototype[method];
      const methodObj = {
        [method]() {
          arguments[0] = new (method === 'addIceCandidate' ? window.RTCIceCandidate : window.RTCSessionDescription)(arguments[0]);
          return nativeMethod.apply(this, arguments);
        }

      };
      window.RTCPeerConnection.prototype[method] = methodObj[method];
    });
  }
} // Attempt to fix ONN in plan-b mode.

function fixNegotiationNeeded(window, browserDetails) {
  wrapPeerConnectionEvent(window, 'negotiationneeded', e => {
    const pc = e.target;

    if (browserDetails.version < 72 || pc.getConfiguration && pc.getConfiguration().sdpSemantics === 'plan-b') {
      if (pc.signalingState !== 'stable') {
        return;
      }
    }

    return e;
  });
}

var chromeShim = /*#__PURE__*/Object.freeze({
	__proto__: null,
	shimMediaStream: shimMediaStream,
	shimOnTrack: shimOnTrack$1,
	shimGetSendersWithDtmf: shimGetSendersWithDtmf,
	shimGetStats: shimGetStats,
	shimSenderReceiverGetStats: shimSenderReceiverGetStats,
	shimAddTrackRemoveTrackWithNative: shimAddTrackRemoveTrackWithNative,
	shimAddTrackRemoveTrack: shimAddTrackRemoveTrack,
	shimPeerConnection: shimPeerConnection$1,
	fixNegotiationNeeded: fixNegotiationNeeded,
	shimGetUserMedia: shimGetUserMedia$2,
	shimGetDisplayMedia: shimGetDisplayMedia$1
});

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
function shimGetUserMedia$1(window, browserDetails) {
  const navigator = window && window.navigator;
  const MediaStreamTrack = window && window.MediaStreamTrack;

  navigator.getUserMedia = function (constraints, onSuccess, onError) {
    // Replace Firefox 44+'s deprecation warning with unprefixed version.
    deprecated('navigator.getUserMedia', 'navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };

  if (!(browserDetails.version > 55 && 'autoGainControl' in navigator.mediaDevices.getSupportedConstraints())) {
    const remap = function (obj, a, b) {
      if (a in obj && !(b in obj)) {
        obj[b] = obj[a];
        delete obj[a];
      }
    };

    const nativeGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

    navigator.mediaDevices.getUserMedia = function (c) {
      if (typeof c === 'object' && typeof c.audio === 'object') {
        c = JSON.parse(JSON.stringify(c));
        remap(c.audio, 'autoGainControl', 'mozAutoGainControl');
        remap(c.audio, 'noiseSuppression', 'mozNoiseSuppression');
      }

      return nativeGetUserMedia(c);
    };

    if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
      const nativeGetSettings = MediaStreamTrack.prototype.getSettings;

      MediaStreamTrack.prototype.getSettings = function () {
        const obj = nativeGetSettings.apply(this, arguments);
        remap(obj, 'mozAutoGainControl', 'autoGainControl');
        remap(obj, 'mozNoiseSuppression', 'noiseSuppression');
        return obj;
      };
    }

    if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
      const nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;

      MediaStreamTrack.prototype.applyConstraints = function (c) {
        if (this.kind === 'audio' && typeof c === 'object') {
          c = JSON.parse(JSON.stringify(c));
          remap(c, 'autoGainControl', 'mozAutoGainControl');
          remap(c, 'noiseSuppression', 'mozNoiseSuppression');
        }

        return nativeApplyConstraints.apply(this, [c]);
      };
    }
  }
}

/*
 *  Copyright (c) 2018 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

function shimGetDisplayMedia(window, preferredMediaSource) {
  if (window.navigator.mediaDevices && 'getDisplayMedia' in window.navigator.mediaDevices) {
    return;
  }

  if (!window.navigator.mediaDevices) {
    return;
  }

  window.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
    if (!(constraints && constraints.video)) {
      const err = new DOMException('getDisplayMedia without video ' + 'constraints is undefined');
      err.name = 'NotFoundError'; // from https://heycam.github.io/webidl/#idl-DOMException-error-names

      err.code = 8;
      return Promise.reject(err);
    }

    if (constraints.video === true) {
      constraints.video = {
        mediaSource: preferredMediaSource
      };
    } else {
      constraints.video.mediaSource = preferredMediaSource;
    }

    return window.navigator.mediaDevices.getUserMedia(constraints);
  };
}

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
function shimOnTrack(window) {
  if (typeof window === 'object' && window.RTCTrackEvent && 'receiver' in window.RTCTrackEvent.prototype && !('transceiver' in window.RTCTrackEvent.prototype)) {
    Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
      get() {
        return {
          receiver: this.receiver
        };
      }

    });
  }
}
function shimPeerConnection(window, browserDetails) {
  if (typeof window !== 'object' || !(window.RTCPeerConnection || window.mozRTCPeerConnection)) {
    return; // probably media.peerconnection.enabled=false in about:config
  }

  if (!window.RTCPeerConnection && window.mozRTCPeerConnection) {
    // very basic support for old versions.
    window.RTCPeerConnection = window.mozRTCPeerConnection;
  }

  if (browserDetails.version < 53) {
    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'].forEach(function (method) {
      const nativeMethod = window.RTCPeerConnection.prototype[method];
      const methodObj = {
        [method]() {
          arguments[0] = new (method === 'addIceCandidate' ? window.RTCIceCandidate : window.RTCSessionDescription)(arguments[0]);
          return nativeMethod.apply(this, arguments);
        }

      };
      window.RTCPeerConnection.prototype[method] = methodObj[method];
    });
  }

  const modernStatsTypes = {
    inboundrtp: 'inbound-rtp',
    outboundrtp: 'outbound-rtp',
    candidatepair: 'candidate-pair',
    localcandidate: 'local-candidate',
    remotecandidate: 'remote-candidate'
  };
  const nativeGetStats = window.RTCPeerConnection.prototype.getStats;

  window.RTCPeerConnection.prototype.getStats = function getStats() {
    const [selector, onSucc, onErr] = arguments;
    return nativeGetStats.apply(this, [selector || null]).then(stats => {
      if (browserDetails.version < 53 && !onSucc) {
        // Shim only promise getStats with spec-hyphens in type names
        // Leave callback version alone; misc old uses of forEach before Map
        try {
          stats.forEach(stat => {
            stat.type = modernStatsTypes[stat.type] || stat.type;
          });
        } catch (e) {
          if (e.name !== 'TypeError') {
            throw e;
          } // Avoid TypeError: "type" is read-only, in old versions. 34-43ish


          stats.forEach((stat, i) => {
            stats.set(i, Object.assign({}, stat, {
              type: modernStatsTypes[stat.type] || stat.type
            }));
          });
        }
      }

      return stats;
    }).then(onSucc, onErr);
  };
}
function shimSenderGetStats(window) {
  if (!(typeof window === 'object' && window.RTCPeerConnection && window.RTCRtpSender)) {
    return;
  }

  if (window.RTCRtpSender && 'getStats' in window.RTCRtpSender.prototype) {
    return;
  }

  const origGetSenders = window.RTCPeerConnection.prototype.getSenders;

  if (origGetSenders) {
    window.RTCPeerConnection.prototype.getSenders = function getSenders() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach(sender => sender._pc = this);
      return senders;
    };
  }

  const origAddTrack = window.RTCPeerConnection.prototype.addTrack;

  if (origAddTrack) {
    window.RTCPeerConnection.prototype.addTrack = function addTrack() {
      const sender = origAddTrack.apply(this, arguments);
      sender._pc = this;
      return sender;
    };
  }

  window.RTCRtpSender.prototype.getStats = function getStats() {
    return this.track ? this._pc.getStats(this.track) : Promise.resolve(new Map());
  };
}
function shimReceiverGetStats(window) {
  if (!(typeof window === 'object' && window.RTCPeerConnection && window.RTCRtpSender)) {
    return;
  }

  if (window.RTCRtpSender && 'getStats' in window.RTCRtpReceiver.prototype) {
    return;
  }

  const origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;

  if (origGetReceivers) {
    window.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
      const receivers = origGetReceivers.apply(this, []);
      receivers.forEach(receiver => receiver._pc = this);
      return receivers;
    };
  }

  wrapPeerConnectionEvent(window, 'track', e => {
    e.receiver._pc = e.srcElement;
    return e;
  });

  window.RTCRtpReceiver.prototype.getStats = function getStats() {
    return this._pc.getStats(this.track);
  };
}
function shimRemoveStream(window) {
  if (!window.RTCPeerConnection || 'removeStream' in window.RTCPeerConnection.prototype) {
    return;
  }

  window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    deprecated('removeStream', 'removeTrack');
    this.getSenders().forEach(sender => {
      if (sender.track && stream.getTracks().includes(sender.track)) {
        this.removeTrack(sender);
      }
    });
  };
}
function shimRTCDataChannel(window) {
  // rename DataChannel to RTCDataChannel (native fix in FF60):
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1173851
  if (window.DataChannel && !window.RTCDataChannel) {
    window.RTCDataChannel = window.DataChannel;
  }
}
function shimAddTransceiver(window) {
  // https://github.com/webrtcHacks/adapter/issues/998#issuecomment-516921647
  // Firefox ignores the init sendEncodings options passed to addTransceiver
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1396918
  if (!(typeof window === 'object' && window.RTCPeerConnection)) {
    return;
  }

  const origAddTransceiver = window.RTCPeerConnection.prototype.addTransceiver;

  if (origAddTransceiver) {
    window.RTCPeerConnection.prototype.addTransceiver = function addTransceiver() {
      this.setParametersPromises = [];
      const initParameters = arguments[1];
      const shouldPerformCheck = initParameters && 'sendEncodings' in initParameters;

      if (shouldPerformCheck) {
        // If sendEncodings params are provided, validate grammar
        initParameters.sendEncodings.forEach(encodingParam => {
          if ('rid' in encodingParam) {
            const ridRegex = /^[a-z0-9]{0,16}$/i;

            if (!ridRegex.test(encodingParam.rid)) {
              throw new TypeError('Invalid RID value provided.');
            }
          }

          if ('scaleResolutionDownBy' in encodingParam) {
            if (!(parseFloat(encodingParam.scaleResolutionDownBy) >= 1.0)) {
              throw new RangeError('scale_resolution_down_by must be >= 1.0');
            }
          }

          if ('maxFramerate' in encodingParam) {
            if (!(parseFloat(encodingParam.maxFramerate) >= 0)) {
              throw new RangeError('max_framerate must be >= 0.0');
            }
          }
        });
      }

      const transceiver = origAddTransceiver.apply(this, arguments);

      if (shouldPerformCheck) {
        // Check if the init options were applied. If not we do this in an
        // asynchronous way and save the promise reference in a global object.
        // This is an ugly hack, but at the same time is way more robust than
        // checking the sender parameters before and after the createOffer
        // Also note that after the createoffer we are not 100% sure that
        // the params were asynchronously applied so we might miss the
        // opportunity to recreate offer.
        const {
          sender
        } = transceiver;
        const params = sender.getParameters();

        if (!('encodings' in params) || // Avoid being fooled by patched getParameters() below.
        params.encodings.length === 1 && Object.keys(params.encodings[0]).length === 0) {
          params.encodings = initParameters.sendEncodings;
          sender.sendEncodings = initParameters.sendEncodings;
          this.setParametersPromises.push(sender.setParameters(params).then(() => {
            delete sender.sendEncodings;
          }).catch(() => {
            delete sender.sendEncodings;
          }));
        }
      }

      return transceiver;
    };
  }
}
function shimGetParameters(window) {
  if (!(typeof window === 'object' && window.RTCRtpSender)) {
    return;
  }

  const origGetParameters = window.RTCRtpSender.prototype.getParameters;

  if (origGetParameters) {
    window.RTCRtpSender.prototype.getParameters = function getParameters() {
      const params = origGetParameters.apply(this, arguments);

      if (!('encodings' in params)) {
        params.encodings = [].concat(this.sendEncodings || [{}]);
      }

      return params;
    };
  }
}
function shimCreateOffer(window) {
  // https://github.com/webrtcHacks/adapter/issues/998#issuecomment-516921647
  // Firefox ignores the init sendEncodings options passed to addTransceiver
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1396918
  if (!(typeof window === 'object' && window.RTCPeerConnection)) {
    return;
  }

  const origCreateOffer = window.RTCPeerConnection.prototype.createOffer;

  window.RTCPeerConnection.prototype.createOffer = function createOffer() {
    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises).then(() => {
        return origCreateOffer.apply(this, arguments);
      }).finally(() => {
        this.setParametersPromises = [];
      });
    }

    return origCreateOffer.apply(this, arguments);
  };
}
function shimCreateAnswer(window) {
  // https://github.com/webrtcHacks/adapter/issues/998#issuecomment-516921647
  // Firefox ignores the init sendEncodings options passed to addTransceiver
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1396918
  if (!(typeof window === 'object' && window.RTCPeerConnection)) {
    return;
  }

  const origCreateAnswer = window.RTCPeerConnection.prototype.createAnswer;

  window.RTCPeerConnection.prototype.createAnswer = function createAnswer() {
    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises).then(() => {
        return origCreateAnswer.apply(this, arguments);
      }).finally(() => {
        this.setParametersPromises = [];
      });
    }

    return origCreateAnswer.apply(this, arguments);
  };
}

var firefoxShim = /*#__PURE__*/Object.freeze({
	__proto__: null,
	shimOnTrack: shimOnTrack,
	shimPeerConnection: shimPeerConnection,
	shimSenderGetStats: shimSenderGetStats,
	shimReceiverGetStats: shimReceiverGetStats,
	shimRemoveStream: shimRemoveStream,
	shimRTCDataChannel: shimRTCDataChannel,
	shimAddTransceiver: shimAddTransceiver,
	shimGetParameters: shimGetParameters,
	shimCreateOffer: shimCreateOffer,
	shimCreateAnswer: shimCreateAnswer,
	shimGetUserMedia: shimGetUserMedia$1,
	shimGetDisplayMedia: shimGetDisplayMedia
});

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
function shimLocalStreamsAPI(window) {
  if (typeof window !== 'object' || !window.RTCPeerConnection) {
    return;
  }

  if (!('getLocalStreams' in window.RTCPeerConnection.prototype)) {
    window.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
      if (!this._localStreams) {
        this._localStreams = [];
      }

      return this._localStreams;
    };
  }

  if (!('addStream' in window.RTCPeerConnection.prototype)) {
    const _addTrack = window.RTCPeerConnection.prototype.addTrack;

    window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      if (!this._localStreams) {
        this._localStreams = [];
      }

      if (!this._localStreams.includes(stream)) {
        this._localStreams.push(stream);
      } // Try to emulate Chrome's behaviour of adding in audio-video order.
      // Safari orders by track id.


      stream.getAudioTracks().forEach(track => _addTrack.call(this, track, stream));
      stream.getVideoTracks().forEach(track => _addTrack.call(this, track, stream));
    };

    window.RTCPeerConnection.prototype.addTrack = function addTrack(track) {
      for (var _len = arguments.length, streams = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        streams[_key - 1] = arguments[_key];
      }

      if (streams) {
        streams.forEach(stream => {
          if (!this._localStreams) {
            this._localStreams = [stream];
          } else if (!this._localStreams.includes(stream)) {
            this._localStreams.push(stream);
          }
        });
      }

      return _addTrack.apply(this, arguments);
    };
  }

  if (!('removeStream' in window.RTCPeerConnection.prototype)) {
    window.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      if (!this._localStreams) {
        this._localStreams = [];
      }

      const index = this._localStreams.indexOf(stream);

      if (index === -1) {
        return;
      }

      this._localStreams.splice(index, 1);

      const tracks = stream.getTracks();
      this.getSenders().forEach(sender => {
        if (tracks.includes(sender.track)) {
          this.removeTrack(sender);
        }
      });
    };
  }
}
function shimRemoteStreamsAPI(window) {
  if (typeof window !== 'object' || !window.RTCPeerConnection) {
    return;
  }

  if (!('getRemoteStreams' in window.RTCPeerConnection.prototype)) {
    window.RTCPeerConnection.prototype.getRemoteStreams = function getRemoteStreams() {
      return this._remoteStreams ? this._remoteStreams : [];
    };
  }

  if (!('onaddstream' in window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'onaddstream', {
      get() {
        return this._onaddstream;
      },

      set(f) {
        if (this._onaddstream) {
          this.removeEventListener('addstream', this._onaddstream);
          this.removeEventListener('track', this._onaddstreampoly);
        }

        this.addEventListener('addstream', this._onaddstream = f);
        this.addEventListener('track', this._onaddstreampoly = e => {
          e.streams.forEach(stream => {
            if (!this._remoteStreams) {
              this._remoteStreams = [];
            }

            if (this._remoteStreams.includes(stream)) {
              return;
            }

            this._remoteStreams.push(stream);

            const event = new Event('addstream');
            event.stream = stream;
            this.dispatchEvent(event);
          });
        });
      }

    });
    const origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;

    window.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      const pc = this;

      if (!this._onaddstreampoly) {
        this.addEventListener('track', this._onaddstreampoly = function (e) {
          e.streams.forEach(stream => {
            if (!pc._remoteStreams) {
              pc._remoteStreams = [];
            }

            if (pc._remoteStreams.indexOf(stream) >= 0) {
              return;
            }

            pc._remoteStreams.push(stream);

            const event = new Event('addstream');
            event.stream = stream;
            pc.dispatchEvent(event);
          });
        });
      }

      return origSetRemoteDescription.apply(pc, arguments);
    };
  }
}
function shimCallbacksAPI(window) {
  if (typeof window !== 'object' || !window.RTCPeerConnection) {
    return;
  }

  const prototype = window.RTCPeerConnection.prototype;
  const origCreateOffer = prototype.createOffer;
  const origCreateAnswer = prototype.createAnswer;
  const setLocalDescription = prototype.setLocalDescription;
  const setRemoteDescription = prototype.setRemoteDescription;
  const addIceCandidate = prototype.addIceCandidate;

  prototype.createOffer = function createOffer(successCallback, failureCallback) {
    const options = arguments.length >= 2 ? arguments[2] : arguments[0];
    const promise = origCreateOffer.apply(this, [options]);

    if (!failureCallback) {
      return promise;
    }

    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };

  prototype.createAnswer = function createAnswer(successCallback, failureCallback) {
    const options = arguments.length >= 2 ? arguments[2] : arguments[0];
    const promise = origCreateAnswer.apply(this, [options]);

    if (!failureCallback) {
      return promise;
    }

    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };

  let withCallback = function (description, successCallback, failureCallback) {
    const promise = setLocalDescription.apply(this, [description]);

    if (!failureCallback) {
      return promise;
    }

    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };

  prototype.setLocalDescription = withCallback;

  withCallback = function (description, successCallback, failureCallback) {
    const promise = setRemoteDescription.apply(this, [description]);

    if (!failureCallback) {
      return promise;
    }

    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };

  prototype.setRemoteDescription = withCallback;

  withCallback = function (candidate, successCallback, failureCallback) {
    const promise = addIceCandidate.apply(this, [candidate]);

    if (!failureCallback) {
      return promise;
    }

    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };

  prototype.addIceCandidate = withCallback;
}
function shimGetUserMedia(window) {
  const navigator = window && window.navigator;

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // shim not needed in Safari 12.1
    const mediaDevices = navigator.mediaDevices;

    const _getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);

    navigator.mediaDevices.getUserMedia = constraints => {
      return _getUserMedia(shimConstraints(constraints));
    };
  }

  if (!navigator.getUserMedia && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.getUserMedia = function getUserMedia(constraints, cb, errcb) {
      navigator.mediaDevices.getUserMedia(constraints).then(cb, errcb);
    }.bind(navigator);
  }
}
function shimConstraints(constraints) {
  if (constraints && constraints.video !== undefined) {
    return Object.assign({}, constraints, {
      video: compactObject(constraints.video)
    });
  }

  return constraints;
}
function shimRTCIceServerUrls(window) {
  if (!window.RTCPeerConnection) {
    return;
  } // migrate from non-spec RTCIceServer.url to RTCIceServer.urls


  const OrigPeerConnection = window.RTCPeerConnection;

  window.RTCPeerConnection = function RTCPeerConnection(pcConfig, pcConstraints) {
    if (pcConfig && pcConfig.iceServers) {
      const newIceServers = [];

      for (let i = 0; i < pcConfig.iceServers.length; i++) {
        let server = pcConfig.iceServers[i];

        if (!server.hasOwnProperty('urls') && server.hasOwnProperty('url')) {
          deprecated('RTCIceServer.url', 'RTCIceServer.urls');
          server = JSON.parse(JSON.stringify(server));
          server.urls = server.url;
          delete server.url;
          newIceServers.push(server);
        } else {
          newIceServers.push(pcConfig.iceServers[i]);
        }
      }

      pcConfig.iceServers = newIceServers;
    }

    return new OrigPeerConnection(pcConfig, pcConstraints);
  };

  window.RTCPeerConnection.prototype = OrigPeerConnection.prototype; // wrap static methods. Currently just generateCertificate.

  if ('generateCertificate' in OrigPeerConnection) {
    Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
      get() {
        return OrigPeerConnection.generateCertificate;
      }

    });
  }
}
function shimTrackEventTransceiver(window) {
  // Add event.transceiver member over deprecated event.receiver
  if (typeof window === 'object' && window.RTCTrackEvent && 'receiver' in window.RTCTrackEvent.prototype && !('transceiver' in window.RTCTrackEvent.prototype)) {
    Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
      get() {
        return {
          receiver: this.receiver
        };
      }

    });
  }
}
function shimCreateOfferLegacy(window) {
  const origCreateOffer = window.RTCPeerConnection.prototype.createOffer;

  window.RTCPeerConnection.prototype.createOffer = function createOffer(offerOptions) {
    if (offerOptions) {
      if (typeof offerOptions.offerToReceiveAudio !== 'undefined') {
        // support bit values
        offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
      }

      const audioTransceiver = this.getTransceivers().find(transceiver => transceiver.receiver.track.kind === 'audio');

      if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
        if (audioTransceiver.direction === 'sendrecv') {
          if (audioTransceiver.setDirection) {
            audioTransceiver.setDirection('sendonly');
          } else {
            audioTransceiver.direction = 'sendonly';
          }
        } else if (audioTransceiver.direction === 'recvonly') {
          if (audioTransceiver.setDirection) {
            audioTransceiver.setDirection('inactive');
          } else {
            audioTransceiver.direction = 'inactive';
          }
        }
      } else if (offerOptions.offerToReceiveAudio === true && !audioTransceiver) {
        this.addTransceiver('audio', {
          direction: 'recvonly'
        });
      }

      if (typeof offerOptions.offerToReceiveVideo !== 'undefined') {
        // support bit values
        offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
      }

      const videoTransceiver = this.getTransceivers().find(transceiver => transceiver.receiver.track.kind === 'video');

      if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
        if (videoTransceiver.direction === 'sendrecv') {
          if (videoTransceiver.setDirection) {
            videoTransceiver.setDirection('sendonly');
          } else {
            videoTransceiver.direction = 'sendonly';
          }
        } else if (videoTransceiver.direction === 'recvonly') {
          if (videoTransceiver.setDirection) {
            videoTransceiver.setDirection('inactive');
          } else {
            videoTransceiver.direction = 'inactive';
          }
        }
      } else if (offerOptions.offerToReceiveVideo === true && !videoTransceiver) {
        this.addTransceiver('video', {
          direction: 'recvonly'
        });
      }
    }

    return origCreateOffer.apply(this, arguments);
  };
}
function shimAudioContext(window) {
  if (typeof window !== 'object' || window.AudioContext) {
    return;
  }

  window.AudioContext = window.webkitAudioContext;
}

var safariShim = /*#__PURE__*/Object.freeze({
	__proto__: null,
	shimLocalStreamsAPI: shimLocalStreamsAPI,
	shimRemoteStreamsAPI: shimRemoteStreamsAPI,
	shimCallbacksAPI: shimCallbacksAPI,
	shimGetUserMedia: shimGetUserMedia,
	shimConstraints: shimConstraints,
	shimRTCIceServerUrls: shimRTCIceServerUrls,
	shimTrackEventTransceiver: shimTrackEventTransceiver,
	shimCreateOfferLegacy: shimCreateOfferLegacy,
	shimAudioContext: shimAudioContext
});

var sdp$1 = {exports: {}};

/* eslint-env node */

(function (module) {

  const SDPUtils = {}; // Generate an alphanumeric identifier for cname or mids.
  // TODO: use UUIDs instead? https://gist.github.com/jed/982883

  SDPUtils.generateIdentifier = function () {
    return Math.random().toString(36).substr(2, 10);
  }; // The RTCP CNAME used by all peerconnections from the same JS.


  SDPUtils.localCName = SDPUtils.generateIdentifier(); // Splits SDP into lines, dealing with both CRLF and LF.

  SDPUtils.splitLines = function (blob) {
    return blob.trim().split('\n').map(line => line.trim());
  }; // Splits SDP into sessionpart and mediasections. Ensures CRLF.


  SDPUtils.splitSections = function (blob) {
    const parts = blob.split('\nm=');
    return parts.map((part, index) => (index > 0 ? 'm=' + part : part).trim() + '\r\n');
  }; // Returns the session description.


  SDPUtils.getDescription = function (blob) {
    const sections = SDPUtils.splitSections(blob);
    return sections && sections[0];
  }; // Returns the individual media sections.


  SDPUtils.getMediaSections = function (blob) {
    const sections = SDPUtils.splitSections(blob);
    sections.shift();
    return sections;
  }; // Returns lines that start with a certain prefix.


  SDPUtils.matchPrefix = function (blob, prefix) {
    return SDPUtils.splitLines(blob).filter(line => line.indexOf(prefix) === 0);
  }; // Parses an ICE candidate line. Sample input:
  // candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
  // rport 55996"
  // Input can be prefixed with a=.


  SDPUtils.parseCandidate = function (line) {
    let parts; // Parse both variants.

    if (line.indexOf('a=candidate:') === 0) {
      parts = line.substring(12).split(' ');
    } else {
      parts = line.substring(10).split(' ');
    }

    const candidate = {
      foundation: parts[0],
      component: {
        1: 'rtp',
        2: 'rtcp'
      }[parts[1]] || parts[1],
      protocol: parts[2].toLowerCase(),
      priority: parseInt(parts[3], 10),
      ip: parts[4],
      address: parts[4],
      // address is an alias for ip.
      port: parseInt(parts[5], 10),
      // skip parts[6] == 'typ'
      type: parts[7]
    };

    for (let i = 8; i < parts.length; i += 2) {
      switch (parts[i]) {
        case 'raddr':
          candidate.relatedAddress = parts[i + 1];
          break;

        case 'rport':
          candidate.relatedPort = parseInt(parts[i + 1], 10);
          break;

        case 'tcptype':
          candidate.tcpType = parts[i + 1];
          break;

        case 'ufrag':
          candidate.ufrag = parts[i + 1]; // for backward compatibility.

          candidate.usernameFragment = parts[i + 1];
          break;

        default:
          // extension handling, in particular ufrag. Don't overwrite.
          if (candidate[parts[i]] === undefined) {
            candidate[parts[i]] = parts[i + 1];
          }

          break;
      }
    }

    return candidate;
  }; // Translates a candidate object into SDP candidate attribute.
  // This does not include the a= prefix!


  SDPUtils.writeCandidate = function (candidate) {
    const sdp = [];
    sdp.push(candidate.foundation);
    const component = candidate.component;

    if (component === 'rtp') {
      sdp.push(1);
    } else if (component === 'rtcp') {
      sdp.push(2);
    } else {
      sdp.push(component);
    }

    sdp.push(candidate.protocol.toUpperCase());
    sdp.push(candidate.priority);
    sdp.push(candidate.address || candidate.ip);
    sdp.push(candidate.port);
    const type = candidate.type;
    sdp.push('typ');
    sdp.push(type);

    if (type !== 'host' && candidate.relatedAddress && candidate.relatedPort) {
      sdp.push('raddr');
      sdp.push(candidate.relatedAddress);
      sdp.push('rport');
      sdp.push(candidate.relatedPort);
    }

    if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
      sdp.push('tcptype');
      sdp.push(candidate.tcpType);
    }

    if (candidate.usernameFragment || candidate.ufrag) {
      sdp.push('ufrag');
      sdp.push(candidate.usernameFragment || candidate.ufrag);
    }

    return 'candidate:' + sdp.join(' ');
  }; // Parses an ice-options line, returns an array of option tags.
  // Sample input:
  // a=ice-options:foo bar


  SDPUtils.parseIceOptions = function (line) {
    return line.substr(14).split(' ');
  }; // Parses a rtpmap line, returns RTCRtpCoddecParameters. Sample input:
  // a=rtpmap:111 opus/48000/2


  SDPUtils.parseRtpMap = function (line) {
    let parts = line.substr(9).split(' ');
    const parsed = {
      payloadType: parseInt(parts.shift(), 10) // was: id

    };
    parts = parts[0].split('/');
    parsed.name = parts[0];
    parsed.clockRate = parseInt(parts[1], 10); // was: clockrate

    parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1; // legacy alias, got renamed back to channels in ORTC.

    parsed.numChannels = parsed.channels;
    return parsed;
  }; // Generates a rtpmap line from RTCRtpCodecCapability or
  // RTCRtpCodecParameters.


  SDPUtils.writeRtpMap = function (codec) {
    let pt = codec.payloadType;

    if (codec.preferredPayloadType !== undefined) {
      pt = codec.preferredPayloadType;
    }

    const channels = codec.channels || codec.numChannels || 1;
    return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate + (channels !== 1 ? '/' + channels : '') + '\r\n';
  }; // Parses a extmap line (headerextension from RFC 5285). Sample input:
  // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
  // a=extmap:2/sendonly urn:ietf:params:rtp-hdrext:toffset


  SDPUtils.parseExtmap = function (line) {
    const parts = line.substr(9).split(' ');
    return {
      id: parseInt(parts[0], 10),
      direction: parts[0].indexOf('/') > 0 ? parts[0].split('/')[1] : 'sendrecv',
      uri: parts[1]
    };
  }; // Generates an extmap line from RTCRtpHeaderExtensionParameters or
  // RTCRtpHeaderExtension.


  SDPUtils.writeExtmap = function (headerExtension) {
    return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) + (headerExtension.direction && headerExtension.direction !== 'sendrecv' ? '/' + headerExtension.direction : '') + ' ' + headerExtension.uri + '\r\n';
  }; // Parses a fmtp line, returns dictionary. Sample input:
  // a=fmtp:96 vbr=on;cng=on
  // Also deals with vbr=on; cng=on


  SDPUtils.parseFmtp = function (line) {
    const parsed = {};
    let kv;
    const parts = line.substr(line.indexOf(' ') + 1).split(';');

    for (let j = 0; j < parts.length; j++) {
      kv = parts[j].trim().split('=');
      parsed[kv[0].trim()] = kv[1];
    }

    return parsed;
  }; // Generates a fmtp line from RTCRtpCodecCapability or RTCRtpCodecParameters.


  SDPUtils.writeFmtp = function (codec) {
    let line = '';
    let pt = codec.payloadType;

    if (codec.preferredPayloadType !== undefined) {
      pt = codec.preferredPayloadType;
    }

    if (codec.parameters && Object.keys(codec.parameters).length) {
      const params = [];
      Object.keys(codec.parameters).forEach(param => {
        if (codec.parameters[param] !== undefined) {
          params.push(param + '=' + codec.parameters[param]);
        } else {
          params.push(param);
        }
      });
      line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
    }

    return line;
  }; // Parses a rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
  // a=rtcp-fb:98 nack rpsi


  SDPUtils.parseRtcpFb = function (line) {
    const parts = line.substr(line.indexOf(' ') + 1).split(' ');
    return {
      type: parts.shift(),
      parameter: parts.join(' ')
    };
  }; // Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.


  SDPUtils.writeRtcpFb = function (codec) {
    let lines = '';
    let pt = codec.payloadType;

    if (codec.preferredPayloadType !== undefined) {
      pt = codec.preferredPayloadType;
    }

    if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
      // FIXME: special handling for trr-int?
      codec.rtcpFeedback.forEach(fb => {
        lines += 'a=rtcp-fb:' + pt + ' ' + fb.type + (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') + '\r\n';
      });
    }

    return lines;
  }; // Parses a RFC 5576 ssrc media attribute. Sample input:
  // a=ssrc:3735928559 cname:something


  SDPUtils.parseSsrcMedia = function (line) {
    const sp = line.indexOf(' ');
    const parts = {
      ssrc: parseInt(line.substr(7, sp - 7), 10)
    };
    const colon = line.indexOf(':', sp);

    if (colon > -1) {
      parts.attribute = line.substr(sp + 1, colon - sp - 1);
      parts.value = line.substr(colon + 1);
    } else {
      parts.attribute = line.substr(sp + 1);
    }

    return parts;
  }; // Parse a ssrc-group line (see RFC 5576). Sample input:
  // a=ssrc-group:semantics 12 34


  SDPUtils.parseSsrcGroup = function (line) {
    const parts = line.substr(13).split(' ');
    return {
      semantics: parts.shift(),
      ssrcs: parts.map(ssrc => parseInt(ssrc, 10))
    };
  }; // Extracts the MID (RFC 5888) from a media section.
  // Returns the MID or undefined if no mid line was found.


  SDPUtils.getMid = function (mediaSection) {
    const mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:')[0];

    if (mid) {
      return mid.substr(6);
    }
  }; // Parses a fingerprint line for DTLS-SRTP.


  SDPUtils.parseFingerprint = function (line) {
    const parts = line.substr(14).split(' ');
    return {
      algorithm: parts[0].toLowerCase(),
      // algorithm is case-sensitive in Edge.
      value: parts[1].toUpperCase() // the definition is upper-case in RFC 4572.

    };
  }; // Extracts DTLS parameters from SDP media section or sessionpart.
  // FIXME: for consistency with other functions this should only
  //   get the fingerprint line as input. See also getIceParameters.


  SDPUtils.getDtlsParameters = function (mediaSection, sessionpart) {
    const lines = SDPUtils.matchPrefix(mediaSection + sessionpart, 'a=fingerprint:'); // Note: a=setup line is ignored since we use the 'auto' role in Edge.

    return {
      role: 'auto',
      fingerprints: lines.map(SDPUtils.parseFingerprint)
    };
  }; // Serializes DTLS parameters to SDP.


  SDPUtils.writeDtlsParameters = function (params, setupType) {
    let sdp = 'a=setup:' + setupType + '\r\n';
    params.fingerprints.forEach(fp => {
      sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
    });
    return sdp;
  }; // Parses a=crypto lines into
  //   https://rawgit.com/aboba/edgertc/master/msortc-rs4.html#dictionary-rtcsrtpsdesparameters-members


  SDPUtils.parseCryptoLine = function (line) {
    const parts = line.substr(9).split(' ');
    return {
      tag: parseInt(parts[0], 10),
      cryptoSuite: parts[1],
      keyParams: parts[2],
      sessionParams: parts.slice(3)
    };
  };

  SDPUtils.writeCryptoLine = function (parameters) {
    return 'a=crypto:' + parameters.tag + ' ' + parameters.cryptoSuite + ' ' + (typeof parameters.keyParams === 'object' ? SDPUtils.writeCryptoKeyParams(parameters.keyParams) : parameters.keyParams) + (parameters.sessionParams ? ' ' + parameters.sessionParams.join(' ') : '') + '\r\n';
  }; // Parses the crypto key parameters into
  //   https://rawgit.com/aboba/edgertc/master/msortc-rs4.html#rtcsrtpkeyparam*


  SDPUtils.parseCryptoKeyParams = function (keyParams) {
    if (keyParams.indexOf('inline:') !== 0) {
      return null;
    }

    const parts = keyParams.substr(7).split('|');
    return {
      keyMethod: 'inline',
      keySalt: parts[0],
      lifeTime: parts[1],
      mkiValue: parts[2] ? parts[2].split(':')[0] : undefined,
      mkiLength: parts[2] ? parts[2].split(':')[1] : undefined
    };
  };

  SDPUtils.writeCryptoKeyParams = function (keyParams) {
    return keyParams.keyMethod + ':' + keyParams.keySalt + (keyParams.lifeTime ? '|' + keyParams.lifeTime : '') + (keyParams.mkiValue && keyParams.mkiLength ? '|' + keyParams.mkiValue + ':' + keyParams.mkiLength : '');
  }; // Extracts all SDES parameters.


  SDPUtils.getCryptoParameters = function (mediaSection, sessionpart) {
    const lines = SDPUtils.matchPrefix(mediaSection + sessionpart, 'a=crypto:');
    return lines.map(SDPUtils.parseCryptoLine);
  }; // Parses ICE information from SDP media section or sessionpart.
  // FIXME: for consistency with other functions this should only
  //   get the ice-ufrag and ice-pwd lines as input.


  SDPUtils.getIceParameters = function (mediaSection, sessionpart) {
    const ufrag = SDPUtils.matchPrefix(mediaSection + sessionpart, 'a=ice-ufrag:')[0];
    const pwd = SDPUtils.matchPrefix(mediaSection + sessionpart, 'a=ice-pwd:')[0];

    if (!(ufrag && pwd)) {
      return null;
    }

    return {
      usernameFragment: ufrag.substr(12),
      password: pwd.substr(10)
    };
  }; // Serializes ICE parameters to SDP.


  SDPUtils.writeIceParameters = function (params) {
    let sdp = 'a=ice-ufrag:' + params.usernameFragment + '\r\n' + 'a=ice-pwd:' + params.password + '\r\n';

    if (params.iceLite) {
      sdp += 'a=ice-lite\r\n';
    }

    return sdp;
  }; // Parses the SDP media section and returns RTCRtpParameters.


  SDPUtils.parseRtpParameters = function (mediaSection) {
    const description = {
      codecs: [],
      headerExtensions: [],
      fecMechanisms: [],
      rtcp: []
    };
    const lines = SDPUtils.splitLines(mediaSection);
    const mline = lines[0].split(' ');

    for (let i = 3; i < mline.length; i++) {
      // find all codecs from mline[3..]
      const pt = mline[i];
      const rtpmapline = SDPUtils.matchPrefix(mediaSection, 'a=rtpmap:' + pt + ' ')[0];

      if (rtpmapline) {
        const codec = SDPUtils.parseRtpMap(rtpmapline);
        const fmtps = SDPUtils.matchPrefix(mediaSection, 'a=fmtp:' + pt + ' '); // Only the first a=fmtp:<pt> is considered.

        codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
        codec.rtcpFeedback = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-fb:' + pt + ' ').map(SDPUtils.parseRtcpFb);
        description.codecs.push(codec); // parse FEC mechanisms from rtpmap lines.

        switch (codec.name.toUpperCase()) {
          case 'RED':
          case 'ULPFEC':
            description.fecMechanisms.push(codec.name.toUpperCase());
            break;
        }
      }
    }

    SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(line => {
      description.headerExtensions.push(SDPUtils.parseExtmap(line));
    }); // FIXME: parse rtcp.

    return description;
  }; // Generates parts of the SDP media section describing the capabilities /
  // parameters.


  SDPUtils.writeRtpDescription = function (kind, caps) {
    let sdp = ''; // Build the mline.

    sdp += 'm=' + kind + ' ';
    sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.

    sdp += ' UDP/TLS/RTP/SAVPF ';
    sdp += caps.codecs.map(codec => {
      if (codec.preferredPayloadType !== undefined) {
        return codec.preferredPayloadType;
      }

      return codec.payloadType;
    }).join(' ') + '\r\n';
    sdp += 'c=IN IP4 0.0.0.0\r\n';
    sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n'; // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.

    caps.codecs.forEach(codec => {
      sdp += SDPUtils.writeRtpMap(codec);
      sdp += SDPUtils.writeFmtp(codec);
      sdp += SDPUtils.writeRtcpFb(codec);
    });
    let maxptime = 0;
    caps.codecs.forEach(codec => {
      if (codec.maxptime > maxptime) {
        maxptime = codec.maxptime;
      }
    });

    if (maxptime > 0) {
      sdp += 'a=maxptime:' + maxptime + '\r\n';
    }

    if (caps.headerExtensions) {
      caps.headerExtensions.forEach(extension => {
        sdp += SDPUtils.writeExtmap(extension);
      });
    } // FIXME: write fecMechanisms.


    return sdp;
  }; // Parses the SDP media section and returns an array of
  // RTCRtpEncodingParameters.


  SDPUtils.parseRtpEncodingParameters = function (mediaSection) {
    const encodingParameters = [];
    const description = SDPUtils.parseRtpParameters(mediaSection);
    const hasRed = description.fecMechanisms.indexOf('RED') !== -1;
    const hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1; // filter a=ssrc:... cname:, ignore PlanB-msid

    const ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:').map(line => SDPUtils.parseSsrcMedia(line)).filter(parts => parts.attribute === 'cname');
    const primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
    let secondarySsrc;
    const flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID').map(line => {
      const parts = line.substr(17).split(' ');
      return parts.map(part => parseInt(part, 10));
    });

    if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
      secondarySsrc = flows[0][1];
    }

    description.codecs.forEach(codec => {
      if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
        let encParam = {
          ssrc: primarySsrc,
          codecPayloadType: parseInt(codec.parameters.apt, 10)
        };

        if (primarySsrc && secondarySsrc) {
          encParam.rtx = {
            ssrc: secondarySsrc
          };
        }

        encodingParameters.push(encParam);

        if (hasRed) {
          encParam = JSON.parse(JSON.stringify(encParam));
          encParam.fec = {
            ssrc: primarySsrc,
            mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
          };
          encodingParameters.push(encParam);
        }
      }
    });

    if (encodingParameters.length === 0 && primarySsrc) {
      encodingParameters.push({
        ssrc: primarySsrc
      });
    } // we support both b=AS and b=TIAS but interpret AS as TIAS.


    let bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');

    if (bandwidth.length) {
      if (bandwidth[0].indexOf('b=TIAS:') === 0) {
        bandwidth = parseInt(bandwidth[0].substr(7), 10);
      } else if (bandwidth[0].indexOf('b=AS:') === 0) {
        // use formula from JSEP to convert b=AS to TIAS value.
        bandwidth = parseInt(bandwidth[0].substr(5), 10) * 1000 * 0.95 - 50 * 40 * 8;
      } else {
        bandwidth = undefined;
      }

      encodingParameters.forEach(params => {
        params.maxBitrate = bandwidth;
      });
    }

    return encodingParameters;
  }; // parses http://draft.ortc.org/#rtcrtcpparameters*


  SDPUtils.parseRtcpParameters = function (mediaSection) {
    const rtcpParameters = {}; // Gets the first SSRC. Note that with RTX there might be multiple
    // SSRCs.

    const remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:').map(line => SDPUtils.parseSsrcMedia(line)).filter(obj => obj.attribute === 'cname')[0];

    if (remoteSsrc) {
      rtcpParameters.cname = remoteSsrc.value;
      rtcpParameters.ssrc = remoteSsrc.ssrc;
    } // Edge uses the compound attribute instead of reducedSize
    // compound is !reducedSize


    const rsize = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-rsize');
    rtcpParameters.reducedSize = rsize.length > 0;
    rtcpParameters.compound = rsize.length === 0; // parses the rtcp-mux attrіbute.
    // Note that Edge does not support unmuxed RTCP.

    const mux = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-mux');
    rtcpParameters.mux = mux.length > 0;
    return rtcpParameters;
  };

  SDPUtils.writeRtcpParameters = function (rtcpParameters) {
    let sdp = '';

    if (rtcpParameters.reducedSize) {
      sdp += 'a=rtcp-rsize\r\n';
    }

    if (rtcpParameters.mux) {
      sdp += 'a=rtcp-mux\r\n';
    }

    if (rtcpParameters.ssrc !== undefined && rtcpParameters.cname) {
      sdp += 'a=ssrc:' + rtcpParameters.ssrc + ' cname:' + rtcpParameters.cname + '\r\n';
    }

    return sdp;
  }; // parses either a=msid: or a=ssrc:... msid lines and returns
  // the id of the MediaStream and MediaStreamTrack.


  SDPUtils.parseMsid = function (mediaSection) {
    let parts;
    const spec = SDPUtils.matchPrefix(mediaSection, 'a=msid:');

    if (spec.length === 1) {
      parts = spec[0].substr(7).split(' ');
      return {
        stream: parts[0],
        track: parts[1]
      };
    }

    const planB = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:').map(line => SDPUtils.parseSsrcMedia(line)).filter(msidParts => msidParts.attribute === 'msid');

    if (planB.length > 0) {
      parts = planB[0].value.split(' ');
      return {
        stream: parts[0],
        track: parts[1]
      };
    }
  }; // SCTP
  // parses draft-ietf-mmusic-sctp-sdp-26 first and falls back
  // to draft-ietf-mmusic-sctp-sdp-05


  SDPUtils.parseSctpDescription = function (mediaSection) {
    const mline = SDPUtils.parseMLine(mediaSection);
    const maxSizeLine = SDPUtils.matchPrefix(mediaSection, 'a=max-message-size:');
    let maxMessageSize;

    if (maxSizeLine.length > 0) {
      maxMessageSize = parseInt(maxSizeLine[0].substr(19), 10);
    }

    if (isNaN(maxMessageSize)) {
      maxMessageSize = 65536;
    }

    const sctpPort = SDPUtils.matchPrefix(mediaSection, 'a=sctp-port:');

    if (sctpPort.length > 0) {
      return {
        port: parseInt(sctpPort[0].substr(12), 10),
        protocol: mline.fmt,
        maxMessageSize
      };
    }

    const sctpMapLines = SDPUtils.matchPrefix(mediaSection, 'a=sctpmap:');

    if (sctpMapLines.length > 0) {
      const parts = sctpMapLines[0].substr(10).split(' ');
      return {
        port: parseInt(parts[0], 10),
        protocol: parts[1],
        maxMessageSize
      };
    }
  }; // SCTP
  // outputs the draft-ietf-mmusic-sctp-sdp-26 version that all browsers
  // support by now receiving in this format, unless we originally parsed
  // as the draft-ietf-mmusic-sctp-sdp-05 format (indicated by the m-line
  // protocol of DTLS/SCTP -- without UDP/ or TCP/)


  SDPUtils.writeSctpDescription = function (media, sctp) {
    let output = [];

    if (media.protocol !== 'DTLS/SCTP') {
      output = ['m=' + media.kind + ' 9 ' + media.protocol + ' ' + sctp.protocol + '\r\n', 'c=IN IP4 0.0.0.0\r\n', 'a=sctp-port:' + sctp.port + '\r\n'];
    } else {
      output = ['m=' + media.kind + ' 9 ' + media.protocol + ' ' + sctp.port + '\r\n', 'c=IN IP4 0.0.0.0\r\n', 'a=sctpmap:' + sctp.port + ' ' + sctp.protocol + ' 65535\r\n'];
    }

    if (sctp.maxMessageSize !== undefined) {
      output.push('a=max-message-size:' + sctp.maxMessageSize + '\r\n');
    }

    return output.join('');
  }; // Generate a session ID for SDP.
  // https://tools.ietf.org/html/draft-ietf-rtcweb-jsep-20#section-5.2.1
  // recommends using a cryptographically random +ve 64-bit value
  // but right now this should be acceptable and within the right range


  SDPUtils.generateSessionId = function () {
    return Math.random().toString().substr(2, 21);
  }; // Write boiler plate for start of SDP
  // sessId argument is optional - if not supplied it will
  // be generated randomly
  // sessVersion is optional and defaults to 2
  // sessUser is optional and defaults to 'thisisadapterortc'


  SDPUtils.writeSessionBoilerplate = function (sessId, sessVer, sessUser) {
    let sessionId;
    const version = sessVer !== undefined ? sessVer : 2;

    if (sessId) {
      sessionId = sessId;
    } else {
      sessionId = SDPUtils.generateSessionId();
    }

    const user = sessUser || 'thisisadapterortc'; // FIXME: sess-id should be an NTP timestamp.

    return 'v=0\r\n' + 'o=' + user + ' ' + sessionId + ' ' + version + ' IN IP4 127.0.0.1\r\n' + 's=-\r\n' + 't=0 0\r\n';
  }; // Gets the direction from the mediaSection or the sessionpart.


  SDPUtils.getDirection = function (mediaSection, sessionpart) {
    // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
    const lines = SDPUtils.splitLines(mediaSection);

    for (let i = 0; i < lines.length; i++) {
      switch (lines[i]) {
        case 'a=sendrecv':
        case 'a=sendonly':
        case 'a=recvonly':
        case 'a=inactive':
          return lines[i].substr(2);

      }
    }

    if (sessionpart) {
      return SDPUtils.getDirection(sessionpart);
    }

    return 'sendrecv';
  };

  SDPUtils.getKind = function (mediaSection) {
    const lines = SDPUtils.splitLines(mediaSection);
    const mline = lines[0].split(' ');
    return mline[0].substr(2);
  };

  SDPUtils.isRejected = function (mediaSection) {
    return mediaSection.split(' ', 2)[1] === '0';
  };

  SDPUtils.parseMLine = function (mediaSection) {
    const lines = SDPUtils.splitLines(mediaSection);
    const parts = lines[0].substr(2).split(' ');
    return {
      kind: parts[0],
      port: parseInt(parts[1], 10),
      protocol: parts[2],
      fmt: parts.slice(3).join(' ')
    };
  };

  SDPUtils.parseOLine = function (mediaSection) {
    const line = SDPUtils.matchPrefix(mediaSection, 'o=')[0];
    const parts = line.substr(2).split(' ');
    return {
      username: parts[0],
      sessionId: parts[1],
      sessionVersion: parseInt(parts[2], 10),
      netType: parts[3],
      addressType: parts[4],
      address: parts[5]
    };
  }; // a very naive interpretation of a valid SDP.


  SDPUtils.isValidSDP = function (blob) {
    if (typeof blob !== 'string' || blob.length === 0) {
      return false;
    }

    const lines = SDPUtils.splitLines(blob);

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length < 2 || lines[i].charAt(1) !== '=') {
        return false;
      } // TODO: check the modifier a bit more.

    }

    return true;
  }; // Expose public methods.


  {
    module.exports = SDPUtils;
  }
})(sdp$1);

var SDPUtils = sdp$1.exports;

var sdp = /*#__PURE__*/_mergeNamespaces({
	__proto__: null,
	'default': SDPUtils
}, [sdp$1.exports]);

/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
function shimRTCIceCandidate(window) {
  // foundation is arbitrarily chosen as an indicator for full support for
  // https://w3c.github.io/webrtc-pc/#rtcicecandidate-interface
  if (!window.RTCIceCandidate || window.RTCIceCandidate && 'foundation' in window.RTCIceCandidate.prototype) {
    return;
  }

  const NativeRTCIceCandidate = window.RTCIceCandidate;

  window.RTCIceCandidate = function RTCIceCandidate(args) {
    // Remove the a= which shouldn't be part of the candidate string.
    if (typeof args === 'object' && args.candidate && args.candidate.indexOf('a=') === 0) {
      args = JSON.parse(JSON.stringify(args));
      args.candidate = args.candidate.substr(2);
    }

    if (args.candidate && args.candidate.length) {
      // Augment the native candidate with the parsed fields.
      const nativeCandidate = new NativeRTCIceCandidate(args);
      const parsedCandidate = SDPUtils.parseCandidate(args.candidate);
      const augmentedCandidate = Object.assign(nativeCandidate, parsedCandidate); // Add a serializer that does not serialize the extra attributes.

      augmentedCandidate.toJSON = function toJSON() {
        return {
          candidate: augmentedCandidate.candidate,
          sdpMid: augmentedCandidate.sdpMid,
          sdpMLineIndex: augmentedCandidate.sdpMLineIndex,
          usernameFragment: augmentedCandidate.usernameFragment
        };
      };

      return augmentedCandidate;
    }

    return new NativeRTCIceCandidate(args);
  };

  window.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype; // Hook up the augmented candidate in onicecandidate and
  // addEventListener('icecandidate', ...)

  wrapPeerConnectionEvent(window, 'icecandidate', e => {
    if (e.candidate) {
      Object.defineProperty(e, 'candidate', {
        value: new window.RTCIceCandidate(e.candidate),
        writable: 'false'
      });
    }

    return e;
  });
}
function shimMaxMessageSize(window, browserDetails) {
  if (!window.RTCPeerConnection) {
    return;
  }

  if (!('sctp' in window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'sctp', {
      get() {
        return typeof this._sctp === 'undefined' ? null : this._sctp;
      }

    });
  }

  const sctpInDescription = function (description) {
    if (!description || !description.sdp) {
      return false;
    }

    const sections = SDPUtils.splitSections(description.sdp);
    sections.shift();
    return sections.some(mediaSection => {
      const mLine = SDPUtils.parseMLine(mediaSection);
      return mLine && mLine.kind === 'application' && mLine.protocol.indexOf('SCTP') !== -1;
    });
  };

  const getRemoteFirefoxVersion = function (description) {
    // TODO: Is there a better solution for detecting Firefox?
    const match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);

    if (match === null || match.length < 2) {
      return -1;
    }

    const version = parseInt(match[1], 10); // Test for NaN (yes, this is ugly)

    return version !== version ? -1 : version;
  };

  const getCanSendMaxMessageSize = function (remoteIsFirefox) {
    // Every implementation we know can send at least 64 KiB.
    // Note: Although Chrome is technically able to send up to 256 KiB, the
    //       data does not reach the other peer reliably.
    //       See: https://bugs.chromium.org/p/webrtc/issues/detail?id=8419
    let canSendMaxMessageSize = 65536;

    if (browserDetails.browser === 'firefox') {
      if (browserDetails.version < 57) {
        if (remoteIsFirefox === -1) {
          // FF < 57 will send in 16 KiB chunks using the deprecated PPID
          // fragmentation.
          canSendMaxMessageSize = 16384;
        } else {
          // However, other FF (and RAWRTC) can reassemble PPID-fragmented
          // messages. Thus, supporting ~2 GiB when sending.
          canSendMaxMessageSize = 2147483637;
        }
      } else if (browserDetails.version < 60) {
        // Currently, all FF >= 57 will reset the remote maximum message size
        // to the default value when a data channel is created at a later
        // stage. :(
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831
        canSendMaxMessageSize = browserDetails.version === 57 ? 65535 : 65536;
      } else {
        // FF >= 60 supports sending ~2 GiB
        canSendMaxMessageSize = 2147483637;
      }
    }

    return canSendMaxMessageSize;
  };

  const getMaxMessageSize = function (description, remoteIsFirefox) {
    // Note: 65536 bytes is the default value from the SDP spec. Also,
    //       every implementation we know supports receiving 65536 bytes.
    let maxMessageSize = 65536; // FF 57 has a slightly incorrect default remote max message size, so
    // we need to adjust it here to avoid a failure when sending.
    // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1425697

    if (browserDetails.browser === 'firefox' && browserDetails.version === 57) {
      maxMessageSize = 65535;
    }

    const match = SDPUtils.matchPrefix(description.sdp, 'a=max-message-size:');

    if (match.length > 0) {
      maxMessageSize = parseInt(match[0].substr(19), 10);
    } else if (browserDetails.browser === 'firefox' && remoteIsFirefox !== -1) {
      // If the maximum message size is not present in the remote SDP and
      // both local and remote are Firefox, the remote peer can receive
      // ~2 GiB.
      maxMessageSize = 2147483637;
    }

    return maxMessageSize;
  };

  const origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;

  window.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
    this._sctp = null; // Chrome decided to not expose .sctp in plan-b mode.
    // As usual, adapter.js has to do an 'ugly worakaround'
    // to cover up the mess.

    if (browserDetails.browser === 'chrome' && browserDetails.version >= 76) {
      const {
        sdpSemantics
      } = this.getConfiguration();

      if (sdpSemantics === 'plan-b') {
        Object.defineProperty(this, 'sctp', {
          get() {
            return typeof this._sctp === 'undefined' ? null : this._sctp;
          },

          enumerable: true,
          configurable: true
        });
      }
    }

    if (sctpInDescription(arguments[0])) {
      // Check if the remote is FF.
      const isFirefox = getRemoteFirefoxVersion(arguments[0]); // Get the maximum message size the local peer is capable of sending

      const canSendMMS = getCanSendMaxMessageSize(isFirefox); // Get the maximum message size of the remote peer.

      const remoteMMS = getMaxMessageSize(arguments[0], isFirefox); // Determine final maximum message size

      let maxMessageSize;

      if (canSendMMS === 0 && remoteMMS === 0) {
        maxMessageSize = Number.POSITIVE_INFINITY;
      } else if (canSendMMS === 0 || remoteMMS === 0) {
        maxMessageSize = Math.max(canSendMMS, remoteMMS);
      } else {
        maxMessageSize = Math.min(canSendMMS, remoteMMS);
      } // Create a dummy RTCSctpTransport object and the 'maxMessageSize'
      // attribute.


      const sctp = {};
      Object.defineProperty(sctp, 'maxMessageSize', {
        get() {
          return maxMessageSize;
        }

      });
      this._sctp = sctp;
    }

    return origSetRemoteDescription.apply(this, arguments);
  };
}
function shimSendThrowTypeError(window) {
  if (!(window.RTCPeerConnection && 'createDataChannel' in window.RTCPeerConnection.prototype)) {
    return;
  } // Note: Although Firefox >= 57 has a native implementation, the maximum
  //       message size can be reset for all data channels at a later stage.
  //       See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831


  function wrapDcSend(dc, pc) {
    const origDataChannelSend = dc.send;

    dc.send = function send() {
      const data = arguments[0];
      const length = data.length || data.size || data.byteLength;

      if (dc.readyState === 'open' && pc.sctp && length > pc.sctp.maxMessageSize) {
        throw new TypeError('Message too large (can send a maximum of ' + pc.sctp.maxMessageSize + ' bytes)');
      }

      return origDataChannelSend.apply(dc, arguments);
    };
  }

  const origCreateDataChannel = window.RTCPeerConnection.prototype.createDataChannel;

  window.RTCPeerConnection.prototype.createDataChannel = function createDataChannel() {
    const dataChannel = origCreateDataChannel.apply(this, arguments);
    wrapDcSend(dataChannel, this);
    return dataChannel;
  };

  wrapPeerConnectionEvent(window, 'datachannel', e => {
    wrapDcSend(e.channel, e.target);
    return e;
  });
}
/* shims RTCConnectionState by pretending it is the same as iceConnectionState.
 * See https://bugs.chromium.org/p/webrtc/issues/detail?id=6145#c12
 * for why this is a valid hack in Chrome. In Firefox it is slightly incorrect
 * since DTLS failures would be hidden. See
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1265827
 * for the Firefox tracking bug.
 */

function shimConnectionState(window) {
  if (!window.RTCPeerConnection || 'connectionState' in window.RTCPeerConnection.prototype) {
    return;
  }

  const proto = window.RTCPeerConnection.prototype;
  Object.defineProperty(proto, 'connectionState', {
    get() {
      return {
        completed: 'connected',
        checking: 'connecting'
      }[this.iceConnectionState] || this.iceConnectionState;
    },

    enumerable: true,
    configurable: true
  });
  Object.defineProperty(proto, 'onconnectionstatechange', {
    get() {
      return this._onconnectionstatechange || null;
    },

    set(cb) {
      if (this._onconnectionstatechange) {
        this.removeEventListener('connectionstatechange', this._onconnectionstatechange);
        delete this._onconnectionstatechange;
      }

      if (cb) {
        this.addEventListener('connectionstatechange', this._onconnectionstatechange = cb);
      }
    },

    enumerable: true,
    configurable: true
  });
  ['setLocalDescription', 'setRemoteDescription'].forEach(method => {
    const origMethod = proto[method];

    proto[method] = function () {
      if (!this._connectionstatechangepoly) {
        this._connectionstatechangepoly = e => {
          const pc = e.target;

          if (pc._lastConnectionState !== pc.connectionState) {
            pc._lastConnectionState = pc.connectionState;
            const newEvent = new Event('connectionstatechange', e);
            pc.dispatchEvent(newEvent);
          }

          return e;
        };

        this.addEventListener('iceconnectionstatechange', this._connectionstatechangepoly);
      }

      return origMethod.apply(this, arguments);
    };
  });
}
function removeExtmapAllowMixed(window, browserDetails) {
  /* remove a=extmap-allow-mixed for webrtc.org < M71 */
  if (!window.RTCPeerConnection) {
    return;
  }

  if (browserDetails.browser === 'chrome' && browserDetails.version >= 71) {
    return;
  }

  if (browserDetails.browser === 'safari' && browserDetails.version >= 605) {
    return;
  }

  const nativeSRD = window.RTCPeerConnection.prototype.setRemoteDescription;

  window.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(desc) {
    if (desc && desc.sdp && desc.sdp.indexOf('\na=extmap-allow-mixed') !== -1) {
      const sdp = desc.sdp.split('\n').filter(line => {
        return line.trim() !== 'a=extmap-allow-mixed';
      }).join('\n'); // Safari enforces read-only-ness of RTCSessionDescription fields.

      if (window.RTCSessionDescription && desc instanceof window.RTCSessionDescription) {
        arguments[0] = new window.RTCSessionDescription({
          type: desc.type,
          sdp
        });
      } else {
        desc.sdp = sdp;
      }
    }

    return nativeSRD.apply(this, arguments);
  };
}
function shimAddIceCandidateNullOrEmpty(window, browserDetails) {
  // Support for addIceCandidate(null or undefined)
  // as well as addIceCandidate({candidate: "", ...})
  // https://bugs.chromium.org/p/chromium/issues/detail?id=978582
  // Note: must be called before other polyfills which change the signature.
  if (!(window.RTCPeerConnection && window.RTCPeerConnection.prototype)) {
    return;
  }

  const nativeAddIceCandidate = window.RTCPeerConnection.prototype.addIceCandidate;

  if (!nativeAddIceCandidate || nativeAddIceCandidate.length === 0) {
    return;
  }

  window.RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate() {
    if (!arguments[0]) {
      if (arguments[1]) {
        arguments[1].apply(null);
      }

      return Promise.resolve();
    } // Firefox 68+ emits and processes {candidate: "", ...}, ignore
    // in older versions.
    // Native support for ignoring exists for Chrome M77+.
    // Safari ignores as well, exact version unknown but works in the same
    // version that also ignores addIceCandidate(null).


    if ((browserDetails.browser === 'chrome' && browserDetails.version < 78 || browserDetails.browser === 'firefox' && browserDetails.version < 68 || browserDetails.browser === 'safari') && arguments[0] && arguments[0].candidate === '') {
      return Promise.resolve();
    }

    return nativeAddIceCandidate.apply(this, arguments);
  };
} // Note: Make sure to call this ahead of APIs that modify
// setLocalDescription.length

function shimParameterlessSetLocalDescription(window, browserDetails) {
  if (!(window.RTCPeerConnection && window.RTCPeerConnection.prototype)) {
    return;
  }

  const nativeSetLocalDescription = window.RTCPeerConnection.prototype.setLocalDescription;

  if (!nativeSetLocalDescription || nativeSetLocalDescription.length === 0) {
    return;
  }

  window.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
    let desc = arguments[0] || {};

    if (typeof desc !== 'object' || desc.type && desc.sdp) {
      return nativeSetLocalDescription.apply(this, arguments);
    } // The remaining steps should technically happen when SLD comes off the
    // RTCPeerConnection's operations chain (not ahead of going on it), but
    // this is too difficult to shim. Instead, this shim only covers the
    // common case where the operations chain is empty. This is imperfect, but
    // should cover many cases. Rationale: Even if we can't reduce the glare
    // window to zero on imperfect implementations, there's value in tapping
    // into the perfect negotiation pattern that several browsers support.


    desc = {
      type: desc.type,
      sdp: desc.sdp
    };

    if (!desc.type) {
      switch (this.signalingState) {
        case 'stable':
        case 'have-local-offer':
        case 'have-remote-pranswer':
          desc.type = 'offer';
          break;

        default:
          desc.type = 'answer';
          break;
      }
    }

    if (desc.sdp || desc.type !== 'offer' && desc.type !== 'answer') {
      return nativeSetLocalDescription.apply(this, [desc]);
    }

    const func = desc.type === 'offer' ? this.createOffer : this.createAnswer;
    return func.apply(this).then(d => nativeSetLocalDescription.apply(this, [d]));
  };
}

var commonShim = /*#__PURE__*/Object.freeze({
	__proto__: null,
	shimRTCIceCandidate: shimRTCIceCandidate,
	shimMaxMessageSize: shimMaxMessageSize,
	shimSendThrowTypeError: shimSendThrowTypeError,
	shimConnectionState: shimConnectionState,
	removeExtmapAllowMixed: removeExtmapAllowMixed,
	shimAddIceCandidateNullOrEmpty: shimAddIceCandidateNullOrEmpty,
	shimParameterlessSetLocalDescription: shimParameterlessSetLocalDescription
});

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

function adapterFactory() {
  let {
    window
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    shimChrome: true,
    shimFirefox: true,
    shimSafari: true
  };
  // Utils.
  const logging = log;
  const browserDetails = detectBrowser(window);
  const adapter = {
    browserDetails,
    commonShim,
    extractVersion: extractVersion,
    disableLog: disableLog,
    disableWarnings: disableWarnings,
    // Expose sdp as a convenience. For production apps include directly.
    sdp
  }; // Shim browser if found.

  switch (browserDetails.browser) {
    case 'chrome':
      if (!chromeShim || !shimPeerConnection$1 || !options.shimChrome) {
        logging('Chrome shim is not included in this adapter release.');
        return adapter;
      }

      if (browserDetails.version === null) {
        logging('Chrome shim can not determine version, not shimming.');
        return adapter;
      }

      logging('adapter.js shimming chrome.'); // Export to the adapter global object visible in the browser.

      adapter.browserShim = chromeShim; // Must be called before shimPeerConnection.

      shimAddIceCandidateNullOrEmpty(window, browserDetails);
      shimParameterlessSetLocalDescription(window);
      shimGetUserMedia$2(window, browserDetails);
      shimMediaStream(window);
      shimPeerConnection$1(window, browserDetails);
      shimOnTrack$1(window);
      shimAddTrackRemoveTrack(window, browserDetails);
      shimGetSendersWithDtmf(window);
      shimGetStats(window);
      shimSenderReceiverGetStats(window);
      fixNegotiationNeeded(window, browserDetails);
      shimRTCIceCandidate(window);
      shimConnectionState(window);
      shimMaxMessageSize(window, browserDetails);
      shimSendThrowTypeError(window);
      removeExtmapAllowMixed(window, browserDetails);
      break;

    case 'firefox':
      if (!firefoxShim || !shimPeerConnection || !options.shimFirefox) {
        logging('Firefox shim is not included in this adapter release.');
        return adapter;
      }

      logging('adapter.js shimming firefox.'); // Export to the adapter global object visible in the browser.

      adapter.browserShim = firefoxShim; // Must be called before shimPeerConnection.

      shimAddIceCandidateNullOrEmpty(window, browserDetails);
      shimParameterlessSetLocalDescription(window);
      shimGetUserMedia$1(window, browserDetails);
      shimPeerConnection(window, browserDetails);
      shimOnTrack(window);
      shimRemoveStream(window);
      shimSenderGetStats(window);
      shimReceiverGetStats(window);
      shimRTCDataChannel(window);
      shimAddTransceiver(window);
      shimGetParameters(window);
      shimCreateOffer(window);
      shimCreateAnswer(window);
      shimRTCIceCandidate(window);
      shimConnectionState(window);
      shimMaxMessageSize(window, browserDetails);
      shimSendThrowTypeError(window);
      break;

    case 'safari':
      if (!safariShim || !options.shimSafari) {
        logging('Safari shim is not included in this adapter release.');
        return adapter;
      }

      logging('adapter.js shimming safari.'); // Export to the adapter global object visible in the browser.

      adapter.browserShim = safariShim; // Must be called before shimCallbackAPI.

      shimAddIceCandidateNullOrEmpty(window, browserDetails);
      shimParameterlessSetLocalDescription(window);
      shimRTCIceServerUrls(window);
      shimCreateOfferLegacy(window);
      shimCallbacksAPI(window);
      shimLocalStreamsAPI(window);
      shimRemoteStreamsAPI(window);
      shimTrackEventTransceiver(window);
      shimGetUserMedia(window);
      shimAudioContext(window);
      shimRTCIceCandidate(window);
      shimMaxMessageSize(window, browserDetails);
      shimSendThrowTypeError(window);
      removeExtmapAllowMixed(window, browserDetails);
      break;

    default:
      logging('Unsupported browser!');
      break;
  }

  return adapter;
}

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
adapterFactory({
  window: typeof window === 'undefined' ? undefined : window
});

class LocalParticipant extends Participant {
  /** @internal */
  constructor(sid, identity, engine, options) {
    super(sid, identity);
    this.pendingPublishing = new Set();
    this.participantTrackPermissions = [];
    this.allParticipantsAllowedToSubscribe = true;

    this.updateTrackSubscriptionPermissions = () => {
      livekitLogger.debug('updating track subscription permissions', {
        allParticipantsAllowed: this.allParticipantsAllowedToSubscribe,
        participantTrackPermissions: this.participantTrackPermissions
      });
      this.engine.client.sendUpdateSubscriptionPermissions(this.allParticipantsAllowedToSubscribe, this.participantTrackPermissions.map(p => trackPermissionToProto(p)));
    };
    /** @internal */


    this.onTrackUnmuted = track => {
      this.onTrackMuted(track, track.isUpstreamPaused);
    }; // when the local track changes in mute status, we'll notify server as such

    /** @internal */


    this.onTrackMuted = (track, muted) => {
      if (muted === undefined) {
        muted = true;
      }

      if (!track.sid) {
        livekitLogger.error('could not update mute status for unpublished track', track);
        return;
      }

      this.engine.updateMuteStatus(track.sid, muted);
    };

    this.onTrackUpstreamPaused = track => {
      livekitLogger.debug('upstream paused');
      this.onTrackMuted(track, true);
    };

    this.onTrackUpstreamResumed = track => {
      livekitLogger.debug('upstream resumed');
      this.onTrackMuted(track, track.isMuted);
    };

    this.handleSubscribedQualityUpdate = async update => {
      var _a, _b;

      if (!((_a = this.roomOptions) === null || _a === void 0 ? void 0 : _a.dynacast)) {
        return;
      }

      const pub = this.videoTracks.get(update.trackSid);

      if (!pub) {
        livekitLogger.warn('received subscribed quality update for unknown track', {
          method: 'handleSubscribedQualityUpdate',
          sid: update.trackSid
        });
        return;
      }

      if (update.subscribedCodecs.length > 0) {
        if (!pub.videoTrack) {
          return;
        }

        const newCodecs = await pub.videoTrack.setPublishingCodecs(update.subscribedCodecs);
        var _iteratorAbruptCompletion = false;
        var _didIteratorError = false;

        var _iteratorError;

        try {
          for (var _iterator = _asyncIterator(newCodecs), _step; _iteratorAbruptCompletion = !(_step = await _iterator.next()).done; _iteratorAbruptCompletion = false) {
            const codec = _step.value;

            if (isBackupCodec(codec)) {
              livekitLogger.debug("publish ".concat(codec, " for ").concat(pub.videoTrack.sid));
              await this.publishAdditionalCodecForTrack(pub.videoTrack, codec, pub.options);
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (_iteratorAbruptCompletion && _iterator.return != null) {
              await _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } else if (update.subscribedQualities.length > 0) {
        (_b = pub.videoTrack) === null || _b === void 0 ? void 0 : _b.setPublishingLayers(update.subscribedQualities);
      }
    };

    this.handleLocalTrackUnpublished = unpublished => {
      const track = this.tracks.get(unpublished.trackSid);

      if (!track) {
        livekitLogger.warn('received unpublished event for unknown track', {
          method: 'handleLocalTrackUnpublished',
          trackSid: unpublished.trackSid
        });
        return;
      }

      this.unpublishTrack(track.track);
    };

    this.handleTrackEnded = async track => {
      if (track.source === Track.Source.ScreenShare || track.source === Track.Source.ScreenShareAudio) {
        livekitLogger.debug('unpublishing local track due to TrackEnded', {
          track: track.sid
        });
        this.unpublishTrack(track);
      } else if (track.isUserProvided) {
        await track.pauseUpstream();
      } else if (track instanceof LocalAudioTrack || track instanceof LocalVideoTrack) {
        try {
          if (isWeb()) {
            try {
              const currentPermissions = await (navigator === null || navigator === void 0 ? void 0 : navigator.permissions.query({
                // the permission query for camera and microphone currently not supported in Safari and Firefox
                // @ts-ignore
                name: track.source === Track.Source.Camera ? 'camera' : 'microphone'
              }));

              if (currentPermissions && currentPermissions.state === 'denied') {
                livekitLogger.warn("user has revoked access to ".concat(track.source)); // detect granted change after permissions were denied to try and resume then

                currentPermissions.onchange = () => {
                  if (currentPermissions.state !== 'denied') {
                    track.restartTrack();
                    currentPermissions.onchange = null;
                  }
                };

                throw new Error('GetUserMedia Permission denied');
              }
            } catch (e) {// permissions query fails for firefox, we continue and try to restart the track
            }
          }

          livekitLogger.debug('track ended, attempting to use a different device');
          await track.restartTrack();
        } catch (e) {
          livekitLogger.warn("could not restart track, pausing upstream instead");
          await track.pauseUpstream();
        }
      }
    };

    this.audioTracks = new Map();
    this.videoTracks = new Map();
    this.tracks = new Map();
    this.engine = engine;
    this.roomOptions = options;

    this.engine.client.onRemoteMuteChanged = (trackSid, muted) => {
      const pub = this.tracks.get(trackSid);

      if (!pub || !pub.track) {
        return;
      }

      if (muted) {
        pub.mute();
      } else {
        pub.unmute();
      }
    };

    this.engine.client.onSubscribedQualityUpdate = this.handleSubscribedQualityUpdate;
    this.engine.client.onLocalTrackUnpublished = this.handleLocalTrackUnpublished;
    this.engine.on(EngineEvent.Connected, this.updateTrackSubscriptionPermissions).on(EngineEvent.Restarted, this.updateTrackSubscriptionPermissions).on(EngineEvent.Resumed, this.updateTrackSubscriptionPermissions);
  }

  get lastCameraError() {
    return this.cameraError;
  }

  get lastMicrophoneError() {
    return this.microphoneError;
  }

  getTrack(source) {
    const track = super.getTrack(source);

    if (track) {
      return track;
    }
  }

  getTrackByName(name) {
    const track = super.getTrackByName(name);

    if (track) {
      return track;
    }
  }
  /**
   * Enable or disable a participant's camera track.
   *
   * If a track has already published, it'll mute or unmute the track.
   * Resolves with a `LocalTrackPublication` instance if successful and `undefined` otherwise
   */


  setCameraEnabled(enabled, options, publishOptions) {
    return this.setTrackEnabled(Track.Source.Camera, enabled, options, publishOptions);
  }
  /**
   * Enable or disable a participant's microphone track.
   *
   * If a track has already published, it'll mute or unmute the track.
   * Resolves with a `LocalTrackPublication` instance if successful and `undefined` otherwise
   */


  setMicrophoneEnabled(enabled, options, publishOptions) {
    return this.setTrackEnabled(Track.Source.Microphone, enabled, options, publishOptions);
  }
  /**
   * Start or stop sharing a participant's screen
   * Resolves with a `LocalTrackPublication` instance if successful and `undefined` otherwise
   */


  setScreenShareEnabled(enabled, options, publishOptions) {
    return this.setTrackEnabled(Track.Source.ScreenShare, enabled, options, publishOptions);
  }
  /** @internal */


  setPermissions(permissions) {
    const prevPermissions = this.permissions;
    const changed = super.setPermissions(permissions);

    if (changed && prevPermissions) {
      this.emit(ParticipantEvent.ParticipantPermissionsChanged, prevPermissions);
    }

    return changed;
  }

  async setTrackEnabled(source, enabled, options, publishOptions) {
    var _a, _b;

    livekitLogger.debug('setTrackEnabled', {
      source,
      enabled
    });
    let track = this.getTrack(source);

    if (enabled) {
      if (track) {
        await track.unmute();
      } else {
        let localTracks;

        if (this.pendingPublishing.has(source)) {
          livekitLogger.info('skipping duplicate published source', {
            source
          }); // no-op it's already been requested

          return;
        }

        this.pendingPublishing.add(source);

        try {
          switch (source) {
            case Track.Source.Camera:
              localTracks = await this.createTracks({
                video: (_a = options) !== null && _a !== void 0 ? _a : true
              });
              break;

            case Track.Source.Microphone:
              localTracks = await this.createTracks({
                audio: (_b = options) !== null && _b !== void 0 ? _b : true
              });
              break;

            case Track.Source.ScreenShare:
              localTracks = await this.createScreenTracks(_objectSpread2({}, options));
              break;

            default:
              throw new TrackInvalidError(source);
          }

          const publishPromises = [];

          for (const localTrack of localTracks) {
            publishPromises.push(this.publishTrack(localTrack, publishOptions));
          }

          const publishedTracks = await Promise.all(publishPromises); // for screen share publications including audio, this will only return the screen share publication, not the screen share audio one
          // revisit if we want to return an array of tracks instead for v2

          [track] = publishedTracks;
        } catch (e) {
          if (e instanceof Error && !(e instanceof TrackInvalidError)) {
            this.emit(ParticipantEvent.MediaDevicesError, e);
          }

          throw e;
        } finally {
          this.pendingPublishing.delete(source);
        }
      }
    } else if (track && track.track) {
      // screenshare cannot be muted, unpublish instead
      if (source === Track.Source.ScreenShare) {
        track = this.unpublishTrack(track.track);
        const screenAudioTrack = this.getTrack(Track.Source.ScreenShareAudio);

        if (screenAudioTrack && screenAudioTrack.track) {
          this.unpublishTrack(screenAudioTrack.track);
        }
      } else {
        await track.mute();
      }
    }

    return track;
  }
  /**
   * Publish both camera and microphone at the same time. This is useful for
   * displaying a single Permission Dialog box to the end user.
   */


  async enableCameraAndMicrophone() {
    if (this.pendingPublishing.has(Track.Source.Camera) || this.pendingPublishing.has(Track.Source.Microphone)) {
      // no-op it's already been requested
      return;
    }

    this.pendingPublishing.add(Track.Source.Camera);
    this.pendingPublishing.add(Track.Source.Microphone);

    try {
      const tracks = await this.createTracks({
        audio: true,
        video: true
      });
      await Promise.all(tracks.map(track => this.publishTrack(track)));
    } finally {
      this.pendingPublishing.delete(Track.Source.Camera);
      this.pendingPublishing.delete(Track.Source.Microphone);
    }
  }
  /**
   * Create local camera and/or microphone tracks
   * @param options
   * @returns
   */


  async createTracks(options) {
    var _a, _b;

    const opts = mergeDefaultOptions(options, (_a = this.roomOptions) === null || _a === void 0 ? void 0 : _a.audioCaptureDefaults, (_b = this.roomOptions) === null || _b === void 0 ? void 0 : _b.videoCaptureDefaults);
    const constraints = constraintsForOptions(opts);
    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      if (err instanceof Error) {
        if (constraints.audio) {
          this.microphoneError = err;
        }

        if (constraints.video) {
          this.cameraError = err;
        }
      }

      throw err;
    }

    if (constraints.audio) {
      this.microphoneError = undefined;
    }

    if (constraints.video) {
      this.cameraError = undefined;
    }

    return stream.getTracks().map(mediaStreamTrack => {
      const isAudio = mediaStreamTrack.kind === 'audio';
      isAudio ? options.audio : options.video;

      let trackConstraints;
      const conOrBool = isAudio ? constraints.audio : constraints.video;

      if (typeof conOrBool !== 'boolean') {
        trackConstraints = conOrBool;
      }

      const track = mediaTrackToLocalTrack(mediaStreamTrack, trackConstraints);

      if (track.kind === Track.Kind.Video) {
        track.source = Track.Source.Camera;
      } else if (track.kind === Track.Kind.Audio) {
        track.source = Track.Source.Microphone;
      }

      track.mediaStream = stream;
      return track;
    });
  }
  /**
   * Creates a screen capture tracks with getDisplayMedia().
   * A LocalVideoTrack is always created and returned.
   * If { audio: true }, and the browser supports audio capture, a LocalAudioTrack is also created.
   */


  async createScreenTracks(options) {
    var _a;

    if (options === undefined) {
      options = {};
    }

    if (options.resolution === undefined) {
      options.resolution = ScreenSharePresets.h1080fps15.resolution;
    }

    let videoConstraints = true;

    if (options.resolution) {
      videoConstraints = {
        width: options.resolution.width,
        height: options.resolution.height,
        frameRate: options.resolution.frameRate
      };
    } // typescript definition is missing getDisplayMedia: https://github.com/microsoft/TypeScript/issues/33232
    // @ts-ignore


    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: (_a = options.audio) !== null && _a !== void 0 ? _a : false,
      video: videoConstraints
    });
    const tracks = stream.getVideoTracks();

    if (tracks.length === 0) {
      throw new TrackInvalidError('no video track found');
    }

    const screenVideo = new LocalVideoTrack(tracks[0], undefined, false);
    screenVideo.source = Track.Source.ScreenShare;
    const localTracks = [screenVideo];

    if (stream.getAudioTracks().length > 0) {
      const screenAudio = new LocalAudioTrack(stream.getAudioTracks()[0], undefined, false);
      screenAudio.source = Track.Source.ScreenShareAudio;
      localTracks.push(screenAudio);
    }

    return localTracks;
  }
  /**
   * Publish a new track to the room
   * @param track
   * @param options
   */


  async publishTrack(track, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h;

    const opts = _objectSpread2(_objectSpread2({}, (_a = this.roomOptions) === null || _a === void 0 ? void 0 : _a.publishDefaults), options); // convert raw media track into audio or video track


    if (track instanceof MediaStreamTrack) {
      switch (track.kind) {
        case 'audio':
          track = new LocalAudioTrack(track, undefined, true);
          break;

        case 'video':
          track = new LocalVideoTrack(track, undefined, true);
          break;

        default:
          throw new TrackInvalidError("unsupported MediaStreamTrack kind ".concat(track.kind));
      }
    } // is it already published? if so skip


    let existingPublication;
    this.tracks.forEach(publication => {
      if (!publication.track) {
        return;
      }

      if (publication.track === track) {
        existingPublication = publication;
      }
    });
    if (existingPublication) return existingPublication;

    if (opts.source) {
      track.source = opts.source;
    }

    const existingTrackOfSource = Array.from(this.tracks.values()).find(publishedTrack => track instanceof LocalTrack && publishedTrack.source === track.source);

    if (existingTrackOfSource) {
      try {
        // throw an Error in order to capture the stack trace
        throw Error("publishing a second track with the same source: ".concat(track.source));
      } catch (e) {
        if (e instanceof Error) {
          livekitLogger.warn(e.message, {
            oldTrack: existingTrackOfSource,
            newTrack: track,
            trace: e.stack
          });
        }
      }
    }

    if (opts.stopMicTrackOnMute && track instanceof LocalAudioTrack) {
      track.stopOnMute = true;
    }

    if (track.source === Track.Source.ScreenShare && isFireFox()) {
      // Firefox does not work well with simulcasted screen share
      // we frequently get no data on layer 0 when enabled
      opts.simulcast = false;
    } // handle track actions


    track.on(TrackEvent.Muted, this.onTrackMuted);
    track.on(TrackEvent.Unmuted, this.onTrackUnmuted);
    track.on(TrackEvent.Ended, this.handleTrackEnded);
    track.on(TrackEvent.UpstreamPaused, this.onTrackUpstreamPaused);
    track.on(TrackEvent.UpstreamResumed, this.onTrackUpstreamResumed); // create track publication from track

    const req = AddTrackRequest.fromPartial({
      // get local track id for use during publishing
      cid: track.mediaStreamTrack.id,
      name: options === null || options === void 0 ? void 0 : options.name,
      type: Track.kindToProto(track.kind),
      muted: track.isMuted,
      source: Track.sourceToProto(track.source),
      disableDtx: !((_b = opts === null || opts === void 0 ? void 0 : opts.dtx) !== null && _b !== void 0 ? _b : true)
    }); // compute encodings and layers for video

    let encodings;
    let simEncodings;

    if (track.kind === Track.Kind.Video) {
      // TODO: support react native, which doesn't expose getSettings
      const settings = track.mediaStreamTrack.getSettings();
      const width = (_c = settings.width) !== null && _c !== void 0 ? _c : (_d = track.dimensions) === null || _d === void 0 ? void 0 : _d.width;
      const height = (_e = settings.height) !== null && _e !== void 0 ? _e : (_f = track.dimensions) === null || _f === void 0 ? void 0 : _f.height; // width and height should be defined for video

      req.width = width !== null && width !== void 0 ? width : 0;
      req.height = height !== null && height !== void 0 ? height : 0; // for svc codecs, disable simulcast and use vp8 for backup codec

      if (track instanceof LocalVideoTrack) {
        if ((opts === null || opts === void 0 ? void 0 : opts.videoCodec) === 'av1') {
          // set scalabilityMode to 'L3T3' by default
          opts.scalabilityMode = (_g = opts.scalabilityMode) !== null && _g !== void 0 ? _g : 'L3T3';
        } // set up backup


        if (opts.videoCodec && opts.backupCodec && opts.videoCodec !== opts.backupCodec.codec) {
          const simOpts = _objectSpread2({}, opts);

          simOpts.simulcast = true;
          simEncodings = computeTrackBackupEncodings(track, opts.backupCodec.codec, simOpts);
          req.simulcastCodecs = [{
            codec: opts.videoCodec,
            cid: track.mediaStreamTrack.id,
            enableSimulcastLayers: true
          }, {
            codec: opts.backupCodec.codec,
            cid: '',
            enableSimulcastLayers: true
          }];
        }
      }

      encodings = computeVideoEncodings(track.source === Track.Source.ScreenShare, width, height, opts);
      req.layers = videoLayersFromEncodings(req.width, req.height, simEncodings !== null && simEncodings !== void 0 ? simEncodings : encodings);
    } else if (track.kind === Track.Kind.Audio && opts.audioBitrate) {
      encodings = [{
        maxBitrate: opts.audioBitrate
      }];
    }

    if (!this.engine || this.engine.isClosed) {
      throw new UnexpectedConnectionState('cannot publish track when not connected');
    }

    const ti = await this.engine.addTrack(req);
    const publication = new LocalTrackPublication(track.kind, ti, track); // save options for when it needs to be republished again

    publication.options = opts;
    track.sid = ti.sid;

    if (!this.engine.publisher) {
      throw new UnexpectedConnectionState('publisher is closed');
    }

    livekitLogger.debug("publishing ".concat(track.kind, " with encodings"), {
      encodings,
      trackInfo: ti
    }); // store RTPSender

    track.sender = await this.engine.createSender(track, opts, encodings);

    if (track.codec === 'av1' && encodings && ((_h = encodings[0]) === null || _h === void 0 ? void 0 : _h.maxBitrate)) {
      this.engine.publisher.setTrackCodecBitrate(req.cid, track.codec, encodings[0].maxBitrate / 1000);
    }

    this.engine.negotiate();

    if (track instanceof LocalVideoTrack) {
      track.startMonitor(this.engine.client);
    } else if (track instanceof LocalAudioTrack) {
      track.startMonitor();
    }

    this.addTrackPublication(publication); // send event for publication

    this.emit(ParticipantEvent.LocalTrackPublished, publication);
    return publication;
  }
  /** @internal
   * publish additional codec to existing track
   */


  async publishAdditionalCodecForTrack(track, videoCodec, options) {
    var _a; // is it not published? if so skip


    let existingPublication;
    this.tracks.forEach(publication => {
      if (!publication.track) {
        return;
      }

      if (publication.track === track) {
        existingPublication = publication;
      }
    });

    if (!existingPublication) {
      throw new TrackInvalidError('track is not published');
    }

    if (!(track instanceof LocalVideoTrack)) {
      throw new TrackInvalidError('track is not a video track');
    }

    const opts = _objectSpread2(_objectSpread2({}, (_a = this.roomOptions) === null || _a === void 0 ? void 0 : _a.publishDefaults), options);

    const encodings = computeTrackBackupEncodings(track, videoCodec, opts);

    if (!encodings) {
      livekitLogger.info("backup codec has been disabled, ignoring request to add additional codec for track");
      return;
    }

    const simulcastTrack = track.addSimulcastTrack(videoCodec, encodings);
    const req = AddTrackRequest.fromPartial({
      cid: simulcastTrack.mediaStreamTrack.id,
      type: Track.kindToProto(track.kind),
      muted: track.isMuted,
      source: Track.sourceToProto(track.source),
      sid: track.sid,
      simulcastCodecs: [{
        codec: opts.videoCodec,
        cid: simulcastTrack.mediaStreamTrack.id,
        enableSimulcastLayers: opts.simulcast
      }]
    });
    req.layers = videoLayersFromEncodings(req.width, req.height, encodings);

    if (!this.engine || this.engine.isClosed) {
      throw new UnexpectedConnectionState('cannot publish track when not connected');
    }

    const ti = await this.engine.addTrack(req);

    await this.engine.createSimulcastSender(track, simulcastTrack, opts, encodings);
    this.engine.negotiate();
    livekitLogger.debug("published ".concat(videoCodec, " for track ").concat(track.sid), {
      encodings,
      trackInfo: ti
    });
  }

  unpublishTrack(track, stopOnUnpublish) {
    var _a, _b; // look through all published tracks to find the right ones


    const publication = this.getPublicationForTrack(track);
    livekitLogger.debug('unpublishing track', {
      track,
      method: 'unpublishTrack'
    });

    if (!publication || !publication.track) {
      livekitLogger.warn('track was not unpublished because no publication was found', {
        track,
        method: 'unpublishTrack'
      });
      return undefined;
    }

    track = publication.track;
    track.off(TrackEvent.Muted, this.onTrackMuted);
    track.off(TrackEvent.Unmuted, this.onTrackUnmuted);
    track.off(TrackEvent.Ended, this.handleTrackEnded);
    track.off(TrackEvent.UpstreamPaused, this.onTrackUpstreamPaused);
    track.off(TrackEvent.UpstreamResumed, this.onTrackUpstreamResumed);

    if (stopOnUnpublish === undefined) {
      stopOnUnpublish = (_b = (_a = this.roomOptions) === null || _a === void 0 ? void 0 : _a.stopLocalTrackOnUnpublish) !== null && _b !== void 0 ? _b : true;
    }

    if (stopOnUnpublish) {
      track.stop();
    }

    if (this.engine.publisher && this.engine.publisher.pc.connectionState !== 'closed' && track.sender) {
      try {
        this.engine.removeTrack(track.sender);

        if (track instanceof LocalVideoTrack) {
          for (const [, trackInfo] of track.simulcastCodecs) {
            if (trackInfo.sender) {
              this.engine.removeTrack(trackInfo.sender);
              trackInfo.sender = undefined;
            }
          }

          track.simulcastCodecs.clear();
        }
      } catch (e) {
        livekitLogger.warn('failed to unpublish track', {
          error: e,
          method: 'unpublishTrack'
        });
      } finally {
        this.engine.negotiate();
      }
    }

    track.sender = undefined; // remove from our maps

    this.tracks.delete(publication.trackSid);

    switch (publication.kind) {
      case Track.Kind.Audio:
        this.audioTracks.delete(publication.trackSid);
        break;

      case Track.Kind.Video:
        this.videoTracks.delete(publication.trackSid);
        break;
    }

    this.emit(ParticipantEvent.LocalTrackUnpublished, publication);
    publication.setTrack(undefined);
    return publication;
  }

  unpublishTracks(tracks) {
    const publications = [];
    tracks.forEach(track => {
      const pub = this.unpublishTrack(track);

      if (pub) {
        publications.push(pub);
      }
    });
    return publications;
  }
  /**
   * Publish a new data payload to the room. Data will be forwarded to each
   * participant in the room if the destination argument is empty
   *
   * @param data Uint8Array of the payload. To send string data, use TextEncoder.encode
   * @param kind whether to send this as reliable or lossy.
   * For data that you need delivery guarantee (such as chat messages), use Reliable.
   * For data that should arrive as quickly as possible, but you are ok with dropped
   * packets, use Lossy.
   * @param destination the participants who will receive the message
   */


  async publishData(data, kind, destination) {
    const dest = [];

    if (destination !== undefined) {
      destination.forEach(val => {
        if (val instanceof RemoteParticipant) {
          dest.push(val.sid);
        } else {
          dest.push(val);
        }
      });
    }

    const packet = {
      kind,
      value: {
        $case: 'user',
        user: {
          participantSid: this.sid,
          payload: data,
          destinationSids: dest
        }
      }
    };
    await this.engine.sendDataPacket(packet, kind);
  }
  /**
   * Control who can subscribe to LocalParticipant's published tracks.
   *
   * By default, all participants can subscribe. This allows fine-grained control over
   * who is able to subscribe at a participant and track level.
   *
   * Note: if access is given at a track-level (i.e. both [allParticipantsAllowed] and
   * [ParticipantTrackPermission.allTracksAllowed] are false), any newer published tracks
   * will not grant permissions to any participants and will require a subsequent
   * permissions update to allow subscription.
   *
   * @param allParticipantsAllowed Allows all participants to subscribe all tracks.
   *  Takes precedence over [[participantTrackPermissions]] if set to true.
   *  By default this is set to true.
   * @param participantTrackPermissions Full list of individual permissions per
   *  participant/track. Any omitted participants will not receive any permissions.
   */


  setTrackSubscriptionPermissions(allParticipantsAllowed) {
    let participantTrackPermissions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    this.participantTrackPermissions = participantTrackPermissions;
    this.allParticipantsAllowedToSubscribe = allParticipantsAllowed;

    if (this.engine.client.isConnected) {
      this.updateTrackSubscriptionPermissions();
    }
  }
  /** @internal */


  updateInfo(info) {
    super.updateInfo(info); // reconcile track mute status.
    // if server's track mute status doesn't match actual, we'll have to update
    // the server's copy

    info.tracks.forEach(ti => {
      var _a, _b;

      const pub = this.tracks.get(ti.sid);

      if (pub) {
        const mutedOnServer = pub.isMuted || ((_b = (_a = pub.track) === null || _a === void 0 ? void 0 : _a.isUpstreamPaused) !== null && _b !== void 0 ? _b : false);

        if (mutedOnServer !== ti.muted) {
          livekitLogger.debug('updating server mute state after reconcile', {
            sid: ti.sid,
            muted: mutedOnServer
          });
          this.engine.client.sendMuteTrack(ti.sid, mutedOnServer);
        }
      }
    });
  }

  getPublicationForTrack(track) {
    let publication;
    this.tracks.forEach(pub => {
      const localTrack = pub.track;

      if (!localTrack) {
        return;
      } // this looks overly complicated due to this object tree


      if (track instanceof MediaStreamTrack) {
        if (localTrack instanceof LocalAudioTrack || localTrack instanceof LocalVideoTrack) {
          if (localTrack.mediaStreamTrack === track) {
            publication = pub;
          }
        }
      } else if (track === localTrack) {
        publication = pub;
      }
    });
    return publication;
  }
  /** @internal */


  publishedTracksInfo() {
    const infos = [];
    this.tracks.forEach(track => {
      if (track.track !== undefined) {
        infos.push({
          cid: track.track.mediaStreamID,
          track: track.trackInfo
        });
      }
    });
    return infos;
  }
  /** @internal */


  dataChannelsInfo() {
    const infos = [];

    const getInfo = (dc, target) => {
      if ((dc === null || dc === void 0 ? void 0 : dc.id) !== undefined && dc.id !== null) {
        infos.push({
          label: dc.label,
          id: dc.id,
          target
        });
      }
    };

    getInfo(this.engine.dataChannelForKind(DataPacket_Kind.LOSSY), SignalTarget.PUBLISHER);
    getInfo(this.engine.dataChannelForKind(DataPacket_Kind.RELIABLE), SignalTarget.PUBLISHER);
    getInfo(this.engine.dataChannelForKind(DataPacket_Kind.LOSSY, true), SignalTarget.SUBSCRIBER);
    getInfo(this.engine.dataChannelForKind(DataPacket_Kind.RELIABLE, true), SignalTarget.SUBSCRIBER);
    return infos;
  }

}

const passThroughQueueSignals = ['syncState', 'trickle', 'offer', 'answer', 'simulate', 'leave'];

function canPassThroughQueue(req) {
  const canPass = passThroughQueueSignals.includes(req.$case);
  livekitLogger.trace('request allowed to bypass queue:', {
    canPass,
    req
  });
  return canPass;
}
/** @internal */


class SignalClient {
  constructor() {
    let useJSON = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    this.isConnected = false;
    this.isReconnecting = false;
    this.useJSON = useJSON;
    this.requestQueue = new Queue();
    this.queuedRequests = [];
  }

  async join(url, token, opts, abortSignal) {
    // during a full reconnect, we'd want to start the sequence even if currently
    // connected
    this.isConnected = false;
    this.options = opts;
    const res = await this.connect(url, token, opts, abortSignal);
    return res;
  }

  async reconnect(url, token, sid) {
    if (!this.options) {
      livekitLogger.warn('attempted to reconnect without signal options being set, ignoring');
      return;
    }

    this.isReconnecting = true; // clear ping interval and restart it once reconnected

    this.clearPingInterval();
    await this.connect(url, token, _objectSpread2(_objectSpread2({}, this.options), {}, {
      reconnect: true,
      sid
    }));
  }

  connect(url, token, opts, abortSignal) {
    this.connectOptions = opts;

    if (url.startsWith('http')) {
      url = url.replace('http', 'ws');
    } // strip trailing slash


    url = url.replace(/\/$/, '');
    url += '/rtc';
    const clientInfo = getClientInfo();
    const params = createConnectionParams(token, clientInfo, opts);
    return new Promise((resolve, reject) => {
      const abortHandler = () => {
        ws.close();
        this.close();
        reject(new ConnectionError('room connection has been cancelled'));
      };

      if (abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.aborted) {
        abortHandler();
      }

      abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.addEventListener('abort', abortHandler);
      livekitLogger.debug("connecting to ".concat(url + params));
      this.ws = undefined;
      const ws = new WebSocket(url + params);
      ws.binaryType = 'arraybuffer';

      ws.onerror = async ev => {
        if (!this.ws) {
          try {
            const resp = await fetch("http".concat(url.substring(2), "/validate").concat(params));

            if (!resp.ok) {
              const msg = await resp.text();
              reject(new ConnectionError(msg));
            } else {
              reject(new ConnectionError('Internal error'));
            }
          } catch (e) {
            reject(new ConnectionError('server was not reachable'));
          }

          return;
        } // other errors, handle


        this.handleWSError(ev);
      };

      ws.onopen = () => {
        this.ws = ws;

        if (opts.reconnect) {
          // upon reconnection, there will not be additional handshake
          this.isConnected = true; // restart ping interval as it's cleared for reconnection

          this.startPingInterval();
          resolve();
        }
      };

      ws.onmessage = async ev => {
        var _a; // not considered connected until JoinResponse is received


        let resp;

        if (typeof ev.data === 'string') {
          const json = JSON.parse(ev.data);
          resp = SignalResponse.fromJSON(json);
        } else if (ev.data instanceof ArrayBuffer) {
          resp = SignalResponse.decode(new Uint8Array(ev.data));
        } else {
          livekitLogger.error("could not decode websocket message: ".concat(typeof ev.data));
          return;
        }

        if (!this.isConnected) {
          // handle join message only
          if (((_a = resp.message) === null || _a === void 0 ? void 0 : _a.$case) === 'join') {
            this.isConnected = true;
            abortSignal === null || abortSignal === void 0 ? void 0 : abortSignal.removeEventListener('abort', abortHandler);
            this.pingTimeoutDuration = resp.message.join.pingTimeout;
            this.pingIntervalDuration = resp.message.join.pingInterval;

            if (this.pingTimeoutDuration && this.pingTimeoutDuration > 0) {
              livekitLogger.debug('ping config', {
                timeout: this.pingTimeoutDuration,
                interval: this.pingIntervalDuration
              });
              this.startPingInterval();
            }

            resolve(resp.message.join);
          } else {
            reject(new ConnectionError('did not receive join response'));
          }

          return;
        }

        if (this.signalLatency) {
          await sleep(this.signalLatency);
        }

        this.handleSignalResponse(resp);
      };

      ws.onclose = ev => {
        if (!this.isConnected || this.ws !== ws) return;
        livekitLogger.debug("websocket connection closed: ".concat(ev.reason));
        this.isConnected = false;
        if (this.onClose) this.onClose(ev.reason);

        if (this.ws === ws) {
          this.ws = undefined;
        }
      };
    });
  }

  close() {
    var _a;

    this.isConnected = false;
    if (this.ws) this.ws.onclose = null;
    (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
    this.ws = undefined;
    this.clearPingInterval();
  } // initial offer after joining


  sendOffer(offer) {
    livekitLogger.debug('sending offer', offer);
    this.sendRequest({
      $case: 'offer',
      offer: toProtoSessionDescription(offer)
    });
  } // answer a server-initiated offer


  sendAnswer(answer) {
    livekitLogger.debug('sending answer');
    this.sendRequest({
      $case: 'answer',
      answer: toProtoSessionDescription(answer)
    });
  }

  sendIceCandidate(candidate, target) {
    livekitLogger.trace('sending ice candidate', candidate);
    this.sendRequest({
      $case: 'trickle',
      trickle: {
        candidateInit: JSON.stringify(candidate),
        target
      }
    });
  }

  sendMuteTrack(trackSid, muted) {
    this.sendRequest({
      $case: 'mute',
      mute: {
        sid: trackSid,
        muted
      }
    });
  }

  sendAddTrack(req) {
    this.sendRequest({
      $case: 'addTrack',
      addTrack: AddTrackRequest.fromPartial(req)
    });
  }

  sendUpdateTrackSettings(settings) {
    this.sendRequest({
      $case: 'trackSetting',
      trackSetting: settings
    });
  }

  sendUpdateSubscription(sub) {
    this.sendRequest({
      $case: 'subscription',
      subscription: sub
    });
  }

  sendSyncState(sync) {
    this.sendRequest({
      $case: 'syncState',
      syncState: sync
    });
  }

  sendUpdateVideoLayers(trackSid, layers) {
    this.sendRequest({
      $case: 'updateLayers',
      updateLayers: {
        trackSid,
        layers
      }
    });
  }

  sendUpdateSubscriptionPermissions(allParticipants, trackPermissions) {
    this.sendRequest({
      $case: 'subscriptionPermission',
      subscriptionPermission: {
        allParticipants,
        trackPermissions
      }
    });
  }

  sendSimulateScenario(scenario) {
    this.sendRequest({
      $case: 'simulate',
      simulate: scenario
    });
  }

  sendPing() {
    this.sendRequest({
      $case: 'ping',
      ping: Date.now()
    });
  }

  async sendLeave() {
    await this.sendRequest({
      $case: 'leave',
      leave: {
        canReconnect: false,
        reason: DisconnectReason.CLIENT_INITIATED
      }
    });
  }

  async sendRequest(message) {
    let fromQueue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    // capture all requests while reconnecting and put them in a queue
    // unless the request originates from the queue, then don't enqueue again
    const canQueue = !fromQueue && !canPassThroughQueue(message);

    if (canQueue && this.isReconnecting) {
      this.queuedRequests.push(async () => {
        await this.sendRequest(message, true);
      });
      return;
    } // make sure previously queued requests are being sent first


    if (!fromQueue) {
      await this.requestQueue.flush();
    }

    if (this.signalLatency) {
      await sleep(this.signalLatency);
    }

    if (!this.ws) {
      livekitLogger.error('cannot send signal request before connected');
      return;
    }

    const req = {
      message
    };

    try {
      if (this.useJSON) {
        this.ws.send(JSON.stringify(SignalRequest.toJSON(req)));
      } else {
        this.ws.send(SignalRequest.encode(req).finish());
      }
    } catch (e) {
      livekitLogger.error('error sending signal message', {
        error: e
      });
    }
  }

  handleSignalResponse(res) {
    var _a, _b;

    const msg = res.message;

    if (msg.$case === 'answer') {
      const sd = fromProtoSessionDescription(msg.answer);

      if (this.onAnswer) {
        this.onAnswer(sd);
      }
    } else if (msg.$case === 'offer') {
      const sd = fromProtoSessionDescription(msg.offer);

      if (this.onOffer) {
        this.onOffer(sd);
      }
    } else if (msg.$case === 'trickle') {
      const candidate = JSON.parse(msg.trickle.candidateInit);

      if (this.onTrickle) {
        this.onTrickle(candidate, msg.trickle.target);
      }
    } else if (msg.$case === 'update') {
      if (this.onParticipantUpdate) {
        this.onParticipantUpdate((_a = msg.update.participants) !== null && _a !== void 0 ? _a : []);
      }
    } else if (msg.$case === 'trackPublished') {
      if (this.onLocalTrackPublished) {
        this.onLocalTrackPublished(msg.trackPublished);
      }
    } else if (msg.$case === 'speakersChanged') {
      if (this.onSpeakersChanged) {
        this.onSpeakersChanged((_b = msg.speakersChanged.speakers) !== null && _b !== void 0 ? _b : []);
      }
    } else if (msg.$case === 'leave') {
      if (this.onLeave) {
        this.onLeave(msg.leave);
      }
    } else if (msg.$case === 'mute') {
      if (this.onRemoteMuteChanged) {
        this.onRemoteMuteChanged(msg.mute.sid, msg.mute.muted);
      }
    } else if (msg.$case === 'roomUpdate') {
      if (this.onRoomUpdate && msg.roomUpdate.room) {
        this.onRoomUpdate(msg.roomUpdate.room);
      }
    } else if (msg.$case === 'connectionQuality') {
      if (this.onConnectionQuality) {
        this.onConnectionQuality(msg.connectionQuality);
      }
    } else if (msg.$case === 'streamStateUpdate') {
      if (this.onStreamStateUpdate) {
        this.onStreamStateUpdate(msg.streamStateUpdate);
      }
    } else if (msg.$case === 'subscribedQualityUpdate') {
      if (this.onSubscribedQualityUpdate) {
        this.onSubscribedQualityUpdate(msg.subscribedQualityUpdate);
      }
    } else if (msg.$case === 'subscriptionPermissionUpdate') {
      if (this.onSubscriptionPermissionUpdate) {
        this.onSubscriptionPermissionUpdate(msg.subscriptionPermissionUpdate);
      }
    } else if (msg.$case === 'refreshToken') {
      if (this.onTokenRefresh) {
        this.onTokenRefresh(msg.refreshToken);
      }
    } else if (msg.$case === 'trackUnpublished') {
      if (this.onLocalTrackUnpublished) {
        this.onLocalTrackUnpublished(msg.trackUnpublished);
      }
    } else if (msg.$case === 'pong') {
      this.resetPingTimeout();
    } else {
      livekitLogger.debug('unsupported message', msg);
    }
  }

  setReconnected() {
    while (this.queuedRequests.length > 0) {
      const req = this.queuedRequests.shift();

      if (req) {
        this.requestQueue.run(req);
      }
    }

    this.isReconnecting = false;
  }

  handleWSError(ev) {
    livekitLogger.error('websocket error', ev);
  }

  resetPingTimeout() {
    this.clearPingTimeout();

    if (!this.pingTimeoutDuration) {
      livekitLogger.warn('ping timeout duration not set');
      return;
    }

    this.pingTimeout = setTimeout(() => {
      livekitLogger.warn("ping timeout triggered. last pong received at: ".concat(new Date(Date.now() - this.pingTimeoutDuration * 1000).toUTCString()));

      if (this.onClose) {
        this.onClose('ping timeout');
      }
    }, this.pingTimeoutDuration * 1000);
  }

  clearPingTimeout() {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }
  }

  startPingInterval() {
    this.clearPingInterval();
    this.resetPingTimeout();

    if (!this.pingIntervalDuration) {
      livekitLogger.warn('ping interval duration not set');
      return;
    }

    livekitLogger.debug('start ping interval');
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, this.pingIntervalDuration * 1000);
  }

  clearPingInterval() {
    livekitLogger.debug('clearing ping interval');
    this.clearPingTimeout();

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

}

function fromProtoSessionDescription(sd) {
  const rsd = {
    type: 'offer',
    sdp: sd.sdp
  };

  switch (sd.type) {
    case 'answer':
    case 'offer':
    case 'pranswer':
    case 'rollback':
      rsd.type = sd.type;
      break;
  }

  return rsd;
}

function toProtoSessionDescription(rsd) {
  const sd = {
    sdp: rsd.sdp,
    type: rsd.type
  };
  return sd;
}

function createConnectionParams(token, info, opts) {
  var _a;

  const params = new URLSearchParams();
  params.set('access_token', token); // opts

  if (opts.reconnect) {
    params.set('reconnect', '1');

    if (opts.sid) {
      params.set('sid', opts.sid);
    }
  }

  params.set('auto_subscribe', opts.autoSubscribe ? '1' : '0'); // ClientInfo

  params.set('sdk', 'js');
  params.set('version', info.version);
  params.set('protocol', info.protocol.toString());

  if (info.deviceModel) {
    params.set('device_model', info.deviceModel);
  }

  if (info.os) {
    params.set('os', info.os);
  }

  if (info.osVersion) {
    params.set('os_version', info.osVersion);
  }

  if (info.browser) {
    params.set('browser', info.browser);
  }

  if (info.browserVersion) {
    params.set('browser_version', info.browserVersion);
  }

  if (opts.publishOnly !== undefined) {
    params.set('publish', opts.publishOnly);
  }

  if (opts.adaptiveStream) {
    params.set('adaptive_stream', '1');
  } // @ts-ignore


  if ((_a = navigator.connection) === null || _a === void 0 ? void 0 : _a.type) {
    // @ts-ignore
    params.set('network', navigator.connection.type);
  }

  return "?".concat(params.toString());
}

const maxRetryDelay = 7000;
const DEFAULT_RETRY_DELAYS_IN_MS = [0, 300, 2 * 2 * 300, 3 * 3 * 300, 4 * 4 * 300, maxRetryDelay, maxRetryDelay, maxRetryDelay, maxRetryDelay, maxRetryDelay];

class DefaultReconnectPolicy {
  constructor(retryDelays) {
    this._retryDelays = retryDelays !== undefined ? [...retryDelays] : DEFAULT_RETRY_DELAYS_IN_MS;
  }

  nextRetryDelayInMs(context) {
    if (context.retryCount >= this._retryDelays.length) return null;
    const retryDelay = this._retryDelays[context.retryCount];
    if (context.retryCount <= 1) return retryDelay;
    return retryDelay + Math.random() * 1000;
  }

}

const publishDefaults = {
  audioBitrate: AudioPresets.speech.maxBitrate,
  dtx: true,
  simulcast: true,
  screenShareEncoding: ScreenSharePresets.h1080fps15.encoding,
  stopMicTrackOnMute: false,
  videoCodec: 'vp8',
  backupCodec: {
    codec: 'vp8',
    encoding: VideoPresets.h540.encoding
  }
};
const audioDefaults = {
  autoGainControl: true,
  echoCancellation: true,
  noiseSuppression: true
};
const videoDefaults = {
  resolution: VideoPresets.h720.resolution
};
const roomOptionDefaults = {
  adaptiveStream: false,
  dynacast: false,
  stopLocalTrackOnUnpublish: false,
  reconnectPolicy: new DefaultReconnectPolicy()
};
const roomConnectOptionDefaults = {
  autoSubscribe: true
};

var parser$1 = {};

var grammar$2 = {exports: {}};

var grammar$1 = grammar$2.exports = {
  v: [{
    name: 'version',
    reg: /^(\d*)$/
  }],
  o: [{
    // o=- 20518 0 IN IP4 203.0.113.1
    // NB: sessionId will be a String in most cases because it is huge
    name: 'origin',
    reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
    names: ['username', 'sessionId', 'sessionVersion', 'netType', 'ipVer', 'address'],
    format: '%s %s %d %s IP%d %s'
  }],
  // default parsing of these only (though some of these feel outdated)
  s: [{
    name: 'name'
  }],
  i: [{
    name: 'description'
  }],
  u: [{
    name: 'uri'
  }],
  e: [{
    name: 'email'
  }],
  p: [{
    name: 'phone'
  }],
  z: [{
    name: 'timezones'
  }],
  // TODO: this one can actually be parsed properly...
  r: [{
    name: 'repeats'
  }],
  // TODO: this one can also be parsed properly
  // k: [{}], // outdated thing ignored
  t: [{
    // t=0 0
    name: 'timing',
    reg: /^(\d*) (\d*)/,
    names: ['start', 'stop'],
    format: '%d %d'
  }],
  c: [{
    // c=IN IP4 10.47.197.26
    name: 'connection',
    reg: /^IN IP(\d) (\S*)/,
    names: ['version', 'ip'],
    format: 'IN IP%d %s'
  }],
  b: [{
    // b=AS:4000
    push: 'bandwidth',
    reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
    names: ['type', 'limit'],
    format: '%s:%s'
  }],
  m: [{
    // m=video 51744 RTP/AVP 126 97 98 34 31
    // NB: special - pushes to session
    // TODO: rtp/fmtp should be filtered by the payloads found here?
    reg: /^(\w*) (\d*) ([\w/]*)(?: (.*))?/,
    names: ['type', 'port', 'protocol', 'payloads'],
    format: '%s %d %s %s'
  }],
  a: [{
    // a=rtpmap:110 opus/48000/2
    push: 'rtp',
    reg: /^rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
    names: ['payload', 'codec', 'rate', 'encoding'],
    format: function (o) {
      return o.encoding ? 'rtpmap:%d %s/%s/%s' : o.rate ? 'rtpmap:%d %s/%s' : 'rtpmap:%d %s';
    }
  }, {
    // a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
    // a=fmtp:111 minptime=10; useinbandfec=1
    push: 'fmtp',
    reg: /^fmtp:(\d*) ([\S| ]*)/,
    names: ['payload', 'config'],
    format: 'fmtp:%d %s'
  }, {
    // a=control:streamid=0
    name: 'control',
    reg: /^control:(.*)/,
    format: 'control:%s'
  }, {
    // a=rtcp:65179 IN IP4 193.84.77.194
    name: 'rtcp',
    reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
    names: ['port', 'netType', 'ipVer', 'address'],
    format: function (o) {
      return o.address != null ? 'rtcp:%d %s IP%d %s' : 'rtcp:%d';
    }
  }, {
    // a=rtcp-fb:98 trr-int 100
    push: 'rtcpFbTrrInt',
    reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
    names: ['payload', 'value'],
    format: 'rtcp-fb:%s trr-int %d'
  }, {
    // a=rtcp-fb:98 nack rpsi
    push: 'rtcpFb',
    reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
    names: ['payload', 'type', 'subtype'],
    format: function (o) {
      return o.subtype != null ? 'rtcp-fb:%s %s %s' : 'rtcp-fb:%s %s';
    }
  }, {
    // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
    // a=extmap:1/recvonly URI-gps-string
    // a=extmap:3 urn:ietf:params:rtp-hdrext:encrypt urn:ietf:params:rtp-hdrext:smpte-tc 25@600/24
    push: 'ext',
    reg: /^extmap:(\d+)(?:\/(\w+))?(?: (urn:ietf:params:rtp-hdrext:encrypt))? (\S*)(?: (\S*))?/,
    names: ['value', 'direction', 'encrypt-uri', 'uri', 'config'],
    format: function (o) {
      return 'extmap:%d' + (o.direction ? '/%s' : '%v') + (o['encrypt-uri'] ? ' %s' : '%v') + ' %s' + (o.config ? ' %s' : '');
    }
  }, {
    // a=extmap-allow-mixed
    name: 'extmapAllowMixed',
    reg: /^(extmap-allow-mixed)/
  }, {
    // a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
    push: 'crypto',
    reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
    names: ['id', 'suite', 'config', 'sessionConfig'],
    format: function (o) {
      return o.sessionConfig != null ? 'crypto:%d %s %s %s' : 'crypto:%d %s %s';
    }
  }, {
    // a=setup:actpass
    name: 'setup',
    reg: /^setup:(\w*)/,
    format: 'setup:%s'
  }, {
    // a=connection:new
    name: 'connectionType',
    reg: /^connection:(new|existing)/,
    format: 'connection:%s'
  }, {
    // a=mid:1
    name: 'mid',
    reg: /^mid:([^\s]*)/,
    format: 'mid:%s'
  }, {
    // a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
    name: 'msid',
    reg: /^msid:(.*)/,
    format: 'msid:%s'
  }, {
    // a=ptime:20
    name: 'ptime',
    reg: /^ptime:(\d*(?:\.\d*)*)/,
    format: 'ptime:%d'
  }, {
    // a=maxptime:60
    name: 'maxptime',
    reg: /^maxptime:(\d*(?:\.\d*)*)/,
    format: 'maxptime:%d'
  }, {
    // a=sendrecv
    name: 'direction',
    reg: /^(sendrecv|recvonly|sendonly|inactive)/
  }, {
    // a=ice-lite
    name: 'icelite',
    reg: /^(ice-lite)/
  }, {
    // a=ice-ufrag:F7gI
    name: 'iceUfrag',
    reg: /^ice-ufrag:(\S*)/,
    format: 'ice-ufrag:%s'
  }, {
    // a=ice-pwd:x9cml/YzichV2+XlhiMu8g
    name: 'icePwd',
    reg: /^ice-pwd:(\S*)/,
    format: 'ice-pwd:%s'
  }, {
    // a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
    name: 'fingerprint',
    reg: /^fingerprint:(\S*) (\S*)/,
    names: ['type', 'hash'],
    format: 'fingerprint:%s %s'
  }, {
    // a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
    // a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0 network-id 3 network-cost 10
    // a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0 network-id 3 network-cost 10
    // a=candidate:229815620 1 tcp 1518280447 192.168.150.19 60017 typ host tcptype active generation 0 network-id 3 network-cost 10
    // a=candidate:3289912957 2 tcp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 tcptype passive generation 0 network-id 3 network-cost 10
    push: 'candidates',
    reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?(?: network-id (\d*))?(?: network-cost (\d*))?/,
    names: ['foundation', 'component', 'transport', 'priority', 'ip', 'port', 'type', 'raddr', 'rport', 'tcptype', 'generation', 'network-id', 'network-cost'],
    format: function (o) {
      var str = 'candidate:%s %d %s %d %s %d typ %s';
      str += o.raddr != null ? ' raddr %s rport %d' : '%v%v'; // NB: candidate has three optional chunks, so %void middles one if it's missing

      str += o.tcptype != null ? ' tcptype %s' : '%v';

      if (o.generation != null) {
        str += ' generation %d';
      }

      str += o['network-id'] != null ? ' network-id %d' : '%v';
      str += o['network-cost'] != null ? ' network-cost %d' : '%v';
      return str;
    }
  }, {
    // a=end-of-candidates (keep after the candidates line for readability)
    name: 'endOfCandidates',
    reg: /^(end-of-candidates)/
  }, {
    // a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
    name: 'remoteCandidates',
    reg: /^remote-candidates:(.*)/,
    format: 'remote-candidates:%s'
  }, {
    // a=ice-options:google-ice
    name: 'iceOptions',
    reg: /^ice-options:(\S*)/,
    format: 'ice-options:%s'
  }, {
    // a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
    push: 'ssrcs',
    reg: /^ssrc:(\d*) ([\w_-]*)(?::(.*))?/,
    names: ['id', 'attribute', 'value'],
    format: function (o) {
      var str = 'ssrc:%d';

      if (o.attribute != null) {
        str += ' %s';

        if (o.value != null) {
          str += ':%s';
        }
      }

      return str;
    }
  }, {
    // a=ssrc-group:FEC 1 2
    // a=ssrc-group:FEC-FR 3004364195 1080772241
    push: 'ssrcGroups',
    // token-char = %x21 / %x23-27 / %x2A-2B / %x2D-2E / %x30-39 / %x41-5A / %x5E-7E
    reg: /^ssrc-group:([\x21\x23\x24\x25\x26\x27\x2A\x2B\x2D\x2E\w]*) (.*)/,
    names: ['semantics', 'ssrcs'],
    format: 'ssrc-group:%s %s'
  }, {
    // a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
    name: 'msidSemantic',
    reg: /^msid-semantic:\s?(\w*) (\S*)/,
    names: ['semantic', 'token'],
    format: 'msid-semantic: %s %s' // space after ':' is not accidental

  }, {
    // a=group:BUNDLE audio video
    push: 'groups',
    reg: /^group:(\w*) (.*)/,
    names: ['type', 'mids'],
    format: 'group:%s %s'
  }, {
    // a=rtcp-mux
    name: 'rtcpMux',
    reg: /^(rtcp-mux)/
  }, {
    // a=rtcp-rsize
    name: 'rtcpRsize',
    reg: /^(rtcp-rsize)/
  }, {
    // a=sctpmap:5000 webrtc-datachannel 1024
    name: 'sctpmap',
    reg: /^sctpmap:([\w_/]*) (\S*)(?: (\S*))?/,
    names: ['sctpmapNumber', 'app', 'maxMessageSize'],
    format: function (o) {
      return o.maxMessageSize != null ? 'sctpmap:%s %s %s' : 'sctpmap:%s %s';
    }
  }, {
    // a=x-google-flag:conference
    name: 'xGoogleFlag',
    reg: /^x-google-flag:([^\s]*)/,
    format: 'x-google-flag:%s'
  }, {
    // a=rid:1 send max-width=1280;max-height=720;max-fps=30;depend=0
    push: 'rids',
    reg: /^rid:([\d\w]+) (\w+)(?: ([\S| ]*))?/,
    names: ['id', 'direction', 'params'],
    format: function (o) {
      return o.params ? 'rid:%s %s %s' : 'rid:%s %s';
    }
  }, {
    // a=imageattr:97 send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320] recv [x=330,y=250]
    // a=imageattr:* send [x=800,y=640] recv *
    // a=imageattr:100 recv [x=320,y=240]
    push: 'imageattrs',
    reg: new RegExp( // a=imageattr:97
    '^imageattr:(\\d+|\\*)' + // send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320]
    '[\\s\\t]+(send|recv)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*)' + // recv [x=330,y=250]
    '(?:[\\s\\t]+(recv|send)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*))?'),
    names: ['pt', 'dir1', 'attrs1', 'dir2', 'attrs2'],
    format: function (o) {
      return 'imageattr:%s %s %s' + (o.dir2 ? ' %s %s' : '');
    }
  }, {
    // a=simulcast:send 1,2,3;~4,~5 recv 6;~7,~8
    // a=simulcast:recv 1;4,5 send 6;7
    name: 'simulcast',
    reg: new RegExp( // a=simulcast:
    '^simulcast:' + // send 1,2,3;~4,~5
    '(send|recv) ([a-zA-Z0-9\\-_~;,]+)' + // space + recv 6;~7,~8
    '(?:\\s?(send|recv) ([a-zA-Z0-9\\-_~;,]+))?' + // end
    '$'),
    names: ['dir1', 'list1', 'dir2', 'list2'],
    format: function (o) {
      return 'simulcast:%s %s' + (o.dir2 ? ' %s %s' : '');
    }
  }, {
    // old simulcast draft 03 (implemented by Firefox)
    //   https://tools.ietf.org/html/draft-ietf-mmusic-sdp-simulcast-03
    // a=simulcast: recv pt=97;98 send pt=97
    // a=simulcast: send rid=5;6;7 paused=6,7
    name: 'simulcast_03',
    reg: /^simulcast:[\s\t]+([\S+\s\t]+)$/,
    names: ['value'],
    format: 'simulcast: %s'
  }, {
    // a=framerate:25
    // a=framerate:29.97
    name: 'framerate',
    reg: /^framerate:(\d+(?:$|\.\d+))/,
    format: 'framerate:%s'
  }, {
    // RFC4570
    // a=source-filter: incl IN IP4 239.5.2.31 10.1.15.5
    name: 'sourceFilter',
    reg: /^source-filter: *(excl|incl) (\S*) (IP4|IP6|\*) (\S*) (.*)/,
    names: ['filterMode', 'netType', 'addressTypes', 'destAddress', 'srcList'],
    format: 'source-filter: %s %s %s %s %s'
  }, {
    // a=bundle-only
    name: 'bundleOnly',
    reg: /^(bundle-only)/
  }, {
    // a=label:1
    name: 'label',
    reg: /^label:(.+)/,
    format: 'label:%s'
  }, {
    // RFC version 26 for SCTP over DTLS
    // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-5
    name: 'sctpPort',
    reg: /^sctp-port:(\d+)$/,
    format: 'sctp-port:%s'
  }, {
    // RFC version 26 for SCTP over DTLS
    // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-6
    name: 'maxMessageSize',
    reg: /^max-message-size:(\d+)$/,
    format: 'max-message-size:%s'
  }, {
    // RFC7273
    // a=ts-refclk:ptp=IEEE1588-2008:39-A7-94-FF-FE-07-CB-D0:37
    push: 'tsRefClocks',
    reg: /^ts-refclk:([^\s=]*)(?:=(\S*))?/,
    names: ['clksrc', 'clksrcExt'],
    format: function (o) {
      return 'ts-refclk:%s' + (o.clksrcExt != null ? '=%s' : '');
    }
  }, {
    // RFC7273
    // a=mediaclk:direct=963214424
    name: 'mediaClk',
    reg: /^mediaclk:(?:id=(\S*))? *([^\s=]*)(?:=(\S*))?(?: *rate=(\d+)\/(\d+))?/,
    names: ['id', 'mediaClockName', 'mediaClockValue', 'rateNumerator', 'rateDenominator'],
    format: function (o) {
      var str = 'mediaclk:';
      str += o.id != null ? 'id=%s %s' : '%v%s';
      str += o.mediaClockValue != null ? '=%s' : '';
      str += o.rateNumerator != null ? ' rate=%s' : '';
      str += o.rateDenominator != null ? '/%s' : '';
      return str;
    }
  }, {
    // a=keywds:keywords
    name: 'keywords',
    reg: /^keywds:(.+)$/,
    format: 'keywds:%s'
  }, {
    // a=content:main
    name: 'content',
    reg: /^content:(.+)/,
    format: 'content:%s'
  }, // BFCP https://tools.ietf.org/html/rfc4583
  {
    // a=floorctrl:c-s
    name: 'bfcpFloorCtrl',
    reg: /^floorctrl:(c-only|s-only|c-s)/,
    format: 'floorctrl:%s'
  }, {
    // a=confid:1
    name: 'bfcpConfId',
    reg: /^confid:(\d+)/,
    format: 'confid:%s'
  }, {
    // a=userid:1
    name: 'bfcpUserId',
    reg: /^userid:(\d+)/,
    format: 'userid:%s'
  }, {
    // a=floorid:1
    name: 'bfcpFloorId',
    reg: /^floorid:(.+) (?:m-stream|mstrm):(.+)/,
    names: ['id', 'mStream'],
    format: 'floorid:%s mstrm:%s'
  }, {
    // any a= that we don't understand is kept verbatim on media.invalid
    push: 'invalid',
    names: ['value']
  }]
}; // set sensible defaults to avoid polluting the grammar with boring details

Object.keys(grammar$1).forEach(function (key) {
  var objs = grammar$1[key];
  objs.forEach(function (obj) {
    if (!obj.reg) {
      obj.reg = /(.*)/;
    }

    if (!obj.format) {
      obj.format = '%s';
    }
  });
});

(function (exports) {
  var toIntIfInt = function (v) {
    return String(Number(v)) === v ? Number(v) : v;
  };

  var attachProperties = function (match, location, names, rawName) {
    if (rawName && !names) {
      location[rawName] = toIntIfInt(match[1]);
    } else {
      for (var i = 0; i < names.length; i += 1) {
        if (match[i + 1] != null) {
          location[names[i]] = toIntIfInt(match[i + 1]);
        }
      }
    }
  };

  var parseReg = function (obj, location, content) {
    var needsBlank = obj.name && obj.names;

    if (obj.push && !location[obj.push]) {
      location[obj.push] = [];
    } else if (needsBlank && !location[obj.name]) {
      location[obj.name] = {};
    }

    var keyLocation = obj.push ? {} : // blank object that will be pushed
    needsBlank ? location[obj.name] : location; // otherwise, named location or root

    attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name);

    if (obj.push) {
      location[obj.push].push(keyLocation);
    }
  };

  var grammar = grammar$2.exports;
  var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);

  exports.parse = function (sdp) {
    var session = {},
        media = [],
        location = session; // points at where properties go under (one of the above)
    // parse lines we understand

    sdp.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function (l) {
      var type = l[0];
      var content = l.slice(2);

      if (type === 'm') {
        media.push({
          rtp: [],
          fmtp: []
        });
        location = media[media.length - 1]; // point at latest media line
      }

      for (var j = 0; j < (grammar[type] || []).length; j += 1) {
        var obj = grammar[type][j];

        if (obj.reg.test(content)) {
          return parseReg(obj, location, content);
        }
      }
    });
    session.media = media; // link it up

    return session;
  };

  var paramReducer = function (acc, expr) {
    var s = expr.split(/=(.+)/, 2);

    if (s.length === 2) {
      acc[s[0]] = toIntIfInt(s[1]);
    } else if (s.length === 1 && expr.length > 1) {
      acc[s[0]] = undefined;
    }

    return acc;
  };

  exports.parseParams = function (str) {
    return str.split(/;\s?/).reduce(paramReducer, {});
  }; // For backward compatibility - alias will be removed in 3.0.0


  exports.parseFmtpConfig = exports.parseParams;

  exports.parsePayloads = function (str) {
    return str.toString().split(' ').map(Number);
  };

  exports.parseRemoteCandidates = function (str) {
    var candidates = [];
    var parts = str.split(' ').map(toIntIfInt);

    for (var i = 0; i < parts.length; i += 3) {
      candidates.push({
        component: parts[i],
        ip: parts[i + 1],
        port: parts[i + 2]
      });
    }

    return candidates;
  };

  exports.parseImageAttributes = function (str) {
    return str.split(' ').map(function (item) {
      return item.substring(1, item.length - 1).split(',').reduce(paramReducer, {});
    });
  };

  exports.parseSimulcastStreamList = function (str) {
    return str.split(';').map(function (stream) {
      return stream.split(',').map(function (format) {
        var scid,
            paused = false;

        if (format[0] !== '~') {
          scid = toIntIfInt(format);
        } else {
          scid = toIntIfInt(format.substring(1, format.length));
          paused = true;
        }

        return {
          scid: scid,
          paused: paused
        };
      });
    });
  };
})(parser$1);

var grammar = grammar$2.exports; // customized util.format - discards excess arguments and can void middle ones

var formatRegExp = /%[sdv%]/g;

var format = function (formatStr) {
  var i = 1;
  var args = arguments;
  var len = args.length;
  return formatStr.replace(formatRegExp, function (x) {
    if (i >= len) {
      return x; // missing argument
    }

    var arg = args[i];
    i += 1;

    switch (x) {
      case '%%':
        return '%';

      case '%s':
        return String(arg);

      case '%d':
        return Number(arg);

      case '%v':
        return '';
    }
  }); // NB: we discard excess arguments - they are typically undefined from makeLine
};

var makeLine = function (type, obj, location) {
  var str = obj.format instanceof Function ? obj.format(obj.push ? location : location[obj.name]) : obj.format;
  var args = [type + '=' + str];

  if (obj.names) {
    for (var i = 0; i < obj.names.length; i += 1) {
      var n = obj.names[i];

      if (obj.name) {
        args.push(location[obj.name][n]);
      } else {
        // for mLine and push attributes
        args.push(location[obj.names[i]]);
      }
    }
  } else {
    args.push(location[obj.name]);
  }

  return format.apply(null, args);
}; // RFC specified order
// TODO: extend this with all the rest


var defaultOuterOrder = ['v', 'o', 's', 'i', 'u', 'e', 'p', 'c', 'b', 't', 'r', 'z', 'a'];
var defaultInnerOrder = ['i', 'c', 'b', 'a'];

var writer$1 = function (session, opts) {
  opts = opts || {}; // ensure certain properties exist

  if (session.version == null) {
    session.version = 0; // 'v=0' must be there (only defined version atm)
  }

  if (session.name == null) {
    session.name = ' '; // 's= ' must be there if no meaningful name set
  }

  session.media.forEach(function (mLine) {
    if (mLine.payloads == null) {
      mLine.payloads = '';
    }
  });
  var outerOrder = opts.outerOrder || defaultOuterOrder;
  var innerOrder = opts.innerOrder || defaultInnerOrder;
  var sdp = []; // loop through outerOrder for matching properties on session

  outerOrder.forEach(function (type) {
    grammar[type].forEach(function (obj) {
      if (obj.name in session && session[obj.name] != null) {
        sdp.push(makeLine(type, obj, session));
      } else if (obj.push in session && session[obj.push] != null) {
        session[obj.push].forEach(function (el) {
          sdp.push(makeLine(type, obj, el));
        });
      }
    });
  }); // then for each media line, follow the innerOrder

  session.media.forEach(function (mLine) {
    sdp.push(makeLine('m', grammar.m[0], mLine));
    innerOrder.forEach(function (type) {
      grammar[type].forEach(function (obj) {
        if (obj.name in mLine && mLine[obj.name] != null) {
          sdp.push(makeLine(type, obj, mLine));
        } else if (obj.push in mLine && mLine[obj.push] != null) {
          mLine[obj.push].forEach(function (el) {
            sdp.push(makeLine(type, obj, el));
          });
        }
      });
    });
  });
  return sdp.join('\r\n') + '\r\n';
};

var parser = parser$1;
var writer = writer$1;
var write = writer;
var parse = parser.parse;
parser.parseParams;
parser.parseFmtpConfig; // Alias of parseParams().

parser.parsePayloads;
parser.parseRemoteCandidates;
parser.parseImageAttributes;
parser.parseSimulcastStreamList;

/** @internal */

class PCTransport {
  constructor(config) {
    this.pendingCandidates = [];
    this.restartingIce = false;
    this.renegotiate = false;
    this.trackBitrates = []; // debounced negotiate interface

    this.negotiate = r(onError => {
      try {
        this.createAndSendOffer();
      } catch (e) {
        if (onError) {
          onError(e);
        } else {
          throw e;
        }
      }
    }, 100);
    this.pc = new RTCPeerConnection(config);
  }

  get isICEConnected() {
    return this.pc.iceConnectionState === 'connected' || this.pc.iceConnectionState === 'completed';
  }

  async addIceCandidate(candidate) {
    if (this.pc.remoteDescription && !this.restartingIce) {
      return this.pc.addIceCandidate(candidate);
    }

    this.pendingCandidates.push(candidate);
  }

  async setRemoteDescription(sd) {
    await this.pc.setRemoteDescription(sd);
    this.pendingCandidates.forEach(candidate => {
      this.pc.addIceCandidate(candidate);
    });
    this.pendingCandidates = [];
    this.restartingIce = false;

    if (this.renegotiate) {
      this.renegotiate = false;
      this.createAndSendOffer();
    }
  }

  async createAndSendOffer(options) {
    var _a;

    if (this.onOffer === undefined) {
      return;
    }

    if (options === null || options === void 0 ? void 0 : options.iceRestart) {
      livekitLogger.debug('restarting ICE');
      this.restartingIce = true;
    }

    if (this.pc.signalingState === 'have-local-offer') {
      // we're waiting for the peer to accept our offer, so we'll just wait
      // the only exception to this is when ICE restart is needed
      const currentSD = this.pc.remoteDescription;

      if ((options === null || options === void 0 ? void 0 : options.iceRestart) && currentSD) {
        // TODO: handle when ICE restart is needed but we don't have a remote description
        // the best thing to do is to recreate the peerconnection
        await this.pc.setRemoteDescription(currentSD);
      } else {
        this.renegotiate = true;
        return;
      }
    } else if (this.pc.signalingState === 'closed') {
      livekitLogger.warn('could not createOffer with closed peer connection');
      return;
    } // actually negotiate


    livekitLogger.debug('starting to negotiate');
    const offer = await this.pc.createOffer(options);
    const sdpParsed = parse((_a = offer.sdp) !== null && _a !== void 0 ? _a : '');
    sdpParsed.media.forEach(media => {
      if (media.type === 'audio') {
        ensureAudioNack(media);
      } else if (media.type === 'video') {
        // mung sdp for codec bitrate setting that can't apply by sendEncoding
        this.trackBitrates.some(trackbr => {
          if (!media.msid || !media.msid.includes(trackbr.sid)) {
            return false;
          }

          let codecPayload = 0;
          media.rtp.some(rtp => {
            if (rtp.codec.toUpperCase() === trackbr.codec.toUpperCase()) {
              codecPayload = rtp.payload;
              return true;
            }

            return false;
          }); // add x-google-max-bitrate to fmtp line if not exist

          if (codecPayload > 0) {
            if (!media.fmtp.some(fmtp => {
              if (fmtp.payload === codecPayload) {
                if (!fmtp.config.includes('x-google-max-bitrate')) {
                  fmtp.config += ";x-google-max-bitrate=".concat(trackbr.maxbr);
                }

                return true;
              }

              return false;
            })) {
              media.fmtp.push({
                payload: codecPayload,
                config: "x-google-max-bitrate=".concat(trackbr.maxbr)
              });
            }
          }

          return true;
        });
      }
    });
    this.trackBitrates = [];
    await this.setMungedLocalDescription(offer, write(sdpParsed));
    this.onOffer(offer);
  }

  async createAndSetAnswer() {
    var _a;

    const answer = await this.pc.createAnswer();
    const sdpParsed = parse((_a = answer.sdp) !== null && _a !== void 0 ? _a : '');
    sdpParsed.media.forEach(media => {
      if (media.type === 'audio') {
        ensureAudioNack(media);
      }
    });
    await this.setMungedLocalDescription(answer, write(sdpParsed));
    return answer;
  }

  setTrackCodecBitrate(sid, codec, maxbr) {
    this.trackBitrates.push({
      sid,
      codec,
      maxbr
    });
  }

  close() {
    this.pc.close();
  }

  async setMungedLocalDescription(sd, munged) {
    const originalSdp = sd.sdp;
    sd.sdp = munged;

    try {
      livekitLogger.debug('setting munged local description');
      await this.pc.setLocalDescription(sd);
      return;
    } catch (e) {
      livekitLogger.warn("not able to set ".concat(sd.type, ", falling back to unmodified sdp"), {
        error: e
      });
      sd.sdp = originalSdp;
    }

    try {
      await this.pc.setLocalDescription(sd);
    } catch (e) {
      // this error cannot always be caught.
      // If the local description has a setCodecPreferences error, this error will be uncaught
      let msg = 'unknown error';

      if (e instanceof Error) {
        msg = e.message;
      } else if (typeof e === 'string') {
        msg = e;
      }

      throw new NegotiationError(msg);
    }
  }

}

function ensureAudioNack(media) {
  // found opus codec to add nack fb
  let opusPayload = 0;
  media.rtp.some(rtp => {
    if (rtp.codec === 'opus') {
      opusPayload = rtp.payload;
      return true;
    }

    return false;
  }); // add nack rtcpfb if not exist

  if (opusPayload > 0) {
    if (!media.rtcpFb) {
      media.rtcpFb = [];
    }

    if (!media.rtcpFb.some(fb => fb.payload === opusPayload && fb.type === 'nack')) {
      media.rtcpFb.push({
        payload: opusPayload,
        type: 'nack'
      });
    }
  }
}

const lossyDataChannel = '_lossy';
const reliableDataChannel = '_reliable';
const minReconnectWait = 2 * 1000;
const leaveReconnect = 'leave-reconnect';
const maxICEConnectTimeout = 15 * 1000;
var PCState;

(function (PCState) {
  PCState[PCState["New"] = 0] = "New";
  PCState[PCState["Connected"] = 1] = "Connected";
  PCState[PCState["Disconnected"] = 2] = "Disconnected";
  PCState[PCState["Reconnecting"] = 3] = "Reconnecting";
  PCState[PCState["Closed"] = 4] = "Closed";
})(PCState || (PCState = {}));
/** @internal */


class RTCEngine extends events.exports.EventEmitter {
  constructor(options) {
    var _this;

    super();
    _this = this;
    this.options = options;
    this.rtcConfig = {};
    this.subscriberPrimary = false;
    this.pcState = PCState.New;
    this._isClosed = true;
    this.pendingTrackResolvers = {}; // true if publisher connection has already been established.
    // this is helpful to know if we need to restart ICE on the publisher connection

    this.hasPublished = false;
    this.reconnectAttempts = 0;
    this.reconnectStart = 0;
    this.fullReconnectOnNext = false;
    this.attemptingReconnect = false;

    this.handleDataChannel = async _ref => {
      let {
        channel
      } = _ref;

      if (!channel) {
        return;
      }

      if (channel.label === reliableDataChannel) {
        this.reliableDCSub = channel;
      } else if (channel.label === lossyDataChannel) {
        this.lossyDCSub = channel;
      } else {
        return;
      }

      livekitLogger.debug("on data channel ".concat(channel.id, ", ").concat(channel.label));
      channel.onmessage = this.handleDataMessage;
    };

    this.handleDataMessage = async message => {
      var _a, _b; // decode


      let buffer;

      if (message.data instanceof ArrayBuffer) {
        buffer = message.data;
      } else if (message.data instanceof Blob) {
        buffer = await message.data.arrayBuffer();
      } else {
        livekitLogger.error('unsupported data type', message.data);
        return;
      }

      const dp = DataPacket.decode(new Uint8Array(buffer));

      if (((_a = dp.value) === null || _a === void 0 ? void 0 : _a.$case) === 'speaker') {
        // dispatch speaker updates
        this.emit(EngineEvent.ActiveSpeakersUpdate, dp.value.speaker.speakers);
      } else if (((_b = dp.value) === null || _b === void 0 ? void 0 : _b.$case) === 'user') {
        this.emit(EngineEvent.DataPacketReceived, dp.value.user, dp.kind);
      }
    };

    this.handleDataError = event => {
      const channel = event.currentTarget;
      const channelKind = channel.maxRetransmits === 0 ? 'lossy' : 'reliable';

      if (event instanceof ErrorEvent) {
        const {
          error
        } = event.error;
        livekitLogger.error("DataChannel error on ".concat(channelKind, ": ").concat(event.message), error);
      } else {
        livekitLogger.error("Unknown DataChannel Error on ".concat(channelKind), event);
      }
    }; // websocket reconnect behavior. if websocket is interrupted, and the PeerConnection
    // continues to work, we can reconnect to websocket to continue the session
    // after a number of retries, we'll close and give up permanently


    this.handleDisconnect = function (connection) {
      let signalEvents = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (_this._isClosed) {
        return;
      }

      livekitLogger.debug("".concat(connection, " disconnected"));

      if (_this.reconnectAttempts === 0) {
        // only reset start time on the first try
        _this.reconnectStart = Date.now();
      }

      const disconnect = duration => {
        livekitLogger.info("could not recover connection after ".concat(_this.reconnectAttempts, " attempts, ").concat(duration, "ms. giving up"));

        _this.emit(EngineEvent.Disconnected);

        _this.close();
      };

      const duration = Date.now() - _this.reconnectStart;

      let delay = _this.getNextRetryDelay({
        elapsedMs: duration,
        retryCount: _this.reconnectAttempts
      });

      if (delay === null) {
        disconnect(duration);
        return;
      }

      if (connection === leaveReconnect) {
        delay = 0;
      }

      livekitLogger.debug("reconnecting in ".concat(delay, "ms"));

      if (_this.reconnectTimeout) {
        clearTimeout(_this.reconnectTimeout);
      }

      _this.reconnectTimeout = setTimeout(async () => {
        var _a, _b, _c;

        if (_this._isClosed) {
          return;
        } // guard for attempting reconnection multiple times while one attempt is still not finished


        if (_this.attemptingReconnect) {
          return;
        }

        if (((_a = _this.clientConfiguration) === null || _a === void 0 ? void 0 : _a.resumeConnection) === ClientConfigSetting.DISABLED || // signaling state could change to closed due to hardware sleep
        // those connections cannot be resumed
        ((_c = (_b = _this.primaryPC) === null || _b === void 0 ? void 0 : _b.signalingState) !== null && _c !== void 0 ? _c : 'closed') === 'closed') {
          _this.fullReconnectOnNext = true;
        }

        try {
          _this.attemptingReconnect = true;

          if (_this.fullReconnectOnNext) {
            await _this.restartConnection(signalEvents);
          } else {
            await _this.resumeConnection(signalEvents);
          }

          _this.reconnectAttempts = 0;
          _this.fullReconnectOnNext = false;

          if (_this.reconnectTimeout) {
            clearTimeout(_this.reconnectTimeout);
          }
        } catch (e) {
          _this.reconnectAttempts += 1;
          let reconnectRequired = false;
          let recoverable = true;
          let requireSignalEvents = false;

          if (e instanceof UnexpectedConnectionState) {
            livekitLogger.debug('received unrecoverable error', {
              error: e
            }); // unrecoverable

            recoverable = false;
          } else if (!(e instanceof SignalReconnectError)) {
            // cannot resume
            reconnectRequired = true;
          } // when we flip from resume to reconnect
          // we need to fire the right reconnecting events


          if (reconnectRequired && !_this.fullReconnectOnNext) {
            _this.fullReconnectOnNext = true;
            requireSignalEvents = true;
          }

          if (recoverable) {
            _this.handleDisconnect('reconnect', requireSignalEvents);
          } else {
            disconnect(Date.now() - _this.reconnectStart);
          }
        } finally {
          _this.attemptingReconnect = false;
        }
      }, delay);
    };

    this.client = new SignalClient();
    this.client.signalLatency = this.options.expSignalLatency;
    this.reconnectPolicy = this.options.reconnectPolicy;
  }

  get isClosed() {
    return this._isClosed;
  }

  async join(url, token, opts, abortSignal) {
    this.url = url;
    this.token = token;
    this.signalOpts = opts;
    const joinResponse = await this.client.join(url, token, opts, abortSignal);
    this._isClosed = false;
    this.subscriberPrimary = joinResponse.subscriberPrimary;

    if (!this.publisher) {
      this.configure(joinResponse);
    } // create offer


    if (!this.subscriberPrimary) {
      this.negotiate();
    }

    this.clientConfiguration = joinResponse.clientConfiguration;
    return joinResponse;
  }

  close() {
    this._isClosed = true;
    this.removeAllListeners();

    if (this.publisher && this.publisher.pc.signalingState !== 'closed') {
      this.publisher.pc.getSenders().forEach(sender => {
        var _a, _b;

        try {
          // TODO: react-native-webrtc doesn't have removeTrack yet.
          if ((_a = this.publisher) === null || _a === void 0 ? void 0 : _a.pc.removeTrack) {
            (_b = this.publisher) === null || _b === void 0 ? void 0 : _b.pc.removeTrack(sender);
          }
        } catch (e) {
          livekitLogger.warn('could not removeTrack', {
            error: e
          });
        }
      });
      this.publisher.close();
      this.publisher = undefined;
    }

    if (this.subscriber) {
      this.subscriber.close();
      this.subscriber = undefined;
    }

    this.client.close();
  }

  addTrack(req) {
    if (this.pendingTrackResolvers[req.cid]) {
      throw new TrackInvalidError('a track with the same ID has already been published');
    }

    return new Promise((resolve, reject) => {
      const publicationTimeout = setTimeout(() => {
        delete this.pendingTrackResolvers[req.cid];
        reject(new ConnectionError('publication of local track timed out, no response from server'));
      }, 10000);
      this.pendingTrackResolvers[req.cid] = {
        resolve: info => {
          clearTimeout(publicationTimeout);
          resolve(info);
        },
        reject: () => {
          clearTimeout(publicationTimeout);
          reject(new Error('Cancelled publication by calling unpublish'));
        }
      };
      this.client.sendAddTrack(req);
    });
  }

  removeTrack(sender) {
    var _a;

    if (sender.track && this.pendingTrackResolvers[sender.track.id]) {
      const {
        reject
      } = this.pendingTrackResolvers[sender.track.id];

      if (reject) {
        reject();
      }

      delete this.pendingTrackResolvers[sender.track.id];
    }

    try {
      (_a = this.publisher) === null || _a === void 0 ? void 0 : _a.pc.removeTrack(sender);
    } catch (e) {
      livekitLogger.warn('failed to remove track', {
        error: e,
        method: 'removeTrack'
      });
    }
  }

  updateMuteStatus(trackSid, muted) {
    this.client.sendMuteTrack(trackSid, muted);
  }

  get dataSubscriberReadyState() {
    var _a;

    return (_a = this.reliableDCSub) === null || _a === void 0 ? void 0 : _a.readyState;
  }

  get connectedServerAddress() {
    return this.connectedServerAddr;
  }

  configure(joinResponse) {
    var _a; // already configured


    if (this.publisher || this.subscriber) {
      return;
    }

    this.participantSid = (_a = joinResponse.participant) === null || _a === void 0 ? void 0 : _a.sid; // update ICE servers before creating PeerConnection

    if (joinResponse.iceServers && !this.rtcConfig.iceServers) {
      const rtcIceServers = [];
      joinResponse.iceServers.forEach(iceServer => {
        const rtcIceServer = {
          urls: iceServer.urls
        };
        if (iceServer.username) rtcIceServer.username = iceServer.username;

        if (iceServer.credential) {
          rtcIceServer.credential = iceServer.credential;
        }

        rtcIceServers.push(rtcIceServer);
      });
      this.rtcConfig.iceServers = rtcIceServers;
    }

    if (joinResponse.clientConfiguration && joinResponse.clientConfiguration.forceRelay === ClientConfigSetting.ENABLED) {
      this.rtcConfig.iceTransportPolicy = 'relay';
    } // @ts-ignore


    this.rtcConfig.sdpSemantics = 'unified-plan'; // @ts-ignore

    this.rtcConfig.continualGatheringPolicy = 'gather_continually';
    this.publisher = new PCTransport(this.rtcConfig);
    this.subscriber = new PCTransport(this.rtcConfig);
    this.emit(EngineEvent.TransportsCreated, this.publisher, this.subscriber);

    this.publisher.pc.onicecandidate = ev => {
      if (!ev.candidate) return;
      livekitLogger.trace('adding ICE candidate for peer', ev.candidate);
      this.client.sendIceCandidate(ev.candidate, SignalTarget.PUBLISHER);
    };

    this.subscriber.pc.onicecandidate = ev => {
      if (!ev.candidate) return;
      this.client.sendIceCandidate(ev.candidate, SignalTarget.SUBSCRIBER);
    };

    this.publisher.onOffer = offer => {
      this.client.sendOffer(offer);
    };

    let primaryPC = this.publisher.pc;
    let secondaryPC = this.subscriber.pc;

    if (joinResponse.subscriberPrimary) {
      primaryPC = this.subscriber.pc;
      secondaryPC = this.publisher.pc; // in subscriber primary mode, server side opens sub data channels.

      this.subscriber.pc.ondatachannel = this.handleDataChannel;
    }

    this.primaryPC = primaryPC;

    primaryPC.onconnectionstatechange = async () => {
      livekitLogger.debug('primary PC state changed', {
        state: primaryPC.connectionState
      });

      if (primaryPC.connectionState === 'connected') {
        try {
          this.connectedServerAddr = await getConnectedAddress(primaryPC);
        } catch (e) {
          livekitLogger.warn('could not get connected server address', {
            error: e
          });
        }

        const shouldEmit = this.pcState === PCState.New;
        this.pcState = PCState.Connected;

        if (shouldEmit) {
          this.emit(EngineEvent.Connected);
        }
      } else if (primaryPC.connectionState === 'failed') {
        // on Safari, PeerConnection will switch to 'disconnected' during renegotiation
        if (this.pcState === PCState.Connected) {
          this.pcState = PCState.Disconnected;
          this.handleDisconnect('primary peerconnection');
        }
      }
    };

    secondaryPC.onconnectionstatechange = async () => {
      livekitLogger.debug('secondary PC state changed', {
        state: secondaryPC.connectionState
      }); // also reconnect if secondary peerconnection fails

      if (secondaryPC.connectionState === 'failed') {
        this.handleDisconnect('secondary peerconnection');
      }
    };

    if (isWeb()) {
      this.subscriber.pc.ontrack = ev => {
        this.emit(EngineEvent.MediaTrackAdded, ev.track, ev.streams[0], ev.receiver);
      };
    } else {
      // TODO: react-native-webrtc doesn't have ontrack yet, replace when ready.
      // @ts-ignore
      this.subscriber.pc.onaddstream = ev => {
        const track = ev.stream.getTracks()[0];
        this.emit(EngineEvent.MediaTrackAdded, track, ev.stream);
      };
    }

    this.createDataChannels(); // configure signaling client

    this.client.onAnswer = async sd => {
      if (!this.publisher) {
        return;
      }

      livekitLogger.debug('received server answer', {
        RTCSdpType: sd.type,
        signalingState: this.publisher.pc.signalingState
      });
      await this.publisher.setRemoteDescription(sd);
    }; // add candidate on trickle


    this.client.onTrickle = (candidate, target) => {
      if (!this.publisher || !this.subscriber) {
        return;
      }

      livekitLogger.trace('got ICE candidate from peer', {
        candidate,
        target
      });

      if (target === SignalTarget.PUBLISHER) {
        this.publisher.addIceCandidate(candidate);
      } else {
        this.subscriber.addIceCandidate(candidate);
      }
    }; // when server creates an offer for the client


    this.client.onOffer = async sd => {
      if (!this.subscriber) {
        return;
      }

      livekitLogger.debug('received server offer', {
        RTCSdpType: sd.type,
        signalingState: this.subscriber.pc.signalingState
      });
      await this.subscriber.setRemoteDescription(sd); // answer the offer

      const answer = await this.subscriber.createAndSetAnswer();
      this.client.sendAnswer(answer);
    };

    this.client.onLocalTrackPublished = res => {
      livekitLogger.debug('received trackPublishedResponse', res);
      const {
        resolve
      } = this.pendingTrackResolvers[res.cid];

      if (!resolve) {
        livekitLogger.error("missing track resolver for ".concat(res.cid));
        return;
      }

      delete this.pendingTrackResolvers[res.cid];
      resolve(res.track);
    };

    this.client.onTokenRefresh = token => {
      this.token = token;
    };

    this.client.onClose = () => {
      this.handleDisconnect('signal');
    };

    this.client.onLeave = leave => {
      if (leave === null || leave === void 0 ? void 0 : leave.canReconnect) {
        this.fullReconnectOnNext = true;
        this.primaryPC = undefined; // reconnect immediately instead of waiting for next attempt

        this.handleDisconnect(leaveReconnect);
      } else {
        this.emit(EngineEvent.Disconnected, leave === null || leave === void 0 ? void 0 : leave.reason);
        this.close();
      }

      livekitLogger.trace('leave request', {
        leave
      });
    };
  }

  createDataChannels() {
    if (!this.publisher) {
      return;
    } // clear old data channel callbacks if recreate


    if (this.lossyDC) {
      this.lossyDC.onmessage = null;
      this.lossyDC.onerror = null;
    }

    if (this.reliableDC) {
      this.reliableDC.onmessage = null;
      this.reliableDC.onerror = null;
    } // create data channels


    this.lossyDC = this.publisher.pc.createDataChannel(lossyDataChannel, {
      // will drop older packets that arrive
      ordered: true,
      maxRetransmits: 0
    });
    this.reliableDC = this.publisher.pc.createDataChannel(reliableDataChannel, {
      ordered: true
    }); // also handle messages over the pub channel, for backwards compatibility

    this.lossyDC.onmessage = this.handleDataMessage;
    this.reliableDC.onmessage = this.handleDataMessage; // handle datachannel errors

    this.lossyDC.onerror = this.handleDataError;
    this.reliableDC.onerror = this.handleDataError;
  }

  setPreferredCodec(transceiver, kind, videoCodec) {
    if (!('getCapabilities' in RTCRtpSender)) {
      return;
    }

    const cap = RTCRtpSender.getCapabilities(kind);
    if (!cap) return;
    livekitLogger.debug('get capabilities', cap);
    const matched = [];
    const partialMatched = [];
    const unmatched = [];
    cap.codecs.forEach(c => {
      const codec = c.mimeType.toLowerCase();

      if (codec === 'audio/opus') {
        matched.push(c);
        return;
      }

      const matchesVideoCodec = codec === "video/".concat(videoCodec);

      if (!matchesVideoCodec) {
        unmatched.push(c);
        return;
      } // for h264 codecs that have sdpFmtpLine available, use only if the
      // profile-level-id is 42e01f for cross-browser compatibility


      if (videoCodec === 'h264') {
        if (c.sdpFmtpLine && c.sdpFmtpLine.includes('profile-level-id=42e01f')) {
          matched.push(c);
        } else {
          partialMatched.push(c);
        }

        return;
      }

      matched.push(c);
    });

    if (supportsSetCodecPreferences(transceiver)) {
      transceiver.setCodecPreferences(matched.concat(partialMatched, unmatched));
    }
  }

  async createSender(track, opts, encodings) {
    if (supportsTransceiver()) {
      return this.createTransceiverRTCRtpSender(track, opts, encodings);
    }

    if (supportsAddTrack()) {
      livekitLogger.debug('using add-track fallback');
      return this.createRTCRtpSender(track.mediaStreamTrack);
    }

    throw new UnexpectedConnectionState('Required webRTC APIs not supported on this device');
  }

  async createSimulcastSender(track, simulcastTrack, opts, encodings) {
    // store RTCRtpSender
    // @ts-ignore
    if (supportsTransceiver()) {
      return this.createSimulcastTransceiverSender(track, simulcastTrack, opts, encodings);
    }

    if (supportsAddTrack()) {
      livekitLogger.debug('using add-track fallback');
      return this.createRTCRtpSender(track.mediaStreamTrack);
    }

    throw new UnexpectedConnectionState('Cannot stream on this device');
  }

  async createTransceiverRTCRtpSender(track, opts, encodings) {
    if (!this.publisher) {
      throw new UnexpectedConnectionState('publisher is closed');
    }

    const transceiverInit = {
      direction: 'sendonly'
    };

    if (encodings) {
      transceiverInit.sendEncodings = encodings;
    } // addTransceiver for react-native is async. web is synchronous, but await won't effect it.


    const transceiver = await this.publisher.pc.addTransceiver(track.mediaStreamTrack, transceiverInit);

    if (track.kind === Track.Kind.Video && opts.videoCodec) {
      this.setPreferredCodec(transceiver, track.kind, opts.videoCodec);
      track.codec = opts.videoCodec;
    }

    return transceiver.sender;
  }

  async createSimulcastTransceiverSender(track, simulcastTrack, opts, encodings) {
    if (!this.publisher) {
      throw new UnexpectedConnectionState('publisher is closed');
    }

    const transceiverInit = {
      direction: 'sendonly'
    };

    if (encodings) {
      transceiverInit.sendEncodings = encodings;
    } // addTransceiver for react-native is async. web is synchronous, but await won't effect it.


    const transceiver = await this.publisher.pc.addTransceiver(simulcastTrack.mediaStreamTrack, transceiverInit);

    if (!opts.videoCodec) {
      return;
    }

    this.setPreferredCodec(transceiver, track.kind, opts.videoCodec);
    track.setSimulcastTrackSender(opts.videoCodec, transceiver.sender);
    return transceiver.sender;
  }

  async createRTCRtpSender(track) {
    if (!this.publisher) {
      throw new UnexpectedConnectionState('publisher is closed');
    }

    return this.publisher.pc.addTrack(track);
  }

  getNextRetryDelay(context) {
    try {
      return this.reconnectPolicy.nextRetryDelayInMs(context);
    } catch (e) {
      livekitLogger.warn('encountered error in reconnect policy', {
        error: e
      });
    } // error in user code with provided reconnect policy, stop reconnecting


    return null;
  }

  async restartConnection() {
    let emitRestarting = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    var _a, _b;

    if (!this.url || !this.token) {
      // permanent failure, don't attempt reconnection
      throw new UnexpectedConnectionState('could not reconnect, url or token not saved');
    }

    livekitLogger.info("reconnecting, attempt: ".concat(this.reconnectAttempts));

    if (emitRestarting || this.reconnectAttempts === 0) {
      this.emit(EngineEvent.Restarting);
    }

    if (this.client.isConnected) {
      this.client.sendLeave();
    }

    this.client.close();
    this.primaryPC = undefined;
    (_a = this.publisher) === null || _a === void 0 ? void 0 : _a.close();
    this.publisher = undefined;
    (_b = this.subscriber) === null || _b === void 0 ? void 0 : _b.close();
    this.subscriber = undefined;
    let joinResponse;

    try {
      if (!this.signalOpts) {
        livekitLogger.warn('attempted connection restart, without signal options present');
        throw new SignalReconnectError();
      }

      joinResponse = await this.join(this.url, this.token, this.signalOpts);
    } catch (e) {
      throw new SignalReconnectError();
    }

    await this.waitForPCConnected();
    this.client.setReconnected(); // reconnect success

    this.emit(EngineEvent.Restarted, joinResponse);
  }

  async resumeConnection() {
    let emitResuming = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    var _a;

    if (!this.url || !this.token) {
      // permanent failure, don't attempt reconnection
      throw new UnexpectedConnectionState('could not reconnect, url or token not saved');
    } // trigger publisher reconnect


    if (!this.publisher || !this.subscriber) {
      throw new UnexpectedConnectionState('publisher and subscriber connections unset');
    }

    livekitLogger.info("resuming signal connection, attempt ".concat(this.reconnectAttempts));

    if (emitResuming || this.reconnectAttempts === 0) {
      this.emit(EngineEvent.Resuming);
    }

    try {
      await this.client.reconnect(this.url, this.token, this.participantSid);
    } catch (e) {
      let message = '';

      if (e instanceof Error) {
        message = e.message;
      }

      throw new SignalReconnectError(message);
    }

    this.emit(EngineEvent.SignalResumed);
    this.subscriber.restartingIce = true; // only restart publisher if it's needed

    if (this.hasPublished) {
      await this.publisher.createAndSendOffer({
        iceRestart: true
      });
    }

    await this.waitForPCConnected();
    this.client.setReconnected(); // recreate publish datachannel if it's id is null
    // (for safari https://bugs.webkit.org/show_bug.cgi?id=184688)

    if (((_a = this.reliableDC) === null || _a === void 0 ? void 0 : _a.readyState) === 'open' && this.reliableDC.id === null) {
      this.createDataChannels();
    } // resume success


    this.emit(EngineEvent.Resumed);
  }

  async waitForPCConnected() {
    var _a;

    const startTime = Date.now();
    let now = startTime;
    this.pcState = PCState.Reconnecting;
    livekitLogger.debug('waiting for peer connection to reconnect');

    while (now - startTime < maxICEConnectTimeout) {
      if (this.primaryPC === undefined) {
        // we can abort early, connection is hosed
        break;
      } else if ( // on Safari, we don't get a connectionstatechanged event during ICE restart
      // this means we'd have to check its status manually and update address
      // manually
      now - startTime > minReconnectWait && ((_a = this.primaryPC) === null || _a === void 0 ? void 0 : _a.connectionState) === 'connected') {
        this.pcState = PCState.Connected;

        try {
          this.connectedServerAddr = await getConnectedAddress(this.primaryPC);
        } catch (e) {
          livekitLogger.warn('could not get connected server address', {
            error: e
          });
        }
      }

      if (this.pcState === PCState.Connected) {
        return;
      }

      await sleep(100);
      now = Date.now();
    } // have not reconnected, throw


    throw new ConnectionError('could not establish PC connection');
  }
  /* @internal */


  async sendDataPacket(packet, kind) {
    const msg = DataPacket.encode(packet).finish(); // make sure we do have a data connection

    await this.ensurePublisherConnected(kind);

    if (kind === DataPacket_Kind.LOSSY && this.lossyDC) {
      this.lossyDC.send(msg);
    } else if (kind === DataPacket_Kind.RELIABLE && this.reliableDC) {
      this.reliableDC.send(msg);
    }
  }

  async ensurePublisherConnected(kind) {
    var _a, _b;

    if (!this.subscriberPrimary) {
      return;
    }

    if (!this.publisher) {
      throw new ConnectionError('publisher connection not set');
    }

    if (!this.publisher.isICEConnected && this.publisher.pc.iceConnectionState !== 'checking') {
      // start negotiation
      this.negotiate();
    }

    const targetChannel = this.dataChannelForKind(kind);

    if ((targetChannel === null || targetChannel === void 0 ? void 0 : targetChannel.readyState) === 'open') {
      return;
    } // wait until publisher ICE connected


    const endTime = new Date().getTime() + maxICEConnectTimeout;

    while (new Date().getTime() < endTime) {
      if (this.publisher.isICEConnected && ((_a = this.dataChannelForKind(kind)) === null || _a === void 0 ? void 0 : _a.readyState) === 'open') {
        return;
      }

      await sleep(50);
    }

    throw new ConnectionError("could not establish publisher connection, state ".concat((_b = this.publisher) === null || _b === void 0 ? void 0 : _b.pc.iceConnectionState));
  }
  /** @internal */


  negotiate() {
    if (!this.publisher) {
      return;
    }

    this.hasPublished = true;
    this.publisher.negotiate(e => {
      if (e instanceof NegotiationError) {
        this.fullReconnectOnNext = true;
      }

      this.handleDisconnect('negotiation');
    });
  }

  dataChannelForKind(kind, sub) {
    if (!sub) {
      if (kind === DataPacket_Kind.LOSSY) {
        return this.lossyDC;
      }

      if (kind === DataPacket_Kind.RELIABLE) {
        return this.reliableDC;
      }
    } else {
      if (kind === DataPacket_Kind.LOSSY) {
        return this.lossyDCSub;
      }

      if (kind === DataPacket_Kind.RELIABLE) {
        return this.reliableDCSub;
      }
    }
  }

}

async function getConnectedAddress(pc) {
  var _a;

  let selectedCandidatePairId = '';
  const candidatePairs = new Map(); // id -> candidate ip

  const candidates = new Map();
  const stats = await pc.getStats();
  stats.forEach(v => {
    switch (v.type) {
      case 'transport':
        selectedCandidatePairId = v.selectedCandidatePairId;
        break;

      case 'candidate-pair':
        if (selectedCandidatePairId === '' && v.selected) {
          selectedCandidatePairId = v.id;
        }

        candidatePairs.set(v.id, v);
        break;

      case 'remote-candidate':
        candidates.set(v.id, "".concat(v.address, ":").concat(v.port));
        break;
    }
  });

  if (selectedCandidatePairId === '') {
    return undefined;
  }

  const selectedID = (_a = candidatePairs.get(selectedCandidatePairId)) === null || _a === void 0 ? void 0 : _a.remoteCandidateId;

  if (selectedID === undefined) {
    return undefined;
  }

  return candidates.get(selectedID);
}

class SignalReconnectError extends Error {}

var ConnectionState;

(function (ConnectionState) {
  ConnectionState["Disconnected"] = "disconnected";
  ConnectionState["Connecting"] = "connecting";
  ConnectionState["Connected"] = "connected";
  ConnectionState["Reconnecting"] = "reconnecting";
})(ConnectionState || (ConnectionState = {}));
/**
 * In LiveKit, a room is the logical grouping for a list of participants.
 * Participants in a room can publish tracks, and subscribe to others' tracks.
 *
 * a Room fires [[RoomEvent | RoomEvents]].
 *
 * @noInheritDoc
 */

class Room extends events.exports.EventEmitter {
  /**
   * Creates a new Room, the primary construct for a LiveKit session.
   * @param options
   */
  constructor(options) {
    var _this;

    super();
    _this = this;
    this.state = ConnectionState.Disconnected;
    /**
     * list of participants that are actively speaking. when this changes
     * a [[RoomEvent.ActiveSpeakersChanged]] event is fired
     */

    this.activeSpeakers = []; // available after connected

    /** server assigned unique room id */

    this.sid = '';
    /** user assigned name, derived from JWT token */

    this.name = '';
    /** room metadata */

    this.metadata = undefined;
    this.audioEnabled = true;

    this.connect = (url, token, opts) => {
      if (this.state === ConnectionState.Connected) {
        // when the state is reconnecting or connected, this function returns immediately
        livekitLogger.warn("already connected to room ".concat(this.name));
        return Promise.resolve();
      }

      if (this.connectFuture) {
        return this.connectFuture.promise;
      }

      if (this.reconnectFuture) {
        this.connectFuture = this.reconnectFuture;
        return this.connectFuture.promise;
      }

      const connectFn = async (resolve, reject) => {
        var _a, _b;

        this.setAndEmitConnectionState(ConnectionState.Connecting);

        if (!this.abortController || this.abortController.signal.aborted) {
          this.abortController = new AbortController();
        } // recreate engine if previously disconnected


        this.createEngine();
        this.acquireAudioContext();
        this.connOptions = _objectSpread2(_objectSpread2({}, roomConnectOptionDefaults), opts);

        if (this.connOptions.rtcConfig) {
          this.engine.rtcConfig = this.connOptions.rtcConfig;
        }

        try {
          const joinResponse = await this.engine.join(url, token, {
            autoSubscribe: this.connOptions.autoSubscribe,
            publishOnly: this.connOptions.publishOnly,
            adaptiveStream: typeof this.options.adaptiveStream === 'object' ? true : this.options.adaptiveStream
          }, this.abortController.signal);
          let serverInfo = joinResponse.serverInfo;

          if (!serverInfo) {
            serverInfo = {
              version: joinResponse.serverVersion,
              region: joinResponse.serverRegion
            };
          }

          livekitLogger.debug("connected to Livekit Server ".concat(Object.entries(serverInfo).map(_ref => {
            let [key, value] = _ref;
            return "".concat(key, ": ").concat(value);
          }).join(', ')));

          if (!joinResponse.serverVersion) {
            throw new UnsupportedServer('unknown server version');
          }

          if (joinResponse.serverVersion === '0.15.1' && this.options.dynacast) {
            livekitLogger.debug('disabling dynacast due to server version'); // dynacast has a bug in 0.15.1, so we cannot use it then

            this.options.dynacast = false;
          }

          const pi = joinResponse.participant;
          this.localParticipant.sid = pi.sid;
          this.localParticipant.identity = pi.identity;
          this.localParticipant.updateInfo(pi); // forward metadata changed for the local participant

          this.localParticipant.on(ParticipantEvent.ParticipantMetadataChanged, this.onLocalParticipantMetadataChanged).on(ParticipantEvent.TrackMuted, this.onLocalTrackMuted).on(ParticipantEvent.TrackUnmuted, this.onLocalTrackUnmuted).on(ParticipantEvent.LocalTrackPublished, this.onLocalTrackPublished).on(ParticipantEvent.LocalTrackUnpublished, this.onLocalTrackUnpublished).on(ParticipantEvent.ConnectionQualityChanged, this.onLocalConnectionQualityChanged).on(ParticipantEvent.MediaDevicesError, this.onMediaDevicesError).on(ParticipantEvent.ParticipantPermissionsChanged, this.onLocalParticipantPermissionsChanged); // populate remote participants, these should not trigger new events

          joinResponse.otherParticipants.forEach(info => {
            if (info.sid !== this.localParticipant.sid && info.identity !== this.localParticipant.identity) {
              this.getOrCreateParticipant(info.sid, info);
            } else {
              livekitLogger.warn('received info to create local participant as remote participant', {
                info,
                localParticipant: this.localParticipant
              });
            }
          });
          this.name = joinResponse.room.name;
          this.sid = joinResponse.room.sid;
          this.metadata = joinResponse.room.metadata;
          this.emit(RoomEvent.SignalConnected);
        } catch (err) {
          this.recreateEngine();
          this.handleDisconnect(this.options.stopLocalTrackOnUnpublish);
          reject(new ConnectionError('could not establish signal connection'));
          return;
        } // don't return until ICE connected


        const connectTimeout = setTimeout(() => {
          // timeout
          this.recreateEngine();
          this.handleDisconnect(this.options.stopLocalTrackOnUnpublish);
          reject(new ConnectionError('could not connect PeerConnection after timeout'));
        }, maxICEConnectTimeout);

        const abortHandler = () => {
          livekitLogger.warn('closing engine');
          clearTimeout(connectTimeout);
          this.recreateEngine();
          this.handleDisconnect(this.options.stopLocalTrackOnUnpublish);
          reject(new ConnectionError('room connection has been cancelled'));
        };

        if ((_a = this.abortController) === null || _a === void 0 ? void 0 : _a.signal.aborted) {
          abortHandler();
        }

        (_b = this.abortController) === null || _b === void 0 ? void 0 : _b.signal.addEventListener('abort', abortHandler);
        this.engine.once(EngineEvent.Connected, () => {
          var _a, _b;

          clearTimeout(connectTimeout);
          (_a = this.abortController) === null || _a === void 0 ? void 0 : _a.signal.removeEventListener('abort', abortHandler); // also hook unload event

          if (isWeb()) {
            window.addEventListener('beforeunload', this.onBeforeUnload);
            (_b = navigator.mediaDevices) === null || _b === void 0 ? void 0 : _b.addEventListener('devicechange', this.handleDeviceChange);
          }

          this.setAndEmitConnectionState(ConnectionState.Connected);
          resolve();
        });
      };

      this.connectFuture = new Future(connectFn, () => {
        this.connectFuture = undefined;
        this.emit(RoomEvent.Connected);
      });
      return this.connectFuture.promise;
    };
    /**
     * disconnects the room, emits [[RoomEvent.Disconnected]]
     */


    this.disconnect = async function () {
      let stopTracks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      var _a, _b, _c, _d;

      livekitLogger.info('disconnect from room', {
        identity: _this.localParticipant.identity
      });

      if (_this.state === ConnectionState.Connecting || _this.state === ConnectionState.Reconnecting) {
        // try aborting pending connection attempt
        livekitLogger.warn('abort connection attempt');
        (_a = _this.abortController) === null || _a === void 0 ? void 0 : _a.abort(); // in case the abort controller didn't manage to cancel the connection attempt, reject the connect promise explicitly

        (_c = (_b = _this.connectFuture) === null || _b === void 0 ? void 0 : _b.reject) === null || _c === void 0 ? void 0 : _c.call(_b, new ConnectionError('Client initiated disconnect'));
        _this.connectFuture = undefined;
      } // send leave


      if ((_d = _this.engine) === null || _d === void 0 ? void 0 : _d.client.isConnected) {
        await _this.engine.client.sendLeave();
      } // close engine (also closes client)


      if (_this.engine) {
        _this.engine.close();
      }

      _this.handleDisconnect(stopTracks, DisconnectReason.CLIENT_INITIATED);
      /* @ts-ignore */


      _this.engine = undefined;
    };

    this.onBeforeUnload = () => {
      this.disconnect();
    };

    this.handleRestarting = () => {
      if (!this.reconnectFuture) {
        this.reconnectFuture = new Future();
      } // also unwind existing participants & existing subscriptions


      for (const p of this.participants.values()) {
        this.handleParticipantDisconnected(p.sid, p);
      }

      if (this.setAndEmitConnectionState(ConnectionState.Reconnecting)) {
        this.emit(RoomEvent.Reconnecting);
      }
    };

    this.handleRestarted = async joinResponse => {
      var _a, _b;

      livekitLogger.debug("reconnected to server", {
        region: joinResponse.serverRegion
      });
      this.setAndEmitConnectionState(ConnectionState.Connected);
      this.emit(RoomEvent.Reconnected);
      (_b = (_a = this.reconnectFuture) === null || _a === void 0 ? void 0 : _a.resolve) === null || _b === void 0 ? void 0 : _b.call(_a);
      this.reconnectFuture = undefined; // rehydrate participants

      if (joinResponse.participant) {
        // with a restart, the sid will have changed, we'll map our understanding to it
        this.localParticipant.sid = joinResponse.participant.sid;
        this.handleParticipantUpdates([joinResponse.participant]);
      }

      this.handleParticipantUpdates(joinResponse.otherParticipants); // unpublish & republish tracks

      const localPubs = [];
      this.localParticipant.tracks.forEach(pub => {
        if (pub.track) {
          localPubs.push(pub);
        }
      });
      await Promise.all(localPubs.map(async pub => {
        const track = pub.track;
        this.localParticipant.unpublishTrack(track, false);

        if (!track.isMuted) {
          if ((track instanceof LocalAudioTrack || track instanceof LocalVideoTrack) && !track.isUserProvided) {
            // we need to restart the track before publishing, often a full reconnect
            // is necessary because computer had gone to sleep.
            livekitLogger.debug('restarting existing track', {
              track: pub.trackSid
            });
            await track.restartTrack();
          }

          await this.localParticipant.publishTrack(track, pub.options);
        }
      }));
    };

    this.handleParticipantUpdates = participantInfos => {
      // handle changes to participant state, and send events
      participantInfos.forEach(info => {
        if (info.sid === this.localParticipant.sid || info.identity === this.localParticipant.identity) {
          this.localParticipant.updateInfo(info);
          return;
        } // ensure identity <=> sid mapping


        const sid = this.identityToSid.get(info.identity);

        if (sid && sid !== info.sid) {
          // sid had changed, need to remove previous participant
          this.handleParticipantDisconnected(sid, this.participants.get(sid));
        }

        let remoteParticipant = this.participants.get(info.sid);
        const isNewParticipant = !remoteParticipant; // create participant if doesn't exist

        remoteParticipant = this.getOrCreateParticipant(info.sid, info); // when it's disconnected, send updates

        if (info.state === ParticipantInfo_State.DISCONNECTED) {
          this.handleParticipantDisconnected(info.sid, remoteParticipant);
        } else if (!isNewParticipant) {
          // just update, no events
          remoteParticipant.updateInfo(info);
        }
      });
    }; // updates are sent only when there's a change to speaker ordering


    this.handleActiveSpeakersUpdate = speakers => {
      const activeSpeakers = [];
      const seenSids = {};
      speakers.forEach(speaker => {
        seenSids[speaker.sid] = true;

        if (speaker.sid === this.localParticipant.sid) {
          this.localParticipant.audioLevel = speaker.level;
          this.localParticipant.setIsSpeaking(true);
          activeSpeakers.push(this.localParticipant);
        } else {
          const p = this.participants.get(speaker.sid);

          if (p) {
            p.audioLevel = speaker.level;
            p.setIsSpeaking(true);
            activeSpeakers.push(p);
          }
        }
      });

      if (!seenSids[this.localParticipant.sid]) {
        this.localParticipant.audioLevel = 0;
        this.localParticipant.setIsSpeaking(false);
      }

      this.participants.forEach(p => {
        if (!seenSids[p.sid]) {
          p.audioLevel = 0;
          p.setIsSpeaking(false);
        }
      });
      this.activeSpeakers = activeSpeakers;
      this.emitWhenConnected(RoomEvent.ActiveSpeakersChanged, activeSpeakers);
    }; // process list of changed speakers


    this.handleSpeakersChanged = speakerUpdates => {
      const lastSpeakers = new Map();
      this.activeSpeakers.forEach(p => {
        lastSpeakers.set(p.sid, p);
      });
      speakerUpdates.forEach(speaker => {
        let p = this.participants.get(speaker.sid);

        if (speaker.sid === this.localParticipant.sid) {
          p = this.localParticipant;
        }

        if (!p) {
          return;
        }

        p.audioLevel = speaker.level;
        p.setIsSpeaking(speaker.active);

        if (speaker.active) {
          lastSpeakers.set(speaker.sid, p);
        } else {
          lastSpeakers.delete(speaker.sid);
        }
      });
      const activeSpeakers = Array.from(lastSpeakers.values());
      activeSpeakers.sort((a, b) => b.audioLevel - a.audioLevel);
      this.activeSpeakers = activeSpeakers;
      this.emitWhenConnected(RoomEvent.ActiveSpeakersChanged, activeSpeakers);
    };

    this.handleStreamStateUpdate = streamStateUpdate => {
      streamStateUpdate.streamStates.forEach(streamState => {
        const participant = this.participants.get(streamState.participantSid);

        if (!participant) {
          return;
        }

        const pub = participant.getTrackPublication(streamState.trackSid);

        if (!pub || !pub.track) {
          return;
        }

        pub.track.streamState = Track.streamStateFromProto(streamState.state);
        participant.emit(ParticipantEvent.TrackStreamStateChanged, pub, pub.track.streamState);
        this.emitWhenConnected(RoomEvent.TrackStreamStateChanged, pub, pub.track.streamState, participant);
      });
    };

    this.handleSubscriptionPermissionUpdate = update => {
      const participant = this.participants.get(update.participantSid);

      if (!participant) {
        return;
      }

      const pub = participant.getTrackPublication(update.trackSid);

      if (!pub) {
        return;
      }

      pub.setAllowed(update.allowed);
    };

    this.handleDataPacket = (userPacket, kind) => {
      // find the participant
      const participant = this.participants.get(userPacket.participantSid);
      this.emit(RoomEvent.DataReceived, userPacket.payload, participant, kind); // also emit on the participant

      participant === null || participant === void 0 ? void 0 : participant.emit(ParticipantEvent.DataReceived, userPacket.payload, kind);
    };

    this.handleAudioPlaybackStarted = () => {
      if (this.canPlaybackAudio) {
        return;
      }

      this.audioEnabled = true;
      this.emit(RoomEvent.AudioPlaybackStatusChanged, true);
    };

    this.handleAudioPlaybackFailed = e => {
      livekitLogger.warn('could not playback audio', e);

      if (!this.canPlaybackAudio) {
        return;
      }

      this.audioEnabled = false;
      this.emit(RoomEvent.AudioPlaybackStatusChanged, false);
    };

    this.handleDeviceChange = async () => {
      this.emit(RoomEvent.MediaDevicesChanged);
    };

    this.handleRoomUpdate = r => {
      this.metadata = r.metadata;
      this.emitWhenConnected(RoomEvent.RoomMetadataChanged, r.metadata);
    };

    this.handleConnectionQualityUpdate = update => {
      update.updates.forEach(info => {
        if (info.participantSid === this.localParticipant.sid) {
          this.localParticipant.setConnectionQuality(info.quality);
          return;
        }

        const participant = this.participants.get(info.participantSid);

        if (participant) {
          participant.setConnectionQuality(info.quality);
        }
      });
    };

    this.onLocalParticipantMetadataChanged = metadata => {
      this.emit(RoomEvent.ParticipantMetadataChanged, metadata, this.localParticipant);
    };

    this.onLocalTrackMuted = pub => {
      this.emit(RoomEvent.TrackMuted, pub, this.localParticipant);
    };

    this.onLocalTrackUnmuted = pub => {
      this.emit(RoomEvent.TrackUnmuted, pub, this.localParticipant);
    };

    this.onLocalTrackPublished = pub => {
      this.emit(RoomEvent.LocalTrackPublished, pub, this.localParticipant);
    };

    this.onLocalTrackUnpublished = pub => {
      this.emit(RoomEvent.LocalTrackUnpublished, pub, this.localParticipant);
    };

    this.onLocalConnectionQualityChanged = quality => {
      this.emit(RoomEvent.ConnectionQualityChanged, quality, this.localParticipant);
    };

    this.onMediaDevicesError = e => {
      this.emit(RoomEvent.MediaDevicesError, e);
    };

    this.onLocalParticipantPermissionsChanged = prevPermissions => {
      this.emit(RoomEvent.ParticipantPermissionsChanged, prevPermissions, this.localParticipant);
    };

    this.participants = new Map();
    this.identityToSid = new Map();
    this.options = _objectSpread2(_objectSpread2({}, roomOptionDefaults), options);
    this.options.audioCaptureDefaults = _objectSpread2(_objectSpread2({}, audioDefaults), options === null || options === void 0 ? void 0 : options.audioCaptureDefaults);
    this.options.videoCaptureDefaults = _objectSpread2(_objectSpread2({}, videoDefaults), options === null || options === void 0 ? void 0 : options.videoCaptureDefaults);
    this.options.publishDefaults = _objectSpread2(_objectSpread2({}, publishDefaults), options === null || options === void 0 ? void 0 : options.publishDefaults);
    this.createEngine();
    this.localParticipant = new LocalParticipant('', '', this.engine, this.options);
  }

  createEngine() {
    if (this.engine) {
      return;
    }

    this.engine = new RTCEngine(this.options);
    this.engine.client.onParticipantUpdate = this.handleParticipantUpdates;
    this.engine.client.onRoomUpdate = this.handleRoomUpdate;
    this.engine.client.onSpeakersChanged = this.handleSpeakersChanged;
    this.engine.client.onStreamStateUpdate = this.handleStreamStateUpdate;
    this.engine.client.onSubscriptionPermissionUpdate = this.handleSubscriptionPermissionUpdate;
    this.engine.client.onConnectionQuality = this.handleConnectionQualityUpdate;
    this.engine.on(EngineEvent.MediaTrackAdded, (mediaTrack, stream, receiver) => {
      this.onTrackAdded(mediaTrack, stream, receiver);
    }).on(EngineEvent.Disconnected, reason => {
      this.handleDisconnect(this.options.stopLocalTrackOnUnpublish, reason);
    }).on(EngineEvent.ActiveSpeakersUpdate, this.handleActiveSpeakersUpdate).on(EngineEvent.DataPacketReceived, this.handleDataPacket).on(EngineEvent.Resuming, () => {
      if (!this.reconnectFuture) {
        this.reconnectFuture = new Future();
      }

      if (this.setAndEmitConnectionState(ConnectionState.Reconnecting)) {
        this.emit(RoomEvent.Reconnecting);
      }
    }).on(EngineEvent.Resumed, () => {
      var _a, _b;

      this.setAndEmitConnectionState(ConnectionState.Connected);
      (_b = (_a = this.reconnectFuture) === null || _a === void 0 ? void 0 : _a.resolve) === null || _b === void 0 ? void 0 : _b.call(_a);
      this.reconnectFuture = undefined;
      this.emit(RoomEvent.Reconnected);
      this.updateSubscriptions();
    }).on(EngineEvent.SignalResumed, () => {
      if (this.state === ConnectionState.Reconnecting) {
        this.sendSyncState();
      }
    }).on(EngineEvent.Restarting, this.handleRestarting).on(EngineEvent.Restarted, this.handleRestarted);

    if (this.localParticipant) {
      this.localParticipant.engine = this.engine;
    }
  }
  /**
   * getLocalDevices abstracts navigator.mediaDevices.enumerateDevices.
   * In particular, it handles Chrome's unique behavior of creating `default`
   * devices. When encountered, it'll be removed from the list of devices.
   * The actual default device will be placed at top.
   * @param kind
   * @returns a list of available local devices
   */


  static getLocalDevices(kind) {
    let requestPermissions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    return DeviceManager.getInstance().getDevices(kind, requestPermissions);
  }
  /**
   * retrieves a participant by identity
   * @param identity
   * @returns
   */


  getParticipantByIdentity(identity) {
    if (this.localParticipant.identity === identity) {
      return this.localParticipant;
    }

    const sid = this.identityToSid.get(identity);

    if (sid) {
      return this.participants.get(sid);
    }
  }
  /**
   * @internal for testing
   */


  simulateScenario(scenario) {
    let postAction = () => {};

    let req;

    switch (scenario) {
      case 'signal-reconnect':
        this.engine.client.close();

        if (this.engine.client.onClose) {
          this.engine.client.onClose('simulate disconnect');
        }

        break;

      case 'speaker':
        req = SimulateScenario.fromPartial({
          scenario: {
            $case: 'speakerUpdate',
            speakerUpdate: 3
          }
        });
        break;

      case 'node-failure':
        req = SimulateScenario.fromPartial({
          scenario: {
            $case: 'nodeFailure',
            nodeFailure: true
          }
        });
        break;

      case 'server-leave':
        req = SimulateScenario.fromPartial({
          scenario: {
            $case: 'serverLeave',
            serverLeave: true
          }
        });
        break;

      case 'migration':
        req = SimulateScenario.fromPartial({
          scenario: {
            $case: 'migration',
            migration: true
          }
        });
        break;

      case 'force-tcp':
      case 'force-tls':
        req = SimulateScenario.fromPartial({
          scenario: {
            $case: 'switchCandidateProtocol',
            switchCandidateProtocol: scenario === 'force-tls' ? 2 : 1
          }
        });

        postAction = async () => {
          const onLeave = this.engine.client.onLeave;

          if (onLeave) {
            onLeave({
              reason: DisconnectReason.CLIENT_INITIATED,
              canReconnect: true
            });
          }
        };

        break;
    }

    if (req) {
      this.engine.client.sendSimulateScenario(req);
      postAction();
    }
  }
  /**
   * Browsers have different policies regarding audio playback. Most requiring
   * some form of user interaction (click/tap/etc).
   * In those cases, audio will be silent until a click/tap triggering one of the following
   * - `startAudio`
   * - `getUserMedia`
   */


  async startAudio() {
    this.acquireAudioContext();
    const elements = [];
    this.participants.forEach(p => {
      p.audioTracks.forEach(t => {
        if (t.track) {
          t.track.attachedElements.forEach(e => {
            elements.push(e);
          });
        }
      });
    });

    try {
      await Promise.all(elements.map(e => e.play()));
      this.handleAudioPlaybackStarted();
    } catch (err) {
      this.handleAudioPlaybackFailed(err);
      throw err;
    }
  }
  /**
   * Returns true if audio playback is enabled
   */


  get canPlaybackAudio() {
    return this.audioEnabled;
  }
  /**
   * Switches all active device used in this room to the given device.
   *
   * Note: setting AudioOutput is not supported on some browsers. See [setSinkId](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId#browser_compatibility)
   *
   * @param kind use `videoinput` for camera track,
   *  `audioinput` for microphone track,
   *  `audiooutput` to set speaker for all incoming audio tracks
   * @param deviceId
   */


  async switchActiveDevice(kind, deviceId) {
    if (kind === 'audioinput') {
      const tracks = Array.from(this.localParticipant.audioTracks.values()).filter(track => track.source === Track.Source.Microphone);
      await Promise.all(tracks.map(t => {
        var _a;

        return (_a = t.audioTrack) === null || _a === void 0 ? void 0 : _a.setDeviceId(deviceId);
      }));
      this.options.audioCaptureDefaults.deviceId = deviceId;
    } else if (kind === 'videoinput') {
      const tracks = Array.from(this.localParticipant.videoTracks.values()).filter(track => track.source === Track.Source.Camera);
      await Promise.all(tracks.map(t => {
        var _a;

        return (_a = t.videoTrack) === null || _a === void 0 ? void 0 : _a.setDeviceId(deviceId);
      }));
      this.options.videoCaptureDefaults.deviceId = deviceId;
    } else if (kind === 'audiooutput') {
      const elements = [];
      this.participants.forEach(p => {
        p.audioTracks.forEach(t => {
          if (t.isSubscribed && t.track) {
            t.track.attachedElements.forEach(e => {
              elements.push(e);
            });
          }
        });
      });
      await Promise.all(elements.map(async e => {
        if ('setSinkId' in e) {
          /* @ts-ignore */
          await e.setSinkId(deviceId);
        }
      }));
    }
  }

  recreateEngine() {
    this.engine.close();
    /* @ts-ignore */

    this.engine = undefined; // clear out existing remote participants, since they may have attached
    // the old engine

    this.participants.clear();
    this.createEngine();
  }

  onTrackAdded(mediaTrack, stream, receiver) {
    var _a, _b; // don't fire onSubscribed when connecting
    // WebRTC fires onTrack as soon as setRemoteDescription is called on the offer
    // at that time, ICE connectivity has not been established so the track is not
    // technically subscribed.
    // We'll defer these events until when the room is connected or eventually disconnected.


    if (this.connectFuture || this.reconnectFuture) {
      Promise.allSettled([(_a = this.connectFuture) === null || _a === void 0 ? void 0 : _a.promise, (_b = this.reconnectFuture) === null || _b === void 0 ? void 0 : _b.promise]).then(() => {
        this.onTrackAdded(mediaTrack, stream, receiver);
      });
      return;
    }

    if (this.state === ConnectionState.Disconnected) {
      livekitLogger.warn('skipping incoming track after Room disconnected');
      return;
    }

    const parts = unpackStreamId(stream.id);
    const participantId = parts[0];
    let trackId = parts[1];
    if (!trackId || trackId === '') trackId = mediaTrack.id;

    if (participantId === this.localParticipant.sid) {
      livekitLogger.warn('tried to create RemoteParticipant for local participant');
      return;
    }

    const participant = this.getOrCreateParticipant(participantId);
    let adaptiveStreamSettings;

    if (this.options.adaptiveStream) {
      if (typeof this.options.adaptiveStream === 'object') {
        adaptiveStreamSettings = this.options.adaptiveStream;
      } else {
        adaptiveStreamSettings = {};
      }
    }

    participant.addSubscribedMediaTrack(mediaTrack, trackId, stream, receiver, adaptiveStreamSettings);
  }

  handleDisconnect() {
    let shouldStopTracks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    let reason = arguments.length > 1 ? arguments[1] : undefined;

    var _a, _b, _c;

    if (this.state === ConnectionState.Disconnected) {
      return;
    } // reject potentially ongoing reconnection attempt


    if (this.connectFuture === this.reconnectFuture) {
      (_b = (_a = this.connectFuture) === null || _a === void 0 ? void 0 : _a.reject) === null || _b === void 0 ? void 0 : _b.call(_a, undefined);
      this.connectFuture = undefined;
    }

    this.reconnectFuture = undefined;
    this.participants.forEach(p => {
      p.tracks.forEach(pub => {
        p.unpublishTrack(pub.trackSid);
      });
    });
    this.localParticipant.off(ParticipantEvent.ParticipantMetadataChanged, this.onLocalParticipantMetadataChanged).off(ParticipantEvent.TrackMuted, this.onLocalTrackMuted).off(ParticipantEvent.TrackUnmuted, this.onLocalTrackUnmuted).off(ParticipantEvent.LocalTrackPublished, this.onLocalTrackPublished).off(ParticipantEvent.LocalTrackUnpublished, this.onLocalTrackUnpublished).off(ParticipantEvent.ConnectionQualityChanged, this.onLocalConnectionQualityChanged).off(ParticipantEvent.MediaDevicesError, this.onMediaDevicesError).off(ParticipantEvent.ParticipantPermissionsChanged, this.onLocalParticipantPermissionsChanged);
    this.localParticipant.tracks.forEach(pub => {
      var _a, _b;

      if (pub.track) {
        this.localParticipant.unpublishTrack(pub.track, shouldStopTracks);
      }

      if (shouldStopTracks) {
        (_a = pub.track) === null || _a === void 0 ? void 0 : _a.detach();
        (_b = pub.track) === null || _b === void 0 ? void 0 : _b.stop();
      }
    });
    this.localParticipant.tracks.clear();
    this.localParticipant.videoTracks.clear();
    this.localParticipant.audioTracks.clear();
    this.participants.clear();
    this.activeSpeakers = [];

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }

    if (isWeb()) {
      window.removeEventListener('beforeunload', this.onBeforeUnload);
      (_c = navigator.mediaDevices) === null || _c === void 0 ? void 0 : _c.removeEventListener('devicechange', this.handleDeviceChange);
    }

    this.setAndEmitConnectionState(ConnectionState.Disconnected);
    this.emit(RoomEvent.Disconnected, reason);
  }

  handleParticipantDisconnected(sid, participant) {
    // remove and send event
    this.participants.delete(sid);

    if (!participant) {
      return;
    }

    this.identityToSid.delete(participant.identity);
    participant.tracks.forEach(publication => {
      participant.unpublishTrack(publication.trackSid, true);
    });
    this.emitWhenConnected(RoomEvent.ParticipantDisconnected, participant);
  }

  acquireAudioContext() {
    if (this.audioContext) {
      this.audioContext.close();
    } // by using an AudioContext, it reduces lag on audio elements
    // https://stackoverflow.com/questions/9811429/html5-audio-tag-on-safari-has-a-delay/54119854#54119854


    const ctx = getNewAudioContext();

    if (ctx) {
      this.audioContext = ctx;
    }
  }

  createParticipant(id, info) {
    let participant;

    if (info) {
      participant = RemoteParticipant.fromParticipantInfo(this.engine.client, info);
    } else {
      participant = new RemoteParticipant(this.engine.client, id, '');
    }

    return participant;
  }

  getOrCreateParticipant(id, info) {
    if (this.participants.has(id)) {
      return this.participants.get(id);
    } // it's possible for the RTC track to arrive before signaling data
    // when this happens, we'll create the participant and make the track work


    const participant = this.createParticipant(id, info);
    this.participants.set(id, participant);

    if (info) {
      this.identityToSid.set(info.identity, info.sid); // if we have valid info and the participant wasn't in the map before, we can assume the participant is new
      // firing here to make sure that `ParticipantConnected` fires before the initial track events

      this.emitWhenConnected(RoomEvent.ParticipantConnected, participant);
    } // also forward events
    // trackPublished is only fired for tracks added after both local participant
    // and remote participant joined the room


    participant.on(ParticipantEvent.TrackPublished, trackPublication => {
      this.emitWhenConnected(RoomEvent.TrackPublished, trackPublication, participant);
    }).on(ParticipantEvent.TrackSubscribed, (track, publication) => {
      // monitor playback status
      if (track.kind === Track.Kind.Audio) {
        track.on(TrackEvent.AudioPlaybackStarted, this.handleAudioPlaybackStarted);
        track.on(TrackEvent.AudioPlaybackFailed, this.handleAudioPlaybackFailed);
      }

      this.emit(RoomEvent.TrackSubscribed, track, publication, participant);
    }).on(ParticipantEvent.TrackUnpublished, publication => {
      this.emitWhenConnected(RoomEvent.TrackUnpublished, publication, participant);
    }).on(ParticipantEvent.TrackUnsubscribed, (track, publication) => {
      this.emit(RoomEvent.TrackUnsubscribed, track, publication, participant);
    }).on(ParticipantEvent.TrackSubscriptionFailed, sid => {
      this.emit(RoomEvent.TrackSubscriptionFailed, sid, participant);
    }).on(ParticipantEvent.TrackMuted, pub => {
      this.emitWhenConnected(RoomEvent.TrackMuted, pub, participant);
    }).on(ParticipantEvent.TrackUnmuted, pub => {
      this.emitWhenConnected(RoomEvent.TrackUnmuted, pub, participant);
    }).on(ParticipantEvent.ParticipantMetadataChanged, metadata => {
      this.emitWhenConnected(RoomEvent.ParticipantMetadataChanged, metadata, participant);
    }).on(ParticipantEvent.ConnectionQualityChanged, quality => {
      this.emitWhenConnected(RoomEvent.ConnectionQualityChanged, quality, participant);
    }).on(ParticipantEvent.ParticipantPermissionsChanged, prevPermissions => {
      this.emitWhenConnected(RoomEvent.ParticipantPermissionsChanged, prevPermissions, participant);
    }).on(ParticipantEvent.TrackSubscriptionStatusChanged, (pub, status) => {
      this.emitWhenConnected(RoomEvent.TrackSubscriptionStatusChanged, pub, status, participant);
    }).on(ParticipantEvent.TrackSubscriptionPermissionChanged, (pub, status) => {
      this.emitWhenConnected(RoomEvent.TrackSubscriptionPermissionChanged, pub, status, participant);
    }); // update info at the end after callbacks have been set up

    if (info) {
      participant.updateInfo(info);
    }

    return participant;
  }

  sendSyncState() {
    var _a;

    if (this.engine.subscriber === undefined || this.engine.subscriber.pc.localDescription === null) {
      return;
    }

    const previousAnswer = this.engine.subscriber.pc.localDescription;
    const previousOffer = this.engine.subscriber.pc.remoteDescription;
    /* 1. autosubscribe on, so subscribed tracks = all tracks - unsub tracks,
          in this case, we send unsub tracks, so server add all tracks to this
          subscribe pc and unsub special tracks from it.
       2. autosubscribe off, we send subscribed tracks.
    */

    const sendUnsub = ((_a = this.connOptions) === null || _a === void 0 ? void 0 : _a.autoSubscribe) || false;
    const trackSids = new Array();
    this.participants.forEach(participant => {
      participant.tracks.forEach(track => {
        if (track.isSubscribed !== sendUnsub) {
          trackSids.push(track.trackSid);
        }
      });
    });
    this.engine.client.sendSyncState({
      answer: toProtoSessionDescription({
        sdp: previousAnswer.sdp,
        type: previousAnswer.type
      }),
      offer: previousOffer ? toProtoSessionDescription({
        sdp: previousOffer.sdp,
        type: previousOffer.type
      }) : undefined,
      subscription: {
        trackSids,
        subscribe: !sendUnsub,
        participantTracks: []
      },
      publishTracks: this.localParticipant.publishedTracksInfo(),
      dataChannels: this.localParticipant.dataChannelsInfo()
    });
  }
  /**
   * After resuming, we'll need to notify the server of the current
   * subscription settings.
   */


  updateSubscriptions() {
    for (const p of this.participants.values()) {
      for (const pub of p.videoTracks.values()) {
        if (pub.isSubscribed && pub instanceof RemoteTrackPublication) {
          pub.emitTrackUpdate();
        }
      }
    }
  }

  setAndEmitConnectionState(state) {
    if (state === this.state) {
      // unchanged
      return false;
    }

    this.state = state;
    this.emit(RoomEvent.ConnectionStateChanged, this.state);
    return true;
  }

  emitWhenConnected(event) {
    if (this.state === ConnectionState.Connected) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return this.emit(event, ...args);
    }

    return false;
  } // /** @internal */


  emit(event) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    livekitLogger.debug('room event', {
      event,
      args
    });
    return super.emit(event, ...args);
  }

}

let startTime;
// @ts-ignore
window.connectToLiveKit = async (token) => {
    const room = new Room({});
    //await room.connect('wss://dan.staging.livekit.cloud', "token");
    room
        .on(RoomEvent.ParticipantConnected, participantConnected)
        .on(RoomEvent.LocalTrackPublished, () => {
        renderParticipant(room.localParticipant);
    })
        .on(RoomEvent.TrackSubscribed, (_1, pub, participant) => {
        console.log('subscribed to track', pub.trackSid, participant.identity);
        renderParticipant(participant);
    })
        .on(RoomEvent.SignalConnected, async () => {
        const signalConnectionTime = Date.now() - startTime;
        console.log(`signal connection established in ${signalConnectionTime}ms`);
        await Promise.all([
            room.localParticipant.setCameraEnabled(true),
            room.localParticipant.setMicrophoneEnabled(true),
        ]);
    });
    startTime = Date.now();
    await room.connect('wss://dan.staging.livekit.cloud', token);
    console.log('connected to room', room);
    room.participants.forEach((participant) => {
        participantConnected(participant);
    });
    participantConnected(room.localParticipant);
};
const $ = (id) => document.getElementById(id);
// updates participant UI
function renderParticipant(participant, remove = false) {
    const container = $('participants-area');
    if (!container)
        return;
    const { identity } = participant;
    let div = $(`participant-${identity}`);
    if (!div && !remove) {
        div = document.createElement('div');
        div.id = `participant-${identity}`;
        div.className = 'participant';
        div.innerHTML = `
      <video id="video-${identity}"></video>
      <audio id="audio-${identity}"></audio>
      <div class="info-bar">
        <div id="name-${identity}" class="name">
        </div>
        <div style="text-align: center;">
          <span id="codec-${identity}" class="codec">
          </span>
          <span id="size-${identity}" class="size">
          </span>
          <span id="bitrate-${identity}" class="bitrate">
          </span>
        </div>
        <div class="right">
          <span id="signal-${identity}"></span>
          <span id="mic-${identity}" class="mic-on"></span>
        </div>
      </div>
      ${participant instanceof RemoteParticipant &&
            `<div class="volume-control">
        <input id="volume-${identity}" type="range" min="0" max="1" step="0.1" value="1" orient="vertical" />
      </div>`}

    `;
        container.appendChild(div);
        const sizeElm = $(`size-${identity}`);
        const videoElm = $(`video-${identity}`);
        videoElm.onresize = () => {
            updateVideoSize(videoElm, sizeElm);
        };
    }
    const videoElm = $(`video-${identity}`);
    const audioELm = $(`audio-${identity}`);
    if (remove) {
        div?.remove();
        if (videoElm) {
            videoElm.srcObject = null;
            videoElm.src = '';
        }
        if (audioELm) {
            audioELm.srcObject = null;
            audioELm.src = '';
        }
        return;
    }
    // update properties
    $(`name-${identity}`).innerHTML = participant.identity;
    if (participant instanceof LocalParticipant) {
        $(`name-${identity}`).innerHTML += ' (you)';
    }
    const micElm = $(`mic-${identity}`);
    const signalElm = $(`signal-${identity}`);
    const cameraPub = participant.getTrack(Track.Source.Camera);
    const micPub = participant.getTrack(Track.Source.Microphone);
    if (participant.isSpeaking) {
        div.classList.add('speaking');
    }
    else {
        div.classList.remove('speaking');
    }
    if (participant instanceof RemoteParticipant) {
        const volumeSlider = $(`volume-${identity}`);
        volumeSlider.addEventListener('input', (ev) => {
            participant.setVolume(Number.parseFloat(ev.target.value));
        });
    }
    const cameraEnabled = cameraPub && cameraPub.isSubscribed && !cameraPub.isMuted;
    if (cameraEnabled) {
        if (participant instanceof LocalParticipant) {
            // flip
            videoElm.style.transform = 'scale(-1, 1)';
        }
        else if (!cameraPub?.videoTrack?.attachedElements.includes(videoElm)) {
            const renderStartTime = Date.now();
            // measure time to render
            videoElm.onloadeddata = () => {
                const elapsed = Date.now() - renderStartTime;
                let fromJoin = 0;
                if (participant.joinedAt && participant.joinedAt.getTime() < startTime) {
                    fromJoin = Date.now() - startTime;
                }
                console.log(`RemoteVideoTrack ${cameraPub?.trackSid} (${videoElm.videoWidth}x${videoElm.videoHeight}) rendered in ${elapsed}ms`, fromJoin > 0 ? `, ${fromJoin}ms from start` : '');
            };
        }
        cameraPub?.videoTrack?.attach(videoElm);
    }
    else {
        // clear information display
        $(`size-${identity}`).innerHTML = '';
        if (cameraPub?.videoTrack) {
            // detach manually whenever possible
            cameraPub.videoTrack?.detach(videoElm);
        }
        else {
            videoElm.src = '';
            videoElm.srcObject = null;
        }
    }
    const micEnabled = micPub && micPub.isSubscribed && !micPub.isMuted;
    if (micEnabled) {
        if (!(participant instanceof LocalParticipant)) {
            // don't attach local audio
            audioELm.onloadeddata = () => {
                if (participant.joinedAt && participant.joinedAt.getTime() < startTime) {
                    const fromJoin = Date.now() - startTime;
                    console.log(`RemoteAudioTrack ${micPub?.trackSid} played ${fromJoin}ms from start`);
                }
            };
            micPub?.audioTrack?.attach(audioELm);
        }
        micElm.className = 'mic-on';
        micElm.innerHTML = '<i class="fas fa-microphone"></i>';
    }
    else {
        micElm.className = 'mic-off';
        micElm.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    }
    switch (participant.connectionQuality) {
        case ConnectionQuality.Excellent:
        case ConnectionQuality.Good:
        case ConnectionQuality.Poor:
            signalElm.className = `connection-${participant.connectionQuality}`;
            signalElm.innerHTML = '<i class="fas fa-circle"></i>';
            break;
        default:
            signalElm.innerHTML = '';
        // do nothing
    }
}
function updateVideoSize(element, target) {
    target.innerHTML = `(${element.videoWidth}x${element.videoHeight})`;
}
function participantConnected(participant) {
    console.log('participant', participant.identity, 'connected', participant.metadata);
    participant
        .on(ParticipantEvent.TrackMuted, (pub) => {
        console.log('track was muted', pub.trackSid, participant.identity);
        renderParticipant(participant);
    })
        .on(ParticipantEvent.TrackUnmuted, (pub) => {
        console.log('track was unmuted', pub.trackSid, participant.identity);
        renderParticipant(participant);
    })
        .on(ParticipantEvent.IsSpeakingChanged, () => {
        renderParticipant(participant);
    })
        .on(ParticipantEvent.ConnectionQualityChanged, () => {
        renderParticipant(participant);
    });
}
//# sourceMappingURL=bundle.js.map
