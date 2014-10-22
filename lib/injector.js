'use strict';


var INSTANTIATING = {};
var PROVIDER_SUFFIX = 'Provider';

/**
 * Return array of named arguments to a function
 * @param func
 * @returns {Array}
 */
var annotate = function(func){
  var result = [];
  var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
  var FN_ARG_SPLIT = /,/;
  var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

  // validate argument
  if (typeof func !== 'function') {
    throw new Error('Argument must be a function');
  }

  // if has $inject property, just return that
  if (func.hasOwnProperty('$inject') && Array.isArray(func['$inject'])) {
    result = func['$inject'];
  }
  else {
    // extract the arguments section of the function with regex
    var fnText = func.toString().replace(STRIP_COMMENTS, '');
    var argDecl = fnText.match(FN_ARGS);

    // push each argument name into result array
    argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg){
      arg.replace(FN_ARG, function(all, underscore, name) {
        result.push(name);
      });
    });

    func['$inject'] = result;
  }

  return result;
};


/**
 * Invoke a function with injected dependencies
 * @param fn - function
 * @param self - object on which to invoke function
 * @param factory - function that takes named dependency and returns instance
 * @returns {*} result from invoking the function
 */
var invoke = function(fn, self, factory){
  var args = [];

  // get list of argument names
  var $inject = annotate(fn);

  // loop through named arguments and get an appropriate instance
  for (var i = 0; i < $inject.length; i++) {
    // get an instance of this name from our factory
    var argInst = factory($inject[i]);

    // push to args list
    args.push(argInst);
  }

  return fn.apply(self, args);
};


/**
 * Instantiate a new object given a function (ctor) with injected dependencies
 * @param fn
 * @param factory
 * @returns {*}
 */
var instantiate = function(fn, factory) {
  var DefaultConstructor = function(){};
  var inst = new DefaultConstructor();

  var result = invoke(fn, inst, factory);

  return (typeof result !== 'undefined' && result !== null) ? result : inst;
};


/**
 * Injector/Container for Providers
 */
var $providerInjector = function(){

  var self = this;

  /**
   * Map of providers and instances
   * @type {Object}
   *
   * Associative arary of provider entries by name.
   */
  var container = {};


  /**
   * factory function to instantiate a dependency of this provider
   * @param dependency
   * @returns {*}
   */
  var loadProviderDependency = function(dependency){
    var dependencyInst = self.get(dependency);

    // if this provider does not allow injection, throw an error as if it's not a real provider
    if (dependencyInst.hasOwnProperty('$injectable') && dependencyInst['$injectable'] === false) {
      throw new Error('Not allowed to inject provider \'' + dependency + '\'');
    }

    return dependencyInst;
  };


  /**
   * Create an instance of the specified provider (entry)
   * @param providerEntry
   */
  var instantiateProvider = function(providerEntry){
    // if the provider definition is a function
    if (typeof providerEntry.provider === 'function') {

      // mark this provider as being instantiated
      providerEntry.inst = INSTANTIATING;

      // invoke the provider function with dependency injection
      var newInst = instantiate(providerEntry.provider, loadProviderDependency);

      // validate returned provider instance
      if (newInst === null || newInst === undefined) {
        throw new Error('Invalid provider instance specified for ' + name);
      }

      // save this instance
      providerEntry.inst = newInst;
    }
    else {
      throw new Error('Unable to instantiate provider of type ' + (typeof providerEntry.provider));
    }
  };


  /**
   * Invoke a function with dependency injection
   * @param fn
   * @param self_
   * @returns {*}
   */
  this.invoke = function(fn, self_) {
    return invoke(fn, self_, loadProviderDependency);
  };


  /**
   * Register a provider with the container
   * @param name
   * @param provider - provider definition. This argument may be
   * an object or a function. If it is an object, it must have a $get
   * function. If it is a function, it is treated as a CTOR which much
   * itself return an object that has a $get function.
   * @param asInstance  - treat the provider argument as a raw instance value.
   * This is used for value providers and 3rd-party modules which may actually
   * be functions.
   */
  this.register = function(name, provider, asInstance){
    // validate arguments
    if (typeof name !== 'string') {
      throw new Error('Provider name must be a string');
    }

    if (provider === null) {
      throw new Error('Invalid provider: ' + provider);
    }

    // create map entry
    var newEntry = {
      provider: provider,
      inst: null
    };

    // if the provider definition is a object or constant value, then just instantiate it now.
    if (typeof provider !== 'function' || asInstance === true) {
      newEntry.inst = provider;
    }

    // create / replace provider definition
    container[name] = newEntry;

  };


  /**
   * Check if a provider has been successfully instantiated
   * @param name - provider name
   * @returns {boolean}
   */
  this.has = function(name){
    var entry = container[name];
    var result = false;

    if (container.hasOwnProperty(name) && entry !== null) {
      result = entry.inst !== null && entry.inst !== INSTANTIATING;
    }

    return result;
  };


  /**
   * Return an instance of a provider
   * @param name - name of provider
   * @returns {*}
   */
  this.get = function(name){
    var entry = container[name];

    // if no definition found
    if (!container.hasOwnProperty(name) || entry === null) {
      throw new Error('Unknown provider: \'' + name + '\'');
    }

    // if there is a circular dependency
    if (entry.inst === INSTANTIATING) {
      throw new Error('Circular dependency in provider: \'' + name + '\'');
    }
    // or if we havent created an instance yet
    else if (entry.inst === null) {
      instantiateProvider(entry);
    }

    return entry.inst;
  };


  /**
   * Instantiate all providers
   */
  this.instantiateAll = function(){

    // iterate all registered providers
    for (var name in container) {
      if (container.hasOwnProperty(name)) {
        // if this provider is not already instantiated
        var entry = container[name];

        // if failed a provider somewhere
        if (entry.inst === INSTANTIATING) {
          throw new Error('Error instantiating providers');
        }
        // try to create this one
        else if (entry.inst === null) {
          instantiateProvider(entry);
        }
      }
    }//endfor
  };
};


