'use strict';

var $q = require('q');

exports.setUp = function(callback){
  delete require.cache[require.resolve('../lib/injector.js')];
  delete require.cache[require.resolve('../lib/herdic.js')];
  this.herdic = require('../lib/herdic.js');

  callback();
};

exports.loadBundle = {

  testNotObject: function(test){
    var self = this;

    test.throws(function(){
      self.herdic.loadBundle('NotABundle');
    }, Error, 'Throws if argument is string');

    test.throws(function(){
      self.herdic.loadBundle(59);
    }, Error, 'Throws if argument is number');

    test.throws(function(){
      self.herdic.loadBundle(null);
    }, Error, 'Throws if argument is null');

    test.done();

  },

  testValidateName: function(test){
    var self = this;

    test.throws(function(){
      self.herdic.loadBundle({});
    }, Error, 'Throws if bundle has no name');

    test.throws(function(){
      self.herdic.loadBundle({name:null});
    }, Error, 'Throws if bundle name is null');

    test.throws(function(){
      self.herdic.loadBundle({name:42});
    }, Error, 'Throws if bundle name is a number');

    test.throws(function(){
      self.herdic.loadBundle({name:{}});
    }, Error, 'Throws if bundle name is an object');

    test.throws(function(){
      self.herdic.loadBundle({name:' \t'});
    }, Error, 'Throws if bundle name is whitespace');

    this.herdic.loadBundle({name:'RealBundle'});

    test.done();
  },

  testValidateDepends: function(test){
    var self = this;

    test.throws(function(){
      self.herdic.loadBundle({name: 'MyBundle', depends:'not an array'});
    }, Error, 'Throws if bundle depends is not an array');

    test.throws(function(){
      self.herdic.loadBundle({name: 'MyBundle', depends:{a:'a',b:'b'}});
    }, Error, 'Throws if bundle depends is an object');

    // should allow null
    this.herdic.loadBundle({name:'MyBundle', depends:null});

    // should allow array
    this.herdic.loadBundle({name:'MyBundle', depends:[]});

    test.done();
  },


  testValidateConfig: function(test){
    var self = this;

    test.throws(function(){
      self.herdic.loadBundle({name: 'MyBundle', config:'a string'});
    }, Error, 'Throws if bundle config is a string');

    test.throws(function(){
      self.herdic.loadBundle({name: 'MyBundle', config:{a:'a string'}});
    }, Error, 'Throws if bundle config is an object');


    // should allow null
    this.herdic.loadBundle({name:'MyBundle', config:null});

    // should allow array
    this.herdic.loadBundle({name:'MyBundle', config:function(){}});

    test.done();
  },


  testValidateRun: function(test){
    var self = this;

    test.throws(function(){
      self.herdic.loadBundle({name: 'MyBundle', run:'a string'});
    }, Error, 'Throws if bundle run is a string');

    test.throws(function(){
      self.herdic.loadBundle({name: 'MyBundle', run:{a:'a string'}});
    }, Error, 'Throws if bundle run is an object');


    // should allow null
    this.herdic.loadBundle({name:'MyBundle', run:null});

    // should allow array
    this.herdic.loadBundle({name:'MyBundle', run:function(){}});

    test.done();
  },


  testValidateComponents: function(test){
    var self = this;

    test.throws(function(){
      self.herdic.loadBundle({name: 'MyBundle', components:'a string'});
    }, Error, 'Throws if bundle components is a string');

    test.throws(function(){
      self.herdic.loadBundle({name: 'MyBundle', components:{a:'a string'}});
    }, Error, 'Throws if bundle components is an object');


    // should allow null
    this.herdic.loadBundle({name:'MyBundle', components:null});

    // should allow array
    this.herdic.loadBundle({name:'MyBundle', components:[]});


    // should throw if submodule doesnt have name
    test.throws(function(){
      self.herdic.loadBundle({name:'MyBundle', components:[
        {}
      ]});
    }, Error, 'Should throw if submodule doesnt haven name');


    test.throws(function(){
      self.herdic.loadBundle({name:'MyBundle', components:[
        {name:null}
      ]});
    }, Error, 'Should throw if submodule name is null');

    test.throws(function(){
      self.herdic.loadBundle({name:'MyBundle', components:[
        {name:56}
      ]});
    }, Error, 'Should throw if submodule name is number');

    test.throws(function(){
      self.herdic.loadBundle({name:'MyBundle', components:[
        {name:{}}
      ]});
    }, Error, 'Should throw if submodule name is object');

    test.throws(function(){
      self.herdic.loadBundle({name:'MyBundle', components:[
        {name:'service'}
      ]});
    }, Error, 'Should throw if submodule has no definition');

    self.herdic.loadBundle({name:'MyBundle', components:[
      {name:'service', value:'Constant'}
    ]});

    test.done();
  }
};



