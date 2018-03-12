
/* REGISTER CONTROLLER is for registering ADMINS */
app.controller('RegisterController', function($scope, $http, $state, $filter){
    $scope.error_message = '';
    $scope.user = {};

    $scope.register = function(){
        if($scope.user.password != $scope.user.confirm_password){
            $scope.error_message = 'Passwords do not match!';
        }
        else{
            delete $scope.user.confirm_password;
            $scope.user.profile_picture = 'default.jpg';
            $scope.user.username = $scope.user.first_name.toLowerCase() + '.' + $scope.user.last_name.toLowerCase();
            $scope.user.full_name = $scope.user.first_name.toLowerCase() + ' ' + $scope.user.last_name.toLowerCase();

            //regi
            $scope.user.role = 'Admin';
            $scope.user.created_date = $filter('date')(new Date(), "yyyy-MM-dd HH:mm:ss");
            //console.log('user to be registered', $scope.user);
            $http.post('/users/register', $scope.user)
            .then(function(res){
                alert(res.data.success_message);
                $state.transitionTo('login');
            })
            .catch(function(err){
                $scope.error_message = err.data.error_message;
            });
        }
    };
});