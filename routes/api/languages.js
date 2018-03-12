var express = require('express');
var router = express.Router();
var languages = require('../../config/language.json');

router.get('/getLanguages', function(req, res, next){
    //else statement ('english') can be changed to the language set by admin in future development
    var current_language = (req.session.user != undefined) ? req.session.user.current_language : 'english';
    res.status(200).send({languages: languages[current_language]});
});

//setting each user's language is on routes/users.js

module.exports = router;