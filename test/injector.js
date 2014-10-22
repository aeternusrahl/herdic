'use strict';

exports.testAnnotate = function(test){
  var $injector = require('../lib/injector.js');

  var fnNoArgs = function(){};
  var fnOneArg = function(MyArg){};
  function fnTwoArgs(MyFirstArg,$2ndArg){}
  var fnManyArgs = function(a1,a2, a3,   a4,
                            a5){};



  var args = $injector.annotate(fnNoArgs);
  test.equals(args.length, 0, 'Should return array with 0 arguments');

  args = $injector.annotate(fnOneArg);
  test.equals(args.length, 1, 'Should return array with 1 arguments');
  test.equals(args[0], 'MyArg', 'Argument name should match');

  args = $injector.annotate(fnTwoArgs);
  test.equals(args.length, 2, 'Should return array with 2 arguments');
  test.equals(args[0], 'MyFirstArg', 'First argument should be first in array');
  test.equals(args[1], '$2ndArg', 'Second argument should be second in array');

  args = $injector.annotate(fnManyArgs);
  test.equals(args.length, 5, 'Should return array with 5 arguments');
  test.equals(args[0], 'a1', 'Argument 1 should be first in array');
  test.equals(args[1], 'a2', 'Argument 2 should be second in array');
  test.equals(args[2], 'a3', 'Argument 3 should be third in array');
  test.equals(args[3], 'a4', 'Argument 4 should be fourth in array');
  test.equals(args[4], 'a5', 'Argument 5 should be fifth in array');


  test.throws(function(){
    $injector.annotate(1);
  }, Error, 'Should throw exception if func is a number');

  test.throws(function(){
    $injector.annotate('1');
  }, Error, 'Should throw exception if func is a string');

  test.throws(function(){
    $injector.annotate({hi:'hi'});
  }, Error, 'Should throw exception if func is an object');

  test.done();
};


/**
 * Tests for Provider Injector
 */
