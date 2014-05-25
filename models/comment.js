var mongodb = require('./db');

function Comment(comment){
  this.name = comment.name;
  this.time = comment.time;
  this.title = comment.title;
  this.comment = comment.comment;
}

module.exports = Comment;

Comment.prototype.save = function(callback){
  var name = this.name,
      day  = this.day,
      title = this.title,
      comment = this.comment;
  
  mongodb.open(function(err, db){
    if(err){
      return callback(err); 
    }
    db.collection('posts', function(err, collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.update({
        "name" : name,
        "time.day"  : time,
        "title" : title
        
      },{
        "$push" : {"comments" : comment }
      
      }, function(err){
        mongodb.close();
        if(err){
          return callback(err); 
        }
        callback(null);
      });
    });
  });
  
}