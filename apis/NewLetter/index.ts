import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { config } from 'dotenv';
import * as ejs from "ejs";
import { MongoClient, MongoError } from "mongodb";
import { v4 } from 'uuid';
import isEmail from 'validator/lib/isEmail';
import { dbName, fromEmail, headers, linkURL, rootWeb } from "../Form/constants";
import sgMail = require('@sendgrid/mail');
import querystring = require('querystring');


const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    config();
    const body = querystring.parse(req.body);
    const client = new MongoClient(process.env.MONGO_URI);
    var email = body.email as string;

    if (email && isEmail(email)) {
        try {
            email = email.toLowerCase();
            const code = v4();
            await client.connect();
            const db = client.db(dbName);
            const newletter = db.collection(dbName);
            await newletter.insertOne({ _id: email, verified: false, code, created: new Date() });
            const link = linkURL + "?code=" + code;
            const text = await ejs.renderFile("./NewLetter/verEmailText.ejs", {
                link: link,
                email: email
            });

            // const html = await ejs.renderFile("./NewLetter/verifyEmail.ejs", {
            //     link: link,
            //     email: email
            // });

            if (process.env.SENDGRID_API_KEY) {
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msg = {
                    from: fromEmail,
                    to: email,
                    subject: `NewsLetter subscription to ${rootWeb}`,
                    text,
                    // html
                };
                try {
                    await sgMail.send(msg);
                } catch (error) {
                    context.log("email send failed");
                }
            }
            context.res = {
                status: 200,
                headers,
            };
        } catch (error) {
            if (error instanceof MongoError
                && error.code === 11000 // error code for duplicate
            ) {
                context.log(`${email} already saved`);
                context.res = {
                    status: 200,
                    headers,
                };
            }
            else {
                context.log(`not able to save ${email} into the db`);
                context.res = {
                    status: 503,
                    headers,
                };
            }

        }
    } else {
        context.res = {
            status: 400,
            headers,
        };
    }

};

export default httpTrigger;