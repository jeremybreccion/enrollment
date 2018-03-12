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
//this function can be used in both adding and updating classes
function validateClass(req_class, full_name){
    var deferred = q.defer();
    db.classes.find({}).toArray(function(err, classes){
        if(err){
            console.log(err);
            deferred.reject({message: 'Database Error. Contact Administrator'});
            //return false;     
        }
        //if no classes, then room is free. therefore, can add
        else if(classes.length == 0){
            //return true;
            console.log('no similar classes found');
            deferred.resolve();
        }
        else{
            //loop each class
            for(var i = 0; i < classes.length; i++){
                //console.log(classes[i]);
                
                //skip if updating the class itself
                if(req_class._id != undefined){
                    if(req_class._id == classes[i]._id){
                        continue;
                    }
                }
                else if(isOverlap(req_class.start_time, req_class.end_time, classes[i].start_time, classes[i].end_time)){
                    //okay to overlap if different teachers and different rooms
                    if(full_name != classes[i].teacher && req_class.room != classes[i].room){
                        deferred.resolve();
                    }
                    else if(hasSameDay(classes[i].days, req_class.days)){
                        deferred.reject({message: 'Schedule overlaps with another class'});
                    }
                }
                /* //loop each day of each class
                for(var k = 0; k < classes[i].days.length; k++){
                    //find the day in the req.body.days
                    //loop each day in the req.body.days then execute overlap statement if same day
                    for(var l = 0; l < req_class.days.length; l++){
                        if(req_class.days[l] == classes[i].days[k]){
                            //enter condition for overlapping times here
                            //can have the same days but must not have overlapping times per teacher
                            if(isOverlap(req_class.start_time, req_class.end_time, classes[i].start_time, classes[i].end_time)){
                                //if two teachers have same day & time, they must not have the same room
                                if(full_name != classes[i].teacher && req_class.room != classes[i].room){
                                    deferred.resolve();
                                }
                                else{
                                    console.log('overlapped');
                                    deferred.reject({message: 'Schedule overlaps with another class'});
                                    break outerloop;
                                }
                            }
                        }
                    }
                } */
            }
            //return true;
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function isOverlap(rq_st, rq_et, lp_st, lp_et){
    return (rq_et <= lp_st || rq_st >= lp_et) ? false : true;
}

function hasSameDay(per_class_days, req_class_days){
    var hasSameDay = false;
    outerloop:
    for(var i = 0; i < per_class_days.length; i++){
        for(var k = 0; k < req_class_days.length; k++){
            if(req_class_days[k] == per_class_days[i]){
                hasSameDay = true;
                break outerloop;
            }
        }
    }

    return hasSameDay;
}

router.post('/add', function(req, res, next){
    validateClass(req.body, req.session.user.full_name).then(function(){
        addClass();
    }).catch(function(err){
        res.status(400).send({error_message: err.message});
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
    }).catch(function(err){
        res.status(400).send({error_message: err.message});
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
                db.classes.find({students: req.session.user.full_name}).toArray(function(err, classes){
                    if(err){
                        res.status(400).send({error_message: 'Database error. Contact Administrator'});
                    }
                    else{
                        console.log('classes retrieved', classes);
                        for(var i = 0; i < classes.length; i++){
                            if(isOverlap(aClass.start_time, aClass.end_time, classes[i].start_time, classes[i].end_time)){
                                if(hasSameDay(classes[i].days, aClass.days)){
                                    canEnroll = false;
                                    break;
                                }
                            }
                        }
                        
                        if(canEnroll){
                            enrollStudent();
                        }
                        else{
                            res.status(400).send({error_message: 'Schedule overlaps with another enrolled class'});
                        }
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