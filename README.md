# Salesforce Identity Login Widget

A javascript login widget for Salesforce External Identity and Communities

To get started:

1. [https://login.salesforce.com/packaging/installPackage.apexp?p0=04tj0000001eicP](Install the following package)
2. Create a Community
3. Go to the force.com site that underlies your Community.  Click on public access settings and add 'SalesforceLoginWidgetXAuthServer' as an allowed Apex Class.  [Read this for more information on how to do this](https://developer.salesforce.com/blogs/developer-relations/2012/02/quick-tip-public-restful-web-services-on-force-com-sites.html)
4. Add the _callback.html file to your site.  Configure it with your meta properties (see below) and capture the URL
5. Create a Connected App.  Select a scope of openid, and set your callback url to the fully qualified URL from step 5
6. Add the widget to your page as seen in the example index.html file, configuring each of the meta properties (see below)

Optionally, you may set your Community login page to the 'loginpage' visualforce page



##Configuration
--

### _callback.html

1. Configure your community url in both the meta tag and script tag
2. Configure allowed domains.  Comma separated lists of domains that will participate in SSO.   Blank or * will be open to all.
3. Configure your callback mode to match the mode you're using for the widget modal-callback, popup-callback, or inline-callback.  This will be the callback URL for your Connected App

```
<html>
<head>
    <meta name="salesforce-community" content="YOUR COMMUNITY URL">
	<meta name="salesforce-mode" content="popup-callback">
	<meta name="salesforce-allowed-domains" content="*">
    <script src="YOUR COMMUNITY URL/resource/salesforce_login_widget_js_min" async defer></script>
</head> 
<body></body>    
</html>

```

### Widget

1. Configure your community url
2. Configure your client id
3. Configure your callback url
4. Configure your mode.  Valid modes are modal, popup, or inline
5. Configure the node to target
6. Configure login and logout handlers.  These are the names of your javascript methods to call

```
<meta name="salesforce-community" content="YOUR COMMUNITY URL">
<meta name="salesforce-client-id" content="CONNECTED APP CLIENT ID">
<meta name="salesforce-redirect-uri" content="YOUR CALLBACK URL">
<meta name="salesforce-mode" content="inline">
<meta name="salesforce-target" content="#salesforce-login">
<meta name="salesforce-login-handler" content="onLogin">
<meta name="salesforce-logout-handler" content="onLogout">
<link href="YOUR COMMUNITY URL/resource/salesforce_login_widget_css" rel="stylesheet" type="text/css" />  
<script src="YOUR COMMUNITY URL/resource/salesforce_login_widget_js_min" async defer></script>

```
