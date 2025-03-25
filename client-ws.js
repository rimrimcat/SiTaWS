import { extension_settings } from "../../../extensions.js";
import { extensionName } from "./settings.js";
import {
    getRequestHeaders,
    setUserName,
    saveSettingsDebounced,
} from "../../../../script.js";

import { initPersona, user_avatar, setUserAvatar } from "../../../personas.js";
import { uploadUserAvatar, changeUserAvatar } from "./copied-fcns.js";
import { power_user } from "../../../power-user.js";

let activeConnection = null;

function successReply(message, data = {}) {
    if (activeConnection) {
        if (!message.id) {
            activeConnection.send(
                JSON.stringify({
                    type: message.type,
                    data: data,
                    timestamp: message.timestamp,
                    ok: true,
                })
            );
        } else {
            activeConnection.send(
                JSON.stringify({
                    type: message.type,
                    data: data,
                    timestamp: message.timestamp,
                    ok: true,
                    id: message.id,
                })
            );
        }
    }
}

function failReply(message, reason = "Internal error") {
    if (activeConnection) {
        if (!message.id) {
            activeConnection.send(
                JSON.stringify({
                    type: message.type,
                    data: { message: reason },
                    timestamp: message.timestamp,
                    ok: false,
                })
            );
        } else {
            activeConnection.send(
                JSON.stringify({
                    type: message.type,
                    data: { message: reason },
                    timestamp: message.timestamp,
                    ok: false,
                    id: message.id,
                })
            );
        }
    }
}

// Update UI to show WebSocket connection status
export function updateWSConnectionStatus(connected) {
    const statusElement = document.getElementById("ws_connection_status");
    if (statusElement) {
        statusElement.innerHTML = connected
            ? "🟢 Connected"
            : "🔴 Disconnected";
        statusElement.className = connected ? "connected" : "disconnected";

        if (!connected) {
            $("#enable_websocket").prop("checked", false);
        }
    }
}

export function initWebSocket() {
    if (activeConnection) {
        // Close existing connection if it exists
        activeConnection.close();
    }

    // Determine the correct WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const port = extension_settings[extensionName].websocket_port;
    const wsUrl = `${protocol}//localhost:${port}`;

    console.log(`Connecting to WebSocket at ${wsUrl}`);
    activeConnection = new WebSocket(wsUrl);

    // Connection opened
    activeConnection.addEventListener("open", (event) => {
        console.log("Connected to WebSocket");
        // Send a ping to test the connection
        activeConnection.send(
            JSON.stringify({
                type: "ping",
                data: {},
                timestamp: Date.now(),
            })
        );

        // Update UI to show connected status
        updateWSConnectionStatus(true);
    });

    // Listen for messages
    activeConnection.addEventListener("message", (event) => {
        try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    });

    // Connection error
    activeConnection.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
        updateWSConnectionStatus(false);
    });
}

export function stopWebSocket() {
    if (activeConnection) {
        activeConnection.close();
        activeConnection = null;
    }
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(message) {
    console.log("Got message", message);

    switch (message.type) {
        case "ping":
            console.log(
                "Received ping from server, latency:",
                Date.now() - message.timestamp,
                "ms"
            );

            break;
        case "shutdown":
            successReply(message);
            break;

        case "notify":
            toastr.info(
                message.data.message || "New notification from server",
                message.data.title || "WS Notification"
            );
            successReply(message);
            break;

        case "get_personas":
            get_personas(message).catch((error) => {
                failReply(message, error.message);
            });
            break;
        case "create_persona":
            create_persona(message).catch((error) => {
                failReply(message, error.message);
            });
            break;
        case "edit_persona":
            edit_persona(message).catch((error) => {
                failReply(message, error.message);
            });
            break;
        case "delete_persona":
            delete_persona(message).catch((error) => {
                failReply(message, error.message);
            });
            break;

        default:
            console.log("Unknown message type:", message.type);
    }
}

async function get_personas(message) {
    const resp = await fetch("/api/avatars/get", {
        method: "POST",
        headers: getRequestHeaders(),
    });

    if (resp.ok) {
        const data = await resp.json();
        const personaList = data.map((id) => {
            return {
                avatarId: id,
                name: power_user.personas[id],
                desc: power_user.persona_descriptions[id].description,
            };
        });

        successReply(message, { personas: personaList });
    } else {
        failReply(message, resp.statusText);
    }
}

async function create_persona(message) {
    const name = message.data.name;

    if (!name) {
        failReply(message, "name is required!");
        return;
    }

    const desc = message.data.desc || "";
    const img_url = message.data.img_url || "img/user-default.png";

    // // Date + name (only ASCII) to make it unique
    const avatarId = `${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, "")}.png`;

    initPersona(avatarId, name, desc);
    const resp = await uploadUserAvatar(img_url, avatarId);
    if (resp.ok) {
        successReply(message, {
            persona: {
                avatarId: avatarId,
                name: name,
                desc: desc,
            },
        });
    } else {
        const base_img_url = img_url.split("/").pop();
        resp.text().then((value) => {
            failReply(message, base_img_url + " " + value);
        });
    }
}

async function edit_persona(message) {
    const avatarId = message.data.avatarId;

    const name = message.data.name;
    const desc = message.data.desc;
    const img_url = message.data.img_url;

    if (img_url) {
        const resp = await changeUserAvatar(avatarId, img_url);

        if (resp && !resp.ok) {
            return failReply(message, await resp.text());
        }

        if (!resp) {
            return failReply(message);
        }
    }

    if (desc) {
        const object = power_user.persona_descriptions[avatarId];
        object.description = desc;
        power_user.persona_descriptions[avatarId] = object;
    }

    if (name) {
        power_user.personas[avatarId] = name;
        if (avatarId === user_avatar) {
            setUserName(name, { toastPersonaNameChange: false });
        }
    }

    saveSettingsDebounced();

    successReply(message, {
        persona: {
            avatarId: avatarId,
            name: power_user.personas[avatarId],
            desc: power_user.persona_descriptions[avatarId].description,
        },
    });
}

async function delete_persona(message) {
    const avatarId = message.data.avatarId;

    if (avatarId == power_user.default_persona) {
        return failReply(message, "Cannot delete default persona!");
    }

    if (avatarId == user_avatar) {
        // Change to default persona if deleting current persona
        setUserAvatar(power_user.default_persona, {
            toastPersonaNameChange: false,
            navigateToCurrent: false,
        });
    }

    // TODO:
    // Avoid deleting default persona and persona with chats
    // Their chats should be deleted first

    const resp = await fetch("/api/avatars/delete", {
        method: "POST",
        headers: getRequestHeaders(),
        body: JSON.stringify({
            avatar: avatarId,
        }),
    });

    if (resp.ok) {
        delete power_user.personas[avatarId];
        delete power_user.persona_descriptions[avatarId];
        successReply(message);
    } else {
        failReply(message, resp.statusText);
    }
}

async function get_characters(message) {
    // for DMs
    $(document).ready(function () {
        var characters = [];

        // Loop through each character select element
        $(".character_select").each(function () {
            // Extract the character name
            var characterName = $(this).find(".ch_name").text().trim();

            // Extract the chid value from the data attribute
            var chid = $(this).data("chid");

            // Store the result in the array
            characters.push({ name: characterName, chid: chid });
        });

        // Output the list (you can log it or process it further)
        console.log(characters);
    });

    // [
    //     { name: "Assistant", chid: 0 },
    //     { name: "Coding Sensei", chid: 1 },
    //     { name: "Rim", chid: 2 },
    //     { name: "Seraphina", chid: 3 },
    // ];
}
