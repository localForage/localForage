// backbone.localForage allows users of Backbone.js to store their collections
// entirely offline with no communication to a REST server. It uses IndexedDB
// or localStorage (depending on availability) to store the data. This allows
// apps on Chrome and Firefox to use async, offline storage, which is cool.
//
// Inspiration for this file comes from a few backbone.localstorage
// implementations.
define(["underscore", "zepto", "backbone", "localforage"], function (_, $, Backbone, localForage) {
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
            var d = $.Deferred();

            localForage.setItem(this.name, JSON.stringify(this.data), function(data) {
                if (callback) {
                    callback(data);
                }

                d.resolve(data);
            });

            return d.promise();
        },

        create: function(model, callbacks) {
            var d = $.Deferred();

            if (this.data) {
                if (!model.id) model.id = model.attributes.id = guid();
                this.data[model.id] = model;
                this.save(function() {
                    if (callbacks.success) {
                        callbacks.success(model);
                    }

                    d.resolve(model);
                });
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};

                    if (!model.id) model.id = model.attributes.id = guid();
                    self.data[model.id] = model;
                    self.save(function() {
                        if (callbacks.success) {
                            callbacks.success(model);
                        }

                        d.resolve(model);
                    });
                });
            }

            return d.promise();
        },

        update: function(model, callbacks) {
            var d = $.Deferred();

            if (this.data) {
                this.data[model.id] = model;
                this.save(function() {
                    if (callbacks.success) {
                        callbacks.success(model);
                    }

                    d.resolve(model);
                });
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};

                    self.data[model.id] = model;
                    self.save(function() {
                        if (callbacks.success) {
                            callbacks.success(model);
                        }

                        d.resolve(model);
                    });
                });
            }

            return d.promise();
        },

        find: function(model, callbacks) {
            var d = $.Deferred();

            if (this.data) {
                if (callbacks.success) {
                    callbacks.success(this.data[model.id]);
                }

                d.resolve(this.data[model.id]);
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};

                    if (callbacks.success) {
                        callbacks.success(self.data[model.id]);
                    }

                    d.resolve(self.data[model.id]);
                });
            }

            return d.promise();
        },

        findAll: function(callbacks) {
            var d = $.Deferred();

            if (this.data) {
                if (callbacks.success) {
                    callbacks.success(_.values(this.data));
                }

                d.resolve(_.values(this.data));
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};
                    if (callbacks.success) {
                        callbacks.success(_.values(self.data));
                    }

                    d.resolve(_.values(self.data));
                });
            }

            return d.promise();
        },

        destroy: function(model, callbacks) {
            var d = $.Deferred();

            if (this.data) {
                delete this.data[model.id];
                this.save(function() {
                    if (callbacks.success) {
                        callbacks.success(model);
                    }

                    d.resolve(model);
                });
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};

                    delete self.data[model.id];
                    self.save(function() {
                        if (callbacks.success) {
                            callbacks.success(model);
                        }

                        d.resolve(model);
                    });
                });
            }

            return d.promise();
        }
    });

    // Override Backbone.sync to call our custom offline sync only.
    // TODO: Allow access to original sync?
    Backbone.sync = function(method, model, options) {
        var store = model.offlineStore || model.localStorage || model.collection.offlineStore || model.collection.localStorage;

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

    return OfflineStore;
});
