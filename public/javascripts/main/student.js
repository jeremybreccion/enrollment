app.controller('StudentController', function($scope, ClassService, ModalService, $rootScope){
    $scope.class_list = [];
    $scope.error_message = '';
    $scope.success_message = '';
    $scope.enrolled_class_list = [];

    $scope.isEnrolled = function(selected_class){
        //if indexOf results != -1, student's full name is included
        return (selected_class.students.length > 0 && selected_class.students.indexOf($rootScope.current_user.full_name) != -1) ? true : false;
    }

    function getAllClasses(){
        ClassService.getAll().then(function(response){
            $scope.class_list = response.classes;

            //process for enrolled classes
            //console.log($rootScope.current_user.full_name);
            $scope.enrolled_class_list = $scope.class_list.filter(function(selected_class){
                //console.log(selected_class);
                return $scope.isEnrolled(selected_class);
            });
        }).catch(function(error){
            $scope.error_message = error.error_message;
        });
    }

    getAllClasses();

    $scope.resetMessages = function(){
        $scope.error_message = '';
        $scope.success_message = '';
    };

    $scope.displayDays = function(days){
        return days.toString().replace(/,/g, ', ');
    };

    $scope.enroll = function(selected_class){
        ClassService.enroll(selected_class).then(function(response){
            $scope.success_message = response.success_message;
            getAllClasses();
        }).catch(function(error){
            $scope.error_message = error.error_message;
        });
    }

    $scope.drop = function(selected_class){
        if(confirm('Are you sure you want to drop ' + selected_class.name + '?')){
            ClassService.drop(selected_class).then(function(response){
                $scope.success_message = response.success_message;
                getAllClasses();
            }).catch(function(error){
                $scope.error_message = error.error_message;
            });
        }
    }

});