(() => {
  const output = document.querySelector("#output");
  const status = document.querySelector("#status");
  const buttons = document.querySelectorAll("button[data-path]");

  const setStatus = (msg, color = "#0f172a") => {
    if (status) {
      status.textContent = msg;
      status.style.color = color;
    }
  };

  if (!output) setStatus("Missing output textarea", "#b91c1c");
  if (typeof fetch !== "function") setStatus("Fetch API not available in this browser", "#b91c1c");

  if (output && buttons.length) {
    setStatus("Buttons ready.");
    for (const btn of buttons) {
      btn.addEventListener("click", async () => {
        const path = btn.getAttribute("data-path") || "";
        output.value = "Loading " + path + "…";
        setStatus("Requesting " + path + " …");
        try {
          const res = await fetch(path);
          const text = await res.text();
          let formatted = text;
          try {
            formatted = JSON.stringify(JSON.parse(text), null, 2);
          } catch (_) {
            // keep plain text
          }
          output.value = formatted;
          setStatus("Loaded " + path);
        } catch (err) {
          output.value = "Request failed: " + err;
          setStatus("Request failed: " + err, "#b91c1c");
        }
      });
    }
  }
})();
