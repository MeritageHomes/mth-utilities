/*
SendGrid Email Service
    This class is repsonsible for handling the logic for sending an email.

*/
const sgMail = require('@sendgrid/mail');

class SGEmailService {
    /**
     * 
     * @param {*} data - Object containing email details:
     *                  to - Object containing array of emails and array of names *names not required
     *                       EX: "test@example.com"
     *                           OR
     *                           [ {email: "test1@example.com", name: "Name One"}, {email: "test2@example.com", name: "Name Two"} ]
     *                  from - From Email
     *                  from_name - From Name
     *                  subject - Email Subject
     *                  text - Email body text
     *                  html - Email body HTML
     */
    constructor(data = null) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.setErrors(false);
        this.setResponse(null);
        if (data) {
            this.setToEmail(data.to);
            this.setToName(data.to_name);
            this.setFromEmail(data.from);
            this.setFromName(data.from_name);
            this.setSubject(data.subject);
            this.setTextBody(data.text);
            this.setHtmlBody(data.html);
        }
    }

    setResponse(response) {
        this._response = response;
    }

    getResponse() {
        return this._response;
    }

    setToEmail(toEmail) {
        this._toEmail = toEmail;
    }

    getToEmail() {
        return this._toEmail;
    }

    setToName(toName) {
        this._toName = toName;
    }

    getToName() {
        return this._toName;
    }

    setFromEmail(fromEmail) {
        this._fromEmail = fromEmail;
    }

    getFromEmail() {
        return this._fromEmail;
    }

    setFromName(fromName) {
        this._fromName = fromName;
    }

    getFromName() {
        return this._fromName;
    }

    setSubject(subject) {
        this._subject = subject;
    }

    getSubject() {
        return this._subject;
    }

    setTextBody(textBody) {
        this._textBody = textBody;
    }

    getTextBody() {
        return this._textBody;
    }

    setHtmlBody(htmlBody) {
        this._htmlBody = htmlBody;
    }

    getHtmlBody() {
        return this._htmlBody;
    }

    setErrors(errors) {
        this._errors = errors;
    }

    getErrors() {
        return this._errors;
    }

    addError(error) {
        if (this._errors !== false) {
            this._errors.push(error);
        }else {
            this._errors = [error];
        }
    }

    /**
     * Returns boolean is the service is in error
     * from last sent email(s)
     */
    inError() {
        return this._errors !== false;
    }

    buildEmailMessage() {
        let bodyTo;
        if (typeof this._toEmail === 'string') {
            //single email
            bodyTo = [{
                email: this._toEmail,
                name: this._toName
            }];
        }else if (Array.isArray(this._toEmail)) {
            //Array of multiple emails
            bodyTo = this._toEmail;
        }else {
            throw "Unable to send email(s). Invalid argument passed for 'To Email'.";
        }
        let body =  {
            to: bodyTo,
            from: {
                email:  this._fromEmail,
                name: this._fromName
            },
            subject: this._subject,
            content: [
                {
                    type: "text/plain",
                    value: this._textBody
                },
                {
                    type: "text/html",
                    value: this._htmlBody
                }
            ]
        };

        if (process.env.IS_DEV === true) {
            //enable sandbox mode
            body.mail_settings = {
                sandbox_mode: {
                    enable: true
                }
            }
        }

        return body;
    }

    /**
     * 
     * Sends an email given the class properties.
     * Required paroperties: To email, To Name, From email, From Name, Subject, Text Body, HTML Body
     */
    async sendEmail() {
        this.setErrors(false);
        this.setResponse(null);
        if (!this.validateEmail(this._toEmail) || !this.validateEmail(this._fromEmail)) {
             //not formatted correctly
             return;
        }else if (this._toEmail && this._toName && this._fromEmail && this._fromName && this._subject && this._textBody && this._htmlBody) {
            //send email
            try {
                let result = await sgMail.send(this.buildEmailMessage());

                if (result.errors) {
                    this._errors = result.errors;
                }
            }catch(error) {
                this.addError(error);
            }
        }else {
            //missing params
            this.addError({message: 'Failed to send email. "To email", "To Name", "From email", "From Name", "Subject", "Email Text Body", and "Email HTML Body" are required'});
        }
    }

    validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (typeof email === 'string') {
            return re.test(String(email).toLowerCase());
        }else if (Array.isArray(email)) {
            email.forEach(aEmail => {
                if (!re.test(String(aEmail).toLowerCase())) {
                    this.addError({message: `Failed to send email to ${aEmail}. Email improperly formatted.`});
                    return false;
                }
            });
            return true;
        }else {
            this.addError({message: `Unable to send email(s). Invalid argument passed for 'To Email'.`});
            return false;
        }
    }
}

module.exports = {
    SGEmailService
}