exports.providerInjector = {

  setUp: function(callback){

    delete require.cache[require.resolve('../lib/injector.js')];
    var $injector = require('../lib/injector.js');
    this.providerInjector = $injector.providerInjector;
    callback();
  },

  /**
   * Register method tests
   */
  testRegisterMethodValidatesInput:function(test){

    var self = this;

    test.throws(function(){
      self.providerInjector.register(45, {});
    }, Error, 'Should throw if name is not string');

    test.throws(function(){
      self.providerInjector.register({}, {});
    }, Error, 'Should throw if name is not string');

    test.throws(function(){
      self.providerInjector.register('MyName', null);
    }, Error, 'Should throw if provider is null');

    test.done();
  },


  testProviderAsObject:function(test){

    var PROVIDER_NAME = 'SimpleObjectProvider';

    var simpleProvider = {
      $get: {
        propertyOne: 'valueOne',
        propertyTwo: {
          propertyThree: 3
        }
      }
    };

    // make sure has returns false before we register it
    test.equals(false, this.providerInjector.has(PROVIDER_NAME), 'Should not have provider before registered');

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, simpleProvider);

    // make sure has returns true (automatically creates instance)
    test.equals(true, this.providerInjector.has(PROVIDER_NAME), 'Should create instance of object provider when registered');

    var inst = this.providerInjector.get(PROVIDER_NAME);

    // verify inst equals $get object
    test.equals(inst, simpleProvider, 'Get provider should return object instance');

    test.done();
  },


  testProviderAsPojo:function(test){

    var PROVIDER_NAME = 'SimpleObjectProvider';

    var simpleProvider = {
      propertyOne: 'valueOne',
      propertyTwo: {
        propertyThree: 3
      }
    };

    // make sure has returns false before we register it
    test.equals(false, this.providerInjector.has(PROVIDER_NAME), 'Should not have provider before registered');

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, simpleProvider);

    // make sure has returns true (automatically creates instance)
    test.equals(true, this.providerInjector.has(PROVIDER_NAME), 'Should create instance of object provider when registered');

    var inst = this.providerInjector.get(PROVIDER_NAME);

    // verify inst equals $get object
    test.equals(inst, simpleProvider, 'Get provider should return object instance');

    test.done();
  },

  testProviderAsString:function(test){

    var PROVIDER_NAME = 'SimpleObjectProvider';

    var simpleProvider = 'My String Constant';

    // make sure has returns false before we register it
    test.equals(false, this.providerInjector.has(PROVIDER_NAME), 'Should not have provider before registered');

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, simpleProvider);

    // make sure has returns true (automatically creates instance)
    test.equals(true, this.providerInjector.has(PROVIDER_NAME), 'Should create instance of object provider when registered');

    var inst = this.providerInjector.get(PROVIDER_NAME);

    // verify inst equals $get object
    test.equals(inst, simpleProvider, 'Get provider should return object instance');

    test.done();
  },


  testProviderAsNumber:function(test){

    var PROVIDER_NAME = 'SimpleObjectProvider';

    var simpleProvider = 3.14159;

    // make sure has returns false before we register it
    test.equals(false, this.providerInjector.has(PROVIDER_NAME), 'Should not have provider before registered');

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, simpleProvider);

    // make sure has returns true (automatically creates instance)
    test.equals(true, this.providerInjector.has(PROVIDER_NAME), 'Should create instance of object provider when registered');

    var inst = this.providerInjector.get(PROVIDER_NAME);

    // verify inst equals $get object
    test.equals(inst, simpleProvider, 'Get provider should return object instance');

    test.done();
  },


  testProviderAsFunctionAsInstance:function(test){
    var PROVIDER_NAME = 'SimpleFuncProvider';

    var funcProvider = function(){
      return 'hello!';
    };

    // make sure has returns false before we register it
    test.equals(false, this.providerInjector.has(PROVIDER_NAME), 'Should not have provider before registered');

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, funcProvider, true);

    // make sure has returns true (automatically creates instance)
    test.equals(true, this.providerInjector.has(PROVIDER_NAME), 'Should create instance of object provider when registered');

    var inst = this.providerInjector.get(PROVIDER_NAME);

    // verify inst equals $get object
    test.equals(inst, funcProvider, 'Get provider should return function instance');

    test.done();
  },


  testProviderFunctionReturnsString:function(test){
    var PROVIDER_NAME = 'InvalidFuncProvider';

    var funcProvider = function(){
      return "hello";
    };

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, funcProvider);

    // get instance of this provider

    var inst = this.providerInjector.get(PROVIDER_NAME);

    test.equals(inst, 'hello', 'Should use function return value');

    test.done();

  },


  testProviderFunctionReturnsNumber:function(test){
    var PROVIDER_NAME = 'InvalidFuncProvider';

    var funcProvider = function(){
      return 42;
    };

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, funcProvider);

    // get instance of this provider

    var inst = this.providerInjector.get(PROVIDER_NAME);

    test.equals(inst, 42, 'Should use function return value');

    test.done();

  },



  testProviderFunctionReturnsPojo:function(test){
    var PROVIDER_NAME = 'InvalidFuncProvider';

    var myObj = {
      something: 'is happening here'
    };
    var funcProvider = function(){
      return myObj;
    };

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, funcProvider);

    // get instance of this provider

    var inst = this.providerInjector.get(PROVIDER_NAME);

    test.equals(inst, myObj, 'Should use function return value');

    test.done();

  },


  testProviderFunctionCreatesProvider:function(test){
    var PROVIDER_NAME = 'SimpleFuncProvider';

    var funcProvider = function(){
      this.add = function(){}
      this.$get = function(){
        return {isService: true};
      };
    };

    // make sure has returns false before we register it
    test.equals(false, this.providerInjector.has(PROVIDER_NAME), 'Should not have provider before registered');

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, funcProvider);

    // make sure does not create inst yet
    test.equals(false, this.providerInjector.has(PROVIDER_NAME), 'Should not create inst when registered');


    // get instance of this provider
    var inst = this.providerInjector.get(PROVIDER_NAME);

    // make sure has add method
    test.ok(inst.hasOwnProperty('add'), 'Provider instance should have add property');
    test.ok(inst.hasOwnProperty('$get'), 'Provider instance should have $get property');

    test.done();
  },


  testProviderFunctionReturnsFunction:function(test){
    var PROVIDER_NAME = 'SimpleFuncProvider';

    var inner = function(){};

    var funcProvider = function(){
      return inner;
    };

    // make sure has returns false before we register it
    test.equals(false, this.providerInjector.has(PROVIDER_NAME), 'Should not have provider before registered');

    // register the provider
    this.providerInjector.register(PROVIDER_NAME, funcProvider);

    // make sure does not create inst yet
    test.equals(false, this.providerInjector.has(PROVIDER_NAME), 'Should not create inst when registered');


    // get instance of this provider
    var inst = this.providerInjector.get(PROVIDER_NAME);

    test.equals(inst, inner, 'Should use function return value');

    test.done();
  },


  testProviderFunctionWithInjectionArgs:function(test){
    function worldProviderFunc(){
      return 'world';
    }

    function greetingProviderFunc(WorldProvider){
      return 'hello ' + WorldProvider;
    }

    // register both providers
    this.providerInjector.register('GreetingProvider', greetingProviderFunc);
    this.providerInjector.register('WorldProvider', worldProviderFunc);

    // no instances yet
    test.equals(false, this.providerInjector.has('GreetingProvider'));
    test.equals(false, this.providerInjector.has('WorldProvider'));

    // get an instance of the greeting provider
    var inst = this.providerInjector.get('GreetingProvider');

    // both instances should have been created
    test.equals(true, this.providerInjector.has('GreetingProvider'));
    test.equals(true, this.providerInjector.has('WorldProvider'));

    // make sure it's got the greeting
    test.equal(inst, 'hello world', 'Provider should be injected with dependency');

    test.done();
  },

  testProviderFunctionWithCircularDependency:function(test){
    var self = this;

    function worldProviderFunc(GreetingProvider){
      return GreetingProvider + ' world';
    }

    function greetingProviderFunc(WorldProvider){
      return 'hello ' + WorldProvider;
    }

    // register both providers
    this.providerInjector.register('GreetingProvider', greetingProviderFunc);
    this.providerInjector.register('WorldProvider', worldProviderFunc);

    // no instances yet
    test.equals(false, this.providerInjector.has('GreetingProvider'));
    test.equals(false, this.providerInjector.has('WorldProvider'));

    // get an instance of the greeting provider
    test.throws(function(){
      self.providerInjector.get('GreetingProvider');
    }, Error, 'Should throw exception if circular dependency');

    test.equals(false, this.providerInjector.has('GreetingProvider'), 'Should not instantiate provider');
    test.equals(false, this.providerInjector.has('WorldProvider'), 'Should not instantiate provider');

    test.done();
  },



  testProviderFunctionWithUnknownDependencies:function(test){
    var self = this;

    function worldProviderFunc(AnotherProvider){
      return 'world';
    }

    function greetingProviderFunc(WorldProvider){
      return 'hello ' + WorldProvider;
    }

    // register both providers
    this.providerInjector.register('GreetingProvider', greetingProviderFunc);
    this.providerInjector.register('WorldProvider', worldProviderFunc);

    // no instances yet
    test.equals(false, this.providerInjector.has('GreetingProvider'));
    test.equals(false, this.providerInjector.has('WorldProvider'));

    // get an instance of the greeting provider
    test.throws(function(){
      self.providerInjector.get('GreetingProvider');
    }, Error, 'Should throw if cant instantiate dependency');

    test.done();
  },



  testProviderFunctionWithUninjectableDependencies:function(test){
    var self = this;

    function worldProviderFunc(){
      return {
        $get:'world',
        $injectable: false
      };
    }

    function greetingProviderFunc(WorldProvider){
      return 'hello ' + WorldProvider;
    }

    // register both providers
    this.providerInjector.register('GreetingProvider', greetingProviderFunc);
    this.providerInjector.register('WorldProvider', worldProviderFunc);

    // no instances yet
    test.equals(false, this.providerInjector.has('GreetingProvider'));
    test.equals(false, this.providerInjector.has('WorldProvider'));

    // get an instance of the greeting provider
    test.throws(function(){
      self.providerInjector.get('GreetingProvider');
    }, Error, 'Should throw if cant inject dependency');


    test.done();
  },

};




