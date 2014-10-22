'use strict';

module.exports = new function herdic(){

  var $injector = require('./injector');

  /**
   * Track if the modules have been bootstrapped already
   * @type {boolean}
   */
  var hasBooted = false;

  /**
   * Map of registered bundles (by name)
   * @type {Object}
   */
  var bundles = {};


  /**
   * Load a bundle into the container.
   * @param bundleDef - bundle definition object.
   *
   * This method must be called prior to booting the application.
   */
  this.loadBundle = function(bundleDef){
    if (hasBooted === true) {
      throw new Error('Cannot load bundle after booting');
    }

    // validate that we got an object
    if (typeof bundleDef !== 'object' || bundleDef === null) {
      throw new Error('Invalid bundle argument: ' + bundleDef);
    }

    // validate bundle has a name
    if (!bundleDef.hasOwnProperty('name') ||
      typeof bundleDef.name !== 'string' ||
      bundleDef.name.trim().length === 0) {
      throw new Error('Invalid bundle name: \'' + bundleDef.name + '\'');
    }

    // validate and copy depends value
    if (bundleDef.hasOwnProperty('depends') && bundleDef.depends !== null) {

      // if present, depends must be an array
      if (typeof bundleDef.depends !== 'object' || !Array.isArray(bundleDef.depends)) {
        throw new Error('Bundle \'depends\' must be an array');
      }
    }

    // validate and copy config function
    if (bundleDef.hasOwnProperty('config') && bundleDef.config !== null) {
      if (typeof bundleDef.config !== 'function') {
        throw new Error('Bundle \'config\' must be a function');
      }
    }

    // validate and copy run function
    if (bundleDef.hasOwnProperty('run') && bundleDef.run !== null) {
      if (typeof bundleDef.run !== 'function') {
        throw new Error('Bundle \'run\' must be a function');
      }
    }


    //
    // now load all components
    //
    if (bundleDef.hasOwnProperty('components') && bundleDef.components !== null) {
      if (typeof bundleDef.components !== 'object' || !Array.isArray(bundleDef.components)) {
        throw new Error('Bundle \'components\' must be an array');
      }

      try {
        bundleDef.components.forEach(function(component){
          loadComponent(component);
        });
      }
      catch (e) {
        throw new Error('Error loading bundle \'' + bundleDef.name + '\': ' + e);
      }
    }

    // add bundle entry to map
    bundles[bundleDef.name] = bundleDef;
  };


  /**
   * Return bundle definition of previously loaded bundle
   * @param bundleName
   * @returns {*}
   */
  this.getBundle = function(bundleName) {
    if (bundles.hasOwnProperty(bundleName)) {
      return bundles[bundleName];
    }
    throw new Error('Unknown bundle: ' + bundleName);
  };


  /**
   * Return array of all loaded bundle definitions.
   * Array is in dependency order.
   */
  this.getAllBundles = function(){
    var result = [];
    processAllBundles(function(bundle){
      result.push(bundle);
    });
    return result;
  };


  /**
   * Helper method to directly register a value component.
   * @param name - name to use when injecting as a dependency.
   * @param value - any javascript value.
   *
   * This named value will be available for injection into both Providers and Services.
   */
  this.setValue = function(name, value) {
    // register it as a simple value provider
    $injector.providerInjector.register(name, value, true);
  };


  /**
   * Bootstrap the application. Configures and runs all loaded modules.
   */
  this.boot = function(){

    if (hasBooted === true) {
      throw new Error('Application has already booted');
    }

    // Configuration Phase. Run the config function (if defined) on all bundles.
    processAllBundles(function(bundle){
      // if there is a config function, invoke it with provider dependencies
      if (bundle.hasOwnProperty('config')) {
        $injector.providerInjector.invoke(bundle.config);
      }
    });

    // Instantiate any providers that haven't already been hit
    $injector.providerInjector.instantiateAll();

    // Run Phase. Execute the Run function on all bundles
    processAllBundles(function(bundle){
      // if there is a run function, invoke it with instance/service dependencies
      if (bundle.hasOwnProperty('run')) {
        $injector.instanceInjector.invoke(bundle.run);
      }
    });

    // mark the application as having booted.
    hasBooted = true;
  };


  /**
   * Invoke a delegate method on each bundle (will recurse over dependencies, so it is possible that delegate
   * @param delegate - function that takes a bundle entry object as only argument
   */
  var processAllBundles = function(delegate){
    var DONE = 'done';
    var INPROG = 'inprog';
    var cache = {};

    /**
     * Process a single bundle
     * @param name - name of the bundle
     */
    var processBundle = function(name) {
      if (bundles.hasOwnProperty(name)) {

        // lookup bundle entry in map
        var bundle = bundles[name];

        // if circular dependency
        if (cache[name] === INPROG) {
          throw new Error('Circular dependency in bundle ' + name);
        }
        // if not already processed
        else if (cache[name] !== DONE) {
          // this bundle is in progress
          cache[name] = INPROG;

          // if it has them,
          // process this bundle's dependencies first
          if (bundle.hasOwnProperty('depends')) {
            bundle.depends.forEach(processBundle);
          }

          // now invoke delegate for this bundle
          delegate(bundle);

          // now we are done processing this bundle
          cache[name] = DONE;
        }

      }
      else {
        throw new Error('Reference to unknown bundle ' + name);
      }
    };


    // traverse all loaded bundles
    for (var name in bundles) {
      processBundle(name);
    }//endfor

  };


  /**
   * Load and register a component as a provider
   * @param component definition object
   */
  var loadComponent = function(component) {

    // validate component has at least a name property
    if (!component.hasOwnProperty('name') ||
      typeof component.name !== 'string' ||
      component.name.trim().length === 0) {
      throw new Error('Invalid component name: \'' + component.name + '\'');
    }

    //
    // if is provider
    if (component.hasOwnProperty('provider')) {
      // validate it is function
      if (typeof component.provider !== 'function') {
        throw new Error('provider definition must be a function in component ' + component.name);
      }

      // register the provider
      $injector.providerInjector.register(component.name, component.provider);
    }

    //
    // if is service
    else if (component.hasOwnProperty('service')) {
      // validate it is function
      if (typeof component.service !== 'function') {
        throw new Error('service definition must be a function in component ' + component.name);
      }

      // create and register an un-injectable service provider
      $injector.providerInjector.register(
        component.name + $injector.PROVIDER_SUFFIX,
        {
          $get: component.service,
          $injectable: false
        }
      );
    }

    //
    // if it is a value
    else if (component.hasOwnProperty('value')) {
      // register it as a simple value provider
      $injector.providerInjector.register(component.name, component.value, true);
    }

    //
    // else unknown definition
    else {
      throw new Error('No definition found for component ' + component.name);
    }
  };


};