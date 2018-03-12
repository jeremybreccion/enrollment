app.controller('LoginController', function($scope, $http, $state, $rootScope, ModalService){
    $scope.user = {};
    $scope.email = '';
    $scope.error_message = '';
    $scope.success_message = '';
    $scope.modal_error_message = '';


    $scope.login = function(){
        $http.post('/users/login', $scope.user)
        .then(function(res){
            $rootScope.current_user = res.data.user;
            $rootScope.token = res.data.token;
            //$http.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.token;
            //console.log('LOGGED IN');
            //get english & nihongo languages from server and set to rootScope
            $http.get('/languages/getLanguages').then(function(res){
                //console.log('getting languages...');
                $rootScope.languages = res.data.languages;
                //console.log($rootScope.languages);
                $state.transitionTo('home');
            });
        })
        .catch(function(err){
            $scope.error_message = err.data.error_message;
        });
    };

    $scope.sendForgotPasswordEmail = function(){
        //console.log('sending email...');
        $http.post('/users/forgotPassword', {email: $scope.email}).then(function(res){
            $scope.success_message = res.data.success_message;
            ModalService.hide();
        }).catch(function(err){
            $scope.modal_error_message = err.data.modal_error_message;
        });
    };

    $scope.resetModal = function(){
        $scope.error_message = '';
    }
});