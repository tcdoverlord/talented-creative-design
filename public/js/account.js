(() => {
  const tabs = [...document.querySelectorAll(".auth-tab")];
  const form = document.querySelector("#account-form");
  if (!form) return;
  const submit = document.querySelector("#account-submit");
  const message = document.querySelector("#account-message");
  const title = document.querySelector("#auth-title");
  const description = document.querySelector("#auth-description");
  const displayNameWrap = document.querySelector("#display-name-wrap");
  const forgotForm = document.querySelector("#forgot-form");
  const twoFactorForm = document.querySelector("#two-factor-form");
  let mode = "signin";
  let csrfToken = "";

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.hidden = false;
    message.style.borderColor = isError ? "#a84b56" : "";
  }
  async function getCsrf() {
    const response = await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Could not start a secure account session. Is the server running?");
    const data = await response.json();
    csrfToken = data.csrfToken;
  }
  async function setMode(nextMode) {
    mode = nextMode;
    tabs.forEach(tab => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    const registering = mode === "register";
    title.textContent = registering ? "Create your account." : "Welcome back.";
    description.textContent = registering ? "Register to prepare for account features and software purchases." : "Sign in to access your account.";
    submit.textContent = registering ? "Create account" : "Sign in";
    displayNameWrap.hidden = !registering;
    forgotForm.hidden = registering;
    form.querySelector('input[name="password"]').autocomplete = registering ? "new-password" : "current-password";
    message.hidden = true;
    try { await getCsrf(); } catch (error) { showMessage(error.message, true); }
  }
  tabs.forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.mode)));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.hidden = true;
    const data = new FormData(form);
    const payload = {
      email: String(data.get("email") || "").trim(),
      password: String(data.get("password") || ""),
      displayName: String(data.get("displayName") || "").trim()
    };
    if (!csrfToken) {
      try { await getCsrf(); } catch (error) { showMessage(error.message, true); return; }
    }
    submit.disabled = true;
    submit.textContent = mode === "register" ? "Creating account…" : "Signing in…";
    try {
      const response = await fetch(`/api/auth/${mode === "register" ? "register" : "login"}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.requiresTwoFactor) { form.hidden = true; forgotForm.hidden = true; twoFactorForm.hidden = false; showMessage(result.message || "Enter your authenticator code."); return; }
      if (!response.ok) {
        showMessage(result.error || "The request failed. Please try again.", true);
        await getCsrf();
        return;
      }
      csrfToken = result.csrfToken || "";
      showMessage(mode === "register" ? "Your account has been created. Opening your account…" : "Signed in successfully. Opening your account…");
      window.location.href = "/account.html";
    } catch {
      showMessage("Could not contact the account server. Make sure the backend is running and try again.", true);
    } finally {
      submit.disabled = false;
      submit.textContent = mode === "register" ? "Create account" : "Sign in";
    }
  });

  if (twoFactorForm) twoFactorForm.addEventListener("submit", async event => {
    event.preventDefault(); message.hidden = true;
    try { if (!csrfToken) await getCsrf(); const code = String(new FormData(twoFactorForm).get("code") || "").trim(); const response = await fetch("/api/auth/2fa/verify", {method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","X-CSRF-Token":csrfToken},body:JSON.stringify({code})}); const result = await response.json().catch(()=>({})); if(!response.ok) throw new Error(result.error || "Could not verify code."); csrfToken=result.csrfToken||""; window.location.href="/account.html"; } catch(error) { showMessage(error.message,true); }
  });

  forgotForm.addEventListener("submit", async event => {
    event.preventDefault(); message.hidden = true;
    try {
      if (!csrfToken) await getCsrf();
      const email = String(new FormData(forgotForm).get("email") || "").trim();
      const response = await fetch("/api/auth/password/forgot", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }, body: JSON.stringify({ email }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not request reset.");
      showMessage(result.message);
    } catch (error) { showMessage(error.message, true); }
  });
  if (new URLSearchParams(window.location.search).has("google2fa")) { form.hidden = true; forgotForm.hidden = true; twoFactorForm.hidden = false; showMessage("Google sign-in succeeded. Enter your administrator authenticator code."); }
  if (new URLSearchParams(window.location.search).has("google")) showMessage("Google sign-in could not be completed. Check the OAuth setup and try again.", true);
  getCsrf().catch(error => showMessage(error.message, true));
})();
