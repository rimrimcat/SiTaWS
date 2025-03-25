import { getRequestHeaders } from "../../../../script.js";
import {
    getUserAvatars,
    getUserAvatar,
    setUserAvatar,
} from "../../../personas.js";
import { getBase64Async, ensureImageFormatSupported } from "../../../utils.js";

// copied from personas.js
export async function uploadUserAvatar(url, name) {
    const fetchResult = await fetch(url);

    const blob = await fetchResult.blob();
    const file = new File([blob], "avatar.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("avatar", file);

    if (name) {
        formData.append("overwrite_name", name);
    }

    const headers = getRequestHeaders();
    delete headers["Content-Type"];

    const resp = await fetch("/api/avatars/upload", {
        method: "POST",
        headers: headers,
        cache: "no-cache",
        body: formData,
    });

    await getUserAvatars(true, name);
    return resp;
}

// copied from persona.js
function reloadUserAvatar(force = false) {
    $(".mes").each(function () {
        const avatarImg = $(this).find(".avatar img");
        if (force) {
            avatarImg.attr("src", avatarImg.attr("src"));
        }

        if (
            $(this).attr("is_user") == "true" &&
            $(this).attr("force_avatar") == "false"
        ) {
            avatarImg.attr("src", getUserAvatar(user_avatar));
        }
    });
}

// modified from persona.js
export async function changeUserAvatar(avatarId, img_url) {
    const fetchResult = await fetch(img_url);
    const blob = await fetchResult.blob();
    let file = new File([blob], "avatar.png", { type: "image/png" });

    setUserAvatar(avatarId, {
        toastPersonaNameChange: false,
        navigateToCurrent: false,
    });

    const form = document.getElementById("form_upload_avatar");

    if (!(form instanceof HTMLFormElement)) {
        console.error("Form not found");
        return null;
    }

    const formData = new FormData(form);

    // We dont do conversion since python handles this already
    // If you do need conversion, just uncomment the line
    // file = await ensureImageFormatSupported(file);
    formData.set("avatar", file);
    formData.set("overwrite_name", avatarId);

    const headers = getRequestHeaders();
    delete headers["Content-Type"];

    const response = await fetch("/api/avatars/upload", {
        method: "POST",
        headers: headers,
        cache: "no-cache",
        body: formData,
    });

    if (response.ok) {
        // const data = await response.json();
        await fetch(getUserAvatar(String(avatarId)), { cache: "no-cache" });
    }

    // Reset the form
    form.reset();
    return response;
}
