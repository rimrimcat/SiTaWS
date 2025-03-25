import { extension_settings } from "../../../extensions.js";

// Keep track of where your extension is located, name should match repo name
export const extensionName = "st-xapi";
export const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
export const defaultSettings = {
  enable_websocket: false,
  websocket_port: "7903",
};

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
export async function loadSettings() {
  //Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }

  $("#enable_websocket")
    .prop("checked", extension_settings[extensionName].enable_websocket)
    .trigger("input");

  $("#websocket_port_input")
    .val(extension_settings[extensionName].websocket_port)
    .trigger("input");

  // Initialize WebSocket if enabled
  if (extension_settings[extensionName].enable_websocket) {
    initWebSocket();
  }
}
