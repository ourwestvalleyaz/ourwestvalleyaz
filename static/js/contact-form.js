(() => {
  "use strict";

  const form = document.getElementById("owvaz-contact-form");
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const result = document.getElementById("owvaz-contact-result");
  const accessKey = form.querySelector('input[name="access_key"]');

  function showResult(message, success) {
    result.textContent = message;
    result.hidden = false;
    result.dataset.state = success ? "success" : "error";
  }

  function clearResult() {
    result.textContent = "";
    result.hidden = true;
    result.dataset.state = "";
  }

  function updateWeb3FormsAvailability() {
    const configured = Boolean(accessKey && accessKey.value.trim());
    const hasMessage = !message.disabled && message.value.trim().length >= 30;
    const ready = configured && hasMessage && form.checkValidity();
    const sending = submitButton.getAttribute("aria-busy") === "true";

    submitButton.disabled = sending || !ready;

    if (!configured) {
      showResult(
        "Contact form submission is disabled in this local build.",
        false
      );
    }
  }
  const topic = document.getElementById("contact-topic");
  const pageField = document.getElementById("contact-page-field");
  const cityField = document.getElementById("contact-city-field");
  const messageField = document.getElementById("contact-message-field");
  const replyField = document.getElementById("contact-reply-field");
  const responseMethodField =
    document.getElementById("contact-response-method-field");
  const emailField = document.getElementById("contact-email-field");
  const socialProfileField =
    document.getElementById("contact-social-profile-field");

  const page = document.getElementById("contact-page");
  const city = document.getElementById("contact-city");
  const message = document.getElementById("contact-message");
  const wantsReply = document.getElementById("contact-wants-reply");
  const responseEmail = document.getElementById("contact-response-email");
  const responseFacebook =
    document.getElementById("contact-response-facebook");
  const responseNextdoor =
    document.getElementById("contact-response-nextdoor");
  const responseReddit =
    document.getElementById("contact-response-reddit");
  const email = document.getElementById("contact-email");
  const socialProfile =
    document.getElementById("contact-social-profile");
  const socialProfileLabel =
    document.getElementById("contact-social-profile-label");
  const socialProfileHelp =
    document.getElementById("contact-social-profile-help");
  const socialProfileSummary =
    document.getElementById("contact-social-profile-summary");
  const socialProfileInstructions =
    document.getElementById("contact-social-profile-instructions-text");

  function updateFields() {
    const selected = topic.value;
    const hasTopic = selected !== "";
    const needsPage =
      selected === "website-issue" || selected === "correction";
    const needsCity = selected === "city-request";
    const isGeneralQuestion = selected === "question";
    const isSocialModeration = selected === "social-moderation";
    const allowsReply = isGeneralQuestion || isSocialModeration;
    const wantsResponse = allowsReply && wantsReply.checked;

    if (!allowsReply) {
      wantsReply.checked = false;
    }

    if (!isSocialModeration) {
      responseEmail.checked = false;
      responseFacebook.checked = false;
      responseNextdoor.checked = false;
      responseReddit.checked = false;
      socialProfile.value = "";
    }

    const needsResponseMethod = isSocialModeration && wantsResponse;
    const socialMethodSelected =
      needsResponseMethod &&
      (responseFacebook.checked ||
       responseNextdoor.checked ||
       responseReddit.checked);

    const needsEmail =
      (isGeneralQuestion && wantsResponse) ||
      (needsResponseMethod && responseEmail.checked);

    if (!needsEmail) {
      email.value = "";
    }

    if (!socialMethodSelected) {
      socialProfile.value = "";
    }

    pageField.hidden = !needsPage;
    cityField.hidden = !needsCity;
    messageField.hidden = !hasTopic;
    replyField.hidden = !allowsReply;
    responseMethodField.hidden = !needsResponseMethod;
    emailField.hidden = !needsEmail;
    socialProfileField.hidden = !socialMethodSelected;

    page.disabled = !needsPage;
    city.disabled = !needsCity;
    message.disabled = !hasTopic;
    wantsReply.disabled = !allowsReply;
    responseEmail.disabled = !needsResponseMethod;
    responseFacebook.disabled = !needsResponseMethod;
    responseNextdoor.disabled = !needsResponseMethod;
    responseReddit.disabled = !needsResponseMethod;
    email.disabled = !needsEmail;
    socialProfile.disabled = !socialMethodSelected;

    page.required = false;
    city.required = needsCity;
    message.required = hasTopic;

    responseEmail.required = needsResponseMethod;
    responseFacebook.required = needsResponseMethod;
    responseNextdoor.required = needsResponseMethod;
    responseReddit.required = needsResponseMethod;

    email.required = needsEmail;
    socialProfile.required = socialMethodSelected;

    updateSocialProfileGuidance();
    validateSocialProfile();
    updateWeb3FormsAvailability();
  }

  function validatePageAddress() {
    const value = page.value.trim();

    if (!value || page.disabled) {
      page.setCustomValidity("");
      return;
    }

    try {
      const parsed = new URL(value);

      const allowed =
        parsed.protocol === "https:" &&
        parsed.hostname === "ourwestvalleyaz.org" &&
        (parsed.port === "" || parsed.port === "443") &&
        parsed.username === "" &&
        parsed.password === "";

      page.setCustomValidity(
        allowed
          ? ""
          : "Enter an HTTPS page address on ourwestvalleyaz.org."
      );
    } catch {
      page.setCustomValidity(
        "Enter a complete OWVAZ page address beginning with https://."
      );
    }
  }

  function selectedSocialMethod() {
    if (responseFacebook.checked) return "facebook";
    if (responseNextdoor.checked) return "nextdoor";
    if (responseReddit.checked) return "reddit";
    return "";
  }

  function updateSocialProfileGuidance() {
    const method = selectedSocialMethod();

    if (method === "facebook") {
      socialProfileLabel.textContent = "Facebook profile URL";
      socialProfile.placeholder = "https://www.facebook.com/...";
      socialProfileHelp.textContent =
        "Enter the link to your Facebook profile so an OWVAZ admin or moderator can contact you. Do not provide your Facebook password or other account information.";
      socialProfileSummary.textContent =
        "How do I find my Facebook profile link?";
      socialProfileInstructions.innerHTML = `
        <p><strong>iPhone / iPad:</strong> Open the Facebook app and open your profile. Use the profile options or sharing control, then choose the option to copy your profile link. Menu names may vary by app version.</p>
        <p><strong>Android:</strong> Open the Facebook app and open your profile. Use the profile options or sharing control, then choose the option to copy your profile link. Menu names may vary by app version.</p>
        <p><strong>Web browser:</strong> Open your Facebook profile page, then copy the profile URL from your browser's address bar.</p>
        <p><strong>Privacy:</strong> Only send your profile link. Do not send your password, login information, or a link to private account settings.</p>
      `;
      return;
    }

    if (method === "nextdoor") {
      socialProfileLabel.textContent = "Nextdoor profile URL";
      socialProfile.placeholder = "https://nextdoor.com/profile/...";
      socialProfileHelp.textContent =
        "Enter the link to your Nextdoor profile so an OWVAZ admin or moderator can contact you. Do not provide your Nextdoor password or other account information.";
      socialProfileSummary.textContent =
        "How do I find my Nextdoor profile link?";
      socialProfileInstructions.innerHTML = `
        <p><strong>iPhone / iPad:</strong> Open the Nextdoor app and open your profile. Use the available profile sharing or copy-link option to copy your profile link. Menu names may vary by app version.</p>
        <p><strong>Android:</strong> Open the Nextdoor app and open your profile. Use the available profile sharing or copy-link option to copy your profile link. Menu names may vary by app version.</p>
        <p><strong>Web browser:</strong> Open your Nextdoor profile page, then copy the profile URL from your browser's address bar.</p>
        <p><strong>Privacy:</strong> Only send your profile link. Do not send your password, login information, or a link to private account settings.</p>
      `;
      return;
    }

    if (method === "reddit") {
      socialProfileLabel.textContent = "Reddit profile URL";
      socialProfile.placeholder = "https://www.reddit.com/user/...";
      socialProfileHelp.textContent =
        "Enter the link to your Reddit profile so an OWVAZ admin or moderator can contact you. Do not provide your Reddit password or other account information.";
      socialProfileSummary.textContent =
        "How do I find my Reddit profile link?";
      socialProfileInstructions.innerHTML = `
        <p><strong>iPhone / iPad:</strong> Open the Reddit app and open your profile from your avatar. Use the profile sharing control to copy or share your profile link.</p>
        <p><strong>Android:</strong> Open the Reddit app and open your profile from your avatar. Use the profile sharing control to copy or share your profile link.</p>
        <p><strong>Web browser:</strong> Open your Reddit profile page, then copy the profile URL from your browser's address bar.</p>
        <p><strong>Privacy:</strong> Only send your profile link. Do not send your password, login information, or a link to private account settings.</p>
      `;
      return;
    }

    socialProfileLabel.textContent = "Social media profile URL";
    socialProfile.placeholder = "";
    socialProfileHelp.textContent =
      "Enter the link to your social media profile so an OWVAZ admin or moderator can contact you. Do not provide your password or other account information.";
    socialProfileSummary.textContent =
      "How do I find my profile link?";
    socialProfileInstructions.textContent = "";
  }

  function validateSocialProfile() {
    const value = socialProfile.value.trim();
    const method = selectedSocialMethod();

    if (!value || socialProfile.disabled) {
      socialProfile.setCustomValidity("");
      return;
    }

    const allowedHosts = {
      facebook: [
        "facebook.com",
        "www.facebook.com",
        "m.facebook.com"
      ],
      nextdoor: [
        "nextdoor.com",
        "www.nextdoor.com"
      ],
      reddit: [
        "reddit.com",
        "www.reddit.com",
        "old.reddit.com"
      ]
    };

    try {
      const parsed = new URL(value);
      const hostname = parsed.hostname.toLowerCase();
      const hosts = allowedHosts[method] || [];

      const allowed =
        parsed.protocol === "https:" &&
        hosts.includes(hostname) &&
        parsed.username === "" &&
        parsed.password === "";

      const platformNames = {
        facebook: "Facebook",
        nextdoor: "Nextdoor",
        reddit: "Reddit"
      };

      const platform = platformNames[method] || "social media";

      socialProfile.setCustomValidity(
        allowed
          ? ""
          : `Enter a complete ${platform} profile URL beginning with https://.`
      );
    } catch {
      socialProfile.setCustomValidity(
        "Enter a complete profile URL beginning with https://."
      );
    }
  }

  topic.addEventListener("change", () => {
    updateFields();
    validatePageAddress();
    validateSocialProfile();
  });

  wantsReply.addEventListener("change", updateFields);
  responseEmail.addEventListener("change", updateFields);
  responseFacebook.addEventListener("change", updateFields);
  responseNextdoor.addEventListener("change", updateFields);
  responseReddit.addEventListener("change", updateFields);

  socialProfile.addEventListener("input", () => {
    validateSocialProfile();
    updateWeb3FormsAvailability();
  });

  socialProfile.addEventListener("blur", () => {
    validateSocialProfile();
    if (socialProfile.value.trim() && !socialProfile.checkValidity()) {
      socialProfile.reportValidity();
    }
  });

  page.addEventListener("input", () => {
    validatePageAddress();
    updateWeb3FormsAvailability();
  });

  message.addEventListener("input", () => {
    message.setCustomValidity("");
  });

  form.addEventListener("input", updateWeb3FormsAvailability);
  form.addEventListener("change", updateWeb3FormsAvailability);
  page.addEventListener("blur", () => {
    validatePageAddress();
    if (page.value.trim() && !page.checkValidity()) {
      page.reportValidity();
    }
  });

    form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitButton.getAttribute("aria-busy") === "true") return;

    clearResult();
    validatePageAddress();
    validateSocialProfile();

    if (message.disabled || message.value.trim().length < 30) {
      message.setCustomValidity(
        "Enter at least 30 characters in your message."
      );
    } else {
      message.setCustomValidity("");
    }

    if (!form.checkValidity()) {
      form.querySelector(":invalid")?.focus();
      return;
    }

    if (!accessKey || !accessKey.value.trim()) {
      showResult(
        "The contact form is not configured for this local build.",
        false
      );
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");

    showResult("Sending your message...", true);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: {
          "Accept": "application/json"
        }
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.ok && data.success) {
        form.reset();
        updateFields();
        updateWeb3FormsAvailability();

        showResult(
          "Your message was sent successfully. Thank you for contacting OWVAZ.",
          true
        );
      } else {
        showResult(
          "We could not send your message. Please check the form and try again.",
          false
        );
      }
    } catch {
      showResult(
        "We could not send your message. Please check your connection and try again.",
        false
      );
    } finally {
      submitButton.removeAttribute("aria-busy");
      updateWeb3FormsAvailability();
    }
  });

  updateFields();
  updateWeb3FormsAvailability();
})();
