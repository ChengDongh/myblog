var mongodb = require('./db');0
//引入markdown
var markdown = require('markdown').markdown

function Post(name,title,content) {
    this.name = name;
    this.title = title;
    this.content = content;
}
// function Post(name) {
//     this.name = name.name;
//     this.title = name.title;
//     this.content = name.content;
// }
//格式化时间的函数
function formaDate(num) {
    return  num < 10 ? '0' + num : num;
}
Post.prototype.save = function (callback) {
    //1.格式化时间
    var data = new Date();
    var now = data.getFullYear() + '-' + formaDate(data.getMonth() + 1) + '-' + formaDate(data.getDate()) + ' ' + formaDate(data.getHours()) + ':' + formaDate(data.getMinutes()) + ':' + formaDate(data.getSeconds());

    //2.收集数据
    var newContent = {
        name:this.name,
        title:this.title,
        content:this.content,
        time:now
    }

    //3.打开数据库
    //4.读取posts集合
    //5.将数据库插入到集合中吗，并且跳转到首页
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.insert(newContent,function (err,doc) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc);
            })
        })
    })
}
Post.getALL = function (name,callback) {
    mongodb.open(function(err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {}
            if(name){
                query.name = name;
            }
            collection.find(query).sort({time:-1}).toArray(function (err,docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                //将每篇文章在读取的时候以markdown的格式进行解析
                docs.forEach(function (doc) {
                    doc.content = markdown.toHTML(doc.content);
                })
                return callback(null,docs);
            })
        })
    })
}
//获取一篇文章
Post.getOne = function (name,title,time,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                name:name,
                title:title,
                time:time
            },function (err,doc) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                db.content = markdown.toHTML(doc.content);
                return callback(null,doc);
            })
        })
    })
}
module.exports = Post;