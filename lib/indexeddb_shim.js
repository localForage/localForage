// IndexedDB Polyfill over WebSql, by Parashuram (http://nparashuram.com/IndexedDBShim/)
/**
 * An initialization file that checks for conditions, removes console.log and warn, etc
 */
var idbModules = {};
(function(idbModules) {
    /**
     * A utility method to callback onsuccess, onerror, etc as soon as the calling function's context is over
     * @param {Object} fn
     * @param {Object} context
     * @param {Object} argArray
     */

    function callback(fn, context, event, func) {
        //window.setTimeout(function(){
        event.target = context;
        (typeof context[fn] === "function") && context[fn].apply(context, [event]);
        (typeof func === "function") && func();
        //}, 1);
    }

    /**
     * Throws a new DOM Exception,
     * @param {Object} name
     * @param {Object} message
     * @param {Object} error
     */

    function throwDOMException(name, message, error) {
        var e = new DOMException.constructor(0, message);
        e.name = name;
        e.message = message;
        e.stack = arguments.callee.caller;
        idbModules.DEBUG && console.log(name, message, error, e);
        throw e;
    }

    /**
     * Shim the DOMStringList object.
     *
     */
    var StringList = function() {
        this.length = 0;
        this._items = [];
        //Internal functions on the prototype have been made non-enumerable below.
        if (Object.defineProperty) {
            Object.defineProperty(this, '_items', {
                enumerable: false
            });
        }
    };
    StringList.prototype = {
        // Interface.
        contains: function(str) {
            return -1 !== this._items.indexOf(str);
        },
        item: function(key) {
            return this._items[key];
        },

        // Helpers. Should only be used internally.
        indexOf: function(str) {
            return this._items.indexOf(str);
        },
        push: function(item) {
            this._items.push(item);
            this.length += 1;
            for (var i = 0; i < this._items.length; i++) {
                this[i] = this._items[i];
            }
        },
        splice: function( /*index, howmany, item1, ..., itemX*/ ) {
            this._items.splice.apply(this._items, arguments);
            this.length = this._items.length;
            for (var i in this) {
                if (i === String(parseInt(i, 10))) {
                    delete this[i];
                }
            }
            for (i = 0; i < this._items.length; i++) {
                this[i] = this._items[i];
            }
        }
    };
    if (Object.defineProperty) {
        for (var i in {
            'indexOf': false,
            'push': false,
            'splice': false
        }) {
            Object.defineProperty(StringList.prototype, i, {
                enumerable: false
            });
        }
    }
    idbModules.util = {
        "throwDOMException": throwDOMException,
        "callback": callback,
        "quote": function(arg) {
            return "'" + arg + "'";
        },
        "StringList": StringList
    };
}(idbModules));
(function(idbModules){
    /**
     * A dummy implementation of the Structured Cloning Algorithm
     * This just converts to a JSON string
     */
    var Sca = (function(){
        return {
            "encode": function(val){
                return JSON.stringify(val);
            },
            "decode": function(val){
                return JSON.parse(val);
            }
        };
    }());
    idbModules.Sca = Sca;
}(idbModules));
(function(idbModules){
    /**
     * Encodes the keys and values based on their types. This is required to maintain collations
     */
    var collations = ["", "number", "string", "boolean", "object", "undefined"];
    var getGenericEncoder = function(){
        return {
            "encode": function(key){
                return collations.indexOf(typeof key) + "-" + JSON.stringify(key);
            },
            "decode": function(key){
                if (typeof key === "undefined") {
                    return undefined;
                }
                else {
                    return JSON.parse(key.substring(2));
                }
            }
        };
    };
    
    var types = {
        "number": getGenericEncoder("number"), // decoder will fail for NaN
        "boolean": getGenericEncoder(),
        "object": getGenericEncoder(),
        "string": {
            "encode": function(key){
                return collations.indexOf("string") + "-" + key;
            },
            "decode": function(key){
                return "" + key.substring(2);
            }
        },
        "undefined": {
            "encode": function(key){
                return collations.indexOf("undefined") + "-undefined";
            },
            "decode": function(key){
                return undefined;
            }
        }
    };
    
    var Key = (function(){
        return {
            encode: function(key){
                return types[typeof key].encode(key);
            },
            decode: function(key){
                return types[collations[key.substring(0, 1)]].decode(key);
            }
        };
    }());
    idbModules.Key = Key;
}(idbModules));

(function(idbModules, undefined){
    // The event interface used for IndexedBD Actions.
    var Event = function(type, debug){
        // Returning an object instead of an even as the event's target cannot be set to IndexedDB Objects
        // We still need to have event.target.result as the result of the IDB request
        return {
            "type": type,
            debug: debug,
            bubbles: false,
            cancelable: false,
            eventPhase: 0,
            timeStamp: new Date()
        };
    };
    idbModules.Event = Event;
}(idbModules));

(function(idbModules){

    /**
     * The IDBRequest Object that is returns for all async calls
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
     */
    var IDBRequest = function(){
        this.onsuccess = this.onerror = this.result = this.error = this.source = this.transaction = null;
        this.readyState = "pending";
    };
    /**
     * The IDBOpen Request called when a database is opened
     */
    var IDBOpenRequest = function(){
        this.onblocked = this.onupgradeneeded = null;
    };
    IDBOpenRequest.prototype = IDBRequest;
    
    idbModules.IDBRequest = IDBRequest;
    idbModules.IDBOpenRequest = IDBOpenRequest;
    
}(idbModules));

