'use strict';

module.exports = new function herdic(){

  var hasBooted = false;

  /**
   * Load a bundle into the container.
   * @param bundle - bundle definition object or path to module which exports bundle definition object.
   *
   * This method must be called prior to booting the application.
   */
  this.loadBundle = function(bundle){
    var bundleDef = null;
    var argType = typeof(bundle);

    if (hasBooted === true) {
      throw new Error('Cannot load bundle after booting');
    }

    // if argument is string, require it
    if (argType === 'string') {
      bundleDef = require(bundle);
    }
    // if object directly specified
    else if (argType === 'object' && bundle !== null) {
      bundleDef = bundle;
    }


  };


  this.boot = function(){

  };


};