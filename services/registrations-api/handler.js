import uuid from "uuid";
import dynamoDb from "../../libs/dynamodb-lib";
import { success, failure } from "../../libs/response-lib";

const serverless = require("serverless-http");
const express = require("express");
const app = express();
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
app.use(awsServerlessExpressMiddleware.eventContext())

export async function main(event, context) {
  const params = {
    TableName: process.env.tableName,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'userId': Identity Pool identity id of the authenticated user
    // - 'registrationId': path parameter
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      registrationId: event.pathParameters.id
    }
  };

  try {
    const result = await dynamoDb.get(params);
    if (result.Item) {
      // Return the retrieved item
      return success(result.Item);
    } else {
      return failure({ status: false, error: "Item not found." });
    }
  } catch (e) {
    return failure({ status: false });
  }
}

app.get("/", async (req, res, next) => {
  const params = {
    TableName: process.env.tableName,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'userId': Identity Pool identity id of the authenticated user
    // - 'registrationId': path parameter
    Key: {
      userId: req.apiGateway.event.requestContext.identity.cognitoIdentityId,
      registrationId: req.apiGateway.event.pathParameters.id
    }
  };

  try {
    const result = await dynamoDb.get(params);
    if (result.Item) {
      // Return the retrieved item
      return success(result.Item);
    } else {
      return failure({ status: false, error: "Item not found." });
    }
  } catch (e) {
    return failure({ status: false });
  }
});

app.post("/", async (req, res, next) => {
  const data = JSON.parse(req.apiGateway.event.body);
  const params = {
    TableName: process.env.tableName,
    Item: {
      userId: req.apiGateway.event.requestContext.identity.cognitoIdentityId,
      registrationId: uuid.v1(),
      content: data.content,
      attachment: data.attachment,
      createdAt: Date.now()
    }
  };

  try {
    await dynamoDb.put(params);
    return success(params.Item);
  } catch (e) {
    console.log(e);
    return failure({ status: false });
  }
});

module.exports.handler = serverless(app);
