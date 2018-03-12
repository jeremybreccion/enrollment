var express = require('express');
var router = express.Router();

var config = require('../../config/config.json');
var mongo = require('mongoskin');
var db = mongo.db(config.database.name, { native_parser: true });
db.bind(config.database.collections.classes);
var q = require('q');



router.get('/getAll', function(req, res, next) {
    //console.log(teacher_name);
    var query = {};
    //if the logged in user is a teacher, get only his class
    if(req.session.user.role == 'Teacher'){
        query['teacher'] = req.session.user.full_name;
    }

    //console.log(query);

    db.classes.find(query).toArray(function(err, classes){
        //console.log(classes);
      if(err){
        console.log(err);
        res.status(400).send({error_message: 'Database Error. Contact Administrator'});
      }
      //empty array = no documents
      else if(classes.length == 0){
        res.status(400).send({error_message: 'No classes found'});
      } 
      else{
        res.status(200).send({classes: classes});
      }
    });
});
//to have overlaps:
//  check if days of requested class are in a class 
//  then check if the time will overlap : 
//* assumes that start_time & end_time of requested_class are correct
function validateClass(req_class, full_name){
    var deferred = q.defer();
    db.classes.find({$and: [
        //for checking of days
        {days: {$in: req_class.days}},
        //for checking of overlapping times
        {$and: [
                {start_time: {$lte: req_class.end_time}}, 
                {end_time: {$gte: req_class.start_time}}
            ]
        },
        //other parameters to consider
        {$or: [
                {teacher: full_name},
                {room: req_class.room}
            ]
        }
    ]})
    .toArray(function(err, classes){
        if(err){
            console.log(err);
            deferred.reject({error_message: 'Database Error. Contact Administrator'});
        }
        //no overlaps
        else if(classes.length == 0){
            console.log(classes);
            deferred.resolve();
        }
        //overlap
        else{
            //check if the overlap is the requested_class itself (during updating a class)
            var isUpdate = classes.find(function(aClass){
                return aClass._id == req_class._id;
            });

            //
            if(isUpdate != undefined){
                deferred.resolve();
            }
            else{
                deferred.reject({error_message: 'Schedule overlaps with another class'});
            }
        }
    });

    return deferred.promise;
}

router.post('/add', function(req, res, next){
    validateClass(req.body, req.session.user.full_name).then(function(){        
        addClass();
    }).catch(function(error){
        res.status(400).send({error_message: error.error_message});
    });    

    function addClass(){
        //check for duplicates (?)
        db.classes.findOne({teacher: req.session.user.full_name, name: req.body.name}, function(err, aClass){
            if(err){
                res.status(400).send({error_message: 'Database Error. Contact Administrator'});     
            }
            //class already exists
            else if(aClass){
                //console.log(aClass);
                res.status(400).send({error_message: 'Class already exists'});
            }
            else{
                var inputted_class = req.body;
                inputted_class.students = [];
                inputted_class.teacher = req.session.user.full_name;
                db.classes.insert(inputted_class, function(err){
                    if(err){
                        res.status(400).send({error_message: 'Cannot add class. Contact Administrator'});     
                    }
                    else{
                        res.status(200).send({success_message: 'Class added'});     
                    }
                });
            }
        });
    }
});

