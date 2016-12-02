# Serverside callbacks

If you'd like to have your callback use an authorization code response_type and return your access token to the server, you need to implement a callback handler.   

An example servlet is provide...you'll have to port this to your preferred language

If using server side callbacks, you'll need this tag included on your page with the widget

```
<meta name="salesforce-server-callback" content="true">
   
```

