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
  }
  const topic = document.getElementById("contact-topic");
  const pageField = document.getElementById("contact-page-field");
  const cityField = document.getElementById("contact-city-field");
  const messageField = document.getElementById("contact-message-field");
  const replyField = document.getElementById("contact-reply-field");
  const emailField = document.getElementById("contact-email-field");

  const page = document.getElementById("contact-page");
  const city = document.getElementById("contact-city");
  const message = document.getElementById("contact-message");
  const wantsReply = document.getElementById("contact-wants-reply");
  const email = document.getElementById("contact-email");

  function updateFields() {
    const selected = topic.value;
    const hasTopic = selected !== "";
    const needsPage =
      selected === "website-issue" || selected === "correction";
    const needsCity = selected === "city-request";
    const isGeneralQuestion = selected === "question";

    if (!isGeneralQuestion) {
      wantsReply.checked = false;
      email.value = "";
    }

    const needsEmail = isGeneralQuestion && wantsReply.checked;

    pageField.hidden = !needsPage;
    cityField.hidden = !needsCity;
    messageField.hidden = !hasTopic;
    replyField.hidden = !isGeneralQuestion;
    emailField.hidden = !needsEmail;

    page.disabled = !needsPage;
    city.disabled = !needsCity;
    message.disabled = !hasTopic;
    wantsReply.disabled = !isGeneralQuestion;
    email.disabled = !needsEmail;

    page.required = false;
    city.required = needsCity;
    message.required = hasTopic;
    email.required = needsEmail;
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

  topic.addEventListener("change", () => {
    updateFields();
    validatePageAddress();
  });
  wantsReply.addEventListener("change", updateFields);
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
