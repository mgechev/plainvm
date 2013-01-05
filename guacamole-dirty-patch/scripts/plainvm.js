(function () {
   var search = window.location.search;
   search = search.substr(1, search.length);
   console.log(search);
   if (search.length > 0) {
       var parts = search.split('&'),
           keyValue = {},
           pairs;
       console.log(keyValue);
       for (var i = 0; i < parts.length; i += 1) {
           pairs = parts[i].split('=');
           keyValue[pairs[0]] = pairs[1];
       }
       if (keyValue.autologin) {
           document.getElementById('username').value = keyValue.username;
           document.getElementById('password').value = '';
           document.forms[0].onsubmit();
       }
   }
}());
