herdic
========

Herdic is a light-weight application bootstrap framework for nodejs with dependency injection.
It is based on patterns in [AngularJS](https://docs.angularjs.org/guide/module).

# Motivation
There are a lot of IoC node modules out there. However, none of them quite fit what I wanted for a server project I was
starting. I like the AngularJS module pattern with automatic dependency injection for services and
providers. I also wanted to make sure that the various application components could be loaded into a unit test without
having to go through the DI system. This module is an attempt to allow me to use those same patterns on server-side
nodejs projects. However, to avoid confusion I use the term bundles instead of modules so as not to conflict with nodejs
terminology.

# Installation
    npm install herdic

# Useage

## Bundles
A herdic application is collection of bundles.
A bundle is a named group of components (services, providers, or values) that provide related functionality.

A bundle is defined by a bundle definition object.

```
{
    // Required
    // String identifier for the bundle. Used to declare dependencies between bundles
    name: 'MyFeatureBundle',

    // Optional
    // Array of names of other bundles on which this one depends.
    // This are used to ensure modules are processed in the right order when the application is booted
    depends: ['MyOtherBundle'],

    // Optional
    // Dependency-injected function used to configure this module's providers before the application starts
    config: function(ServiceOneProvider, ServiceTwoProvider) {  },

    // Optional
    // Dependency-injected function used to initialize this module and its services
    run: function(ServiceOne, ServiceTwo) { },

    // Optional
    // Array of component definition objects (See components)
    components: []
}
```

Use the loadBundle method to load a module. Note that this must be done prior to booting the application.

```
var hedric = require('hedric');
hedric.loadBundle(require('./MyFeatureBundle/bundle.js'));

```

The intention is for each bundle to be in a separate folder. Thus each bundle folder would contain a `bundle.js`.

```
// MyFeatureBundle/bundle.js
module.exports = {
    name: 'MyFeatureBundle',
    components:[
        require('./MyFeatureConfigs.js'),
        require('./MyFeatureService.js')
    ]
};

```


## Components
Components are the things inside a bundle that can be injected as dependencies.  There are three flavors of components--
values, services, providers.

A component is defined by a component definition object.  The exact syntax depends on the type of component. See below
for examples.

### Values
A *value* component is any plain javascript value. It can be a string, number, object, etc. *Value* components are useful
for injecting constant configuration values into your services.

A *value* can be injected into any provider, service, config, or run function.

```
// MyFeatureConfig.js
module.exports = {
    // Required
    // Component identifier. Must be unique throughout entire application
    name: 'MyFeatureConfig',

    // Required
    // The javascript value
    value: {
        someUrl: 'https://github.com',
        somePort: 443
    }
};
```

### Services
A service component defines a singleton that can be injected to other parts of your application. When you define a
service, you define a constructor function with arguments whose names match those of the other components you want
to have injected into your service. When that service is instantiated, the arguments will be automatically
populated with instances of those other components.

A service can be injected into other services or a bundle's run function. Services cannot be injected into providers
or a bundle's config function.  For an explanation of this, see [Booting](#booting).

```
// MyFeatureService.js
module.exports = {
    // Required
    // Component identifier. Must be unique throughout entire application.
    name: 'MyFeatureService',

    // Required
    // A dependency-injected constructor function which creates a service object
    service: function(MyFeatureConfig, AnotherService){
        this.getSomeUrl = function(){
            return MyFeatureConfig.someUrl;
        };
    }
};
```

### Providers
A provider is the most advanced component. It also defines a service except that it can be configured during the
configuration phase prior to instantiating the service.

Providers can be injected into other providers and into a bundle's config function.  A provider cannot be injected into
a service. However, the service it *provides* can be.

```
// GreeterProvider.js
module.exports = {
    // Required
    // Base name of the service this provider will instantiate.
    name: 'Greeter',

    // Required
    // A dependency-injected constructor function which creates a provider object.
    // A provider is required to define a $get property. Typically, this is another
    // dependency-injected constructor function that will be used to instantiate the
    // service after the configuration phase.
    provider: function GreeterProvider(){
        var theGreeting = 'hello';
        this.setGreeting = function(newGreeting){
            theGreeting = newGreeting;
        };

        this.$get = function Greeter(MyFeatureConfig, AnotherService){
            this.greet = function(person) {
                console.log(theGreeting + ' ' + person);
            }
        };
    }
};


// bundle.js
module.exports = {
    name: 'FrenchBundle',
    config: function(GreeterProvider){
        GreeterProvider.setGreeting('Bonjour');
    },
    run:function(Greeter){
        // outputs 'Bonjour Dave' because we override the default greeting in our config function
        Greeter.greet('Dave');
    }
};

```


## <a name="booting">Booting</a>
After all the modules are loaded, it is time to boot the application.
    hedric.boot();
The boot process takes place in two phases: configuration and run.

### Configure Phase
In the configuration phase, all providers are instantiated and each module's `config` function is called (if defined).
This is typically where you would override any default values in your providers. Module's are configured in order of
their dependencies. So if ModuleB depends on ModuleA, ModuleA's config function is guaranteed to be called before that
of ModuleB.

### Run Phase
After configuration is complete, it is time to fully initialize the application. Just like each module's config function
was called in the configuration phase, in the run phase each module's run function is invoked. Again, modules are
started up in order of dependency.

