let myEmail = 'jiteshmalipeddi92@gmail.com';

// Client ID and API key from the Developer Console
let CLIENT_ID = '91979129025-a93s6k7bir2p55i6k879jumhv0ajhi1g.apps.googleusercontent.com';
let API_KEY = 'AIzaSyAhnekIeZsCseTztrMm3zrK_0K5WSXboPU';

// Array of API discovery doc URLs for APIs used by the quickstart
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
let SCOPES = 'https://mail.google.com/';

let authorizeButton = document.getElementById('authorize_button');
let signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
    }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
    }, function(error) {
    appendPre(JSON.stringify(error, null, 2));
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        
        div = document.createElement('div');
        div.className = 'text-center';
        
        showInbox = document.createElement('button');
        showInbox.innerHTML = 'Show Inbox'
        showInbox.setAttribute('type','button');
        showInbox.setAttribute('class','btn btn-primary btn-lg style-buttons');
        showInbox.addEventListener('click',function(){
            showInbox.setAttribute('style','display:none');
            showEmails("INBOX",showSentMails,null);
            showSentMails.setAttribute('style','display:inline-block');
        });

        showSentMails = document.createElement('button');
        showSentMails.innerHTML = 'Show Sent';
        showSentMails.setAttribute('type','button');
        showSentMails.setAttribute('class','btn btn-primary btn-lg style-buttons');
        showSentMails.addEventListener('click',function(){
            showSentMails.setAttribute('style','display:none');
            showEmails("SENT",showInbox,null);
            showInbox.setAttribute('style','display:inline-block');
        });

        // sendMail = document.createElement('button');
        // sendMail.innerHTML = 'Compose Mail'
        // sendMail.setAttribute('type','button');
        // sendMail.setAttribute('class','btn btn-primary btn-lg');
        // sendMail.addEventListener('click',function(){
        //     sendMail.setAttribute('style','display:none');
        //     composeMail();
        // });
        // div.append(sendMail);
        
        div.append(showInbox,showSentMails);
        document.body.append(div);
        
    } 
    else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

async function getEmailContent(message){
    let response = await gapi.client.gmail.users.messages.get({'userId': 'me','id':message.id});
    snippet = response.result.snippet;
    return snippet;
}

function removeElement(element){
    if(typeof(element) != 'undefined' && element != null){
        document.body.removeChild(element);
    }
}

async function showEmails(emailType,elementToDisable,pageToken){
    elementToDisable.disabled = true;
    sent = document.getElementById('SENT');
    inbox = document.getElementById('INBOX');
    nextPageButton = document.getElementById('next-page');
    removeElement(inbox);
    removeElement(sent);
    removeElement(nextPageButton);
    
    table = document.createElement('table');
    table.setAttribute('id',emailType);
    table.className = 'table table-striped add-table-borders';
    thead = document.createElement('thead');
    tr = document.createElement('tr');
    sno = document.createElement('th');sno.innerHTML = 'Serial Number';sno.setAttribute('scope','col');
    email = document.createElement('th');email.innerHTML = 'Email Snippet';email.setAttribute('scope','col');
    tr.append(sno,email);
    thead.append(tr);
    table.append(thead);
    tbody = document.createElement('tbody');

    loaderDiv = document.createElement('div');loaderDiv.setAttribute('class','text-center');
    spinner = document.createElement('div');
    spinner.setAttribute('class','spinner-border');
    spinner.setAttribute('role','status');
    loader = document.createElement('span');loader.setAttribute('class','sr-only');
    loader.innerHTML='Loading...';
    spinner.append(loader);
    loaderDiv.append(spinner);
    document.body.append(loaderDiv);

    let responseLabels = await gapi.client.gmail.users.labels.list({'userId': 'me'});
    
    let labels = responseLabels.result.labels;
    if (labels && labels.length > 0) {
        options = {'userId': 'me','maxResults':10,'labelIds':[`${emailType}`]};
        if(pageToken != null){
            options['pageToken'] = pageToken;
        }
        let responseMessages = await gapi.client.gmail.users.messages.list(options);
        let messages = responseMessages.result.messages;
        if(messages && messages.length > 0){
            for(let i = 0; i < messages.length; i++) {
                message = messages[i];
                data = await getEmailContent(message);
                tr = document.createElement('tr');
                th = document.createElement('th');th.innerHTML=i+1;th.setAttribute('scope','row');
                td = document.createElement('td');
                td.innerHTML = data;
                tr.append(th,td);
                tbody.append(tr);
            };
            table.append(tbody);
            document.body.removeChild(loaderDiv);
            document.body.append(table);


            nextPage = document.createElement('button');
            nextPage.innerHTML = 'Next Page';
            nextPage.setAttribute('type','button');
            nextPage.setAttribute('class','btn btn-primary btn-lg');
            nextPage.setAttribute('id','next-page');
            nextPageToken = responseMessages.result.nextPageToken;
            nextPage.addEventListener('click',function(){
                if(emailType == "INBOX"){
                    showEmails(emailType,showInbox,nextPageToken);
                }
                else if(emailType == "SENT"){
                    showEmails(emailType,showSentMails,nextPageToken);
                }
            
            });
            document.body.append(nextPage);

        }
        else{
            console.log("No messages found");
        }
    } 
    else {
        appendPre('No Labels found.');
    }
    elementToDisable.disabled = false;
}

// async function composeMail() {
//     const message =
//     "From: jiteshmalipeddi92@gmail.com\r\n" + 
//     "To: mjitesh.psn@gmail.com\r\n" +
//     "Subject: As basic as it gets\r\n\r\n" +
//     "This is the plain text body of the message.  Note the blank line between the header information and the body of the message.";

//     // The body needs to be base64url encoded.
//     const encodedMessage = btoa(message)
//     const reallyEncodedMessage = encodedMessage.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

//     response = await gapi.client.gmail.users.messages.send({
//         'userId': 'me',
//         'resource': { // Modified
//             // same response with any of these
//             raw: reallyEncodedMessage
//             // raw: encodedMessage
//             // raw: message
//         }
//     });
//     console.log("Mail Successfully Sent !")
// }
