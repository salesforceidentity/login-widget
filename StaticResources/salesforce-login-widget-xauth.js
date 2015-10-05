/*
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
!function(){function e(e,t){e&&"number"==typeof e.id&&r.console&&r.console.log&&r.console.log(e.cmd+" Error: "+t)}function t(e,t){e&&"number"==typeof e.id&&r.parent.postMessage(JSON.stringify(e),t)}function n(){return"1"==o.getItem("disabled.xauth.org")}function i(e){var i=e.origin.split("://")[1].split(":")[0],r=JSON.parse(e.data);r&&"object"==typeof r&&r.cmd&&void 0!=r.id&&!n()&&d[r.cmd]&&t(d[r.cmd](i,r),e.origin)}var r=window;if(r.top!=r&&r.postMessage&&r.localStorage&&r.JSON){var o=r.localStorage,s=null,a=document.cookie.match(/(?:^|;)\s*session=(\d+)(?:;|$)/);a&&a.length&&(s=a[1]),s||(s=(new Date).getTime(),document.cookie="session="+s+"; ");var d={"xauth::extend":function(t,n){if(!n.token)return e(n,"Invalid",t),null;n.token=String(n.token).substr(0,8192),n.expire=Number(n.expire);var i=new Date(n.expire);if(i<new Date)return e(n,"Invalid Expiration",t),null;if(!n.extend||!n.extend.length)return e(n,"No Extend List Specified",t),null;var r={token:n.token,expire:n.expire,extend:n.extend};return n.session===!0&&(r.session=s),o.setItem(t,JSON.stringify(r)),{cmd:n.cmd,id:n.id}},"xauth::retrieve":function(t,n){if(!n.retrieve||!n.retrieve.length)return e(n,"No Retrieve List Requested",t),null;for(var i={},r=0;r<n.retrieve.length;r++){var a=n.retrieve[r],d=o.getItem(a),c=d?JSON.parse(d):null;if(c&&!c.block){var u=t==a;if(!u)for(var l=0;l<c.extend.length;l++)if("*"==c.extend[l]||c.extend[l]==t){u=!0;break}if(u){var m=new Date(c.expire);if(m<new Date){o.removeItem(a);continue}if(c.session&&c.session!=s){o.removeItem(a);continue}i[a]={token:c.token,expire:c.expire}}}}return{cmd:n.cmd,id:n.id,tokens:i}},"xauth::expire":function(e,t){return o.removeItem(e),{cmd:t.cmd,id:t.id}}};r.addEventListener?r.addEventListener("message",i,!1):r.attachEvent&&r.attachEvent("onmessage",i),r.parent.postMessage(JSON.stringify({cmd:"xauth::ready"}),"*")}}();