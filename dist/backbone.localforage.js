// backbone.localforage allows users of Backbone.js to store their collections
// entirely offline with no communication to a REST server. It uses whatever
// driver localForage is set to use to store the data (IndexedDB, WebSQL, or
// localStorage, depending on availability). This allows apps on Chrome,
// Firefox, IE, and Safari to use async, offline storage, which is cool.
//
// The basics of how to use this library is that it lets you override the
// `sync` method on your collections and models to use localForage. So
//
//     var MyModel = Backbone.Collection.extend({})
//     var MyCollection = Backbone.Collection.extend({\
//         model: MyModel
//     });
//
// becomes
//
//     var MyModel = Backbone.Collection.extend({
//         sync: Backbone.localforage.sync()
//     });
//     var MyCollection = Backbone.Collection.extend({
//         model: MyModel,
//         sync: Backbone.localforage.sync('MyCollection')
//     });
//
// Inspiration for this file comes from a few backbone.localstorage
// implementations.
(function (root, factory) {
  if (typeof define === 'function' && define.amd)
    define(['localforage', 'backbone', 'underscore'], factory);
  else if (typeof module !== 'undefined' && module.exports) {
    var localforage = require('localforage');
    var Backbone = require('backbone');
    var _ = require('underscore');
    module.exports = factory(localforage, Backbone, _);
  } else
    factory(root.localforage, root.Backbone, root._);
}(this, function (localforage, Backbone, _) {
    var Promise = window.Promise;

    function S4() {
        return ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
    }

    function guid() {
        return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
    }

    var OfflineStore = function(name) {
        // Initialize data as null so we can test to see if it's been loaded
        // from our data store later on.
        this.data = null;
        this.name = name;
    };

    _.extend(OfflineStore.prototype, {
        save: function (callback) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                localforage.setItem(_this.name, JSON.stringify(_this.data), function(data) {
                    if (callback) {
                        callback(data);
                    }

                    resolve(data);
                });
            });
        },

        create: function(model, callbacks) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                if (_this.data) {
                    if (!model.id) model.id = model.attributes.id = guid();
                    _this.data[model.id] = model.toJSON();
                    _this.save(function() {
                        if (callbacks.success) {
                            callbacks.success(_this.data[model.id]);
                        }

                        resolve(_this.data[model.id]);
                    });
                } else {
                    localforage.getItem(_this.name, function(data) {
                        _this.data = JSON.parse(data) || {};

                        if (!model.id) model.id = model.attributes.id = guid();
                        _this.data[model.id] = model.toJSON();
                        _this.save(function() {
                            if (callbacks.success) {
                                callbacks.success(_this.data[model.id]);
                            }

                            resolve(_this.data[model.id]);
                        });
                    });
                }
            });
        },

        update: function(model, callbacks) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                if (_this.data) {
                    _this.data[model.id] = model.toJSON();
                    _this.save(function() {
                        if (callbacks.success) {
                            callbacks.success(_this.data[model.id]);
                        }

                        resolve(_this.data[model.id]);
                    });
                } else {
                    localforage.getItem(_this.name, function(data) {
                        _this.data = JSON.parse(data) || {};

                        _this.data[model.id] = model.toJSON();
                        _this.save(function() {
                            if (callbacks.success) {
                                callbacks.success(_this.data[model.id]);
                            }

                            resolve(_this.data[model.id]);
                        });
                    });
                }
            });
        },

        find: function(model, callbacks) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                if (_this.data) {
                    if (callbacks.success) {
                        callbacks.success(_this.data[model.id]);
                    }

                    resolve(_this.data[model.id]);
                } else {
                    localforage.getItem(_this.name, function(data) {
                        _this.data = JSON.parse(data) || {};

                        if (callbacks.success) {
                            callbacks.success(_this.data[model.id]);
                        }

                        resolve(_this.data[model.id]);
                    });
                }
            });
        },

        findAll: function(callbacks) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                if (_this.data) {
                    if (callbacks.success) {
                        callbacks.success(_.values(_this.data));
                    }

                    resolve(_.values(_this.data));
                } else {
                    localforage.getItem(_this.name, function(data) {
                        _this.data = JSON.parse(data) || {};
                        if (callbacks.success) {
                            callbacks.success(_.values(_this.data));
                        }

                        resolve(_.values(_this.data));
                    });
                }
            });
        },

        destroy: function(model, callbacks) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                if (_this.data) {
                    delete _this.data[model.id];
                    _this.save(function() {
                        if (callbacks.success) {
                            callbacks.success(model);
                        }

                        resolve(model);
                    });
                } else {
                    localforage.getItem(__this.name, function(data) {
                        _this.data = JSON.parse(data) || {};

                        delete _this.data[model.id];
                        _this.save(function() {
                            if (callbacks.success) {
                                callbacks.success(model);
                            }

                            resolve(model);
                        });
                    });
                }
            });
        }
    });

    function localforageSync(store, method, model, options) {
        switch (method) {
            case "read":
                return model.id ? store.find(model, options) : store.findAll(options);
            case "create":
                return store.create(model, options);
            case "update":
                return store.update(model, options);
            case "delete":
                return store.destroy(model, options);
        }
    }

    // For now, we aren't complicated: just set a property off Backbone to
    // serve as our export point.
    Backbone.localforage = {
        OfflineStore: OfflineStore,

        sync: function(name) {
            var offlineStore;
            var sync;

            // If a name's given we create a store for the model or collection;
            // otherwise we assume it's a model and try to use its collection's
            // store.
            if (name) {
                offlineStore = new OfflineStore(name);

                sync = function(method, model, options) {
                    return localforageSync.apply(null, [offlineStore].concat([].slice.call(arguments, 0)));
                };

                sync.offlineStore = offlineStore;
            } else {
                sync = function(method, model, options) {
                    var offlineStore = model.collection && model.collection.sync.offlineStore;

                    if (offlineStore) {
                        return localforageSync.apply(null, [offlineStore].concat([].slice.call(arguments, 0)));
                    }

                    // It relies on Backbone.sync if the model isn't in a collection or
                    // the collection doesn't have a store
                    return Backbone.sync.apply(this, arguments);
                };
            }

            return sync;
        }
    };

    return Backbone.localforage;
}));
