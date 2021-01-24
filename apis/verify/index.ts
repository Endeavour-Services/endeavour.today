import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { config } from 'dotenv';
import { MongoClient } from "mongodb";
import { dbName, website, headers } from "../Form/constants";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    config();
    var updated = false;
    var count = 0;
    const body = {
        updated,
        count
    }
    if (req.query.code) {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(dbName);
        try {
            const resp = await collection.updateOne({ code: req.query.code }, { "$set": { verified: true, updatedTime: new Date() } });
            updated = resp.matchedCount == 1;
            count = resp.modifiedCount
        } catch (error) {
            context.log(`verification failed ${JSON.stringify(error)}`)
        }
    }

    context.res = {
        status: 302,
        headers: {
            "location": website,
            ...headers
        }, body
    };

};

export default httpTrigger;