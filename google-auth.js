(function(angular, window) {
  'use strict';
  angular.module('googleAuth', ['ng']).provider('gAuth', function() {
    var client_id, hd;
    client_id = null;
    hd = null;
    this.setClientId = function(clientId) {
      return client_id = clientId;
    };
    this.setHD = function(HD) {
      return hd = HD;
    };
    this.$get = [
      '$q', function($q) {
        var checkSessionState, gapiLoadedPromise, refreshLoginToken, scopes, tokenInfo;
        scopes = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
        gapiLoadedPromise = (function() {
          var defer;
          defer = $q.defer();
          $.getScript('https://apis.google.com/js/client.js', function() {
            var _loop;
            return (_loop = function() {
              return setTimeout(function() {
                if (!window.gapi || !window.gapi.auth) {
                  return _loop();
                } else {
                  return setTimeout(function() {
                    return defer.resolve(window.gapi);
                  }, 1);
                }
              }, 10);
            })();
          });
          return defer.promise;
        })();
        tokenInfo = false;
        checkSessionState = function() {
          var defer;
          defer = $q.defer();
          if (!client_id) {
            defer.reject(new Error("Please configure client_id with setClientId"));
            return defer.promise;
          }
          gapiLoadedPromise.then(function(gapi) {
            return gapi.auth.checkSessionState({
              client_id: client_id,
              hd: hd
            }, function(disconnected) {
              return defer.resolve(!disconnected);
            });
          });
          return defer.promise;
        };
        refreshLoginToken = function(showPrompt) {
          var defer;
          if (showPrompt == null) {
            showPrompt = false;
          }
          defer = $q.defer();
          if (!client_id) {
            defer.reject(new Error("Please configure client_id with setClientId"));
            return defer.promise;
          }
          checkSessionState().then(function(ok) {
            var immediate;
            if (!ok && !showPrompt) {
              return defer.resolve(false);
            } else {
              immediate = showPrompt ? false : true;
              return gapi.auth.authorize({
                client_id: client_id,
                scope: scopes,
                immediate: immediate,
                hd: hd
              }, function(json) {
                return defer.resolve(json);
              });
            }
          });
          return defer.promise;
        };
        return {
          refreshLoginToken: refreshLoginToken,
          getUserInfoFromGoogle: function(showPrompt) {
            var tokenPromise;
            if (showPrompt == null) {
              showPrompt = false;
            }
            tokenPromise = (function() {
              var defer;
              defer = $q.defer();
              if (tokenInfo && (tokenInfo.error == null)) {
                defer.resolve(tokenInfo);
                return defer.promise;
              } else {
                return refreshLoginToken(showPrompt);
              }
            })();
            return tokenPromise.then(function(_tokenInfo) {
              var defer;
              tokenInfo = _tokenInfo;
              defer = $q.defer();
              if (_tokenInfo && (_tokenInfo.error == null)) {
                gapiLoadedPromise.then(function(gapi) {
                  return gapi.client.request({
                    path: '/oauth2/v2/userinfo'
                  }).execute(function(user) {
                    return defer.resolve(user);
                  });
                });
              } else {
                defer.resolve(false);
              }
              return defer.promise;
            });
          },
          setScopes: function(_scopes) {
            if (Array.isArray(_scopes)) {
              return scopes = _scopes.join(" ");
            } else {
              return scopes = _scopes;
            }
          },
          getScopes: function() {
            return _scopes.split(" ");
          }
        };
      }
    ];
  });
})(angular, window);
