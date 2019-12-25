"use strict";
/*
获取目录下所有文件列表
 */
const fs = require('fs');
const util = require('util');
const FSPath = require('path');

const readdir  = util.promisify(fs.readdir);
const fileStat = util.promisify(fs.stat);

module.exports = function (root,dir='/') {
    let result = [];
    let filter = arguments[2] || function (f) {
        result.push(f);
    }
    return promise_get_files(root,dir,filter).then(()=>result);
}
//同步阻塞模式
module.exports.sync = function (root,dir='/') {
    let result = [];
    let filter = arguments[2] || function (f) {
        result.push(f);
    }
    sync_get_files(root,dir,filter);
    return  result;
}
//递归检查并创建目录
module.exports.mkdir = function (root,dir) {
    if(!dir) return;
    let arr = dir.split("/");
    let p = [root];
    for(let v of arr){
        if(!v) continue;
        p.push(v);
        let f= p.join("/");
        if(!fs.existsSync(f)){
            fs.mkdirSync(f);
        }
    }
}


//遍历目录,promise
function promise_get_files(root,dir,filter) {
    if(dir.indexOf('/',dir.length-1) < 0){
        dir = [dir,'/'].join('');
    }
    let path = root + dir;
    return fileStat(path).then(stats=>{
        if(!stats.isDirectory()){
            return Promise.reject('path not dir');
        }
        else {
            return readdir(path);
        }
    }).then(files=>{
        let promises_get_file = files.map(f=>promise_chk_files(root,dir,f,filter));
        return Promise.all(promises_get_file);
    }).catch(err=>{
        
    })
}


function promise_chk_files(root,dir,name,filter){
    let realPath = FSPath.resolve([root,dir,name].join('/'));
    let realName = [dir,name].join("");
    return fileStat(realPath).then(stats=>{
        if(stats.isDirectory()){
            return promise_get_files.call(this,root,realName,filter);
        }
        else {
            filter(realName);
        }
    }).catch(err=>err)
}




function sync_get_files(root,dir,filter) {
    if(dir.indexOf('/',dir.length-1) < 0){
        dir = [dir,'/'].join('');
    }
    let stats, path = root + dir;
    try {
        stats = fs.statSync(path);
    }
    catch (e){
        stats = null;
    }
    if(!stats){
        return;
    }
    if(!stats.isDirectory()){
        return;
    }
    let files = fs.readdirSync(path);
    if(!files || !files.length){
        return;
    }
    for(let name of files){
        sync_chk_files(root,dir,name,filter);
    }
}


function sync_chk_files(root,dir,name,filter){
    let realPath = FSPath.resolve([root,dir,name].join('/'));
    let realName = [dir,name].join("");
    let stats = fs.statSync(realPath);
    if (stats.isDirectory()) {
        return sync_get_files(root,realName,filter);
    }
    else{
        filter(realName);
    }
}