(function(idbModules, undefined){
    /**
     * The IndexedDB KeyRange object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
     * @param {Object} lower
     * @param {Object} upper
     * @param {Object} lowerOpen
     * @param {Object} upperOpen
     */
    var IDBKeyRange = function(lower, upper, lowerOpen, upperOpen){
        this.lower = lower;
        this.upper = upper;
        this.lowerOpen = lowerOpen;
        this.upperOpen = upperOpen;
    };
    
    IDBKeyRange.only = function(value){
        return new IDBKeyRange(value, value, true, true);
    };
    
    IDBKeyRange.lowerBound = function(value, open){
        return new IDBKeyRange(value, undefined, open, undefined);
    };
    IDBKeyRange.upperBound = function(value){
        return new IDBKeyRange(undefined, value, undefined, open);
    };
    IDBKeyRange.bound = function(lower, upper, lowerOpen, upperOpen){
        return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
    };
    
    idbModules.IDBKeyRange = IDBKeyRange;
    
}(idbModules));

(function(idbModules, undefined){
    /**
     * The IndexedDB Cursor Object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
     * @param {Object} range
     * @param {Object} direction
     * @param {Object} idbObjectStore
     * @param {Object} cursorRequest
     */
    function IDBCursor(range, direction, idbObjectStore, cursorRequest, keyColumnName, valueColumnName){
        this.__range = range;
        this.source = this.__idbObjectStore = idbObjectStore;
        this.__req = cursorRequest;
        
        this.key = undefined;
        this.direction = direction;
        
        this.__keyColumnName = keyColumnName;
        this.__valueColumnName = valueColumnName;
        
        if (!this.source.transaction.__active) {
            idbModules.util.throwDOMException("TransactionInactiveError - The transaction this IDBObjectStore belongs to is not active.");
        }
        // Setting this to -1 as continue will set it to 0 anyway
        this.__offset = -1;

        this.__lastKeyContinued = undefined; // Used when continuing with a key

        this["continue"]();
    }
    
    IDBCursor.prototype.__find = function(key, tx, success, error){
        var me = this;
        var sql = ["SELECT * FROM ", idbModules.util.quote(me.__idbObjectStore.name)];
        var sqlValues = [];
        sql.push("WHERE ", me.__keyColumnName, " NOT NULL");
        if (me.__range && (me.__range.lower || me.__range.upper)) {
            sql.push("AND");
            if (me.__range.lower) {
                sql.push(me.__keyColumnName + (me.__range.lowerOpen ? " >" : " >= ") + " ?");
                sqlValues.push(idbModules.Key.encode(me.__range.lower));
            }
            (me.__range.lower && me.__range.upper) && sql.push("AND");
            if (me.__range.upper) {
                sql.push(me.__keyColumnName + (me.__range.upperOpen ? " < " : " <= ") + " ?");
                sqlValues.push(idbModules.Key.encode(me.__range.upper));
            }
        }
        if (typeof key !== "undefined") {
            me.__lastKeyContinued = key;
            me.__offset = 0;
        }
        if (me.__lastKeyContinued !== undefined) {
            sql.push("AND " + me.__keyColumnName + " >= ?");
            sqlValues.push(idbModules.Key.encode(me.__lastKeyContinued));
        }
        sql.push("ORDER BY ", me.__keyColumnName);
        sql.push("LIMIT 1 OFFSET " + me.__offset);
        idbModules.DEBUG && console.log(sql.join(" "), sqlValues);
        tx.executeSql(sql.join(" "), sqlValues, function(tx, data){
            if (data.rows.length === 1) {
                var key = idbModules.Key.decode(data.rows.item(0)[me.__keyColumnName]);
                var val = me.__valueColumnName === "value" ? idbModules.Sca.decode(data.rows.item(0)[me.__valueColumnName]) : idbModules.Key.decode(data.rows.item(0)[me.__valueColumnName]);
                success(key, val);
            }
            else {
                idbModules.DEBUG && console.log("Reached end of cursors");
                success(undefined, undefined);
            }
        }, function(tx, data){
            idbModules.DEBUG && console.log("Could not execute Cursor.continue");
            error(data);
        });
    };
    
    IDBCursor.prototype["continue"] = function(key){
        var me = this;
        this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__offset++;
            me.__find(key, tx, function(key, val){
                me.key = key;
                me.value = val;
                success(typeof me.key !== "undefined" ? me : undefined, me.__req);
            }, function(data){
                error(data);
            });
        });
    };
    
    IDBCursor.prototype.advance = function(count){
        if (count <= 0) {
            idbModules.util.throwDOMException("Type Error - Count is invalid - 0 or negative", count);
        }
        var me = this;
        this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__offset += count;
            me.__find(undefined, tx, function(key, value){
                me.key = key;
                me.value = value;
                success(typeof me.key !== "undefined" ? me : undefined, me.__req);
            }, function(data){
                error(data);
            });
        });
    };
    
    IDBCursor.prototype.update = function(valueToUpdate){
        var me = this;
        return this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__find(undefined, tx, function(key, value){
                var sql = "UPDATE " + idbModules.util.quote(me.__idbObjectStore.name) + " SET value = ? WHERE key = ?";
                idbModules.DEBUG && console.log(sql, valueToUpdate, key);
                tx.executeSql(sql, [idbModules.Sca.encode(valueToUpdate), idbModules.Key.encode(key)], function(tx, data){
                    if (data.rowsAffected === 1) {
                        success(key);
                    }
                    else {
                        error("No rowns with key found" + key);
                    }
                }, function(tx, data){
                    error(data);
                });
            }, function(data){
                error(data);
            });
        });
    };
    
    IDBCursor.prototype["delete"] = function(){
        var me = this;
        return this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__find(undefined, tx, function(key, value){
                var sql = "DELETE FROM  " + idbModules.util.quote(me.__idbObjectStore.name) + " WHERE key = ?";
                idbModules.DEBUG && console.log(sql, key);
                tx.executeSql(sql, [idbModules.Key.encode(key)], function(tx, data){
                    if (data.rowsAffected === 1) {
                        success(undefined);
                    }
                    else {
                        error("No rowns with key found" + key);
                    }
                }, function(tx, data){
                    error(data);
                });
            }, function(data){
                error(data);
            });
        });
    };
    
    idbModules.IDBCursor = IDBCursor;
}(idbModules));

