'use strict';

const LOG_HEADER = '[ip-recorder]'
const request = require('request');

function stringfy(obj) {
    
    const objtype = (typeof obj).toLowerCase();

    // console.log('stringfy ', 'objtype: ', objtype, 'obj: ', obj)

    if (objtype == 'string' || objtype == 'number' || objtype == 'boolean')
        return obj;
    else
        return JSON.stringify(obj);
}

function log2console() {

    if (arguments && arguments.length > 1) {
        const method = arguments[0];
        var message = undefined;

        for (var i=1; i<arguments.length; i++) {
            let input = arguments[i];

            const inputstring = stringfy(input);

            if (message)
                message = `${message} ${inputstring}`;
            else
                message = inputstring;
        }
        const now = new Date()
        console.log(`${LOG_HEADER} ${now.toISOString()} [${method}] ${message}`);
    } else {
        log2console("log2console", "Failed to log. Needs more than 1 arguments. [arguments]", arguments);
    }

}


// Function to update DNS record by recordId using Softlayer API
function updateDns(slUserId, slApiKey, recordId, hostAName, ipAddress, callback) {

    const DNS_SERVER_HOST = 'api.softlayer.com'
    
    const DNS_METHOD_UPDATE = "editObject.json";
    const DNS_SERVER_PATH = `/rest/v3.1/SoftLayer_Dns_Domain_ResourceRecord/${recordId}/${DNS_METHOD_UPDATE}`;

    const options = {
        uri: `https://${DNS_SERVER_HOST}/${DNS_SERVER_PATH}`,
        method: 'POST',
        // authentication headers
        auth: {
            user: slUserId,
            pass: slApiKey   
        },
        json: {
            "parameters": [
                {
                    "data": `${ipAddress}`,
                    "host": `${hostAName}`
                }
            ]
        }
    };

    // send request to Softlayer DNS service
    request(options, callback);
}

const fs = require('fs');

// read settings from a json file
function getSettings() {

    let settingData = fs.readFileSync('ddns-settings.json');
    return JSON.parse(settingData);
}

// A Name of the host (probably don't need it since we are updating with Softlayer DNS Record Id)
const HOST_A_NAME = 'xyzcabin';
// Read settings from file
const settings = getSettings();
// log2console('main', settings);

const express = require('express');
const app = express();

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

app.get('/',function(req, res) {
    const ipAddress = req.socket.remoteAddress;
    const clienttag = req.query.ClientTag;
    const clientmsg = req.query.Message;

    // Log all incoming requests
    log2console('main', `Request: IP: ${ipAddress} ClientTag: ${clienttag} Message: ${clientmsg}`)

    if (clienttag && "pls update dns" === clientmsg) { 
        // only respond if the request has ClientTag (to avoid expose our service) and message is pls update dns
        updateDns(
            settings.softlayer_userid, 
            settings.softlayer_apikey, 
            settings.xyzcabin_dns_id,
            HOST_A_NAME,
            ipAddress, 
            (err, restres, body)=> {
                var now = new Date()

                if (err) {
                    log2console('updateDns/callback', "SoftLayer_Dns_Domain_ResourceRecord Request Failed:", err);
                } else if (restres.statusCode == 200) {
                    log2console('updateDns/callback', 'SoftLayer_Dns_Domain_ResourceRecord Successfully Updated DNS IP to:', ipAddress, 'Response:', body);
                    res.send(`[${now.toISOString()}] Successfully Updated DNS IP to: ${ipAddress} [ClientTag: ${clienttag} Message: ${clientmsg}]`);
                } else {
                    log2console('updateDns/callback', "SoftLayer_Dns_Domain_ResourceRecord Failure status code:", restres.statusCode, "Response:", body);
                    res.send(`[${now.toISOString()}] Failed to update DNS IP to: ${ipAddress} [ClientTag: ${clienttag} Message: ${clientmsg}]`);
                }
                res.end();
            });
    } else {
        // ends response to avoid spam
        log2console('main', "Request failed ClientTag and Message check. No action taken.")
        res.end();
    }
});
  
app.listen(PORT, HOST, 
    () => log2console('main', `Server running at http://${HOST}:${PORT}/`))
