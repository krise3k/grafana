define(['angular',
  'lodash',
  'jquery',
  'require',
  'app/core/config',
],
function (angular, _, $, require, config) {
  'use strict';

  var module = angular.module('grafana.controllers');

  module.controller('ShareModalCtrl', function($scope, $rootScope, $location, $timeout, timeSrv, templateSrv, linkSrv) {

    $scope.options = { forCurrent: true, includeTemplateVars: true, browserTimeOffset: false, theme: 'current' };
    $scope.editor = { index: $scope.tabIndex || 0};

    $scope.init = function() {
      $scope.modeSharePanel = $scope.panel ? true : false;

      $scope.tabs = [{title: 'Link', src: 'shareLink.html'}];

      if ($scope.modeSharePanel) {
        $scope.modalTitle = 'Share Panel';
        $scope.tabs.push({title: 'Embed', src: 'shareEmbed.html'});
      } else {
        $scope.modalTitle = 'Share';
      }

      if (!$scope.dashboard.meta.isSnapshot) {
        $scope.tabs.push({title: 'Snapshot', src: 'shareSnapshot.html'});
      }

      if (!$scope.dashboard.meta.isSnapshot && !$scope.modeSharePanel) {
        $scope.tabs.push({title: 'Export', src: 'shareExport.html'});
      }

      $scope.buildUrl();
    };

    $scope.buildUrl = function() {
      var baseUrl = $location.absUrl();
      var queryStart = baseUrl.indexOf('?');

      if (queryStart !== -1) {
        baseUrl = baseUrl.substring(0, queryStart);
      }

      var params = angular.copy($location.search());

      var range = timeSrv.timeRange();
      params.from = range.from.valueOf();
      params.to = range.to.valueOf();

      if ($scope.options.includeTemplateVars) {
        templateSrv.fillVariableValuesForUrl(params);
      }

      if (!$scope.options.forCurrent) {
        delete params.from;
        delete params.to;
      }

      if ($scope.options.theme !== 'current') {
        params.theme = $scope.options.theme;
      }

      if ($scope.modeSharePanel) {
        params.panelId = $scope.panel.id;
        params.fullscreen = true;
      } else {
        delete params.panelId;
        delete params.fullscreen;
      }

      $scope.shareUrl = linkSrv.addParamsToUrl(baseUrl, params);

      var soloUrl = $scope.shareUrl;
      soloUrl = soloUrl.replace(config.appSubUrl + '/dashboard/', config.appSubUrl + '/dashboard-solo/');
      soloUrl = soloUrl.replace("&fullscreen", "").replace("&edit", "");

      $scope.iframeHtml = '<iframe src="' + soloUrl + '" width="450" height="200" frameborder="0"></iframe>';

      $scope.imageUrl = soloUrl.replace(config.appSubUrl + '/dashboard-solo/', config.appSubUrl + '/render/dashboard-solo/');
      $scope.imageUrl += '&width=1000';
      $scope.imageUrl += '&height=500';
      if ($scope.options.browserTimeOffset) {
        var offsetMinutes = new Date().getTimezoneOffset(); // Negative if ahead of UTC
        var sign = offsetMinutes < 0 ? '+' : '-';
        var hours = ('0' + Math.abs(offsetMinutes) / 60).slice(-2);
        var minutes = ('0' + Math.abs(offsetMinutes) % 60).slice(-2);
        $scope.imageUrl += '&timeOffset=' + encodeURIComponent(sign + hours + minutes);
      }
    };

  });

  module.directive('clipboardButton',function() {
    return function(scope, elem) {
      require(['vendor/clipboard/dist/clipboard'], function(Clipboard) {
        scope.clipboard = new Clipboard(elem[0]);
      });

      scope.$on('$destroy', function() {
        if (scope.clipboard) {
          scope.clipboard.destroy();
        }
      });
    };
  });

});