exports.getBundle = {

  testGetUnknownBundle: function(test){
    var self = this;

    test.throws(function(){
      self.herdic.getBundle('nothingLoaded');
    }, Error, 'Should throw if getBundle before any are loaded');

    self.herdic.loadBundle({name:'a bundle'});

    test.throws(function(){
      self.herdic.getBundle('NotTheRightName');
    }, Error, 'Should throw if getBundle on unknown name');


    test.done();
  },


  testGetBundleExtraProperties: function(test){

    var CustomBundleDef = {
      name: 'CustomBundle',
      depends: ['AnotherBundle'],
      config: function(){},
      run: function(){},
      myextra: {
        settingA: 'ValueA'
      }
    };

    // load the bundle
    this.herdic.loadBundle(CustomBundleDef);


    // get the bundle
    var bundle = this.herdic.getBundle('CustomBundle');

    // make sure got right bundle
    test.equals(bundle, CustomBundleDef, 'Should return same bundle definition object');
    test.equals(bundle.myextra.settingA, 'ValueA', 'Should preserve extra properties on bundle');

    test.done();
  },


  testGetAllBundles: function(test){

    // get when no bundles registered
    var result = this.herdic.getAllBundles();

    test.ok(Array.isArray(result), 'Returns array');
    test.equals(0, result.length, 'Returns 0-length array when no bundles registered');

    this.herdic.loadBundle({name:'BundleB', depends:['BundleA']});
    this.herdic.loadBundle({name:'BundleA', depends:[]});

    result = this.herdic.getAllBundles();

    test.equals(2, result.length, 'Returns array with all registered bundles');
    test.equals(result[0].name, 'BundleA', 'First result should be root dependency');
    test.equals(result[1].name, 'BundleB', 'Second result should be other bundle');

    test.done();
  }

};



