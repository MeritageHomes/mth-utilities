const { buildErrorResponse, buildResponse, logMessage, setContext, postMessageHandler, isSuccess } = require('../shared/common');

module.exports = async function (context, req) {
    let status = 200;
    let body = "";

    setContext(context);

    if (!req.body || req.body === "") {
        // req.body must exist and cannot be an empty string
        // send error to Loggly and set 400 response

        logMessage(context,"JSON body is required","error");
        status = 400;
        body = {error:"JSON body is required"};
    }
    
    else {
        // req.body exists and is not an empty string

        if (!req.body.message || req.body.message === "" || !req.body.log_level || req.body.log_level ==="") {
            // either body.message or body.log_level do not exist or they are empty strings
            // send error to Loggly and set 400 response

            logMessage(context,"Unable to validate JSON body","error");
            status = 400;
            body = {error:"Unable to validate JSON body. JSON body must include a message and log_level."};
        }

        else  {
            // JSON body is valid
            // create the Loggly JSON from the request body

            //logMessage(context,req.body.message,req.body.log_level);
            //body = {success: true};

            // call out to axios
            // look in Buyer Portal common.js for examples "require axios"
            
            let response = await postMessageHandler(req.body);

            if (!response.isAxiosError) {
                body = {success: true};
                status = response.status;
            } else {
                status = response.response.status;
                body = {success: false};
                logMessage(context, `Failed to post to MessageHandler. ${JSON.stringify(response.toJSON())}`, 'error');
            }

        }


    }
    
    context.res = {
        //content-type:
        status: status, /* Defaults to 200 */
        body: body
    };
}