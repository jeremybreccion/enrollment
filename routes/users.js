var express = require('express');
var router = express.Router();

var config = require('../config/config.json');
var languages = require('../config/language.json');
var mongo = require('mongoskin');
var db = mongo.db(config.database.name, { native_parser: true });
db.bind(config.database.collections.accounts);

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var url = require('url');
var crypto = require('crypto');

var mailer = require('./services/email.js');

/* for simple operations, declare multer here */
var multer = require('multer');
var storage = multer.diskStorage({
  destination: './public/images/profile_pictures',
  filename: function(req, file, cb){
    var new_filename = req.session.user.username + '.' + file.mimetype.toString().slice(6);
    return cb(null, new_filename);
  }
});

//so far, no size limit
var upload = multer({storage: storage}).single('profile_picture');
/* end multer declarations */

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.status('respond with a resource');
});

router.get('/getAll', function(req, res, next) {
  db.accounts.find({}).toArray(function(err, accounts){
    if(err){
      res.status(400).send({error_message: 'Database Error. Contact Administrator'});
    }
    //empty array = no documents
    //although this will not happen because an admin must be logged in first lol
    /* else if(accounts.length == 0){
      res.send(400).send({error_message: 'No accounts found'});
    } */
    else{
      res.status(200).send({accounts: accounts});
    }
  });
});

router.post('/login', function(req, res, next){
  db.accounts.findOne({username: req.body.username}, function(err, user){
    if(err){
      res.status(400).send({error_message: 'Database Error. Contact Administrator'});
    }
    else if(user && bcrypt.compareSync(req.body.password, user.password)){
      //res.redirect('/');
      req.session.token = jwt.sign({ sub: user._id }, config.session.secret ,{expiresIn: config.session.duration.expiresIn});
      delete user.password;
      delete user._id;
      req.session.user = user;
      res.status(200).send({user: user, token: req.session.token});
    }
    else{
      res.status(400).send({error_message: 'Username or Password is incorrect'});
    }
  });
});

router.post('/register', function(req, res, next){
  //console.log(req.body);
  var inputted_user = {};
  var isAdmin = true;
  var tempPass = '';
  db.accounts.findOne({username: req.body.username}, function(err, user){

    if(err){
      console.log(err);
      res.status(400).send({error_message: 'Database error! Contact Administrator'});
    }
    else if(user){
      res.status(400).send({error_message: 'Username already exists!'});
    }
    else{
      inputted_user = req.body;

      //this means that a student/teacher is being added
      if(req.body.password == undefined){
        console.log('you have undefined password');
        isAdmin = false;
        tempPass = crypto.randomBytes(4).toString('hex');
      }
      else{
        tempPass = req.body.password;
      }
      inputted_user.password = bcrypt.hashSync(tempPass, 10);

      db.accounts.insert(inputted_user, function(err){
        if(err){
          console.log(err);
          res.status(400).send({error_message: 'Cannot register user! Contact Administrator'});
        }
        else{
          //console.log('registered');
          //send email for new students & teachers
          console.log('req body after db insert', req.body);
          if(!isAdmin){
            //
            if(mailer.sendNewAccountEmail(inputted_user, tempPass)){
              res.status(200).send({success_message: 'User registered. Email sent'});
            }
            else{
              res.status(400).send({error_message: 'Email cannot be sent. Contact Administrator'});
            }
          }
          else{
            res.status(200).send({success_message: 'User registered. Proceeding to login page'});
          }
          
        }
      });
    }
  });
});

//this route is used but is optional. 
//because when user has logged in, most of its details are stored in req.session.user
router.get('/current', function(req, res, next){
  db.accounts.findOne({username: req.session.user.username}, function(err, user){
    if(err){
      res.status(400).send({error_message: 'Database Error. Contact Administrator'});
    }
    else if(user == null){
      res.status(400).send({error_message: 'Cannot find user'});
    }
    else{
      //delete password & _id for security reasons
      delete user.password;
      delete user._id;
      //console.log(user);
      res.status(200).send({user: user});
    }
  });
});

