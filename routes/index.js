//引入Users集合操作方法
var User = require('../model/User');
//引入Posts集合操作的方法
var Post = require('../model/Post');
//引入Comments字段的操作方法
var Comment = require('../model/Comment');
// var mongodb = require('../model/db');
function formaDate(num) {
    return  num < 10 ? '0' + num : num;
}
//引入一个加密的插件
var crypto = require('crypto');
//引入上传的插件
var multer = require('multer');
//配置信息
var storage = multer.diskStorage({
    destination:function (req,file,cb) {
        cb(null,'./public/images')
    },
    filename:function (req,file,cb) {
        cb(null,file.originalname);
    }
})
var upload = multer({storage:storage});
//未登录情况下，不允许访问发表和退出
function checkLogin(req,res,next) {
    if(!req.session.user){
        req.flash('error','未登录');
        return res.redirect('/login');
    }
    next()
}
//已登录情况下，不允许访问登录和注册
function checkNotLogin(req,res,next) {
    if(req.session.user){
        req.flash('error','已登录');
        return res.redirect('back');
    }
    next();
}
module.exports = function(app) {
  //首页页面
    app.get('/',function (req,res) {
        //如果当前传递了当前页数的参数，就以这个参数为准，否则就是第一页
        var page = parseInt(req.query.page) || 1;
        console.log(req.query)
        Post.getTen(null,page,function (err,docs,total) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('index',{
                title:'首页',
                page:page,//当前页数
                //是不是第一页，如果是第一页的话，值true
                isFirstPage:(page - 1)*10 == 0,
                isLastPage:(page - 1)*10 + docs.length == total,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                docs:docs
            })
        })
    })
    //注册页面
    app.get('/reg',checkNotLogin,function (req,res) {
        res.render('reg',{
          title:'注册页面',
          user:req.session.user,
          success:req.flash('success').toString(),
          error:req.flash('error').toString()
        })
    })
    //注册行为
    app.post('/reg',function (req,res) {
        //要把数据存放到数据库里面去
        //1.收集数据
        var username = req.body.username;
        var password = req.body.password;
        var password_repeat = req.body['password_repeat'];
        var email = req.body.email;
        //2.判断两次密码输入是否正确
        if(username=='' || password==''){
            req.flash('error','用户或密码不能为空');
            return res.redirect('/reg');
        }else if(password != password_repeat){
            //给出用户提示
            req.flash('error','两次密码输入不正确');
            return res.redirect('/reg');
        }
        //3.对密码进行加密
        var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            username:username,
            password:password,
            email:email
        })
        console.log(newUser.username);
        //4.判断用户名是否存在
        User.get(newUser.username,function (err,user) {
            if(err){
                req.flash('error',err);
                return res.redirect('/reg');
            }
            if(user){
                req.flash('error','用户已存在');
                return res.redirect('/reg');
            }
            //5.将用户信息存入数据库，并跳转到首页
            newUser.save(function (err,user) {
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash('success','注册成功');
                return res.redirect('/');
            })
        })
    })
    //登录
    app.get('/login',checkNotLogin,function (req,res) {
        res.render('login',{
          title:'登录页面',
          user:req.session.user,
          success:req.flash('success').toString(),
          error:req.flash('error').toString()
        })
    })
    //登录行为
    app.post('/login',function (req,res) {
        //1.对密码进行加密
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        //2.判断用户名是否存在
        User.get(req.body.username,function (err,user) {
            if(err){
                req.flash('error',err);
                return res.redirect('/login')
            }
            if(!user){
                req.flash('error','用户不存在');
                return res.redirect('/login');
            }
            //3.判断密码是否正确
            if(user.password != password){
                req.flash('error','密码错误，请重新输入');
                return res.redirect('/login');
            }
            // console.log('1');
            //4.把用户登录的信息保存在session中，并给出提示，跳转首页
            req.session.user = user;
            req.flash('success','登录成功');
            res.redirect('/');
        })
    })
    //发表页面
    app.get('/post',checkLogin,function (req,res) {
        res.render('post',{
          title:'发表页面',
          user:req.session.user,
          success:req.flash('success').toString(),
          error:req.flash('error').toString()
        })
    })
    //发表行为
    app.post('/post',function (req,res) {
        //获取到当前登录用户的用户名
        var currentName = req.session.user.username;
        //接受一下传递过来的标签数组
        var tags = [req.body.tag1,req.body.tag2,req.body.tag3];
        var newPost = new Post(currentName,req.body.title,req.body.content,tags);
        // var newPost = new Post({
        //     name:req.session.user.username,
        //     title:req.body.title,
        //     content:req.body.content
        // });
        newPost.save(function (err) {
            if(err) {
                req.flash('error',err);
                return res.redirect('/');
            }
            req.flash('success','发表成功');
            return res.redirect('/')
        })
    })
    //退出
    app.get('/logout',checkLogin,function (req,res) {
        //将session里面的信息清除，并给出提示信息，跳转到首页
        req.session.user = null;
        req.flash('success','退出成功');
        return res.redirect('/');
    })
    //上传的页面
    app.get('/upload',checkLogin,function (req,res) {
        res.render('upload',{
            title:'上传',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //上传行为
    app.post('/upload',upload.array('filename',5),function (req,res) {
        req.flash('success','上传成功');
        return res.redirect('/upload');
    })
    //添加一个用户页面
    app.get('/u/:name',function (req,res) {
        var page = parseInt(req.query.page) || 1;
        //1.检查用户是否存在
        User.get(req.params.name,function (err,user) {
            if(err){
                req.flash('error','查询的用户不存在');
            }
            //2.查询出name对应的所有该用户的文章
            Post.getTen(user.username,page,function (err,docs,total) {
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                return res.render('user',{
                    title:'用户文章列表',
                    page:page,
                    isFirstPage:(page - 1)*10 ==0,
                    isLastPage:(page - 1)*10 + docs.length == total,
                    user:req.session.user,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString(),
                    docs:docs
                })
            })
        })
    })
    //文章详情
    app.get('/u/:name/:title/:time',function (req,res) {
        Post.getOne(req.params.name,req.params.title,req.params.time,function (err,doc) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            return res.render('article',{
                title:'文章详情页面',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                doc:doc
            })
        })
    })
    //编辑的路由
    app.get('/edit/:name/:title/:time',checkLogin,function (req,res) {
        Post.edit(req.params.name,req.params.title,req.params.time,function (err,doc) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            return res.render('edit',{
                title:'编辑页面',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                doc:doc
            })
        })
    })
    //修改行为
    app.post('/edit/:name/:title/:time',function (req,res) {
        Post.update(req.params.name,req.params.title,req.params.time,req.body.content,function (err,doc) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.title + '/' + req.params.time);
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            req.flash('success','修改成功');
            return res.redirect(url);
        })
    })
    //删除
    app.get('/remove/:name/:title/:time',function (req,res) {
        Post.remove(req.params.name,req.params.title,req.params.time,function (err) {
            if(err){
                req.flash('error',err)
                return res.redirect('/');
            }
            req.flash('success','删除成功');
            return res.redirect('/');
        })
    })
    //添加留言
    app.post('/comment/:name/:title/:time',function (req,res) {
        var data = new Date();
        var now = data.getFullYear() + '-' + formaDate(data.getMonth() + 1) + '-' + formaDate(data.getDate()) + ' ' + formaDate(data.getHours()) + ':' + formaDate(data.getMinutes()) + ':' + formaDate(data.getSeconds());
        //收集要保存在留言中的内容
        var comment = {
            c_name:req.session.user.username,
            c_time:now,
            c_content:req.body.c_content
        }
        var newComment = new Comment(req.params.name,req.params.title,req.params.time,comment);
        newComment.save(function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            req.flash('success','留言成功');
            return res.redirect('back');
        })
    })
    //存档
    app.get('/archive',checkLogin,function (req,res) {
        Post.getArchive(function (err,docs) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('archive',{
                title:'存档',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                docs:docs
            })
        })
    })
    //标签页面
    app.get('/tags',checkLogin,function (req,res) {
        Post.getTags(function (err,docs) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            return res.render('tags',{
                title:'标签列表',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                docs:docs
            })
        })
    })
    //显示标签所对应的文章
    app.get('/tags/:tag',checkLogin,function (req,res) {
        Post.getTag(req.params.tag,function (err,docs) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            return res.render('tag',{
                title:'标签列表页',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                docs:docs
            })
        })
    })
    //搜索
    app.get('/search',function (req,res) {
        Post.search(req.query.keyword,function (err,docs) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            return res.render('search',{
                title:'搜索结果',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                docs:docs
            })
        })
    })
}
