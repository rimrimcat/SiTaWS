// The main script for the extension
// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import {
  extension_settings,
  getContext,
  loadExtensionSettings,
} from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced } from "../../../../script.js";

import {
  initWebSocket,
  stopWebSocket,
  updateWSConnectionStatus,
} from "./client-ws.js";

import {
  extensionName,
  extensionFolderPath,
  loadSettings,
} from "./settings.js";

// Toggle WebSocket connection
function toggleWebSocket() {
  const enabled = $("#enable_websocket").prop("checked");
  extension_settings[extensionName].enable_websocket = enabled;
  saveSettingsDebounced();

  if (enabled) {
    initWebSocket();
  } else {
    stopWebSocket();
    updateWSConnectionStatus(false);
  }
}

function updateWebSocketPort() {
  const port = $("#websocket_port_input").val();
  extension_settings[extensionName].websocket_port = port;
  saveSettingsDebounced();
}

// This function is called when the extension is loaded
// Put listeners here
jQuery(async () => {
  // This is an example of loading HTML from a file
  const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);

  // Append settingsHtml to extensions_settings
  // extension_settings and extensions_settings2 are the left and right columns of the settings menu
  // Left should be extensions that deal with system functions and right should be visual/UI related
  $("#extensions_settings").append(settingsHtml);

  // Event listeners
  $("#enable_websocket").on("input", toggleWebSocket);
  $("#websocket_port_input").on("input", updateWebSocketPort);

  // $("#ws_test_button").on("click", sendWebSocketTest);

  // Load settings when starting things up
  loadSettings();
});
