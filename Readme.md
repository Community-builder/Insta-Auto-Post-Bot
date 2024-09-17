//to get acees toekn

FB.getLoginStatus(function(response) {
  if (response.status === 'connected') {
    console.log(response.authResponse.accessToken);
  }
});

userid=3852094065117525




curl -i -X GET "https://graph.facebook.com/3852094065117525?fields=id,name,email,picture&access_token=EAAPAstZAT7iwBO4BWHvTUcdqnOwEwo5f0guJFQR2o7hXETyrkBKdd2zX5LVPc5x4MVbgInaNdmZAYripu4GktdoPcShrG3xrZAvB3J3JsP7HapCu1qiRwiquZCqZBlpclVG9D9bBZBmAH7qD1ZAIbeokPt1xc6H4Xkruqq9rAUz2XR4ZBKfBHmFSxjViEq6WxMWaspstBXaCbkDjrkABvHSk5bIZBbzYPzizUaQZDZD"