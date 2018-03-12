app.factory('ModalService', function(){
    var service = {};

    service.hide = hideModal;
    return service;

    function hideModal(){
        $('.modal').hide();
        $('.modal-backdrop').hide();
    }
});

