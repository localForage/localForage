// backbone.localForage allows users of Backbone.js to store their collections
// entirely offline with no communication to a REST server. It uses IndexedDB
// or localStorage (depending on availability) to store the data. This allows
// apps on Chrome and Firefox to use async, offline storage, which is cool.
//
// Inspiration for this file comes from a few backbone.localstorage
// implementations.
define(["underscore", "backbone", "localforage"], function (_, Backbone, localForage) {
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
            localForage.setItem(this.name, JSON.stringify(this.data), callback);
        },

        create: function(model, options) {
            if (this.data) {
                if (!model.id) model.id = model.attributes.id = guid();
                this.data[model.id] = model;
                this.save(function() {
                    options.success(model);
                });
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};

                    if (!model.id) model.id = model.attributes.id = guid();
                    self.data[model.id] = model;
                    self.save(function() {
                        options.success(model);
                    });
                });
            }
        },

        update: function(model, options) {
            if (this.data) {
                this.data[model.id] = model;
                this.save(function() {
                    options.success(model);
                });
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};

                    self.data[model.id] = model;
                    self.save(function() {
                        options.success(model);
                    });
                });
            }
        },

        find: function(model, options) {
            if (this.data) {
                options.success(this.data[model.id]);
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};
                    options.success(self.data[model.id]);
                });
            }
        },

        findAll: function(options) {
            if (this.data) {
                options.success(_.values(this.data));
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};
                    options.success(_.values(self.data));
                });
            }
        },

        destroy: function(model, options) {
            if (this.data) {
                delete this.data[model.id];
                this.save(function() {
                    options.success(model);
                });
            } else {
                var self = this;

                localForage.getItem(this.name, function(data) {
                    self.data = JSON.parse(data) || {};

                    delete self.data[model.id];
                    self.save(function() {
                        options.success(model);
                    });
                });
            }
        }
    });

    // Override Backbone.sync to call our custom offline sync only.
    // TODO: Allow access to original sync?
    Backbone.sync = function(method, model, options) {
        var store = model.localStorage || model.collection.localStorage;

        switch (method) {
            case "read":
                if (model.id) {
                    store.find(model, options);
                } else {
                    store.findAll(options);
                }
                break;
            case "create":
                store.create(model, options);
                break;
            case "update":
                store.update(model, options);
                break;
            case "delete":
                store.destroy(model, options);
                break;
        }
    };

    return OfflineStore;
});
