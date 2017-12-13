var mongodb = require('./db');
//创建一个构造函数，命名为User，里面的username，password，email分别存储用户名，密码，邮箱
function User(user) {
    this.username = user.username;
    this.password = user.password;
    this.email = user.email;
}
module.exports = User

User.prototype.save = function (callback) {
    var user = {
        username:this.username,
        password:this.password,
        email:this.email
    }
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        //读取users集合
        db.collection('users',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //将数据插到users集合里面去
            collection.insert(user,{safe:true},function (err,user) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,user);//user是一个注册成功后的返回对象，里面包含了查询的相关信息
            })
        })
    })
}
User.get = function (name,callback) {
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err)
        }
        //读取users集合
        db.collection('users',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            //查询出name为指定用户名的用户信息，将结果返回
            collection.findOne({username:name},function (err,user) {
                mongodb.close();//关掉数据库
                if(err){
                    return callback(err);
                }
                return callback(null,user);
            })
        })
    })
}