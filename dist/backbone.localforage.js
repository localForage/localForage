// backbone.localforage allows users of Backbone.js to store their collections
// entirely offline with no communication to a REST server. It uses IndexedDB
// or localStorage (depending on availability) to store the data. This allows
// apps on Chrome and Firefox to use async, offline storage, which is cool.
//
// Inspiration for this file comes from a few backbone.localstorage
// implementations.
(function() {
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
                    _this.data[model.id] = model;
                    _this.save(function() {
                        if (callbacks.success) {
                            callbacks.success(model);
                        }

                        resolve(model);
                    });
                } else {
                    localforage.getItem(_this.name, function(data) {
                        _this.data = JSON.parse(data) || {};

                        if (!model.id) model.id = model.attributes.id = guid();
                        _this.data[model.id] = model;
                        _this.save(function() {
                            if (callbacks.success) {
                                callbacks.success(model);
                            }

                            resolve(model);
                        });
                    });
                }
            });
        },

        update: function(model, callbacks) {
            var _this = this;
            return new Promise(function(resolve, reject) {
                if (_this.data) {
                    _this.data[model.id] = model;
                    _this.save(function() {
                        if (callbacks.success) {
                            callbacks.success(model);
                        }

                        resolve(model);
                    });
                } else {
                    localforage.getItem(_this.name, function(data) {
                        _this.data = JSON.parse(data) || {};

                        _this.data[model.id] = model;
                        _this.save(function() {
                            if (callbacks.success) {
                                callbacks.success(model);
                            }

                            resolve(model);
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

    // Override Backbone.sync to call our custom offline sync only.
    // TODO: Allow access to original sync?
    Backbone.sync = function(method, model, options) {
        var store = model.offlineStore || model.collection.offlineStore;

        switch (method) {
            case "read":
                return model.id ? store.find(model, options) : store.findAll(options);
                break;
            case "create":
                return store.create(model, options);
                break;
            case "update":
                return store.update(model, options);
                break;
            case "delete":
                return store.destroy(model, options);
                break;
        }
    };

    // For now, we aren't complicated: just set a property off Backbone to
    // serve as our export point.
    Backbone.localforage = OfflineStore;

    return OfflineStore;
}).call(this);
