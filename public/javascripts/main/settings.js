app.controller('SettingsController', function($scope, $http, ModalService, $rootScope){
    $scope.user = {};
    $scope.password = {
        username: '',
        old: '',
        new: '',
        confirm: ''
    };
    $scope.error_message = '';
    $scope.success_message = '';
    $scope.set_language = $rootScope.current_user.current_language;

    //get current user. this is different from rootScope user since here you will get other info
    $http.get('/users/current').then(function(res){
        $scope.user = res.data.user;
        //console.log('current User', $scope.user);
    }).catch(function(err){
        $scope.error_message = err.data.error_message;
    });

    $scope.changePassword = function(){
        //console.log('oii');
        if($scope.password.new != $scope.password.confirm){
            $scope.error_message = 'Passwords do not match';
        }
        else{
            //optional. in db findOne, can use req.session.user.username
            $scope.password.username = $scope.user.username;
            
            //remove confirm before submit
            delete $scope.password.confirm;

            //console.log($scope.password);

            $http.put('/users/changePassword', $scope.password).then(function(res){
                $scope.success_message = res.data.success_message;
                ModalService.hide();
            }).catch(function(err){
                $scope.error_message = err.data.error_message;
            });
        }
    };

    $scope.updateProfilePicture = function(){
        //get image
        var formData = new FormData();
        var file = $('#file')[0].files[0];

        formData.append('profile_picture', file);

        $http.post('/users/profilePicture', formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        }).then(function(res){
            $scope.success_message = res.data.success_message;
            $rootScope.current_user.profile_picture = res.data.profile_picture;
            //ModalService.hide();

            //try alert & reload (bad remedy)
            alert($scope.success_message);
            location.reload();
            
        }).catch(function(err){
            //console.log(err);
            $scope.error_message = err.data.error_message;
        });
    };

    $scope.setLanguage = function(){
        $http.put('/users/setLanguage/' + $scope.set_language).then(function(res){
            $scope.success_message = res.data.success_message;
            $rootScope.current_user.current_language = $scope.set_language;
            //get english & nihongo languages from server and set to rootScope
            $http.get('/languages/getLanguages').then(function(res){
                //console.log('getting languages...');
                $rootScope.languages = res.data.languages;
                //console.log($rootScope.languages);
            });
        }).catch(function(err){
            $scope.error_message = err.data.error_message;
        });
    }

    $scope.resetMessages = function(){
        $scope.error_message = '';
        $scope.success_message = '';
    };
});