(function(idbModules, undefined){
    /**
     * IDB Index
     * http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
     * @param {Object} name;
     * @param {Object} objectStore;
     */
    function IDBIndex(indexName, idbObjectStore){
        this.indexName = this.name = indexName;
        this.__idbObjectStore = this.objectStore = this.source = idbObjectStore;
        
        var indexList = idbObjectStore.__storeProps && idbObjectStore.__storeProps.indexList;
        indexList && (indexList = JSON.parse(indexList));
        
        this.keyPath = ((indexList && indexList[indexName] && indexList[indexName].keyPath) || indexName);
        ['multiEntry','unique'].forEach(function(prop){
            this[prop] = !!indexList && !!indexList[indexName] && !!indexList[indexName].optionalParams && !!indexList[indexName].optionalParams[prop];
        }, this);
    }
    
    IDBIndex.prototype.__createIndex = function(indexName, keyPath, optionalParameters){
        var me = this;
        var transaction = me.__idbObjectStore.transaction;
        transaction.__addToTransactionQueue(function(tx, args, success, failure){
            me.__idbObjectStore.__getStoreProps(tx, function(){
                function error(){
                    idbModules.util.throwDOMException(0, "Could not create new index", arguments);
                }
                if (transaction.mode !== 2) {
                    idbModules.util.throwDOMException(0, "Invalid State error, not a version transaction", me.transaction);
                }
                var idxList = JSON.parse(me.__idbObjectStore.__storeProps.indexList);
                if (typeof idxList[indexName] !== "undefined") {
                    idbModules.util.throwDOMException(0, "Index already exists on store", idxList);
                }
                var columnName = indexName;
                idxList[indexName] = {
                    "columnName": columnName,
                    "keyPath": keyPath,
                    "optionalParams": optionalParameters
                };
                // For this index, first create a column
                me.__idbObjectStore.__storeProps.indexList = JSON.stringify(idxList);
                var sql = ["ALTER TABLE", idbModules.util.quote(me.__idbObjectStore.name), "ADD", columnName, "BLOB"].join(" ");
                idbModules.DEBUG && console.log(sql);
                tx.executeSql(sql, [], function(tx, data){
                    // Once a column is created, put existing records into the index
                    tx.executeSql("SELECT * FROM " + idbModules.util.quote(me.__idbObjectStore.name), [], function(tx, data){
                        (function initIndexForRow(i){
                            if (i < data.rows.length) {
                                try {
                                    var value = idbModules.Sca.decode(data.rows.item(i).value);
                                    var indexKey = eval("value['" + keyPath + "']");
                                    tx.executeSql("UPDATE " + idbModules.util.quote(me.__idbObjectStore.name) + " set " + columnName + " = ? where key = ?", [idbModules.Key.encode(indexKey), data.rows.item(i).key], function(tx, data){
                                        initIndexForRow(i + 1);
                                    }, error);
                                } 
                                catch (e) {
                                    // Not a valid value to insert into index, so just continue
                                    initIndexForRow(i + 1);
                                }
                            }
                            else {
                                idbModules.DEBUG && console.log("Updating the indexes in table", me.__idbObjectStore.__storeProps);
                                tx.executeSql("UPDATE __sys__ set indexList = ? where name = ?", [me.__idbObjectStore.__storeProps.indexList, me.__idbObjectStore.name], function(){
                                    me.__idbObjectStore.__setReadyState("createIndex", true);
                                    success(me);
                                }, error);
                            }
                        }(0));
                    }, error);
                }, error);
            }, "createObjectStore");
        });
    };
    
    IDBIndex.prototype.openCursor = function(range, direction){
        var cursorRequest = new idbModules.IDBRequest();
        var cursor = new idbModules.IDBCursor(range, direction, this.source, cursorRequest, this.indexName, "value");
        return cursorRequest;
    };
    
    IDBIndex.prototype.openKeyCursor = function(range, direction){
        var cursorRequest = new idbModules.IDBRequest();
        var cursor = new idbModules.IDBCursor(range, direction, this.source, cursorRequest, this.indexName, "key");
        return cursorRequest;
    };
    
    IDBIndex.prototype.__fetchIndexData = function(key, opType){
        var me = this;
        return me.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
            var sql = ["SELECT * FROM ", idbModules.util.quote(me.__idbObjectStore.name), " WHERE", me.indexName, "NOT NULL"];
            var sqlValues = [];
            if (typeof key !== "undefined") {
                sql.push("AND", me.indexName, " = ?");
                sqlValues.push(idbModules.Key.encode(key));
            }
            idbModules.DEBUG && console.log("Trying to fetch data for Index", sql.join(" "), sqlValues);
            tx.executeSql(sql.join(" "), sqlValues, function(tx, data){
                var d;
                if (typeof opType === "count") {
                    d = data.rows.length;
                }
                else 
                    if (data.rows.length === 0) {
                        d = undefined;
                    }
                    else 
                        if (opType === "key") {
                            d = idbModules.Key.decode(data.rows.item(0).key);
                        }
                        else { // when opType is value
                            d = idbModules.Sca.decode(data.rows.item(0).value);
                        }
                success(d);
            }, error);
        });
    };
    
    IDBIndex.prototype.get = function(key){
        return this.__fetchIndexData(key, "value");
    };
    
    IDBIndex.prototype.getKey = function(key){
        return this.__fetchIndexData(key, "key");
    };
    
    IDBIndex.prototype.count = function(key){
        return this.__fetchIndexData(key, "count");
    };
    
    idbModules.IDBIndex = IDBIndex;
}(idbModules));

