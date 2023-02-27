const index = require("./index.js");
const email_password = 'email_password';
const email_username = 'email_username';
const email_to = ["xx@xx.com"];

test_need_attention()
test_non_attention()

function test_need_attention(){
    var issue = {
        "title": "Privacy Concerns for a Commercial Application",
        "body": "We are considering distributing WebView2 in a commercial application, however our privacy team has significant concerns.The following text comes from the EULA:",
        "html_url": "https://github.com/ElyssaJyu/GH-Auto-Digest-Bot/issues/2",
        "updated_at": "2023-02-15T03:09:22Z"
    }
    index.main(email_username, email_password, email_to, issue);   
}

function test_non_attention(){
    var issue = {
        "title": "Is CoreWebView2Frame still in development?",
        "body": "Is CoreWebView2Frame still in development?",
        "html_url": "https://github.com/ElyssaJyu/GH-Auto-Digest-Bot/issues/1",
        "updated_at": "2023-02-15T03:09:22Z"
    }
    index.main(email_username, email_password, email_to, issue);   
}
