(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const gate = $("profile-auth-gate");
  const authMessage = $("profile-auth-message");
  const loginLink = $("profile-login-link");
  const app = $("profile-builder-app");
  const status = $("pb-status");
  const themes = {
    gold: ["#d9b765","#5e4b25","#0b0b0b","#050505"],
    blue: ["#49c6ff","#176080","#07111b","#030910"],
    pink: ["#ff4fa0","#7d2450","#0b080c","#050306"],
    purple: ["#c4a0ff","#573b85","#100b18","#05030a"],
    green: ["#7de3b1","#245d45","#07120e","#020806"]
  };
  const ids = ["name","theme","avatar","about","tagline","features","schedule-intro","days","hours","days-extra","hours-extra","timezone","onlyfans","instagram","other-label","other-url","amazon","lovense","rules","goal-title","goal-text","goal-url","goal-button"];
  const val = id => $("pb-" + id).value.trim();
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function safeUrl(raw) {
    if (!raw) return "";
    try { const url = new URL(raw); return url.protocol === "https:" ? url.href : ""; } catch { return ""; }
  }
  function linkCard(title, description, href, t) {
    const safe = safeUrl(href);
    if (!safe) return "";
    return `<span style="display:inline-block;width:44%;min-width:230px;vertical-align:top;padding:24px 16px;margin:7px;box-sizing:border-box;background:${t[2]};border:1px solid ${t[1]};border-radius:16px;text-align:center;"><b style="display:block;font-size:21px;color:#f4efe3;">${escape(title)}</b><span style="display:block;padding:10px 0 16px;color:#aa9b7d;">${escape(description)}</span><a href="${escape(safe)}" rel="nofollow noopener noreferrer" target="_blank" style="display:inline-block;padding:12px 18px;border:1px solid ${t[0]};border-radius:9px;background:${t[3]};color:${t[0]};text-decoration:none;font-weight:800;">OPEN LINK</a></span>`;
  }
  function section(title, body, t) {
    return `<li style="display:block;width:100%;list-style:none;padding:28px 4%;margin:12px auto;box-sizing:border-box;text-align:center;background:${t[2]};border:1px solid ${t[1]};border-radius:24px;overflow:hidden;"><p style="display:block;width:100%;padding:0 0 14px;margin:0 auto;text-align:center;color:${t[0]};font-size:32px;line-height:1.2;font-weight:900;">${title}</p>${body}</li>`;
  }
  function build() {
    const t = themes[val("theme")] || themes.gold;
    const name = val("name") || "YourStageName";
    let sections = "";
    if (val("goal-title") || val("goal-text")) {
      const goalLink = safeUrl(val("goal-url"));
      sections += section(escape(val("goal-title") || "MY GOAL"),
        `<p style="width:92%;max-width:850px;margin:0 auto 18px;color:#e6decd;font-size:17px;line-height:1.7;">${escape(val("goal-text"))}</p>${goalLink ? `<a href="${escape(goalLink)}" target="_blank" rel="nofollow noopener noreferrer" style="display:inline-block;padding:14px 22px;border:2px solid ${t[0]};border-radius:10px;background:${t[3]};color:${t[0]};text-decoration:none;font-weight:900;">${escape(val("goal-button") || "OPEN LINK")}</a>` : ""}`, t);
    }
    const avatar = safeUrl(val("avatar"));
    const avatarHtml = avatar
      ? `<div style="width:100%;margin:0 auto 22px;"><img alt="${escape(name)} profile image" src="${escape(avatar)}" style="display:block;width:100%;max-width:320px;height:auto;margin:0 auto;border-radius:50%;border:3px solid ${t[0]};box-shadow:0 0 24px ${t[1]};"></div>`
      : "";
    const features = val("features").split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0,3).map((feature,i) =>
      `<span style="display:inline-block;width:28%;min-width:185px;vertical-align:top;padding:20px 13px;margin:5px;box-sizing:border-box;background:${t[3]};border:1px solid ${t[1]};border-radius:16px;text-align:center;"><b style="display:block;color:${t[0]};font-size:17px;">${["💬","✨","💙"][i]}</b><i style="display:block;padding-top:8px;color:#e6decd;font-size:14px;font-style:normal;">${escape(feature)}</i></span>`).join("");
    sections += section("ABOUT ME", avatarHtml +
      `<p style="width:92%;max-width:900px;padding:0 0 22px;margin:0 auto;font-size:18px;line-height:1.75;color:#ddd5c5;">${escape(val("about") || "Tell viewers about yourself.")}</p>` +
      (val("tagline") ? `<p style="color:${t[0]};margin:0 auto 18px;">${escape(val("tagline"))}</p>` : "") + features, t);

    if (val("hours") || val("days") || val("hours-extra") || val("days-extra")) {
      let schedule = `<p style="color:#aa9b7d;margin:0 auto 14px;">${escape(val("schedule-intro") || "Here is when I usually stream.")}</p>`;
      if (val("hours") || val("days")) schedule += `<span style="display:inline-block;min-width:220px;padding:22px 15px;margin:6px;box-sizing:border-box;background:${t[3]};border:1px solid ${t[1]};border-radius:16px;"><b style="display:block;color:${t[0]};">MAIN STREAM</b><strong style="display:block;padding:9px 0;font-size:22px;">${escape(val("hours") || "Set your hours")}</strong><span style="color:#aa9b7d;">${escape(val("days") || "Your days")}</span></span>`;
      if (val("hours-extra") || val("days-extra")) schedule += `<span style="display:inline-block;min-width:220px;padding:22px 15px;margin:6px;box-sizing:border-box;background:${t[3]};border:1px solid ${t[1]};border-radius:16px;"><b style="display:block;color:${t[0]};">EXTRA STREAM</b><strong style="display:block;padding:9px 0;font-size:22px;">${escape(val("hours-extra") || "Optional")}</strong><span style="color:#aa9b7d;">${escape(val("days-extra"))}</span></span>`;
      if (val("timezone")) schedule += `<p style="color:#aa9b7d;font-size:13px;">Times shown in ${escape(val("timezone"))}.</p>`;
      sections += section("MY STREAMING SCHEDULE", schedule, t);
    }

    const social = linkCard("♛ OnlyFans","More content and updates.",val("onlyfans"),t) +
      linkCard("📸 Instagram","Follow for updates.",val("instagram"),t) +
      linkCard(val("other-label") || "More Links","Find me elsewhere online.",val("other-url"),t);
    if (social) sections += section("STAY CONNECTED", `<p style="color:#aa9b7d;">Follow my other pages and updates.</p>${social}`, t);
    const wishlists = linkCard("📦 Amazon Wishlist","Things I use and enjoy.",val("amazon"),t) +
      linkCard("🎁 Lovense Wishlist","My wishlist for toys and other items.",val("lovense"),t);
    if (wishlists) sections += section("WISHLISTS", `<p style="color:#aa9b7d;">Thank you for your support—never any pressure.</p>${wishlists}`, t);
    const rules = val("rules").split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0,30);
    if (rules.length) sections += section("ROOM RULES", `<p style="color:#aa9b7d;">Let's keep the room respectful and fun.</p>${rules.map(rule => `<p style="width:92%;max-width:900px;padding:14px 18px;margin:8px auto;border-left:3px solid ${t[0]};background:${t[3]};color:#e6decd;text-align:left;box-sizing:border-box;">${escape(rule)}</p>`).join("")}`, t);
    const id = name.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").slice(0,80) || "cam-model-profile";
    const html = `<ul id="${escape(id)}" style="display:block;width:100%;list-style:none;padding:0;margin:0 auto;box-sizing:border-box;overflow:visible;background:${t[3]};color:#f4efe3;font-family:Arial,Helvetica,sans-serif;text-align:center;">\n${sections}\n</ul>`;
    $("pb-html").value = html;
    // Generated content is safe for the preview because all user fields are escaped and URLs are HTTPS-only.
    $("pb-preview").innerHTML = html;
  }
  async function verifySession() {
    try {
      const response = await fetch("/api/auth/me", {credentials:"same-origin",cache:"no-store",headers:{"Accept":"application/json"}});
      if (!response.ok) throw new Error("We couldn't verify your sign-in. Please sign in again.");
      const data = await response.json();
      if (!data.authenticated) {
        authMessage.textContent = "Sign in to access the Cam Model Profile Builder.";
        loginLink.hidden = false;
        loginLink.href = "login.html?next=%2Fcam-profile-builder.html";
        return;
      }
      gate.hidden = true;
      app.hidden = false;
      build();
    } catch {
      authMessage.textContent = "We couldn't verify your sign-in. Refresh the page, or sign in again.";
      loginLink.hidden = false;
    }
  }
  $("pb-example").addEventListener("click", () => {
    const values = {"name":"LunaAfterDark","theme":"blue","about":"Hey, welcome in! I am a friendly, playful person who loves music, laughs, and meeting new people. Make yourself comfortable and say hello.","tagline":"Good vibes, conversation, and interactive fun.","features":"Friendly conversation\nMusic and chill vibes\nInteractive community","schedule-intro":"My schedule can change, so check back for updates.","days":"Tuesday–Saturday","hours":"7 PM–10 PM","days-extra":"Sunday","hours-extra":"2 PM–5 PM","timezone":"Eastern Time (ET)","rules":"Be respectful to me and other viewers.\nNo harassment, hate, or spam.\nRespect my boundaries and platform rules.\nHave fun and enjoy the room."};
    Object.entries(values).forEach(([key,value]) => { $("pb-"+key).value = value; });
    build(); status.textContent = "Example loaded. Replace the sample information with your own.";
  });
  $("pb-clear").addEventListener("click", () => {
    ["avatar","onlyfans","instagram","other-label","other-url","amazon","lovense","goal-title","goal-text","goal-url","goal-button"].forEach(key => { $("pb-"+key).value = ""; });
    build(); status.textContent = "Optional fields cleared.";
  });
  $("pb-tab-preview").addEventListener("click", () => {
    $("pb-preview-pane").hidden = false; $("pb-code-pane").hidden = true;
    $("pb-tab-preview").classList.add("button-primary"); $("pb-tab-code").classList.remove("button-primary"); build();
  });
  $("pb-tab-code").addEventListener("click", () => {
    $("pb-preview-pane").hidden = true; $("pb-code-pane").hidden = false;
    $("pb-tab-code").classList.add("button-primary"); $("pb-tab-preview").classList.remove("button-primary"); build();
  });
  $("pb-copy").addEventListener("click", async () => {
    build();
    try { await navigator.clipboard.writeText($("pb-html").value); status.textContent = "HTML copied to clipboard. Paste it into your Chaturbate profile editor."; }
    catch { $("pb-tab-code").click(); $("pb-html").focus(); $("pb-html").select(); status.textContent = "Clipboard access was blocked. The code is selected; press Ctrl+C to copy it."; }
  });
  $("pb-download").addEventListener("click", () => {
    build();
    const title = escape(val("name") || "Cam Model Profile");
    const blob = new Blob([`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body>${$("pb-html").value}</body></html>`], {type:"text/html;charset=utf-8"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = (val("name") || "cam-model-profile").replace(/[^a-z0-9_-]+/gi,"-") + ".html";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    status.textContent = "HTML file downloaded.";
  });
  ids.forEach(id => $("pb-"+id).addEventListener("input", () => { build(); status.textContent = "Preview refreshed."; }));
  verifySession();
})();