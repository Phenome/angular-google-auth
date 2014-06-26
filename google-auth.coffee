do (angular, window) ->
  'use strict'
  angular
  .module 'googleAuth', ['ng']
  .provider 'gAuth', ->
    client_id = null
    hd = null
    @setClientId = (clientId) ->
      client_id = clientId
    @setHD = (HD) ->
      hd = HD

    @$get = ['$q', ($q) ->
      scopes = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
      
      gapiLoadedPromise = do ->
        defer = $q.defer()
        #$.getScript 'https://apis.google.com/js/client.js', ->
        $.getScript 'https://apis.google.com/js/client.js', ->
          do _loop = ->
            setTimeout ->
              if not window.gapi or not window.gapi.auth
                _loop()
              else
                setTimeout ->
                  defer.resolve window.gapi
                , 1
            , 10
        defer.promise

      tokenInfo = false

      checkSessionState = ->
        defer = $q.defer()
        if !client_id
          defer.reject new Error "Please configure client_id with setClientId"
          return defer.promise
        gapiLoadedPromise.then (gapi) ->
          gapi.auth.checkSessionState
            client_id: client_id
            hd: hd
          , (disconnected) ->
            defer.resolve !disconnected    
        defer.promise

      refreshLoginToken = (showPrompt = false) ->
        defer = $q.defer()
        if !client_id
          defer.reject new Error "Please configure client_id with setClientId"
          return defer.promise
        checkSessionState().then (ok) ->
          if not ok and not showPrompt
            defer.resolve false
          else
            immediate = if showPrompt then false else true
            gapi.auth.authorize
              client_id: client_id
              scope: scopes
              immediate:immediate
              hd: hd
            , (json) ->
              defer.resolve json       
        defer.promise

      #return this object
      refreshLoginToken : refreshLoginToken
      getUserInfoFromGoogle : (showPrompt = false) ->
        tokenPromise = do ->
          defer = $q.defer()
          if tokenInfo and not tokenInfo.error?
            defer.resolve tokenInfo
            defer.promise
          else
            refreshLoginToken showPrompt
        tokenPromise.then (_tokenInfo) ->
          tokenInfo = _tokenInfo
          defer = $q.defer()
          if _tokenInfo and not _tokenInfo.error?
            gapiLoadedPromise.then (gapi) ->
              gapi.client.request path:'/oauth2/v2/userinfo'
              .execute (user) ->
                defer.resolve user
          else
            defer.resolve false
          defer.promise
      setScopes : (_scopes) ->
        if Array.isArray _scopes
          scopes = _scopes.join " "
        else
          scopes = _scopes
      getScopes : ->
        _scopes.split " "
    ]
    return
  return