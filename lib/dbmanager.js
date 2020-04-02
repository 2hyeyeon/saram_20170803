// Author: 안정길 
// Create Date: 2014.12.18
var _ = require("underscore"); 

var Promise = require('bluebird');
var mysql=Promise.promisifyAll(require('mysql'));
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

var fs = Promise.promisifyAll(require("fs"));
var digester = require("xml-digester").XmlDigester({});
var debug = require('debug')('DB');
var path = require("path");
var db_info = require('./db_info.json');

var DBManager = function () {
    var db=this;
    db.dbInfo = {
	    host: db_info.host,
        user: db_info.user, 
        password : db_info.password,
        port : db_info.port,
        database :db_info.database
    };
    
    var pool = mysql.createPool(db.dbInfo);
    db.pool=pool;
    
    fs.readFileAsync(path.dirname(module.parent.filename) + "/../xml/query.xml","utf8").then(function (data) {
        digester.digest(data, function(err, result) {
            if (err) { 
                debug(err);
            } else {
                for(var i = 0; i < result.querys.group.length; i++){
                    db.querys[result.querys.group[i].id] = result.querys.group[i].query;
                }
            }
        });
    }).catch(SyntaxError, function (e) {
        debug("file contains invalid file");
    }).error(function (e) {
        debug("unable to read file, because: ", e.message);
    });
};

DBManager.prototype.querys = [];

DBManager.prototype.getDbInfo = function(){
    return this.dbInfo;
};

DBManager.prototype.getQuery = function(groupid, id){
    var groupitem = this.querys[groupid];
    if (undefined == groupitem) {
        return id;
    }
    for(var i = 0; i< groupitem.length ; i++){
        var item = groupitem[i];
        if(item.id == id){
            return item._text;
        }
    }
    throw new Error('Can not find Query');
};

DBManager.prototype.queryTransaction = function(queryArr){
    debug("DB Transaction Begin! (" + queryArr.length + ")");
    var db = this;
    return new Promise(function(resolve, reject){
        db.pool.getConnectionAsync().then(function(connection){//Connection Success
            connection.beginTransaction(function(err){
                if (err) { throw err; }
                var startTransaction = function(itemArr){
                    var item = _.last(itemArr);
                    itemArr = _.reject(itemArr, item);
                    connection.query(db.getQuery(item.group, item.item), item.data, function(err, result){
                        if(err){
                            debug("DB Transaction Rollback");
                            connection.rollback(function(){
                                reject(err);
                                connection.release();
                            });
                            
                        }else{
                            if(itemArr.length > 0){
                                startTransaction(itemArr);    
                            } else {
                                debug("DB Transaction Commit!");
                                connection.commit(function(err){
                                    if(err){
                                        debug("DB Transaction Rollback");
                                        connection.rollback(function(){
                                            reject(err);
                                            connection.release();
                                        });
                                    }
                                    debug("DB Transaction Commit Success!");
                                    resolve();
                                    connection.release();
                                });
                            }
                        }
                    });
                };
                
                if(!_.isUndefined(queryArr)){
                    startTransaction(queryArr);
                }
            });
        });
    });
};

DBManager.prototype.query = function(queryGroup, queryItem, keyArr, queryStr){
    var db = this;
    var logFlag = false;
    if(_.isUndefined(queryStr) || _.isNull(queryStr)){
        queryStr = db.getQuery(queryGroup, queryItem);
        logFlag = true;
    }
    
    if(_.isUndefined(keyArr) || _.isNull(keyArr)){
        keyArr = [];
    }
    
    return new Promise(function(resolve, reject){// promise patten
        db.pool.getConnectionAsync().then(function(connection){//Connection Success
            connection.queryAsync(queryStr, keyArr).then(function(data){//Query Success
                var resultArr=data[0];
                if(logFlag){
                    debug("Query: " + queryGroup + " ("+queryItem +")");
                    if(keyArr.length > 0)
                        debug("Key : [" + keyArr +"]");
                    debug("Query Result : " + resultArr.length);
                }else{
                    debug("Query: " + queryStr);
                }
                resolve(resultArr);     
            }).catch(function(e){//Query Error
                debug("Query ERROR: " + e);
                reject(e);
            }).finally(function(){
                connection.release();
            });
        }).catch(function(e){//Connection Error
           debug("Connection ERROR:"+e.message);
           reject(e);
        });
    });    
};

module.exports = new DBManager();