(function(idbModules){

    /**
     * IndexedDB Object Store
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
     * @param {Object} name
     * @param {Object} transaction
     */
    var IDBObjectStore = function(name, idbTransaction, ready){
        this.name = name;
        this.transaction = idbTransaction;
        this.__ready = {};
        this.__setReadyState("createObjectStore", typeof ready === "undefined" ? true : ready);
        this.indexNames = new idbModules.util.StringList();
    };
    
    /**
     * Need this flag as createObjectStore is synchronous. So, we simply return when create ObjectStore is called
     * but do the processing in the background. All other operations should wait till ready is set
     * @param {Object} val
     */
    IDBObjectStore.prototype.__setReadyState = function(key, val){
        this.__ready[key] = val;
    };
    
    /**
     * Called by all operations on the object store, waits till the store is ready, and then performs the operation
     * @param {Object} callback
     */
    IDBObjectStore.prototype.__waitForReady = function(callback, key){
        var ready = true;
        if (typeof key !== "undefined") {
            ready = (typeof this.__ready[key] === "undefined") ? true : this.__ready[key];
        }
        else {
            for (var x in this.__ready) {
                if (!this.__ready[x]) {
                    ready = false;
                }
            }
        }
        
        if (ready) {
            callback();
        }
        else {
            idbModules.DEBUG && console.log("Waiting for to be ready", key);
            var me = this;
            window.setTimeout(function(){
                me.__waitForReady(callback, key);
            }, 100);
        }
    };
    
    /**
     * Gets (and optionally caches) the properties like keyPath, autoincrement, etc for this objectStore
     * @param {Object} callback
     */
    IDBObjectStore.prototype.__getStoreProps = function(tx, callback, waitOnProperty){
        var me = this;
        this.__waitForReady(function(){
            if (me.__storeProps) {
                idbModules.DEBUG && console.log("Store properties - cached", me.__storeProps);
                callback(me.__storeProps);
            }
            else {
                tx.executeSql("SELECT * FROM __sys__ where name = ?", [me.name], function(tx, data){
                    if (data.rows.length !== 1) {
                        callback();
                    }
                    else {
                        me.__storeProps = {
                            "name": data.rows.item(0).name,
                            "indexList": data.rows.item(0).indexList,
                            "autoInc": data.rows.item(0).autoInc,
                            "keyPath": data.rows.item(0).keyPath
                        };
                        idbModules.DEBUG && console.log("Store properties", me.__storeProps);
                        callback(me.__storeProps);
                    }
                }, function(){
                    callback();
                });
            }
        }, waitOnProperty);
    };
    
    /**
     * From the store properties and object, extracts the value for the key in hte object Store
     * If the table has auto increment, get the next in sequence
     * @param {Object} props
     * @param {Object} value
     * @param {Object} key
     */
    IDBObjectStore.prototype.__deriveKey = function(tx, value, key, callback){
        function getNextAutoIncKey(){
            tx.executeSql("SELECT * FROM sqlite_sequence where name like ?", [me.name], function(tx, data){
                if (data.rows.length !== 1) {
                    callback(0);
                }
                else {
                    callback(data.rows.item(0).seq);
                }
            }, function(tx, error){
                idbModules.util.throwDOMException(0, "Data Error - Could not get the auto increment value for key", error);
            });
        }
        
        var me = this;
        me.__getStoreProps(tx, function(props){
            if (!props) {
                idbModules.util.throwDOMException(0, "Data Error - Could not locate defination for this table", props);
            }
            if (props.keyPath) {
                if (typeof key !== "undefined") {
                    idbModules.util.throwDOMException(0, "Data Error - The object store uses in-line keys and the key parameter was provided", props);
                }
                if (value) {
                    try {
                        var primaryKey = eval("value['" + props.keyPath + "']");
                        if (!primaryKey) {
                            if (props.autoInc === "true") {
                                getNextAutoIncKey();
                            }
                            else {
                                idbModules.util.throwDOMException(0, "Data Error - Could not eval key from keyPath");
                            }
                        }
                        else {
                            callback(primaryKey);
                        }
                    } 
                    catch (e) {
                        idbModules.util.throwDOMException(0, "Data Error - Could not eval key from keyPath", e);
                    }
                }
                else {
                    idbModules.util.throwDOMException(0, "Data Error - KeyPath was specified, but value was not");
                }
            }
            else {
                if (typeof key !== "undefined") {
                    callback(key);
                }
                else {
                    if (props.autoInc === "false") {
                        idbModules.util.throwDOMException(0, "Data Error - The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ", props);
                    }
                    else {
                        // Looks like this has autoInc, so lets get the next in sequence and return that.
                        getNextAutoIncKey();
                    }
                }
            }
        });
    };
    
    IDBObjectStore.prototype.__insertData = function(tx, value, primaryKey, success, error){
        var paramMap = {};
        if (typeof primaryKey !== "undefined") {
            paramMap.key = idbModules.Key.encode(primaryKey);
        }
        var indexes = JSON.parse(this.__storeProps.indexList);
        for (var key in indexes) {
            try {
                paramMap[indexes[key].columnName] = idbModules.Key.encode(eval("value['" + indexes[key].keyPath + "']"));
            } 
            catch (e) {
                error(e);
            }
        }
        var sqlStart = ["INSERT INTO ", idbModules.util.quote(this.name), "("];
        var sqlEnd = [" VALUES ("];
        var sqlValues = [];
        for (key in paramMap) {
            sqlStart.push(key + ",");
            sqlEnd.push("?,");
            sqlValues.push(paramMap[key]);
        }
        // removing the trailing comma
        sqlStart.push("value )");
        sqlEnd.push("?)");
        sqlValues.push(idbModules.Sca.encode(value));
        
        var sql = sqlStart.join(" ") + sqlEnd.join(" ");
        
        idbModules.DEBUG && console.log("SQL for adding", sql, sqlValues);
        tx.executeSql(sql, sqlValues, function(tx, data){
            success(primaryKey);
        }, function(tx, err){
            error(err);
        });
    };
    
    IDBObjectStore.prototype.add = function(value, key){
        var me = this;
        return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__deriveKey(tx, value, key, function(primaryKey){
                me.__insertData(tx, value, primaryKey, success, error);
            });
        });
    };
    
    IDBObjectStore.prototype.put = function(value, key){
        var me = this;
        return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__deriveKey(tx, value, key, function(primaryKey){
                // First try to delete if the record exists
                var sql = "DELETE FROM " + idbModules.util.quote(me.name) + " where key = ?";
                tx.executeSql(sql, [idbModules.Key.encode(primaryKey)], function(tx, data){
                    idbModules.DEBUG && console.log("Did the row with the", primaryKey, "exist? ", data.rowsAffected);
                    me.__insertData(tx, value, primaryKey, success, error);
                }, function(tx, err){
                    error(err);
                });
            });
        });
    };
    
    IDBObjectStore.prototype.get = function(key){
        // TODO Key should also be a key range
        var me = this;
        return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__waitForReady(function(){
                var primaryKey = idbModules.Key.encode(key);
                idbModules.DEBUG && console.log("Fetching", me.name, primaryKey);
                tx.executeSql("SELECT * FROM " + idbModules.util.quote(me.name) + " where key = ?", [primaryKey], function(tx, data){
                    idbModules.DEBUG && console.log("Fetched data", data);
                    try {
                        // Opera can't deal with the try-catch here.
                        if (0 === data.rows.length) {
                            return success();
                        }
                        
                        success(idbModules.Sca.decode(data.rows.item(0).value));
                    } 
                    catch (e) {
                        idbModules.DEBUG && console.log(e);
                        // If no result is returned, or error occurs when parsing JSON
                        success(undefined);
                    }
                }, function(tx, err){
                    error(err);
                });
            });
        });
    };
    
    IDBObjectStore.prototype["delete"] = function(key){
        // TODO key should also support key ranges
        var me = this;
        return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__waitForReady(function(){
                var primaryKey = idbModules.Key.encode(key);
                idbModules.DEBUG && console.log("Fetching", me.name, primaryKey);
                tx.executeSql("DELETE FROM " + idbModules.util.quote(me.name) + " where key = ?", [primaryKey], function(tx, data){
                    idbModules.DEBUG && console.log("Deleted from database", data.rowsAffected);
                    success();
                }, function(tx, err){
                    error(err);
                });
            });
        });
    };
    
    IDBObjectStore.prototype.clear = function(){
        var me = this;
        return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__waitForReady(function(){
                tx.executeSql("DELETE FROM " + idbModules.util.quote(me.name), [], function(tx, data){
                    idbModules.DEBUG && console.log("Cleared all records from database", data.rowsAffected);
                    success();
                }, function(tx, err){
                    error(err);
                });
            });
        });
    };
    
    IDBObjectStore.prototype.count = function(key){
        var me = this;
        return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__waitForReady(function(){
                var sql = "SELECT * FROM " + idbModules.util.quote(me.name) + ((typeof key !== "undefined") ? " WHERE key = ?" : "");
                var sqlValues = [];
                (typeof key !== "undefined") && sqlValues.push(idbModules.Key.encode(key));
                tx.executeSql(sql, sqlValues, function(tx, data){
                    success(data.rows.length);
                }, function(tx, err){
                    error(err);
                });
            });
        });
    };
    
    IDBObjectStore.prototype.openCursor = function(range, direction){
        var cursorRequest = new idbModules.IDBRequest();
        var cursor = new idbModules.IDBCursor(range, direction, this, cursorRequest, "key", "value");
        return cursorRequest;
    };
    
    IDBObjectStore.prototype.index = function(indexName){
        var index = new idbModules.IDBIndex(indexName, this);
        return index;
    };
    
    IDBObjectStore.prototype.createIndex = function(indexName, keyPath, optionalParameters){
        var me = this;
        optionalParameters = optionalParameters || {};
        me.__setReadyState("createIndex", false);
        var result = new idbModules.IDBIndex(indexName, me);
        me.__waitForReady(function(){
            result.__createIndex(indexName, keyPath, optionalParameters);
        }, "createObjectStore");
        me.indexNames.push(indexName);
        return result;
    };
    
    IDBObjectStore.prototype.deleteIndex = function(indexName){
        var result = new idbModules.IDBIndex(indexName, this, false);
        result.__deleteIndex(indexName);
        return result;
    };
    
    idbModules.IDBObjectStore = IDBObjectStore;
}(idbModules));

