const index = require("./index.js");
const email_password = 'email_password';
const email_username = 'email_username';
const email_to = ["xx@xx.com"];


test1();

function test1(){
    var issue = {
        "body": "safty concern data",
        "html_url": "https://github.com/xx/xx/issues/12",
        "updated_at": "2023-02-15T03:09:22Z",
        "title": "123"
    }
    index.main(email_username, email_password, email_to, issue);   
}
