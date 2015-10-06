@RestResource(urlMapping='/xauth/*')
global class SalesforceLoginWidgetXAuthServer {
    @HttpGet
    global static void doGet() {
        
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        res.addHeader('Content-Type', 'text/html');
        res.addHeader('Cache-Control', 'public');
        res.addHeader('Expires', 'Thu, 3 Oct 2115 00:00:00 GMT');
        res.addHeader('Last-Modified', 'Sat, 3 Oct 2015 00:00:00 GMT');
        String community = req.params.get('community');
        if (community == null) community = '';
        res.statusCode = 200; 
        res.responseBody = Blob.valueOf('<script type="text/javascript" src="' + community + '/resource/salesforce_login_widget_xauth"></script>');
    }
}