(function(idbModules){

    /**
     * The IndexedDB Transaction
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
     * @param {Object} storeNames
     * @param {Object} mode
     * @param {Object} db
     */
    var READ = 0;
    var READ_WRITE = 1;
    var VERSION_TRANSACTION = 2;
    
    var IDBTransaction = function(storeNames, mode, db){
        if (typeof mode === "number") {
            this.mode = mode;
            (mode !== 2) && idbModules.DEBUG && console.log("Mode should be a string, but was specified as ", mode);
        }
        else 
            if (typeof mode === "string") {
                switch (mode) {
                    case "readwrite":
                        this.mode = READ_WRITE;
                        break;
                    case "readonly":
                        this.mode = READ;
                        break;
                    default:
                        this.mode = READ;
                        break;
                }
            }
        
        this.storeNames = typeof storeNames === "string" ? [storeNames] : storeNames;
        for (var i = 0; i < this.storeNames.length; i++) {
            if (!db.objectStoreNames.contains(this.storeNames[i])) {
                idbModules.util.throwDOMException(0, "The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.", this.storeNames[i]);
            }
        }
        this.__active = true;
        this.__running = false;
        this.__requests = [];
        this.__aborted = false;
        this.db = db;
        this.error = null;
        this.onabort = this.onerror = this.oncomplete = null;
        var me = this;
    };
    
    IDBTransaction.prototype.__executeRequests = function(){
        if (this.__running && this.mode !== VERSION_TRANSACTION) {
            idbModules.DEBUG && console.log("Looks like the request set is already running", this.mode);
            return;
        }
        this.__running = true;
        var me = this;
        window.setTimeout(function(){
            if (me.mode !== 2 && !me.__active) {
                idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
            }
            // Start using the version transaction
            me.db.__db.transaction(function(tx){
                me.__tx = tx;
                var q = null, i = 0;
                function success(result, req){
                    if (req) {
                        q.req = req;// Need to do this in case of cursors
                    }
                    q.req.readyState = "done";
                    q.req.result = result;
                    delete q.req.error;
                    var e = idbModules.Event("success");
                    idbModules.util.callback("onsuccess", q.req, e);
                    i++;
                    executeRequest();
                }
                
                function error(errorVal){
                    q.req.readyState = "done";
                    q.req.error = "DOMError";
                    var e = idbModules.Event("error", arguments);
                    idbModules.util.callback("onerror", q.req, e);
                    i++;
                    executeRequest();
                }
                try {
                    function executeRequest(){
                        if (i >= me.__requests.length) {
                            me.__active = false; // All requests in the transaction is done
                            me.__requests = [];
                            return;
                        }
                        q = me.__requests[i];
                        q.op(tx, q.args, success, error);
                    }
                    executeRequest();
                } 
                catch (e) {
                    idbModules.DEBUG && console.log("An exception occured in transaction", arguments);
                    typeof me.onerror === "function" && me.onerror();
                }
            }, function(){
                idbModules.DEBUG && console.log("An error in transaction", arguments);
                typeof me.onerror === "function" && me.onerror();
            }, function(){
                idbModules.DEBUG && console.log("Transaction completed", arguments);
                typeof me.oncomplete === "function" && me.oncomplete();
            });
        }, 1);
    };
    
    IDBTransaction.prototype.__addToTransactionQueue = function(callback, args){
        if (!this.__active && this.mode !== VERSION_TRANSACTION) {
            idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished.", this.__mode);
        }
        var request = new idbModules.IDBRequest();
        request.source = this.db;
        this.__requests.push({
            "op": callback,
            "args": args,
            "req": request
        });
        // Start the queue for executing the requests
        this.__executeRequests();
        return request;
    };
    
    IDBTransaction.prototype.objectStore = function(objectStoreName){
        return new idbModules.IDBObjectStore(objectStoreName, this);
    };
    
    IDBTransaction.prototype.abort = function(){
        !this.__active && idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", this.__active);
        
    };
    
    IDBTransaction.prototype.READ_ONLY = 0;
    IDBTransaction.prototype.READ_WRITE = 1;
    IDBTransaction.prototype.VERSION_CHANGE = 2;
    
    idbModules.IDBTransaction = IDBTransaction;
}(idbModules));

