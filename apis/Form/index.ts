import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { config } from 'dotenv';
import isEmail from 'validator/lib/isEmail';
import { fromEmail, toEmail, headers } from "./constants";
import sgMail = require('@sendgrid/mail');
import querystring = require('querystring');


const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    config();
    const body = querystring.parse(req.body);
    const email = body.email as string;
    if (process.env.SENDGRID_API_KEY && email && isEmail(email)) {
        const name = body.name ?? email;

        const subject = body.subject ?? "";
        const message = body.message ?? "";


        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            from: fromEmail,
            to: toEmail,
            subject: `<${name}>${email} says subject: ${subject}`,
            text: `message: ${message}`,
        };
        try {
            await sgMail.send(msg);
            context.res = {
                status: 200,
                headers,
            };
        } catch (error) {
            context.log(`sending email failed with error ${JSON.stringify(error)}`);
            if (error.response) context.log(`sending email failed with error with resposne ${error.response.body}`);
            context.res = {
                status: 503,
                headers,
            };
        }

    } else {
        context.log(`request with ${req} failed`)
        context.res = {
            status: 500,
            headers,
        };
    }
};

export default httpTrigger;