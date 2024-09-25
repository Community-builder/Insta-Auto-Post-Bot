//to get acees toekn

FB.getLoginStatus(function(response) {
  if (response.status === 'connected') {
    console.log(response.authResponse.accessToken);
  }
});

userid=3852094065117525




curl -i -X GET "https://graph.facebook.com/3852094065117525?fields=id,name,email,picture&access_token="




python3 -m http.server 8000

ngrok http 8000
