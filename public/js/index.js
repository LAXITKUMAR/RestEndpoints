var app = angular.module('restEndpointsApp', ['ngMaterial', 'ngMdIcons', 'ngMessages']);

app.run(function ($rootScope) {
    $rootScope.availableEndpoints = [];
});

app.controller('RestEndpointsCtrl', ['$rootScope', '$scope', '$http', '$mdDialog', '$mdToast', function ($rootScope, $scope, $http, $mdDialog, $mdToast) {
    $http.get('ENDPOINTAPP__GET__AVAILABLEENDPOINTS').then(function (response) {
        $rootScope.availableEndpoints = response.data;
    });

    $scope.showAdd = function (ev) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: '../tmpl/main-form.html',
            targetEvent: ev
        }).then(function (answer) {
            $scope.alert = 'You said the information was "' + answer + '".';
        }, function () {
            $scope.alert = 'You cancelled the dialog.';
        });
    };

    $scope.removeEndpoint = function (endpoint) {
        $http.post('/ENDPOINTAPP__DELETE__ENDPOINT', endpoint).then(function (response) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('Successfully deleted endpoint: ' + response.data.deletedEndpoint.endpoint)
                    .hideDelay(7000)
            );
            $rootScope.availableEndpoints = response.data.availableEndpoints;
        }, function (response) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('Failed to delete endpoint!')
                    .hideDelay(7000)
            );
        });
    };
}]);

function DialogController($rootScope, $scope, $mdDialog, $http, $mdToast) {
    $scope.hide = function () {
        $mdDialog.hide();
    };
    $scope.cancel = function () {
        $mdDialog.cancel();
    };
    $scope.answer = function (answer, form) {
        if (answer === 'create') {
            $http.post('/ENDPOINTAPP__CHECK_IF_AVAILABLE', $scope.restEndPoint).then(function (response) {
                if (response.data.isAvailable) {
                    //call express function
                    $http.post('/ENDPOINTAPP__CREATE__ENDPOINT', $scope.restEndPoint).then(function (response) {
                        $rootScope.availableEndpoints = response.data;
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Endpoint Created Succesfully!')
                                .hideDelay(3000)
                        );
                    }, function (response) {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Failed to create endpoint!')
                                .hideDelay(3000)
                        );
                    });
                    $mdDialog.hide(answer);
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Failed to create endpoint!\nEndpoint already exists!')
                            .hideDelay(5000)
                    );
                }

            }, function (error) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Something went wrong!')
                        .hideDelay(3000)
                );
            });
        } else {
            $mdDialog.hide(answer);
        }
    };
}

app.config(function ($mdThemingProvider) {
    var customBlueMap = $mdThemingProvider.extendPalette('deep-purple', {
        'contrastDefaultColor': 'light',
        'contrastDarkColors': ['50'],
        '50': 'ffffff'
    });
    $mdThemingProvider.definePalette('customBlue', customBlueMap);
    $mdThemingProvider.theme('default').primaryPalette('customBlue', {
        'default': '500',
        'hue-1': '50'
    }).accentPalette('deep-purple');
});
