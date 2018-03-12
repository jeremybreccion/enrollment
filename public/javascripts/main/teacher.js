app.controller('TeacherController', function($scope, ClassService, ModalService, $filter){
    $scope.class_model = {};
    $scope.class_list = [];
    $scope.error_message = '';
    $scope.modal_error_message = '';
    $scope.success_message = '';

    function getAllClasses(){
        ClassService.getAll().then(function(response){
            $scope.class_list = response.classes;
        }).catch(function(error){
            $scope.error_message = error.error_message;
        });
    }

    getAllClasses();

    $scope.addOrUpdateClass = function(){
        //generate other info
        //$scope.class_model.created_date = $filter('date')(new Date(), "yyyy-MM-dd HH:mm:ss");
        $scope.resetMessages();

        //delete student array since teacher must not update this
        delete $scope.class_model.students;

        //need dummy variable to avoid changing errors in input type time due to conversion
        var tempClass = {};
        angular.copy($scope.class_model, tempClass);

        //check for valid time range
        if(tempClass.start_time >= tempClass.end_time){
            $scope.modal_error_message = 'Invalid time range';
        }
        else{
            //convert time to string prior to http request (when displaying model back to html, convert from string to date)
            tempClass.start_time = $filter('date')(tempClass.start_time, 'HH:mm');
            tempClass.end_time = $filter('date')(tempClass.end_time, 'HH:mm');
            //console.log(tempClass);
            //add
            if(tempClass._id == undefined){
                ClassService.addClass(tempClass).then(function(response){
                    //console.log(response);
                    $scope.success_message = response.success_message;
                    ModalService.hide();
                    getAllClasses();
                }).catch(function(error){
                    $scope.modal_error_message = error.error_message;
                });
            }
            //update
            else{
                ClassService.updateClass(tempClass).then(function(response){
                    $scope.success_message = response.success_message;
                    ModalService.hide();
                    getAllClasses();
                }).catch(function(error){
                    $scope.modal_error_message = error.error_message;
                });
            }
        }
        
    };

    $scope.editClass = function(aClass){
        //console.log(aClass);
        $scope.resetMessages();

        //convert time strings to date
        //need dummy variable to avoid changing errors in input type time due to conversion
        var tempClass = {};
        angular.copy(aClass, tempClass);
        tempClass.start_time = new Date('2018/03/09 ' + tempClass.start_time);
        tempClass.end_time = new Date('2018/03/09 ' + tempClass.end_time);;
        angular.copy(tempClass, $scope.class_model);
        //console.log($scope.class_model);
    };

    $scope.resetMessages = function(){
        $scope.modal_error_message = '';
        $scope.error_message = '';
        $scope.success_message = '';
    };

    $scope.resetClass = function(){
        $scope.class_model = {};
        $scope.resetMessages();
    }

    $scope.selectClass = function(selected_class){
        $scope.selected_class = selected_class;
    }

    $scope.displayDays = function(days){
        return days.toString().replace(/,/g, ', ');
    };

});