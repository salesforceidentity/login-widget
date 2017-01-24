/*
	Copyright  Salesforce.com 2015
	Copyright 2010 Meebo Inc.

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	    http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

var SFIDWidget_loginHandler;
var SFIDWidget_logoutHandler;

var SFIDWidget = function() {
	
	this.config = null;
	this.access_token = null;
	this.openid = null;
	this.openid_response = null;
	
	// Reference shortcut so minifier can save on characters
	this.win = window;

	// Check for browser capabilities
	this.unsupported = !(win.postMessage && win.localStorage && win.JSON);
	
	this.XAuthServerUrl = null;
	this.iframe = null;
	this.postWindow = null;

	// Requests are done asynchronously so we add numeric ids to each
	// postMessage request object. References to the request objects
	// are stored in the openRequests object keyed by the request id.
	this.openRequests = {};
	this.requestId = 0;

	// All requests made before the iframe is ready are queued (referenced by
	// request id) in the requestQueue array and then called in order after
	// the iframe has messaged to us that it's ready for communication
	this.requestQueue = [];
	

	
	function addButton(targetDiv) {
		targetDiv.innerHTML = '';
		var button = document.createElement("button"); 
	 	button.className = "sfid-button";
		button.innerHTML = "Log in";
		button.setAttribute("onClick", "SFIDWidget.login()");
		targetDiv.appendChild(button);		
	}
	
	
	
	function addLogin(targetDiv) {

		if (targetDiv != null) targetDiv.innerHTML = '';

		var content = document.createElement('div'); 
		if (SFIDWidget.config.mode == 'modal') content.id = "sfid-content";
		else if (SFIDWidget.config.mode == 'inline') content.id = "sfid-inline-content";
		
		if (SFIDWidget.config.mode == 'modal')  {
			if (SFIDWidget.authconfig.LoginPage.LogoUrl != null ) {
				var logowrapper = document.createElement('div'); 
			 	logowrapper.id = "sfid-logo_wrapper";
			 	logowrapper.className = "sfid-standard_logo_wrapper sfid-mt12";
			
				var img = document.createElement('img'); 
			 	img.src = SFIDWidget.authconfig.LoginPage.LogoUrl; 
				img.className = "sfid-standard_logo";
			
				logowrapper.appendChild(img);
				content.appendChild(logowrapper);
			}
		}
		
		var error = document.createElement('div'); 
		error.className = "sfid-mb1";
		error.id = "sfid-error";
		error.innerHTML = "Your login attempt has failed. Make sure the username and password are correct. ";
		error.style.display = "none";
		content.appendChild(error);
		
		
		if (SFIDWidget.authconfig.LoginPage.UsernamePasswordEnabled) {
			var form = document.createElement('form'); 
			form.setAttribute("onSubmit", "SFIDWidget.authenticate();return false;");
		
			var un = document.createElement('input'); 
			un.className = "sfid-wide sfid-mb12";
			un.type = "text";
			un.name = "username";
			un.id = "sfid-username";
			un.setAttribute("placeholder", "Username");
			//un.setAttribute("autofocus", "true");
			
			var pw = document.createElement('input'); 
			pw.className = "sfid-wide sfid-mb12";
			pw.type = "password";
			pw.name = "password";
			pw.id = "sfid-password";
			pw.setAttribute("placeholder", "Password");
			
			var button = document.createElement("input"); 
		 	button.className = "sfid-button sfid-wide sfid-mb16";
			button.type = "submit";
			button.id = "sfid-submit";
			button.value = "Log in";
			
			form.appendChild(un);
			form.appendChild(pw);
			form.appendChild(button);
			
			content.appendChild(form);
			
		}
		
		if ((SFIDWidget.authconfig.LoginPage.UsernamePasswordEnabled) && (SFIDWidget.authconfig.AuthProviders.length > 0)) {
			
			var orloginwith = document.createElement("p"); 
			orloginwith.className = "sfid-small sfid-mb16";
			orloginwith.innerHTML = "or log in with";
			content.appendChild(orloginwith);
			
			
		} else if ((!SFIDWidget.authconfig.LoginPage.UsernamePasswordEnabled) && (SFIDWidget.authconfig.AuthProviders.length > 0)) {
			
			var orloginwith = document.createElement("p"); 
			orloginwith.className = "sfid-small sfid-mb16";
			orloginwith.innerHTML = "Choose a Provider";
			content.appendChild(orloginwith);
			
		}
		
		
		
		
		if (SFIDWidget.authconfig.AuthProviders.length > 0) {
		
			var social = document.createElement('div'); 
		 	social.id = "sfid-social";
		
			var socialul = document.createElement('ul'); 
		
			for (var i in SFIDWidget.authconfig.AuthProviders) {
		
				var socialli = document.createElement('li'); 
				
				var icon = document.createElement('img'); 
			 	icon.src = SFIDWidget.authconfig.AuthProviders[i].IconUrl; 
		
				var a = document.createElement('a');
				a.href = SFIDWidget.authconfig.AuthProviders[i].SsoUrl + '&startURL=' + encodeURIComponent(SFIDWidget.config.authorizeURL);
				a.appendChild(icon);
				a.title = SFIDWidget.authconfig.AuthProviders[i].Name;
				socialli.appendChild(a);		
				
				socialul.appendChild(socialli);
		
			}
			social.appendChild(socialul);
			content.appendChild(social);
		
		}
		
		if (SFIDWidget.config.mode == 'modal') {
		
			var lightbox = document.createElement('div'); 
		 	lightbox.className = "sfid-lightbox";
		 	lightbox.id = "sfid-login-overlay";
			lightbox.setAttribute("onClick", "SFIDWidget.cancel()");
		
			var wrapper = document.createElement('div'); 
		 	wrapper.id = "sfid-wrapper";
			wrapper.onclick = function(event) {
			    event = event || window.event // cross-browser event
    
			    if (event.stopPropagation) {
			        // W3C standard variant
			        event.stopPropagation()
			    } else {
			        // IE variant
			        event.cancelBubble = true
			    }
			}
		
			wrapper.appendChild(content);
			lightbox.appendChild(wrapper);
		
			document.body.appendChild(lightbox);	
		} else {
			targetDiv.appendChild(content);			
		}
	}
	

	function closeLogin() {
		var lightbox = document.getElementById("sfid-login-overlay");
		lightbox.style.display = "none";
		if (lightbox.parentNode) {
		  lightbox.parentNode.removeChild(lightbox);
		}
		
	}
	
	

	// Listener for window message events, receives messages from only
	// the xauth domain that we set up in the iframe
	function onMessage(event) {
		// event.origin will always be of the format scheme://hostname:port
		// http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#dom-messageevent-origin
		var originHostname = event.origin.split('://')[1].split(':')[0];
		if(originHostname != SFIDWidget.config.domain ) {
			// Doesn't match xauth.org, reject
			console.log('doesnt match domain: ' + originHostname + ";" + SFIDWidget.config.domain);
			return;
		}
		
		// unfreeze request message into object
		var msg = JSON.parse(event.data);
		if(!msg) {
			return;
		}

		// Check for special iframe ready message and call any pending
		// requests in our queue made before the iframe was created.
		if(msg.cmd == 'xauth::ready') {
			// Cache the reference to the iframe window object
			postWindow = iframe.contentWindow;
			setTimeout(makePendingRequests, 0);
			return;
		}

		// Look up saved request object and send response message to callback
		var request = openRequests[msg.id];
		if(request) {
			if(request.callback) {
				request.callback(msg);
			}
			delete openRequests[msg.id];
		}
	}

	// Called once on first command to create the iframe to xauth.org
	function setupWindow() {
		if(iframe || postWindow) { return; }
		
		// Create hidden iframe dom element
		var doc = win.document;
		iframe = doc.createElement('iframe');
		iframe.id = 'sfid_xdomain';
		var iframeStyle = iframe.style;
		iframeStyle.position = 'absolute';
		iframeStyle.left = iframeStyle.top = '-999px';

		// Setup postMessage event listeners
		if (win.addEventListener) {
			win.addEventListener('message', onMessage, false);
		} else if(win.attachEvent) {
			win.attachEvent('onmessage', onMessage);
		}

		// Append iframe to the dom and load up xauth.org inside
		doc.body.appendChild(iframe);
		iframe.src = SFIDWidget.XAuthServerUrl;
	}
	
	// Called immediately after iframe has told us it's ready for communication
	function makePendingRequests() {
		for(var i=0; i<requestQueue.length; i++) {
			makeRequest(openRequests[requestQueue.shift()]);
		}
	}

	// Simple wrapper for the postMessage command that sends serialized requests
	// to the xauth.org iframe window
	function makeRequest(requestObj) {
		console.log(document.getElementById('sfid_xdomain').contentWindow.postMessage);
		document.getElementById('sfid_xdomain').contentWindow.postMessage(JSON.stringify(requestObj), SFIDWidget.XAuthServerUrl);
	}

	// All requests funnel thru queueRequest which assigns it a unique
	// request Id and either queues up the request before the iframe
	// is created or makes the actual request
	function queueRequest(requestObj) {
		if(unsupported) { return; }
		requestObj.id = requestId;
		openRequests[requestId++] = requestObj;
		// If window isn't ready, add it to a queue
		if(!iframe || !postWindow) {
			requestQueue.push(requestObj.id);
			setupWindow(); // must happen after we've added to the queue
			
		} else {
			makeRequest(requestObj);
		}
	}
	
	// Following three functions are just API wrappers that clean up the
	// the arguments passed in before they're sent and attach the
	// appropriate command strings to the request objects

	function callRetrieve(args) {
		if(!args) { args = {}; }
		var requestObj = {
			cmd: 'xauth::retrieve',
			retrieve: args.retrieve || [SFIDWidget.config.communityURL],
			callback: args.callback || null
		}
		queueRequest(requestObj);
	}
	
	function callAlive(args) {
		if(!args) { args = {}; }
		var requestObj = {
			cmd: 'xauth::alive',
			retrieve: args.retrieve || [SFIDWidget.config.communityURL],
			callback: args.callback || aliveCallback
		}
		queueRequest(requestObj);
	}
	
	function callExtend(args) {
		if(!args) { args = {}; }
		var requestObj = {
			cmd: 'xauth::extend',
			token: args.token || '',
			expire: args.expire || 0,
			extend: args.extend || [],
			session: args.session || false,
			callback: args.callback || null,
			communityURL: SFIDWidget.config.communityURL
		}
		queueRequest(requestObj);
	}
	
	function callExpire(args) {
		if(!args) { args = {}; }
		var requestObj = {
			cmd: 'xauth::expire',
			callback: args.callback || null,
			communityURL: SFIDWidget.config.communityURL
		}
		queueRequest(requestObj);
	}
	
	function aliveCallback(response) {
		
		if ((response.alive) && (SFIDWidget.openid_response == null)) {
			//you got logged in
			console.log('you got logged in');
			SFIDWidget.init();
			
		} else if ((!response.alive) && (SFIDWidget.openid_response)) {
			//you got logged out
			console.log('you got logged out');
			SFIDWidget.logout();
		}
		
		
	}
	
	function setup(response) {
        var tokens = response.tokens;
        for(var domain in tokens) {
            var encodedToken = tokens[domain]['token'];
			var decodedToken = atob(encodedToken);
			SFIDWidget.openid_response = JSON.parse(decodedToken);
        }
		if (SFIDWidget.openid_response) {
			window[SFIDWidget_loginHandler](SFIDWidget.openid_response);
		} else {

			if (SFIDWidget.config.mode == 'popup') {

				var targetDiv = document.querySelector(SFIDWidget.config.target );
				processConfig();
	
			} else if ((SFIDWidget.config.mode == 'modal') || (SFIDWidget.config.mode == 'inline')) {

				if ((sessionStorage.authconfig == null) || (sessionStorage.authconfig == 'null')) {
	
					var request = new XMLHttpRequest();
					request.onreadystatechange = function () {
					    var DONE = this.DONE || 4;
					    if (this.readyState === DONE){
							SFIDWidget.authconfig = JSON.parse(this.responseText);
							sessionStorage.authconfig = btoa(JSON.stringify(SFIDWidget.authconfig));
							processConfig();
					    }
					};
					request.open('GET', SFIDWidget.config.communityURL + '/.well-known/auth-configuration', true);
					request.send(null);
					
				} else {
					
					SFIDWidget.authconfig = JSON.parse(atob(sessionStorage.authconfig));
					processConfig();
					
				}
	
			}	

		}
		
		setInterval("SFIDWidget.isAlive()",3000);

	}
	
	function processConfig() {
		
		var state = '';
		if (SFIDWidget.config.mode == 'popup') {
			state = encodeURIComponent(SFIDWidget_loginHandler); 
		} else {
			state = (SFIDWidget.config.startURL ? encodeURIComponent(SFIDWidget.config.startURL) : '');
		}

		var responseType = 'token';
		if (SFIDWidget.config.serverCallback) responseType = 'code';

		SFIDWidget.config.authorizeURL = '/services/oauth2/authorize?response_type=' + responseType + '&client_id=' + SFIDWidget.config.client_id + '&redirect_uri=' + encodeURIComponent(SFIDWidget.config.redirect_uri) + '&state=' + state; 

		if (SFIDWidget.config.mode == 'inline') {
			var targetDiv = document.querySelector(SFIDWidget.config.target );
			addLogin(targetDiv);
		} else {
			var targetDiv = document.querySelector(SFIDWidget.config.target );
			addButton(targetDiv);
		}
		
	}
	
	function showError() {
		var e = document.getElementById('sfid-error');
		e.style.display = 'inline';
	}
	
	function hideError() {
		var e = document.getElementById('sfid-error');
		e.style.display = 'none';
	}
	
	
    var ready = function(a,b,c){b=document,c='addEventListener';b[c]?b[c]('DOMContentLoaded',a):window.attachEvent('onload',a)}
	
	function fetch() {
	    SFIDWidget.getToken({
	      callback: setup
	    });
	}
	

	return {
		init: function() {
			
			SFIDWidget.config = {};
			
			SFIDWidget.config.startURL = location.pathname+location.search;
			
			// adding support for Apex namespace
			var namespace = null;
			var namespaceTag = document.querySelector('meta[name="salesforce-namespace"]');
			if (namespaceTag != null && namespaceTag.content != ''){
				namespace = namespaceTag.content + '/';
			}
			
			var communityURLTag = document.querySelector('meta[name="salesforce-community"]');
			if (communityURLTag == null) {
				alert('Specify a meta-tag for salesforce-community');
				return;
			} else {
				SFIDWidget.config.communityURL = communityURLTag.content;
				var rawDomain = SFIDWidget.config.communityURL.substring(8,SFIDWidget.config.communityURL.length);
				if (rawDomain.indexOf("/") > 0) rawDomain = rawDomain.substring(0,rawDomain.indexOf('/'));
				SFIDWidget.config.domain = rawDomain;
				SFIDWidget.XAuthServerUrl = SFIDWidget.config.communityURL + "/services/apexrest/";
				if (namespace != null) SFIDWidget.XAuthServerUrl += namespace;
				SFIDWidget.XAuthServerUrl += "xauth?community=" + SFIDWidget.config.communityURL;
			}
			
			var callbackMethodTag = document.querySelector('meta[name="salesforce-server-callback"]');
			if ((callbackMethodTag == null) || (callbackMethodTag.content == 'false')) {
				SFIDWidget.config.serverCallback = false;
			} else if (callbackMethodTag.content == 'true') {
				SFIDWidget.config.serverCallback = true;
			}
			
			var modeTag = document.querySelector('meta[name="salesforce-mode"]');
			if (modeTag == null) {
				alert('Specify a meta-tag for salesforce-mode');
				return;
			} else {
				SFIDWidget.config.mode = modeTag.content;
				if ((SFIDWidget.config.mode == 'popup-callback') || (SFIDWidget.config.mode == 'modal-callback') || (SFIDWidget.config.mode == 'inline-callback')) {
					
					var allowedDomainsTag = document.querySelector('meta[name="salesforce-allowed-domains"]');
					if (allowedDomainsTag == null) {
						alert('Specify a meta-tag for salesforce-allowed-domains');
					} else {
						SFIDWidget.config.allowedDomains = allowedDomainsTag.content.split(',');
					}
					
					
					var saveTokenTag = document.querySelector('meta[name="salesforce-save-access-token"]');
					if ((saveTokenTag == null) || (saveTokenTag.content == 'false')) {
						SFIDWidget.config.saveToken = false;
					} else if (saveTokenTag.content == 'true') {
						SFIDWidget.config.saveToken = true;
					}
										
					SFIDWidget.handleLoginCallback();
					return;
				}
			}
		
			var client_idTag = document.querySelector('meta[name="salesforce-client-id"]');
			if (client_idTag == null) {
				alert('Specify a meta-tag for salesforce-client-id');
				return;
			} else {
				SFIDWidget.config.client_id = client_idTag.content;
			}
			
			var redirect_uriTag = document.querySelector('meta[name="salesforce-redirect-uri"]');
			if (redirect_uriTag == null) {
				alert('Specify a meta-tag for salesforce-redirect-uri');
				return;
			} else {
				SFIDWidget.config.redirect_uri = redirect_uriTag.content;
			}
	
			
			var targetTag = document.querySelector('meta[name="salesforce-target"]');
			if (targetTag == null) {
				alert('Specify a meta-tag for salesforce-target');
				return;
			} else {
				SFIDWidget.config.target = targetTag.content;
			}
	
			
			var loginHandlerTag = document.querySelector('meta[name="salesforce-login-handler"]');
			if (loginHandlerTag == null) {
				alert('Specify a meta-tag for salesforce-login-handler');
				return;
			} else {
				SFIDWidget_loginHandler = loginHandlerTag.content;
			}
			
			var logoutHandlerTag = document.querySelector('meta[name="salesforce-logout-handler"]');
			if (logoutHandlerTag != null) {
				SFIDWidget_logoutHandler = logoutHandlerTag.content;
			}
			
			
			if ((SFIDWidget.config.mode == 'popup') || (SFIDWidget.config.mode == 'modal') || (SFIDWidget.config.mode == 'inline')) {
				
				if (document.body == null) {
					ready(function () {fetch();});
				} else {
				    fetch();
				}
			}
	
			
		}, login: function() {
			
			if (SFIDWidget.config != null) {
				
				if (SFIDWidget.config.mode == 'popup') {
					
					//window.location = startURL;
					var loginWindow = window.open(SFIDWidget.config.communityURL + SFIDWidget.config.authorizeURL,'Login Window','height=580,width=450');
					if (window.focus) {loginWindow.focus()}
					return false;
				
				} else if (SFIDWidget.config.mode == 'modal') {
				
					addLogin();
				
				}
				
			}
				
			
		}, authenticate: function(){
			hideError();
			document.getElementById("sfid-submit").disabled = true;
			document.getElementById("sfid-submit").className = 'sfid-disabled sfid-wide sfid-mb16';
			var un = document.getElementById('sfid-username').value;
			var pw = document.getElementById('sfid-password').value;
			
			if ((un != null) && (un != '') && (pw != null) && (pw != '')) {
				
			
				var request = new XMLHttpRequest();
				request.open('POST', SFIDWidget.config.communityURL + '/loginservice', true);
				request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				request.onreadystatechange = function () {
				    var DONE = this.DONE || 4;
				    if (this.readyState === DONE){
						
						var apiResponse = JSON.parse(this.responseText);
						if (apiResponse.result == 'invalid') {
							showError();
							document.getElementById("sfid-submit").disabled = false;
							document.getElementById("sfid-submit").className = 'sfid-button sfid-wide sfid-mb16';
							
							
							
						} else {
			
							var ifrm = document.createElement('iframe');
							ifrm.setAttribute('src', apiResponse.result);
							ifrm.className = 'sfid-callback';
							ifrm.id = 'sfid-callback';
							document.body.appendChild(ifrm);
							
						}
				    }
				};
				request.send('username=' + un + '&password=' + pw + '&startURL=' + encodeURIComponent(SFIDWidget.config.authorizeURL) );
				
				
			} else {
				showError();
				document.getElementById("sfid-submit").className = 'sfid-button sfid-wide sfid-mb16';
				document.getElementById("sfid-submit").disabled = false;
				
			}
			
		}, cancel: function() {
			
			closeLogin();
			
		},  handleLoginCallback: function() {
			
			if (SFIDWidget.config.serverCallback) {
				
				var serverProcessedStartURLTag = document.querySelector('meta[name="salesforce-server-starturl"]');
				if (serverProcessedStartURLTag == null) {
					SFIDWidget.config.startURL = "/";
				} else {
					SFIDWidget.config.startURL = serverProcessedStartURLTag.content;
				}
				
				var serverProcessedResponseTag = document.querySelector('meta[name="salesforce-server-response"]');
				if (serverProcessedResponseTag == null) {
					alert('server callback didnt provide a response');
					return;
				} else {
					SFIDWidget_handleOpenIDCallback(JSON.parse(serverProcessedResponseTag.content));
				}
			
				
			} else {
			
				if (window.location.hash) {
					var message = window.location.hash.substr(1);
					var nvps = message.split('&');
					for (var nvp in nvps) {
					    var parts = nvps[nvp].split('=');
					    if (parts[0] == 'id') {
							SFIDWidget.openid = decodeURIComponent(parts[1]);
					    } else if (parts[0] == 'access_token') {
							SFIDWidget.access_token = parts[1];
						} else if (parts[0] == 'state') {
							if (parts[1] != null) 
							if (SFIDWidget.config.mode == 'popup-callback') {
								if (parts[1] != null) SFIDWidget_loginHandler = decodeURIComponent(parts[1]);
							} else {
								SFIDWidget.config.startURL = decodeURIComponent(parts[1]);
							}
						}
					}
					var openidScript = document.createElement('script');
					openidScript.setAttribute('src', SFIDWidget.openid + '?version=latest&callback=SFIDWidget_handleOpenIDCallback&format=jsonp&access_token=' + SFIDWidget.access_token);
					document.head.appendChild(openidScript);
				}
			}
		},  redirectToStartURL: function() {
			
			if (SFIDWidget.config.mode == 'popup-callback') {
				window.opener.SFIDWidget.openid_response = SFIDWidget.openid_response;
				window.opener[SFIDWidget_loginHandler](SFIDWidget.openid_response);
				window.close();
			} else if ((SFIDWidget.config.mode == 'modal-callback') || (SFIDWidget.config.mode == 'inline-callback')) {
				if ((SFIDWidget.config.startURL) && (SFIDWidget.config.startURL.toLowerCase().indexOf('http') == 0)) {
					alert('You may only use paths for your startURL.');
					return null;
				} else {
					
					if (self==top) {
						window.location = SFIDWidget.config.startURL;
					} else {
						window.parent.SFIDWidget.openid_response = SFIDWidget.openid_response;
						window.parent.callLoginEvent();
					}
				}
			
			} 
			
			
		}, logout: function() {
			
			if (SFIDWidget.openid_response.access_token != null) {
				var revokeURL =  SFIDWidget.config.communityURL + '/services/oauth2/revoke?callback=SFIDWidget_handleRevokeCallback&token=' + SFIDWidget.openid_response.access_token;
				var openidScript = document.createElement('script');
				openidScript.setAttribute('src', revokeURL);
				document.head.appendChild(openidScript);
			}
				
			SFIDWidget.expireToken({callback:SFIDWidget_handleExpireCallback});
			
			var ifrm = document.createElement('iframe');
			ifrm.setAttribute('src', SFIDWidget.config.communityURL + '/secur/logout.jsp');
			ifrm.className = 'sfid-logout';
			ifrm.onload = function() {
			    this.parentNode.removeChild(this);  
				console.log('idp session was invalidated');
			};
			document.body.appendChild(ifrm);
			
			
		},
		setToken: callExtend,
		getToken: callRetrieve,
		expireToken: callExpire,
		isAlive: callAlive,
		disabled: unsupported // boolean, NOT a function
	}

}();

function callLoginEvent() {
	window[SFIDWidget_loginHandler](SFIDWidget.openid_response);
	var iframe = document.getElementById('sfid-callback');
	iframe.parentNode.removeChild(iframe);  
	if (SFIDWidget.config.mode == 'modal')  SFIDWidget.cancel();
	
}

function SFIDWidget_handleOpenIDCallback(response) {
	SFIDWidget.openid_response = response;
	console.log(SFIDWidget.openid_response);
	if ((SFIDWidget.config.saveToken) && (!SFIDWidget.config.serverCallback)) {
		SFIDWidget.openid_response.access_token = SFIDWidget.access_token;
	}
	var encodedResponse = btoa(JSON.stringify(response));
	SFIDWidget.setToken({
		  token: encodedResponse, 
	      expire: 1589249349000, 
	      extend: SFIDWidget.config.allowedDomains,
		  callback: SFIDWidget.redirectToStartURL,
		  session: true
	    });

};

function SFIDWidget_handleRevokeCallback(response) {
	if (response.error != null) {
		console.log('access token was already invalid');
	} else {
		console.log('access token was revoked');
	}
};

function SFIDWidget_handleExpireCallback(response) {
	console.log('xauth token was expired: ' + response);
	SFIDWidget.access_token = null;
	SFIDWidget.openid = null;
	SFIDWidget.openid_response = null;
	SFIDWidget.config = null;
	SFIDWidget.authconfig = null;
	window[SFIDWidget_logoutHandler]();	
};


SFIDWidget.init();



