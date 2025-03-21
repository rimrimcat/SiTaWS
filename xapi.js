// ===============================================================================================

// Drop this file inside sillytavern directory, then insert the following to server.js:
// (Preferably right after line 247)

// import { router as extensionExtraRouter } from './xapi.js';
// app.use('/xapi', extensionExtraRouter);
// console.log("Running extra extension api at '/xapi'");

// ===============================================================================================

import express from "express";

export const router = express.Router();

router.post("/test", async function (request, response) {
  try {
    // Access any data from the request body
    const data = request.body;

    // Log the received data (optional)
    console.log("Received data:", data);

    // Process the data (here we're just echoing it back with a timestamp)
    const result = {
      message: "Test endpoint working successfully",
      receivedData: data,
      timestamp: new Date().toISOString(),
    };

    // Return a success response
    return response.status(200).json(result);
  } catch (error) {
    console.error(err);
    response.sendStatus(500);
  }
});

router.post("/persona/create", async function (request, response) {
  try {
    const data = request.body;
    // name
    // desc
    // default image
    // id (taken from name and date)
  } catch (error) {
    console.error(err);
    response.sendStatus(500);
  }
});