(function(idbModules){

    /**
     * IDB Database Object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
     * @param {Object} db
     */
    var IDBDatabase = function(db, name, version, storeProperties){
        this.__db = db;
        this.version = version;
        this.__storeProperties = storeProperties;
        this.objectStoreNames = new idbModules.util.StringList();
        for (var i = 0; i < storeProperties.rows.length; i++) {
            this.objectStoreNames.push(storeProperties.rows.item(i).name);
        }
        this.name = name;
        this.onabort = this.onerror = this.onversionchange = null;
    };
    
    IDBDatabase.prototype.createObjectStore = function(storeName, createOptions){
        var me = this;
        createOptions = createOptions || {};
        createOptions.keyPath = createOptions.keyPath || null;
        var result = new idbModules.IDBObjectStore(storeName, me.__versionTransaction, false);
        
        var transaction = me.__versionTransaction;
        transaction.__addToTransactionQueue(function(tx, args, success, failure){
            function error(){
                idbModules.util.throwDOMException(0, "Could not create new object store", arguments);
            }
            
            if (!me.__versionTransaction) {
                idbModules.util.throwDOMException(0, "Invalid State error", me.transaction);
            }
            //key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
            var sql = ["CREATE TABLE", idbModules.util.quote(storeName), "(key BLOB", createOptions.autoIncrement ? ", inc INTEGER PRIMARY KEY AUTOINCREMENT" : "PRIMARY KEY", ", value BLOB)"].join(" ");
            idbModules.DEBUG && console.log(sql);
            tx.executeSql(sql, [], function(tx, data){
                tx.executeSql("INSERT INTO __sys__ VALUES (?,?,?,?)", [storeName, createOptions.keyPath, createOptions.autoIncrement ? true : false, "{}"], function(){
                    result.__setReadyState("createObjectStore", true);
                    success(result);
                }, error);
            }, error);
        });
        
        // The IndexedDB Specification needs us to return an Object Store immediatly, but WebSQL does not create and return the store immediatly
        // Hence, this can technically be unusable, and we hack around it, by setting the ready value to false
        me.objectStoreNames.push(storeName);
        return result;
    };
    
    IDBDatabase.prototype.deleteObjectStore = function(storeName){
        var error = function(){
            idbModules.util.throwDOMException(0, "Could not delete ObjectStore", arguments);
        };
        var me = this;
        !me.objectStoreNames.contains(storeName) && error("Object Store does not exist");
        me.objectStoreNames.splice(me.objectStoreNames.indexOf(storeName), 1);
        
        var transaction = me.__versionTransaction;
        transaction.__addToTransactionQueue(function(tx, args, success, failure){
            if (!me.__versionTransaction) {
                idbModules.util.throwDOMException(0, "Invalid State error", me.transaction);
            }
            me.__db.transaction(function(tx){
                tx.executeSql("SELECT * FROM __sys__ where name = ?", [storeName], function(tx, data){
                    if (data.rows.length > 0) {
                        tx.executeSql("DROP TABLE " + idbModules.util.quote(storeName), [], function(){
                            tx.executeSql("DELETE FROM __sys__ WHERE name = ?", [storeName], function(){
                            }, error);
                        }, error);
                    }
                });
            });
        });
    };
    
    IDBDatabase.prototype.close = function(){
        // Don't do anything coz the database automatically closes
    };
    
    IDBDatabase.prototype.transaction = function(storeNames, mode){
        var transaction = new idbModules.IDBTransaction(storeNames, mode || 1, this);
        return transaction;
    };
    
    idbModules.IDBDatabase = IDBDatabase;
}(idbModules));

