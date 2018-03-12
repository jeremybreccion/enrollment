app.controller('AdminController', function($scope, $http, ModalService, $filter, $rootScope){
    $scope.account_model = {};
    $scope.account_list = [];
    $scope.error_message = '';
    $scope.modal_error_message = '';
    $scope.success_message = '';

    function getAllAccounts(){
        $http.get('/users/getAll').then(function(res){
            $scope.account_list = res.data.accounts;
        }).catch(function(err){
            $scope.error_message = err.data.error_message;
        });
    }

    getAllAccounts();

    $scope.register = function(){
        //generate other info
        $scope.account_model.created_date = $filter('date')(new Date(), "yyyy-MM-dd HH:mm:ss");
        $scope.account_model.profile_picture = 'default.jpg';
        $scope.account_model.username = $scope.account_model.first_name.toLowerCase() + '.' + $scope.account_model.last_name.toLowerCase();
        $scope.account_model.full_name = $scope.account_model.first_name.toLowerCase() + ' ' + $scope.account_model.last_name.toLowerCase();

        $scope.resetMessages();
        $http.post('/users/register', $scope.account_model).then(function(res){
            $scope.success_message = res.data.success_message;
            ModalService.hide();
            getAllAccounts();
        }).catch(function(err){
            $scope.modal_error_message = err.data.error_message;
        });
    };

    $scope.deleteAccount = function(account){
        $scope.resetMessages();

        //check so that the logged in account cannot be deleted
        if($rootScope.current_user.username == account.username){
            $scope.error_message = 'Cannot delete yourself';
        }
        else{
            if(confirm('Delete user: ' + account.username + '?')){
                $http.delete('/users/delete/' + account.username).then(function(res){
                    $scope.success_message = res.data.success_message;
                    getAllAccounts();
                }).catch(function(err){
                    $scope.error_message = err.data.error_message;
                });
            }
        }
    };

    $scope.resetMessages = function(){
        $scope.modal_error_message = '';
        $scope.error_message = '';
        $scope.success_message = '';
    };

});