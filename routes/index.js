var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User   = require('../models/user.js');
var Post   = require('../models/post.js');
var Comment = require('../models/comment.js')
var fs     = require('fs');



/* GET home page. */
router.get('/', function(req, res) {
  //res.render('index', { title: 'Express' });
  Post.getAll(null, function(err, posts){
    if(err){
      posts = {} 
    }
    res.render('index', {
      user:req.session.user,
      posts : posts
    });
               
  });
  
});


router.get('/reg', function(req, res){
  res.render('reg', {title:"注册"});
});

/*用户注册*/
router.post('/reg', function(req, res){
  var name = req.body.username.trim();
  var password = req.body.password.trim();
  var password_re = req.body["password-repeat"].trim();
  var email = req.body.email.trim();
  
  if(name == ''){
    var infoMsg = "用户名不能为空";
    return res.render("reg", {infoMsg: infoMsg});
  }
  
  if(email == ''){
    var infoMsg = "邮箱为空";
    return res.render("reg", {infoMsg : infoMsg});
    
  }
  
  if(password == ''){
    var infoMsg = "密码为空";
    return res.render("reg", {infoMsg : infoMsg});
  }
  
  if(password != password_re){
    var infoMsg = "两次密码不一致";
    return res.render("reg", {infoMsg : infoMsg});
  }
  
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('hex');
  
  var newUser = new User({
    name : name,
    password : password,
    email : email
  });
  
  User.get(newUser.name, function(err, user){
    if(user){
      var infoMsg = "用户已经存在"; 
      return res.render("reg", {infoMsg: infoMsg});
    }
    newUser.save(function(err, user){
      if(err){
        var infoMsg = "注册失败";
        return res.render("reg", {infoMsg: infoMsg});
      }
      req.session.user = user;
      return res.redirect('/');
      
    });
    
  });
                           
        
});


router.get('/login', function(req, res){
  res.render('login', {title: "登入"});
});

router.post('/login', function(req, res){
  var name = req.body.username.trim();
  //var password = req.body.password.trim();
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password.trim()).digest('hex');
  User.get(name, function(err, user){
    if(!user){
      var infoMsg = "用户不存在"; 
      return res.render("login", {infoMsg : infoMsg});
    }
    if(user.password != password){
      var infoMsg = "密码错误";
      return res.render("login", {infoMsg: infoMsg});
    }
    req.session.user = user;
    return res.redirect('/');
  });
});

/*发表文章*/
router.post("/post", function(req, res){
  var currentUser = req.session.user;
  console.log(req.body.post);
  var post = new Post(currentUser.name, req.body.title, req.body.post);
  post.save(function(err){
    if(err){
      console.log(err);
      return res.redirect('/');
    }
    req.session.success = "发表成功";
    return res.redirect('/');
  });
});


router.get("/upload", function(req, res){
  return res.render("upload", {title: "上传图片到文件夹"});
});

router.post("/upload", function(req, res){
  //console.log(req.files["myfile"]);
  var path = 'public/images/';
  var ossName = req.files["myfile"].path.replace(path, '');
  console.log(ossName);
  fs.renameSync(req.files["myfile"].path, req.files["myfile"].path);
  console.log("ok");
  var OssEasy = require("oss-easy");
  ossOptions = {
  accessKeyId : "uOaJsZxgxlTbFO3B",
  accessKeySecret : "wbyU0nQ9wX63OpoOXslLeSpscq9Sdf"
  }
  var oss = new OssEasy(ossOptions, "youqingkui");
  oss.uploadFile(req.files["myfile"].path, ossName, function(err) {
    if(err){
      console.log(err);
    }
    console.log("oss ok" + req.files["myfile"].name);
  });
  req.session.error = "等待回调";
  return res.redirect("/");
});


router.get("/u/:name", function(req, res){
  User.get(req.params.name, function(err, user){
    if(!user){
      req.session.error = "没有这个用户";
      return res.redirect("/");
    }
    Post.getAll(user.name, function(err, posts){
      if(err){
        req.session.error = "获取文章出现错误";
        return res.redirect("/");
      }
      return res.render("user", {
        title : user.name,
        posts : posts,
        
      });
    });
  });
});

router.get("/u/:name/:day/:title", function(req, res){
  Post.getOne(req.params.name, req.params.day, req.params.title, function(err, posts){
    if(!posts){
      req.session.error = "没有找到这片文章";
      return res.redirect("/");
    }
    console.log(posts.comments);
    return res.render("article",{
      title : posts.title,
      post : posts
    });
  });
});

router.post("/u/:name/:day/:title", function(req, res){
  var date = new Date(),
      time = date.getFullYear() + '-' +(date.getMonth() + 1) + '-' + date.getDate() + ' '
  + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
  
  var comment = {
    name : req.body.name,
    email : req.body.email,
    website : req.body.website,
    time : time,
    content : req.body.content
  };
  var newComment = new Comment(req.body.name, req.params.day, req.params.title, comment);
  newComment.save(function(err){
    if(err){
      req.session.errror = "添加评论出现错误";
      res.redirect("back");
    }
    req.session.success = "添加评论成功";
    res.redirect("back");
    
  });
  
  
});

router.get("/edit/:name/:day/:title", function(req, res){
  Post.edit(req.params.name, req.params.day, req.params.title, function(err, post){
    if(err){
      req.session.error = "出现错误";
      return res.redirect("back");
    } 
    return res.render("edit", 
      { 
        title : "编辑",
        post  : post
      
      
      }               
    );
  });
});

router.post("/edit/:name/:day/:title", function(req, res){
  var currentUser = req.session.user;
  Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err){
    var url = "/u/" + currentUser.name + "/" + req.params.day + "/" + req.params.title;
    if(err){
      req.session.error = "更新出现错误";
      return res.redirect(url);
    }
    req.session.success = "更新成功";
    return res.redirect(url);
  });
});

router.get("/delete/:name/:day/:title", function(req, res){
  var currentUser = req.session.user;
  Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
    if(err){
      req.session.error = "删除出现错误";
      return res.redirect("back");
    }
    req.session.success = "删除成功";
    return res.redirect("back");
    
  });
});




module.exports = router;