exports.boot = {

  testBootSingleBundle: function(test){

    var configureCalled = false;
    var runCalled = false;

    var BundleA = {
      name: 'BundleA',
      config: function(MyServiceProvider){

        test.ok(!configureCalled, 'Should not call configure more than once');
        test.ok(!runCalled, 'Should not call configure after run');

        configureCalled = true;
        test.ok(MyServiceProvider.hasOwnProperty('setConfigValue'), 'Should inject provider into config function');
        MyServiceProvider.setConfigValue(4259);
      },
      run: function(MyService, SimpleService){
        test.ok(configureCalled, 'Should call run after configure');
        test.ok(!runCalled, 'Should not call run more than once');
        runCalled = true;
        test.equals(MyService.value, 4259, 'Should inject service into run function');
        test.ok(SimpleService != null, 'Should inject simple service into run function');
        test.ok(SimpleService.hasOwnProperty('doStuff'), 'Should create service instance');
      },
      components:[
        {
          name:'MyService',
          provider: function(){
            var configValue = null;
            this.setConfigValue = function(arg) {
              configValue = arg;
            };
            this.$get = function(){
              return {value:configValue};
            };
          }//end provider
        },
        {
          name:'SimpleService',
          service: function(){
            this.doStuff = function(){};
          }
        }
      ]
    };

    this.herdic.loadBundle(BundleA);
    var result = this.herdic.boot();

    test.ok($q.isPromise(result), 'boot should return a promise');

    result.then(function(){
      test.ok(configureCalled, 'should call configure function');
      test.ok(runCalled, 'should call run function');
    }).catch(function(){
      test.fail('Should not reject boot promise');
    }).finally(function(){
      test.done();
    });
  },



  testBootBundleWithDependency: function(test){

    var called = {
      configure: {
        a: false,
        b: false,
        c: false
      },
      run: {
        a: false,
        b: false,
        c: false
      }
    };

    var BundleA = {
      name: 'BundleA',
      config: function(){
        test.ok(!called.configure.a, 'should not call config on A more than once');
        test.ok(!called.configure.b, 'should call config on A before B');
        test.ok(!called.configure.c, 'should call config on A before C');

        called.configure.a = true;

        return $q.when();
      },
      run: function(){
        test.ok(!called.run.a, 'should not call run on A more than once');
        test.ok(!called.run.b, 'should call run on A before B');
        test.ok(!called.run.c, 'should call run on A before C');

        called.run.a = true;

        return $q.when().delay(50);
      },
      components:[

      ]
    };

    var BundleB = {
      name: 'BundleB',
      depends:['BundleA'],
      config: function(){
        test.ok(called.configure.a, 'should call config on A before B');
        test.ok(!called.configure.b, 'should call config on B more than once');
        test.ok(!called.configure.c, 'should call config on C before B');

        called.configure.b = true;
      },
      run: function(){
        test.ok(called.run.a, 'should call run on A before B');
        test.ok(!called.run.b, 'should call run on B more than once');
        test.ok(!called.run.c, 'should call run on C before B');

        called.run.b = true;
      },
      components:[

      ]
    };

    var BundleC = {
      name: 'BundleC',
      depends: ['BundleB'],
      config: function(){
        test.ok(called.configure.a, 'should call config on A before C');
        test.ok(called.configure.b, 'should call config on B before C');
        test.ok(!called.configure.c, 'should not call config on C more than once');

        called.configure.c = true;
        return $q.when().delay(10);
      },
      run: function(){
        test.ok(called.run.a, 'should call run on A before C');
        test.ok(called.run.b, 'should call run on B before C');
        test.ok(!called.run.c, 'should not call run on C more than once');

        called.run.c = true;
      },
      components:[

      ]
    };


    this.herdic.loadBundle(BundleB);
    this.herdic.loadBundle(BundleC);
    this.herdic.loadBundle(BundleA);
    var result = this.herdic.boot();

    test.ok($q.isPromise(result), 'boot should return promise');

    result.then(function(){
      test.ok(called.configure.a, 'Should call configure on bundle a');
      test.ok(called.configure.b, 'Should call configure on bundle b');
      test.ok(called.configure.c, 'Should call configure on bundle c');

      test.ok(called.run.a, 'Should call run on bundle a');
      test.ok(called.run.b, 'Should call run on bundle b');
      test.ok(called.run.c, 'Should call run on bundle c');

    }).catch(function(){
      test.fail('Should not reject boot promise');
    }).finally(function(){
      test.done();
    });

  },


  testBootBundleWithCircularDependency: function(test){
    var self = this;

    var BundleA = {
      name: 'BundleA',
      depends: ['BundleB'],
      config: function(){

      },
      run: function(){

      }
    };

    var BundleB = {
      name: 'BundleB',
      depends:['BundleA'],
      config: function(){

      },
      run: function(){

      }
    };


    this.herdic.loadBundle(BundleA);
    this.herdic.loadBundle(BundleB);

    test.throws(function(){
      self.herdic.boot();
    }, Error, 'Should throw if circular dependency in bundle');

    test.done();
  }

};