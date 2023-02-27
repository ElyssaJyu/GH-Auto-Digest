const { includes } = require("resium");
const core = require('@actions/core');
const github = require('@actions/github');
const nodemailer = require('nodemailer');

const issue = github.context.payload.issue;
const email_password = core.getInput('email_password');
const email_username = core.getInput('sender_email');
const email_to = core.getInput('recipient_email').split(';');
core.debug(issue)

const keywords_lists = [
    ["privacy", "theft", "steal", "leak"],
    ["safety", "security", "concern"],
    ["data", "password", "profile"], 
    ["send", "user", "Microsoft","content"] 
]

core.debug(issue)
  
main(email_username, email_password, email_to, issue)

function main(email_username, email_password, email_to, issue) {
    var need_attention = false;
    try {
        //any word in the 1st item of keywords_lists
        if ((issue.title.match(new RegExp(keywords_lists[0].join('|', 'gi')))) || 
            (issue.body.match(new RegExp(keywords_lists[0].join('|', 'gi'))))){
                setOutput_sendEmail(email_username, email_password, email_to, issue);
                need_attention = true;
        }
        else{
            //4 words coexist in the 4th item of keywords_lists
            if (keywords_lists[3].every(coexist_keywords => 
                (issue.title.includes(coexist_keywords) || issue.body.includes(coexist_keywords)))){
                    setOutput_sendEmail(email_username, email_password, email_to, issue);
                    need_attention = true;
            }else{
                //any word from 2nd item shows together with any word from 3nd item in the keywords_lists
                for (let i = 0; i < keywords_lists[1].length; i++) {
                    const firstKeyword = keywords_lists[1][i];
                    for (let j = 0; j < keywords_lists[2].length; j++) {
                      const secondKeyword = keywords_lists[2][j];
                      if ((issue.title.match(new RegExp(`\\b${firstKeyword}\\b.*\\b${secondKeyword}\\b`, 'gi'))) ||
                            (issue.body.match(new RegExp(`\\b${firstKeyword}\\b.*\\b${secondKeyword}\\b`, 'gi')))) {
                                setOutput_sendEmail(email_username, email_password, email_to, issue);
                                need_attention = true;
                                break;
                      }
                    }
                    if (need_attention) {
                        break;
                    }
                }
            }
        }
        if (!need_attention) {
            core.setOutput("need_attention", 'false');
        }
    }
    catch (err) {
        core.setFailed(`Error ${err}`);
    }
}

function setOutput_sendEmail(email_username, email_password, email_to, issue) {
    var data = {
        "title": "privacy",
        "issueName": issue.title,
        "issueLink": issue.html_url,
        "issueNumber": issue.number,
        "issueCreateTime": issue.created_at
    }
    var jsonData = JSON.stringify(data);
    core.setOutput("need_attention", 'true');
    core.setOutput("issue_info", jsonData);
    core.notice("Alarm: new high priority issue need to look into!\n" + issue.html_url)
    try {
        sendMail(email_username, email_password, email_to, issue);
    } catch (err) {
        core.error(err.message)
    }
}

function sendMail(email_username, email_password, email_to, issue) {

    const emailContent = `
    <html>
        <body style="background-color:grey">
            <table align="center" border="0" cellpadding="0" cellspacing="0"
                width="550" bgcolor="white" style="border:2px solid black">
                <tbody>
                    <tr>
                        <td align="center">
                            <table align="center" border="0" cellpadding="0" 
                                cellspacing="0" class="col-550" width="550">
                                <tbody>
                                    <tr>
                                        <td align="center" style="background-color: #188cd9;;
                                                height: 50px;">
                                            <a href="#" style="text-decoration: none;">
                                                <p style="color:white;
                                                        font-weight:bold; font-size: 18px">
                                                    GitHub Auto-Digest Bot
                                                </p>
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr style="height: 300px;">
                        <td align="center" style="border: none;
                                border-bottom: 2px solid #188cd9; 
                                padding-right: 20px;padding-left:20px">
        
                            <p style="font-weight: bolder;font-size: 42px;
                                    letter-spacing: 0.025em;
                                    color:red" class="small">
                                    Alarm!
                            </p>
                            <p style="font-weight: bolder;font-size: 36px;
                                    letter-spacing: 0.025em;
                                    color:black" class="small">
                                    New high priority issue need to look into!
                            </p>
                        </td>
                    </tr>
        
                    <tr style="display: inline-block;">
                        <td style="height: 150px;
                                padding: 20px;
                                border: none; 
                                border-bottom: 2px solid #361B0E;
                                background-color: white;">
                            
                            <h2 style="text-align: left; align-items: center;">
                                Issue Title: ${issue.title}
                            </h2>
                            <p class="data" 
                                style="text-align: justify-all;
                                align-items: center; 
                                font-size: 15px;
                                padding-bottom: 12px;">
                                Issue Number: ${issue.number}
                            </p>
                            <p class="data" 
                                style="text-align: justify-all;
                                align-items: center; 
                                font-size: 15px;
                                padding-bottom: 12px;">
                                Issue Create Time: ${issue.created_at}
                            </p>
                            <p>
                                <a href="${issue.html_url}"
                                style="text-decoration: none; 
                                        color:black; 
                                        border: 2px solid #188cd9; 
                                        padding: 10px 30px;
                                        font-weight: bold;"> 
                                View Issue 
                                </a>
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </body>
    </html>
    `

    let transporter = nodemailer.createTransport({
        host: 'primary.exchange.microsoft.com',
        port: 25,
        tls: {
            rejectUnauthorized: false
        }
    })

    let mailOptions = {
        from: email_username,
        to: email_to,
        subject: 'Alarm: new high priority issue need to look into!',
        html: emailContent,
        priority: "high"
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            core.error(error);
        } else {
            core.info('Email sent: ' + info.response);
        }
    });

}

module.exports = {
    main,
}
