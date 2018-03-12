var express = require('express');
var router = express.Router();

/* GET home page. */
//backend routing scheme
//can restrict routes based from user role here (?)
router.get('/', function(req, res, next) {
  //console.log(req.session.token);
  //console.log(req.headers);
  //node does not know angular paths so '/users/login' & '/users/register' do not work
  if(req.path != '/users/login' && req.path != '/users/register' && !req.session.token){
    console.log('redirecting to login');
    return res.redirect('/users/login');
  }
  
  next();
});

router.get('/session', function(req, res, next){
  if(req.session.token != undefined){
    res.status(200).send({token: req.session.token, user: req.session.user});
  }
  else{
    res.status(400).send(null);
  }
});

module.exports = router;