(function(idbModules){
    var DEFAULT_DB_SIZE = 4 * 1024 * 1024;
    if (!window.openDatabase) {
        return;
    }
    // The sysDB to keep track of version numbers for databases
    var sysdb = window.openDatabase("__sysdb__", 1, "System Database", DEFAULT_DB_SIZE);
    sysdb.transaction(function(tx){
        tx.executeSql("SELECT * FROM dbVersions", [], function(t, data){
            // dbVersions already exists
        }, function(){
            // dbVersions does not exist, so creating it
            sysdb.transaction(function(tx){
                tx.executeSql("CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);", [], function(){
                }, function(){
                    idbModules.util.throwDOMException("Could not create table __sysdb__ to save DB versions");
                });
            });
        });
    }, function(){
        // sysdb Transaction failed
       idbModules.DEBUG && console.log("Error in sysdb transaction - when selecting from dbVersions", arguments);
    });
    
    var shimIndexedDB = {
        /**
         * The IndexedDB Method to create a new database and return the DB
         * @param {Object} name
         * @param {Object} version
         */
        open: function(name, version){
            var req = new idbModules.IDBOpenRequest();
            var calledDbCreateError = false;
            
            function dbCreateError(){
                if (calledDbCreateError) {
                    return;
                }
                var e = idbModules.Event("error", arguments);
                req.readyState = "done";
                req.error = "DOMError";
                idbModules.util.callback("onerror", req, e);
                calledDbCreateError = true;
            }
            
            function openDB(oldVersion){
                var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
                req.readyState = "done";
                if (typeof version === "undefined") {
                    version = oldVersion || 1;
                }
                if (version <= 0 || oldVersion > version) {
                    idbModules.util.throwDOMException(0, "An attempt was made to open a database using a lower version than the existing version.", version);
                }
                
                db.transaction(function(tx){
                    tx.executeSql("CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexList BLOB)", [], function(){
                        tx.executeSql("SELECT * FROM __sys__", [], function(tx, data){
                            var e = idbModules.Event("success");
                            req.source = req.result = new idbModules.IDBDatabase(db, name, version, data);
                            if (oldVersion < version) {
                                // DB Upgrade in progress 
                                sysdb.transaction(function(systx){
                                    systx.executeSql("UPDATE dbVersions set version = ? where name = ?", [version, name], function(){
                                        var e = idbModules.Event("upgradeneeded");
                                        e.oldVersion = oldVersion;
                                        e.newVersion = version;
                                        req.transaction = req.result.__versionTransaction = new idbModules.IDBTransaction([], 2, req.source);
                                        idbModules.util.callback("onupgradeneeded", req, e, function(){
                                            var e = idbModules.Event("success");
                                            idbModules.util.callback("onsuccess", req, e);
                                        });
                                    }, dbCreateError);
                                }, dbCreateError);
                            } else {
                                idbModules.util.callback("onsuccess", req, e);
                            }
                        }, dbCreateError);
                    }, dbCreateError);
                }, dbCreateError);
            }
            
            sysdb.transaction(function(tx){
                tx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data){
                    if (data.rows.length === 0) {
                        // Database with this name does not exist
                        tx.executeSql("INSERT INTO dbVersions VALUES (?,?)", [name, version || 1], function(){
                            openDB(0);
                        }, dbCreateError);
                    } else {
                        openDB(data.rows.item(0).version);
                    }
                }, dbCreateError);
            }, dbCreateError);
            
            return req;
        },
        
        "deleteDatabase": function(name){
            var req = new idbModules.IDBOpenRequest();
            var calledDBError = false;
            function dbError(msg){
                if (calledDBError) {
                    return;
                }
                req.readyState = "done";
                req.error = "DOMError";
                var e = idbModules.Event("error");
                e.message = msg;
                e.debug = arguments;
                idbModules.util.callback("onerror", req, e);
                calledDBError = true;
            }
            var version = null;
            function deleteFromDbVersions(){
                sysdb.transaction(function(systx){
                    systx.executeSql("DELETE FROM dbVersions where name = ? ", [name], function(){
                        req.result = undefined;
                        var e = idbModules.Event("success");
                        e.newVersion = null;
                        e.oldVersion = version;
                        idbModules.util.callback("onsuccess", req, e);
                    }, dbError);
                }, dbError);
            }
            sysdb.transaction(function(systx){
                systx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data){
                    if (data.rows.length === 0) {
                        req.result = undefined;
                        var e = idbModules.Event("success");
                        e.newVersion = null;
                        e.oldVersion = version;
                        idbModules.util.callback("onsuccess", req, e);
                        return;
                    }
                    version = data.rows.item(0).version;
                    var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
                    db.transaction(function(tx){
                        tx.executeSql("SELECT * FROM __sys__", [], function(tx, data){
                            var tables = data.rows;
                            (function deleteTables(i){
                                if (i >= tables.length) {
                                    // If all tables are deleted, delete the housekeeping tables
                                    tx.executeSql("DROP TABLE __sys__", [], function(){
                                        // Finally, delete the record for this DB from sysdb
                                        deleteFromDbVersions();
                                    }, dbError);
                                } else {
                                    // Delete all tables in this database, maintained in the sys table
                                    tx.executeSql("DROP TABLE " + idbModules.util.quote(tables.item(i).name), [], function(){
                                        deleteTables(i + 1);
                                    }, function(){
                                        deleteTables(i + 1);
                                    });
                                }
                            }(0));
                        }, function(e){
                            // __sysdb table does not exist, but that does not mean delete did not happen
                            deleteFromDbVersions();
                        });
                    }, dbError);
                });
            }, dbError);
            return req;
        },
        "cmp": function(key1, key2){
            return idbModules.Key.encode(key1) > idbModules.Key.encode(key2) ? 1 : key1 === key2 ? 0 : -1;
        }
    };
    
    idbModules.shimIndexedDB = shimIndexedDB;
}(idbModules));

