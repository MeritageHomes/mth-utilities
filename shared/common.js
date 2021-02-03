const axios = require('axios');
var winston = require('winston');
var { Loggly } = require('winston-loggly-bulk');

//global variables
let globalContext;
let logger;


function getLogger() {
    if (logger) {
      return logger;
    }
  
    const transports = [];
    if (process.env.IS_DEV === 'true') {
      transports.push(new winston.transports.Console({
        level: 'silly',
        colorize: true
      }));
    } else {
      transports.push(
        new winston.transports.Loggly({
          level: 'warn',
          token: process.env.LOGGLY_TOKEN,
          subdomain: process.env.LOGGLY_SUBDOMAIN,
          tags: [process.env.LOGGLY_TAG, process.env.LOGGLY_TAG_ENV],
          json: true
        }),
        new winston.transports.Console({
          level: 'silly',
          colorize: true
        }));
    }
    logger = winston.createLogger({
      transports: transports
    });
    return logger;
  }

  function buildResponse(body, status = 200) {
    return {
      status: status,
      body: body,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
  
  function buildErrorResponse(status, messages) {
    let messageArr = (typeof messages != 'undefined' && messages instanceof Array) ? messages : [messages];
    let body = {
      "status": status,
      "messages": messageArr
    };
    return {
      status: status,
      body: body,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  function logMessage(context, message, log_level = 'info') {
    if (!context) {
      context = globalContext;
    }
    if (!logger) {
      getLogger();
    }
    if (context && message) {
      switch (log_level) {
        case 'info':
          logger.info(message);
          break;
        case 'warn':
          logger.warn(message);
          break;
        case 'error':
          logger.error(message);
          break;
        default:
          logger.info(message);
          break;
      }
      return true;
    }
  
    return false;
  }

  function setContext(context) {
    globalContext = context;
  }
  
  function getContext() {
    return globalContext;
  }

function isSuccess(response) {
  let status = response;
  if (typeof response === 'object') status = response.status;

  status -= 200;

  if (status >= 0 && status < 100) return true;
  return false;
}

// HTTP function for Loggly
async function postMessageHandler(body) {
  /* // Unneeded from copied function
  const params = new URLSearchParams();
  params.append('client_id', process.env['B2C_CLIENT_ID']);
  params.append('resource', process.env['GRAPH_API_ORIGIN']);
  params.append('client_secret', process.env['B2C_CLIENT_SECRET']);
  params.append('grant_type', 'client_credentials');
  */

  // Define response
  let response = null;

  // Build full URI
  //combine the url and uri
  let loggly_uri = `http://${process.env['LOGGLY_URL']}/${process.env['LOGGLY_URI']}/${process.env['LOGGLY_TOKEN']}`;

  const logglyMessage = {
    url: loggly_uri,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'X-LOGGLY-TAG': `${process.env['LOGGLY_TAG']},${process.env['LOGGLY_TAG_ENV']}`  
      //'Accept': 'application/json'
    },
    data: body
  };

  await axios(logglyMessage)
  .then((result) => {
    response = result;
  })
  .catch((err) => {
    response = err;
  });

  return response;
}

function getValueFromBody(field, body) {
  let value;
  if (field.indexOf('.') !== -1) {
    const fieldArr = field.split('.');
    value = body[fieldArr[0]];
    for (let i = 1; i < fieldArr.length; i++) {
      if (value) {
        value = value[fieldArr[i]];
      } else {
        break;
      }
    }
  } else {
    value = body[field];
  }

  return value;
}

function validateBody(req, fields = {}) {
  var errObj = true;
  let userMessage = 'An unknown error has occurred.';
  if (!fields.required) {
    fields.required = [];
  }

  if (!req.body) {
    const devMessage = `Provide a JSON payload with the following field(s): ${Object.keys(fields.required).join()} of the following type(s): ${Object.values(fields.required).join()}`;
    errObj = {
      developer_message: devMessage,
      user_message: userMessage,
      error_code: 444
    };
    return errObj;
  }

  const body = req.body;

    /* item is input
  const somefunction = ( item ) => {
    //your function here
  };
  */

    for (const [field, required_type] of Object.entries(fields.required)) {
      let error_message = null;
      const value = getValueFromBody(field, body);

      //split types for required fields
      const allowedTypes = required_type.split("|");
      const fieldtype = Array.isArray(value) ? "array" : typeof value;

      if (value === undefined) {
        error_message = `'${field}' does not have a value.`;
      } else if (!allowedTypes.includes(fieldtype)) {
        error_message = `'${field}' is '${fieldtype}' but needs to be '${allowedTypes.join(", ")}'.`;
      }

      if (error_message) {
        errObj = {
          developer_message: error_message,
          user_message: userMessage,
          error_code: 444
        };
        return errObj;
      }

    }

  return errObj;
}

module.exports = {
  buildErrorResponse,
  buildResponse,
  logMessage,
  setContext,
  postMessageHandler,
  isSuccess,
  validateBody
};