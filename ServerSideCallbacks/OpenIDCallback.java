package com.salesforce.oauth;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.httpclient.methods.PostMethod;
import org.json.JSONObject;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URLDecoder;


public class OpenIDCallback extends HttpServlet{

    private static String client_id;
    private static String client_secret;
    private static String token_endpoint;
    private static String redirect_uri;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        client_id = System.getenv("client_id");
        if (client_id == null) throw new ServletException("set the client_id environment parameter");
        client_secret = System.getenv("client_secret");
        if (client_secret == null) throw new ServletException("set the client_secret environment parameter");
        token_endpoint = System.getenv("token_endpoint");
        if (token_endpoint == null) throw new ServletException("set the token_endpoint environment parameter");
        redirect_uri = System.getenv("redirect_uri");
        if (redirect_uri == null) throw new ServletException("set the redirect_uri environment parameter");

    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

        String code = request.getParameter("code");
        code = URLDecoder.decode(code,"UTF-8");
        String startURL = request.getParameter("state");
        startURL = URLDecoder.decode(startURL,"UTF-8");

        HttpClient httpclient = new HttpClient();
        PostMethod post = new PostMethod(token_endpoint);
        post.addParameter("code",code);
        post.addParameter("grant_type","authorization_code");
        post.addParameter("client_id",client_id);
        post.addParameter("client_secret",client_secret);
        post.addParameter("redirect_uri", redirect_uri);
        httpclient.executeMethod(post);
        String tokenResponse = post.getResponseBodyAsString();
        post.releaseConnection();

        System.out.println(post.getStatusCode() + " : " + tokenResponse);

        JSONObject identityJSON = null;
        try {
            JSONObject token = new JSONObject(tokenResponse);

            String accessToken = token.getString("access_token");
            String identity = token.getString("id");
            httpclient = new HttpClient();
            GetMethod get = new GetMethod(identity + "?version=latest");
            get.setFollowRedirects(true);
            get.addRequestHeader("Authorization","Bearer " + accessToken);
            httpclient.executeMethod(get);
            String identityResponse = get.getResponseBodyAsString();
            get.releaseConnection();
            identityJSON = new JSONObject(identityResponse);
            identityJSON.put("access_token", accessToken);

        } catch (Exception e) {
            throw new ServletException(e);
        }

        PrintWriter out = response.getWriter();

        out.write(
            "<html><head>\n" +
            "<meta name=\"salesforce-community\" content=\"https://loginwidget-developer-edition.na16.force.com/test\">\n" +
            "<meta name=\"salesforce-mode\" content=\"modal-callback\">\n" +
            "<meta name=\"salesforce-server-callback\" content=\"true\">\n" +
            "<meta name=\"salesforce-server-response\" content='" + identityJSON.toString()  +"'>\n" +
            "<meta name=\"salesforce-server-starturl\" content='" + startURL  +"'>\n" +
            "<meta name=\"salesforce-allowed-domains\" content=\"loginwidget-modal.herokuapp.com,loginwidget-inline.herokuapp.com,loginwidget-popup.herokuapp.com,loginwidget-servercallback.herokuapp.com\">\n" +
            "<script src=\"https://loginwidget-developer-edition.na16.force.com/test/resource/salesforce_login_widget_js\" async defer></script>\n" +
            "</head></html>\n"
        );
    }

}