(function(window, idbModules){
    if (typeof window.openDatabase !== "undefined") {
        window.shimIndexedDB = idbModules.shimIndexedDB;
        if (window.shimIndexedDB) {
            window.shimIndexedDB.__useShim = function(){
                window.indexedDB = idbModules.shimIndexedDB;
                window.IDBDatabase = idbModules.IDBDatabase;
                window.IDBTransaction = idbModules.IDBTransaction;
                window.IDBCursor = idbModules.IDBCursor;
                window.IDBKeyRange = idbModules.IDBKeyRange;
            };
            window.shimIndexedDB.__debug = function(val){
                idbModules.DEBUG = val;
            };
        }
    }
    
    window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB;
    
    if (typeof window.indexedDB === "undefined" && typeof window.openDatabase !== "undefined") {
        window.shimIndexedDB.__useShim();
    }
    else {
        window.IDBDatabase = window.IDBDatabase || window.webkitIDBDatabase;
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
        window.IDBCursor = window.IDBCursor || window.webkitIDBCursor;
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
        if(!window.IDBTransaction){
            window.IDBTransaction = {};
        }
        window.IDBTransaction.READ_ONLY = window.IDBTransaction.READ_ONLY || "readonly";
        window.IDBTransaction.READ_WRITE = window.IDBTransaction.READ_WRITE || "readwrite";
    }
    
}(window, idbModules));
