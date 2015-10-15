/**
* An apex page controller that exposes the site login functionality
*/
global with sharing class LoginController {
    global String username {get; set;}
    global String password {get; set;}
    global String startURL {get; set;}
    global String communityUrl {get; set;}
    global String apiResponse {get; set;}
    global Auth.AuthConfiguration authConfig {get;set;}
    global List<AuthProvider> authProviders {get;set;}
    global Map<String,String> ssoUrls {get;set;}
    global Boolean hasAuthproviders {get; set;}
    global Boolean hasError {get; set;}
    
    global PageReference login() {
        PageReference result = null;
        if ((username != null) && (password != null)) {
            result = Site.login(username, password, startUrl);
        }
        if (ApexPages.hasMessages()) hasError = true;
        return result;
    }
    
    
    global void loginAPI() {
        Apexpages.currentPage().getHeaders().put('Access-Control-Allow-Origin', '*');
        PageReference result = null;
        if ((username != null) && (password != null)) {
            result = Site.login(username, password, startUrl);
        }
        if (ApexPages.hasMessages()) hasError = true;
        if (result != null) apiResponse = result.getUrl();
        else apiResponse = 'invalid';
    }
    
    
    
    global LoginController () {
        hasAuthproviders = false;
        hasError = false;
        username = System.currentPageReference().getParameters().get('username');
        password = System.currentPageReference().getParameters().get('password');
        startUrl = System.currentPageReference().getParameters().get('startURL');
        communityUrl = Site.getBaseUrl();
        if ((communityUrl != null) && (communityUrl != '')) {
            authConfig = new Auth.AuthConfiguration(communityUrl,startUrl);
            authProviders = authConfig.getAuthProviders();
            if (authProviders.size() > 0) {
                hasAuthproviders = true; 
                ssoUrls = new Map<String,String>();
                for (AuthProvider a : authProviders) {
                    String name = a.DeveloperName;
                    String url = Auth.AuthConfiguration.getAuthProviderSsoUrl(communityUrl, startUrl, name);   
                    ssoUrls.put(name,url);
                }            
            }
        }
    }
}