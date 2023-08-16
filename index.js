const { includes } = require("resium");
const core = require('@actions/core');
const github = require('@actions/github');
const nodemailer = require('nodemailer');

const issue = github.context.payload.issue;
const email_password = core.getInput('email_password');
const email_username = core.getInput('sender_email');
const email_to = core.getInput('recipient_email').split(';');
const RETRY_MAX = 3;
let need_retry_time = RETRY_MAX;
core.debug(issue)

const keywords_lists = [
    ["privacy", "theft", "steal", "leak", "consent","privacy issue","privacy policy","privacy consent","data stored"],
    ["safety", "security", "concern"],
    ["data", "password", "profile","policy"], 
    ["send", "user", "Microsoft","content"],
    ["memory leak"] //bypass keywords   
]
let matchwords = [];

main(email_username, email_password, email_to, issue)
function main(email_username, email_password, email_to, issue) {
    var need_attention = false;
    var titleMatchWords = [];
    var bodyMatchWords = [];
    try {
        //bypass issue with label name "feature request"
        if (issue && Array.isArray(issue.labels)) {
            var labelNames = issue.labels.map(label => label.name);
            if (labelNames.includes("feature request")) {
                core.setOutput("need_attention", 'false');
                return;
            }
        } else {
            console.error("Issue or labels property is not correctly defined.");
        }
        
        //remove link from issue body to avoid matching link text
        var issuebody = removeInfo(issue.body);

        //any word in the 5th item of keywords_lists will be replaced by <bypassPharse>.
        issuebody = bypassPhrase(issuebody, keywords_lists[4]);
        var issuetitle = bypassPhrase(issue.title, keywords_lists[4]);

        //any word in the 1st item of keywords_lists 
        titleMatchWords = issuetitle.match(new RegExp(keywords_lists[0].join('|'), 'gi'));
        bodyMatchWords = issuebody.match(new RegExp(keywords_lists[0].join('|'), 'gi'));
        if (titleMatchWords !== null || bodyMatchWords !== null){
            matchwords = mergewithoutduplicates(titleMatchWords,bodyMatchWords);
            setOutput_sendEmail(email_username, email_password, email_to, issue, matchwords);
            need_attention = true;
        }
        else{
            //4 words coexist in the 4th item of keywords_lists
            if (keywords_lists[3].every(coexist_keywords => 
                ((issuetitle.includes(coexist_keywords) || issuebody.includes(coexist_keywords))))){
                    matchwords = ["send", "user", "Microsoft","content"];
                    setOutput_sendEmail(email_username, email_password, email_to, issue, matchwords);
                    need_attention = true;
            }else{
                //any word from 2nd item shows together with any word from 3nd item in the keywords_lists
                for (let i = 0; i < keywords_lists[1].length; i++) {
                    const firstKeyword = keywords_lists[1][i];
                    for (let j = 0; j < keywords_lists[2].length; j++) {
                        const secondKeyword = keywords_lists[2][j];
                        titleMatchWords = issuetitle.match(new RegExp(`\\b${firstKeyword}\\b.*\\b${secondKeyword}\\b|\\b${secondKeyword}\\b.*\\b${firstKeyword}\\b`, 'gi'));
                        bodyMatchWords = issuebody.match(new RegExp(`\\b${firstKeyword}\\b.*\\b${secondKeyword}\\b|\\b${secondKeyword}\\b.*\\b${firstKeyword}\\b`, 'gi'));
                        if (titleMatchWords !== null || bodyMatchWords !== null){
                            matchwords = mergewithoutduplicates(titleMatchWords,bodyMatchWords);
                            setOutput_sendEmail(email_username, email_password, email_to, issue, matchwords);
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

function removeInfo(str) {
    // The following Regex is designed to match URLs from issue reference and image attachment; code block.
    const urlRegex = /https:\/\/github\.com\/MicrosoftEdge\/\S*|https:\/\/user-images\.githubusercontent\.com\/\S*/g;
    const codeRegex = /```[\s\S]*?```/g;

    str = str.replace(urlRegex, '');
    str = str.replace(codeRegex, '[Code Snippet]');
    
    return str;
}

function bypassPhrase(text, phrases) {
    let lowerCaseText = text.toLowerCase();
    phrases.forEach(phrase => {
        let words = phrase.toLowerCase().split(' ');
        let regex = new RegExp(words.join('\\s+') + '|' + words.reverse().join('\\s+'), 'g');
        lowerCaseText = lowerCaseText.replace(regex, '<byPassPhrase>');
    });
    return lowerCaseText;
}

function mergewithoutduplicates(...arrays) {
    let mergedarray = [];
    arrays
        .filter(array => array!== null)
        .forEach(array => {
            const lowerCaseArray = array.map(item => item.toLowerCase());
            mergedarray = [...mergedarray, ...lowerCaseArray]
    });

    return [...new Set([...mergedarray])];
}

function setOutput_sendEmail(email_username, email_password, email_to, issue, matchwords) {
    var data = {
        "title": "privacy",
        "labels": issue.labels.map(label => label.name),
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
        sendMail(email_username, email_password, email_to, issue, matchwords);
    } catch (err) {
        core.error(err.message)
    }
}

function sendMail(email_username, email_password, email_to, issue,matchwords) {

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
                                Issue Label: ${issue.labels.map(label => label.name)}
                            </p>
                            <p class="data" 
                                style="text-align: justify-all;
                                align-items: center; 
                                font-size: 15px;
                                padding-bottom: 12px;">
                                Issue Create Time: ${issue.created_at}
                            </p>
                            <p class="data" 
                            style="text-align: justify-all;
                            align-items: center; 
                            font-size: 15px;
                            padding-bottom: 12px;">
                            This issue is alarmed since matching keywords: <span style="color:red;font-weight: bold;">${matchwords}</span>
                            </p>
                            <br/>
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
        subject: '[WV2 GitHub Alerts] New high priority issue',
        html: emailContent,
        priority: "high"
    };

    transporter.sendMail(mailOptions, (error,info,email_username_=email_username, email_password_ = email_password, email_to_=email_to, issue_=issue,matchwords_ = matchwords) => retryFunc(error,info,email_username_, email_password_, email_to_, issue_,matchwords_));
}

function retryFunc(error,info,email_username, email_password, email_to, issue,matchwords){
    if(error){
        let Retry = RETRY_MAX - need_retry_time + 1;
        core.error("Try times:" + Retry   + " | " + error);
        need_retry_time--;
        if(need_retry_time > 0){
            sendMail(email_username, email_password, email_to, issue,matchwords);
        }
    }else{
        core.info('Email sent: ' + info.response);
    }
}

module.exports = {
    main,
}
