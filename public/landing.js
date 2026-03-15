(() => {
  const output = document.querySelector("#output");
  const status = document.querySelector("#status");
  const buttons = document.querySelectorAll("button[data-path]");
  const cards = document.querySelector("#cards");

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
          renderCards(text);
          setStatus("Loaded " + path);
        } catch (err) {
          output.value = "Request failed: " + err;
          setStatus("Request failed: " + err, "#b91c1c");
        }
      });
    }
  }

  function renderCards(raw) {
    if (!cards) return;
    cards.innerHTML = "";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      return;
    }
    const items = Array.isArray(parsed?.data) ? parsed.data : [];
    if (!items.length) return;

    for (const item of items) {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.alt = item.name || "poster";
      img.src = item.posterUrl || "";

      const textWrap = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = item.name || "Untitled";
      const meta = document.createElement("p");
      const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : "";
      const genres = Array.isArray(item.genres) ? item.genres.join(", ") : "";
      meta.textContent = [item.mediaType, year, genres].filter(Boolean).join(" • ");

      textWrap.appendChild(title);
      textWrap.appendChild(meta);
      card.appendChild(img);
      card.appendChild(textWrap);
      cards.appendChild(card);
    }
  }
})();