router.put('/changePassword', function(req, res, next){
  //console.log(req.body);
  db.accounts.findOne({username: req.body.username}, function(err, user){
    if(err){
      res.status(400).send({error_message: 'Database Error. Contact Administrator'});
    }
    else if(user == null){
      res.status(400).send({error_message: 'Cannot find user'});
    }
    else{
      //check old password here and not on client side for security reasons
      //wrong old password
      if(!bcrypt.compareSync(req.body.old, user.password)){
        //console.log(user.password);
        res.status(400).send({error_message: 'Old password is incorrect'});
      }
      //correct old password, so update
      else{
        var hashed_password = bcrypt.hashSync(req.body.new, 10);
        db.accounts.update({username: req.body.username}, {$set : {password: hashed_password}}, function(err){
          if(err){
            res.status(400).send({error_message: 'Database Error. Contact Administrator'});
          }
          else{
            res.status(200).send({success_message: 'Password Updated'});
          }
        });
      }
    }
  });
});

router.post('/forgotPassword', function(req, res, next){
  //console.log(req.body);
  db.accounts.findOne({email: req.body.email}, function(err, user){
    if(err){
      res.status(400).send({error_message: 'Database Error. Contact Administrator'});
    }
    else if(user == null){
      res.status(400).send({error_message: 'Email is not registered'});
    }
    else{
      //generate temporary password. but since hindi pa alam kung pano mag random, default muna and constant
      var temporary_new_password = "replacethistext";
      var hashed_password = bcrypt.hashSync(temporary_new_password, 10);
      db.accounts.update({username: user.username}, {$set: {password: hashed_password}}, function(err){
        if(err){
          res.status(400).send({error_message: 'Database Error. Contact Administrator'});
        }
        else{
          //send email here
          var tempUser = {
            username: user.username,
            email: user.email,
            password: temporary_new_password
          };

          //console.log(tempUser);

          if(mailer.sendForgotPasswordEmail(tempUser)){
            res.status(200).send({success_message: 'Email sent'});
          }
          else{
            res.status(400).send({error_message: 'Email cannot be sent. Contact Administrator'});
          }
        }
      });
    }
  });
});

router.post('/profilePicture', function(req, res, next){
  upload(req, res, function(err){
    if(err){
      res.status(400).send({error_message: 'Image cannot be uploaded. Contact Administrator'});
    }
    else{
      //console.log(req.file);
      if(!req.file){
        res.status(400).send({error_message: 'No image selected'});
      }
      else{
        //upload successful, store link to user

        db.accounts.update({username: req.session.user.username}, {$set: {profile_picture: req.file.filename}}, function(err){
          if(err){
            res.status(400).send({error_message: 'Database Error. Contact Administrator'});
          }
          else{
            //explicitly declare profile pic to session here ???
            req.session.user.profile_picture = req.file.filename;
            res.status(200).send({success_message: 'Profile Picture updated', profile_picture: req.file.filename});
          }
        });
      }
    }
  });
});

router.delete('/delete/:username', function(req, res, next){
  //maybe check here to avoid deleting self
  //e.g. send error if req.session.user.username == req.params.username

  db.accounts.remove({username: req.params.username}, function(err){
    if(err){
      res.status(400).send({error_message: 'Database Error. Contact Administrator'});
    }
    else{
      res.status(200).send({success_message: 'Account deleted'});
    }
  });
});

router.put('/setLanguage/:language', function(req, res, next){
  db.accounts.update({username: req.session.user.username}, {$set: {current_language: req.params.language}}, function(err){
    if(err){
      res.status(400).send({error_message: 'Database error. Contact Administrator'});
    }
    else{
      req.session.user.current_language = req.params.language;
      var success_message = languages[req.params.language].setLanguage.success_message;
      res.status(200).send({success_message: success_message});
    }
  });
});

router.get('/logout', function(req, res, next){
  delete req.session.user;
  delete req.session.token;
  console.log('LOGGED OUT');
  res.status(200).send();
});

module.exports = router;