router.put('/update', function(req, res, next){
    //check for days and time
    validateClass(req.body, req.session.user.full_name).then(function(){
        updateClass();
    }).catch(function(error){
        res.status(400).send({error_message: error.error_message});
    });

    function updateClass(){
        db.classes.findOne({teacher: req.session.user.full_name, name: req.body.name}, function(err, aClass){
            if(err){
                res.status(400).send({error_message: 'Database Error. Contact Administrator'});     
            }
            //check for duplicate names
            //need to check _id. this means that there is another document that has the requested name
            else if(aClass._id != req.body._id){
                //console.log(aClass);
                res.status(400).send({error_message: 'Another class already exists'});
            }
            else{
                //check for capacity & number of students enrolled
                if(req.body.capacity < aClass.students.length){
                    res.status(400).send({error_message: 'Capacity must be equal or greater ' + 
                    'than the current number of students enrolled in this class'});
                }
                else{

                    //explicitly state fields to be updated
                    var inputted_class = {
                        name: req.body.name,
                        capacity: req.body.capacity,
                        room: req.body.room,
                        days: req.body.days,
                        start_time: req.body.start_time,
                        end_time: req.body.end_time
                    };

                    //use this because after deleting inputted_class._id, req.body._id is also deleted for some reason
                    //delete inputted_class.teacher;
                    //console.log(inputted_class);
                    //console.log(req.body);
                    //use the id since the name of the class can be changed
                    db.classes.update({_id: mongo.helper.toObjectID(req.body._id)}, {$set: inputted_class}, function(err){
                        if(err){
                            res.status(400).send({error_message: 'Cannot update class. Contact Administrator'});     
                        }
                        else{
                            res.status(200).send({success_message: 'Class updated'});     
                        }
                    });
                }
            }
        });
    }
});

router.put('/enroll', function(req, res, next){
    //use _id for extra search?
    db.classes.findOne({name: req.body.name, _id: mongo.helper.toObjectID(req.body._id)}, function(err, aClass){
        if(err){
            res.status(400).send({error_message: 'Database error. Contact Administrator'});
        }
        else if(aClass == null){
            res.status(400).send({error_message: 'Cannot find class'});
        }
        else{
            //check if student is not enrolled
            if(aClass.students.indexOf(req.session.user.full_name) == -1){
                var canEnroll = true;
                //check the enrolled classes of the students then look for overlapped times
                db.classes.find({$and: [
                    //for checking of days
                    {days: {$in: aClass.days}},
                    //for checking of overlapping times
                    {$and: [
                        {start_time: {$lte: aClass.end_time}}, 
                        {end_time: {$gte: aClass.start_time}}
                    ]},
                    //classes where the student belongs
                    {students: req.session.user.full_name},
                ]})
                .toArray(function(err, classes){
                    if(err){
                        res.status(400).send({error_message: 'Database error. Contact Administrator'});
                    }
                    else if(classes.length == 0) {
                        enrollStudent();
                    }
                    else{
                        res.status(400).send({error_message: 'Schedule overlaps with another enrolled class'});
                    }
                });

                function enrollStudent(){
                    //get the students array of the class then push the user's full name
                    var students = aClass.students;
                    students.push(req.session.user.full_name);
                    db.classes.update({_id: mongo.helper.toObjectID(req.body._id)}, {$set: {students: students}}, function(err){
                        if(err){
                            res.status(400).send({error_message: 'Database error. Contact Administrator'});
                        }
                        else{
                            res.status(200).send({success_message: 'You have successfully enrolled in ' + aClass.name});
                        }
                    });
                }
            }
            else{
                res.status(400).send({error_message: 'You are already enrolled in this class'});
            }
                        
        }
    });
});

router.put('/drop', function(req, res, next){
    //use _id for extra search?
    db.classes.findOne({name: req.body.name, _id: mongo.helper.toObjectID(req.body._id)}, function(err, aClass){
        if(err){
            res.status(400).send({error_message: 'Database error. Contact Administrator'});
        }
        else if(aClass == null){
            res.status(400).send({error_message: 'Cannot find class'});
        }
        else{
            //check if student is enrolled
            if(aClass.students.indexOf(req.session.user.full_name) != -1){
                //get the students array of the class then push the user's full name
                var students = aClass.students;
                //remove the user from students array using splice(index, 1);
                students.splice(students.indexOf(req.session.user.full_name), 1);
                db.classes.update({_id: mongo.helper.toObjectID(req.body._id)}, {$set: {students: students}}, function(err){
                    if(err){
                        res.status(400).send({error_message: 'Database error. Contact Administrator'});
                    }
                    else{
                        res.status(200).send({success_message: 'You have successfully dropped ' + aClass.name});
                    }
                });
            }
            else{
                res.status(400).send({error_message: 'You are not enrolled in this class'});
            }
                        
        }
    });
});


module.exports = router;