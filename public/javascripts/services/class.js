app.factory('ClassService', function($http, $q){
    var service = {};

    service.getAll = getAll;
    service.addClass = addClass;
    service.updateClass = updateClass;
    service.enroll = enroll;
    service.drop = drop;

    return service;

    function getAll(){
        return $http.get('/classes/getAll').then(function(res){
            return res.data;
        }).catch(function(err){
            return $q.reject(err.data);
        });
    }

    function addClass(class_model){
        return $http.post('/classes/add', class_model).then(function(res){
            return res.data;
        }).catch(function(err){
            return $q.reject(err.data);
        });
    }

    function updateClass(class_model){
        return $http.put('/classes/update', class_model).then(function(res){
            return res.data;
        }).catch(function(err){
            return $q.reject(err.data);
        });
    }

    function enroll(selected_class){
        return $http.put('/classes/enroll', selected_class).then(function(res){
            return res.data;
        }).catch(function(err){
            return $q.reject(err.data);
        });
    }

    function drop(selected_class){
        return $http.put('/classes/drop', selected_class).then(function(res){
            return res.data;
        }).catch(function(err){
            return $q.reject(err.data);
        });
    }


    
});