/**
 * Injector/Container for service instances
 */
var $injector = function(providerInjector){

  var self = this;

  /**
   * Associative array of service names to instances
   * @type {Object}
   */
  var container = {
    '$injector' : self // this is a hard-coded service that is always available.
  };


  /**
   * Return an instance of a service
   * @param name
   * @returns {*}
   */
  this.get = function(name){
    var inst = container[name];
    var providerInst = null;

    // if we already have an entry
    if (container.hasOwnProperty(name) && inst !== null) {
      // if this service is already being instantiated
      if (inst === INSTANTIATING) {
        throw new Error('Circular dependency in service \'' + name + '\'');
      }
    }
    // else we need to load the service
    else {

      // look for a suitable provider instance. First try with the provider suffix.
      if (providerInjector.has(name + PROVIDER_SUFFIX)) {
        providerInst = providerInjector.get(name + PROVIDER_SUFFIX);
      }
      // then try without (for things like plain values)
      else if (providerInjector.has(name)) {
        providerInst = providerInjector.get(name);

        // if trying to get a non-constant provider, don't allow
        if (providerInst.hasOwnProperty('$injectable') && providerInst['$injectable'] === false) {
          // just mask it out. pretend the hidden providers aren't there.
          providerInst = null;
        }
      }

      // if no provider instance
      if (providerInst === null) {
        throw new Error('No suitable provider for \'' + name + '\'');
      }

      // if the provider instance DOES NOT have a $get property
      if (typeof providerInst !== 'object' || !providerInst.hasOwnProperty('$get')) {
        // then just use that as the service instance, too.
        // this is useful for constant values
        inst = providerInst;
      }
      // otherwise the provider instance is an object with a $get property
      else {
        // if the provider's $get property is NOT a function, straight return that
        if (typeof providerInst['$get'] !== 'function') {
          inst = providerInst['$get'];
        }
        // else if $get is a CTOR function
        else {
          // mark this service as being instantiated
          container[name] = INSTANTIATING;

          // invoke the ctor with dependency injection
          inst = invoke(providerInst['$get'], providerInst, function loadDependency(dependency){
            return self.get(dependency);
          });
        }

        // if inst is invalid
        if (inst === null) {
          throw new Error('Service instance resolved to null: \'' + name + '\'');
        }
      }


      container[name] = inst;
    }

    // return our loaded instance
    return inst;
  };


  /**
   * Invoke a function with dependency injection
   * @param fn
   * @param self_
   * @returns {*}
   */
  this.invoke = function(fn, self_) {
    return invoke(fn, self_, function loadDependency(dependency){
      return self.get(dependency);
    });
  };


};


exports.providerInjector = new $providerInjector();
exports.instanceInjector = new $injector(exports.providerInjector);
exports.annotate = annotate;
exports.PROVIDER_SUFFIX = PROVIDER_SUFFIX;

