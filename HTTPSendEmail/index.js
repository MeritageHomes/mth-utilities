/**
 * This endpoint sends an email using SendGrid
 *
 * @param {JSON} - The Email payload. See swagger docs: https://app.swaggerhub.com/apis-docs/MeritageHomes/Meritage_Buyer_Portal
 * 
 * @return {JSON} Success or an error response.
 */


let { SGEmailService } = require("../shared/SGEmailService");
var { validateBody, buildResponse, buildErrorResponse, logMessage, setContext } = require('../shared/common');


module.exports = async (context, req) => {
    setContext(context);
    // messages Object
    let messages = response = null;

    // Validate request body
    var fields = {
        required: {
            'to': 'string|array',
            'to_name': 'string|array',
            'from': 'string',
            'from_name': 'string',
            'subject': 'string',
            'text': 'string',
            'html': 'string'
        }
    };

    let validateResponse = validateBody(req, fields); 
    if (validateResponse !== true) {
        // error with body validation
        messages = validateResponse
        logMessage(context,messages,"error");
        response = buildErrorResponse(400,messages);

    } else {
        //send email 
        const msg = {
          to: req.body.to,
          to_name: req.body.to_name,
          from:  req.body.from,
          from_name: req.body.from_name,
          subject:  req.body.subject,
          text:  req.body.text,
          html:  req.body.html,
        };
        const sgEmailService = new SGEmailService(msg);
        await sgEmailService.sendEmail();
        if (sgEmailService.inError()) {
          response = buildErrorResponse(400,sgEmailService.getErrors());
        }else {
          response = buildResponse({success: true},200);
        }
    }

    //context.res = response;
    context.done(null, response);

};