/**
 * Tests for Provider Injector
 */
exports.instanceInjector = {

  setUp: function(callback){
    delete require.cache[require.resolve('../lib/injector.js')];
    var $injector = require('../lib/injector.js');
    this.providerInjector = $injector.providerInjector;
    this.instanceInjector = $injector.instanceInjector;
    callback();
  },


  testUnknownProvider: function(test) {
    var self = this;
    test.throws(function(){
      self.instanceInjector.get('INeverDefinedThis');
    }, Error, 'Should throw if no provider');

    test.done();
  },


  testLookupProviderWithExactName: function(test){
    var ConfigProviderObj = {MyConfigValue:42};

    // register a constant provider
    this.providerInjector.register('Config', ConfigProviderObj);

    var inst = this.instanceInjector.get('Config');

    test.equals(inst, ConfigProviderObj, 'Should return provider instance with same name');

    test.done();
  },


  testLookupProviderWithProviderSuffix: function(test){
    var ConfigProviderObj = {MyConfigValue:42};

    // register a constant provider
    this.providerInjector.register('ConfigProvider', ConfigProviderObj);

    var inst = this.instanceInjector.get('Config');

    test.equals(inst, ConfigProviderObj, 'Should find provider with suffix');

    test.done();
  },

  testProviderInstanceIsConstantNumber: function(test){
    var ConstProvider = 42;

    this.providerInjector.register('Const', ConstProvider);

    var inst = this.instanceInjector.get('Const');

    test.equals(inst, ConstProvider, 'Should return provider instance for constant');

    test.done();
  },

  testProviderInstanceIsConstantString: function(test){
    var ConstProvider = 'fortytwo';

    this.providerInjector.register('Const', ConstProvider);

    var inst = this.instanceInjector.get('Const');

    test.equals(inst, ConstProvider, 'Should return provider instance for constant');

    test.done();
  },


  testProviderInstanceIsNotInjectable: function(test){
    var self = this;
    var MyServiceProvider = function(){
      this.$get = 'Hi';
      this.$injectable = false;
    };

    this.providerInjector.register('MyServiceProvider', MyServiceProvider);
    this.providerInjector.instantiateAll();

    test.throws(function(){
      self.instanceInjector.get('MyServiceProvider');
    }, Error, 'Should throw if trying to get service for uninjectable provider by exact name');

    var inst = this.instanceInjector.get('MyService');
    test.equals(inst, 'Hi', 'Can get uninjectable instance by service name');

    test.done();
  },


  testProviderInstanceProvidesObject: function(test){
    var self = this;
    var SampleProvider = function(){
      this.$get = {
        hello:'world'
      };
    };

    this.providerInjector.register('SampleProvider', SampleProvider);

    // cant get until has instance
    test.throws(function(){
      self.instanceInjector.get('Sample');
    }, Error, 'Throws if no provider instance created');

    // forcibly create a provider instance
    this.providerInjector.instantiateAll();

    var inst = this.instanceInjector.get('Sample');

    test.equals(inst.hello, 'world', 'Should return provided object');

    test.done();
  },


  testInjectServiceDependencies:function(test){
    var WorldProviderFunc = function(){
      this.$get = 'world';
    };

    var GreetingProviderFunc = function(){
      this.$get = function(World){
        return 'hello ' + World;
      };
    };

    // register and instantiate providers (config phase)
    this.providerInjector.register('WorldProvider', WorldProviderFunc);
    this.providerInjector.register('GreetingProvider', GreetingProviderFunc);
    this.providerInjector.instantiateAll();

    // get instance of Greeting "service"
    var greeting = this.instanceInjector.get('Greeting');
    test.equals(greeting, 'hello world', 'Should inject dependencies and create service');

    test.done();
  },

  testInjectWithCircularDependencies:function(test){
    var self = this;

    var WorldProviderFunc = function(){
      this.$get = function(Greeting){
        return Greeting + ' world';
      };
    };

    var GreetingProviderFunc = function(){
      this.$get = function(World){
        return 'hello ' + World;
      };
    };

    // register and instantiate providers (config phase)
    this.providerInjector.register('WorldProvider', WorldProviderFunc);
    this.providerInjector.register('GreetingProvider', GreetingProviderFunc);
    this.providerInjector.instantiateAll();

    // get instance of Greeting "service"
    test.throws(function(){
      self.instanceInjector.get('Greeting');
    }, Error, 'Should throw if circular dependency');

    test.done();
  },

  testInvokeMethodWithInjectedDependencies: function(test){

    var WorldProviderFunc = function(){
      this.$get = 'world';
    };

    var GreetingProviderFunc = function(){
      this.$get = function(World){
        return 'hello ' + World;
      };
    };

    var NameProviderFunc = function(){
      this.$get = function(){
        return 'Bob';
      };
    };

    // register and instantiate providers (config phase)
    this.providerInjector.register('WorldProvider', WorldProviderFunc);
    this.providerInjector.register('GreetingProvider', GreetingProviderFunc);
    this.providerInjector.register('NameProvider', NameProviderFunc);
    this.providerInjector.instantiateAll();

    var myFunction = function(Name, Greeting){
      this.name = Name;
      this.greeting = Greeting;
    };

    var instance = {};
    this.instanceInjector.invoke(myFunction, instance);

    test.equals(instance.name, 'Bob', 'Should inject name service');
    test.equals(instance.greeting, 'hello world', 'Should inject greeting service');
    test.done();
  }
};