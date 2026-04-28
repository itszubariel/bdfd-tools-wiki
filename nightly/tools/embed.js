const MODE_KEY = "bdtools_embed_mode";
const NORMAL_KEY = "bdtools_normal_embed_state";
const SEND_KEY = "bdtools_send_embed_state";
const CV2_KEY = "bdtools_compv2_state";

let currentMode = localStorage.getItem(MODE_KEY) || "normal";
let fieldCount = 0,
  buttonCount = 0,
  selectCount = 0,
  modalCount = 0;

function sanitizeInput(str) {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "%{DOL}%")
    .replace(/;/g, "\\;")
    .replace(/\]/g, "\\]");
}

function isValidHex(val) {
  return /^#[0-9A-Fa-f]{6}$/.test(val);
}

function isValidUrl(val) {
  return /^https?:\/\/.+/.test(val);
}

function clearInlineErrors() {
  document.querySelectorAll(".inline-error").forEach((el) => el.remove());
}

function rowError(container, msg) {
  const span = document.createElement("div");
  span.className = "inline-error";
  span.textContent = msg;
  container.insertAdjacentElement("afterend", span);
}

function formRowError(inputEl, msg) {
  if (!inputEl) return;
  const formRow = inputEl.closest(".form-row") || inputEl.parentElement;
  rowError(formRow, msg);
}

function bodyRowError(formRowEl, msg) {
  if (!formRowEl) return;
  rowError(formRowEl, msg);
}

function showToast(msg, isError) {
  let toast = document.getElementById("embedToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "embedToast";
    toast.style.cssText = [
      "position:fixed",
      "bottom:2rem",
      "left:50%",
      "transform:translateX(-50%)",
      "padding:0.8rem 1.6rem",
      "border-radius:var(--border-radius)",
      "font-size:1.3rem",
      "font-weight:500",
      "color:#fff",
      "box-shadow:0 5px 15px rgba(0,0,0,0.4)",
      "z-index:9999",
      "transition:opacity 0.3s",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = isError
    ? "hsl(0deg 70% 40%)"
    : "hsl(220deg 80% 45%)";
  toast.style.opacity = "1";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.opacity = "0";
  }, 2800);
}

function saveNormalState() {
  const state = {};
  [
    "authorName",
    "authorIcon",
    "authorUrl",
    "title",
    "titleUrl",
    "description",
    "thumbnail",
    "image",
    "color",
    "footer",
    "footerIcon",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) state[id] = el.value;
  });
  const ts = document.getElementById("timestamp");
  if (ts) state.timestamp = ts.checked;
  // dynamic fields snapshot
  const dynamics = [];
  document
    .querySelectorAll('#dynamicFields > [class$="-row"]')
    .forEach((row) => {
      const type = Array.from(row.classList).find(
        (c) => c.endsWith("-row") && c !== "form-row",
      );
      dynamics.push({ type, html: row.outerHTML });
    });
  state.dynamics = dynamics;
  localStorage.setItem(NORMAL_KEY, JSON.stringify(state));
}

function loadNormalState() {
  const raw = localStorage.getItem(NORMAL_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    [
      "authorName",
      "authorIcon",
      "authorUrl",
      "title",
      "titleUrl",
      "description",
      "thumbnail",
      "image",
      "color",
      "footer",
      "footerIcon",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el && state[id] !== undefined) el.value = state[id];
    });
    const ts = document.getElementById("timestamp");
    if (ts && state.timestamp !== undefined) ts.checked = state.timestamp;
  } catch (e) {}
}

const SEND_FIELDS = [
  "s_channelId",
  "s_content",
  "s_authorName",
  "s_authorIcon",
  "s_title",
  "s_titleUrl",
  "s_description",
  "s_thumbnail",
  "s_image",
  "s_color",
  "s_footer",
  "s_footerIcon",
];
const SEND_CHECKS = ["s_timestamp", "s_returnMsgId"];

function saveSendState() {
  const state = {};
  SEND_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) state[id] = el.value;
  });
  SEND_CHECKS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) state[id] = el.checked;
  });
  localStorage.setItem(SEND_KEY, JSON.stringify(state));
}

function loadSendState() {
  const raw = localStorage.getItem(SEND_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    SEND_FIELDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el && state[id] !== undefined) el.value = state[id];
    });
    SEND_CHECKS.forEach((id) => {
      const el = document.getElementById(id);
      if (el && state[id] !== undefined) el.checked = state[id];
    });
  } catch (e) {}
}

function switchMode(mode) {
  if (mode === currentMode) return;
  // save current mode state before switching
  if (currentMode === "normal") saveNormalState();
  else if (currentMode === "send") saveSendState();
  else if (currentMode === "compv2") saveCV2State();

  currentMode = mode;
  localStorage.setItem(MODE_KEY, mode);

  const normalBuilder = document.getElementById("normalBuilder");
  const sendBuilder = document.getElementById("sendBuilder");
  const compV2Builder = document.getElementById("compV2Builder");
  const btnNormal = document.getElementById("modeNormal");
  const btnSend = document.getElementById("modeSend");
  const btnCV2 = document.getElementById("modeCompV2");

  normalBuilder.style.display = "none";
  sendBuilder.style.display = "none";
  compV2Builder.style.display = "none";
  btnNormal.classList.remove("active");
  btnSend.classList.remove("active");
  btnCV2.classList.remove("active");

  if (mode === "normal") {
    normalBuilder.style.display = "";
    btnNormal.classList.add("active");
    loadNormalState();
  } else if (mode === "send") {
    sendBuilder.style.display = "";
    btnSend.classList.add("active");
    loadSendState();
  } else if (mode === "compv2") {
    compV2Builder.style.display = "";
    btnCV2.classList.add("active");
    // DO NOT call loadCV2State() here — cards are already in the DOM
    // Just refresh dropdowns in case names changed while in another mode
    cv2RefreshAllDropdowns();
  }
}

function makeHeader(title, body, onRemove) {
  const header = document.createElement("div");
  header.className = "component-header";
  const titleEl = document.createElement("span");
  titleEl.className = "component-title";
  titleEl.textContent = title;

  const btnGroup = document.createElement("div");
  btnGroup.style.cssText = "display:flex;gap:0.5rem;align-items:center;";

  const collapseBtn = document.createElement("button");
  collapseBtn.className = "collapse-btn";
  collapseBtn.textContent = "▲";
  collapseBtn.onclick = () => {
    const collapsed = body.style.display === "none";
    body.style.display = collapsed ? "" : "none";
    collapseBtn.textContent = collapsed ? "▲" : "▼";
  };
  btnGroup.appendChild(collapseBtn);

  if (onRemove) {
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn-red remove-btn-small";
    removeBtn.textContent = "✕";
    removeBtn.onclick = onRemove;
    btnGroup.appendChild(removeBtn);
  }

  header.appendChild(titleEl);
  header.appendChild(btnGroup);
  return header;
}

function addFieldRow() {
  fieldCount++;
  const row = document.createElement("div");
  row.className = "field-row";
  const body = document.createElement("div");
  body.className = "component-body";
  body.innerHTML = `
    <div class="form-row">
      <input class="form-input field-name" placeholder="Field Name">
      <input class="form-input field-value" placeholder="Field Value">
    </div>
    <div style="display:flex;align-items:center;margin-top:0.75rem;">
      <label class="checkbox-label" style="margin:0;">
        <input type="checkbox" class="form-checkbox field-inline">
        <span>Inline</span>
      </label>
    </div>
  `;
  row.appendChild(makeHeader(`Field #${fieldCount}`, body, () => row.remove()));
  row.appendChild(body);
  document.getElementById("dynamicFields").appendChild(row);
}

function addButtonRow() {
  buttonCount++;
  const row = document.createElement("div");
  row.className = "button-row";
  const body = document.createElement("div");
  body.className = "component-body";
  body.innerHTML = `
    <div class="form-row">
      <input class="form-input button-label" placeholder="Button Label">
      <input class="form-input button-id" placeholder="Custom ID">
      <select class="form-input button-style">
        <option value="primary">Primary</option>
        <option value="secondary">Secondary</option>
        <option value="success">Success</option>
        <option value="danger">Danger</option>
        <option value="link">Link</option>
      </select>
    </div>
    <div class="form-row" style="margin-top:0.75rem;">
      <input class="form-input button-emoji" placeholder="Emoji">
      <input class="form-input button-url" placeholder="URL (for Link style)">
    </div>
    <div style="display:flex;gap:1.5rem;align-items:center;margin-top:0.75rem;">
      <label class="checkbox-label" style="margin:0;">
        <input type="checkbox" class="form-checkbox button-disabled">
        <span>Disabled</span>
      </label>
      <label class="checkbox-label" style="margin:0;">
        <input type="checkbox" class="form-checkbox button-newrow">
        <span>New Row</span>
      </label>
    </div>
  `;
  row.appendChild(
    makeHeader(`Button #${buttonCount}`, body, () => row.remove()),
  );
  row.appendChild(body);
  document.getElementById("dynamicFields").appendChild(row);
}

function addSelectRow() {
  selectCount++;
  const row = document.createElement("div");
  row.className = "select-row";
  const body = document.createElement("div");
  body.className = "component-body";
  body.innerHTML = `
    <div class="form-row">
      <input class="form-input select-placeholder" placeholder="Placeholder">
      <input class="form-input select-id" placeholder="Custom ID">
      <input class="form-input select-min" type="number" placeholder="Min Values" value="1" min="1">
      <input class="form-input select-max" type="number" placeholder="Max Values" value="1" min="1">
    </div>
    <div class="options-container" style="margin-top:1rem;"></div>
    <div style="display:flex;gap:0.75rem;margin-top:0.75rem;">
      <button class="add-field-btn add-option-btn">+ Option</button>
    </div>
  `;
  row.appendChild(
    makeHeader(`Select Menu #${selectCount}`, body, () => row.remove()),
  );
  row.appendChild(body);
  document.getElementById("dynamicFields").appendChild(row);

  let optionCount = 0;
  const optionsContainer = body.querySelector(".options-container");
  body.querySelector(".add-option-btn").onclick = () => {
    optionCount++;
    const option = document.createElement("div");
    option.className = "select-option";
    const optBody = document.createElement("div");
    optBody.className = "form-row";
    optBody.style.marginTop = "0.5rem";
    optBody.innerHTML = `
      <input class="form-input option-label" placeholder="Label">
      <input class="form-input option-value" placeholder="Value">
      <input class="form-input option-desc" placeholder="Description">
      <input class="form-input option-emoji" placeholder="Emoji">
    `;
    const optHeader = document.createElement("div");
    optHeader.className = "option-header";
    const titleSpan = document.createElement("span");
    titleSpan.className = "option-title";
    titleSpan.textContent = `Option #${optionCount}`;
    const btnGroup = document.createElement("div");
    btnGroup.style.cssText = "display:flex;gap:0.75rem;align-items:center;";
    const collapseBtn = document.createElement("button");
    collapseBtn.className = "collapse-btn";
    collapseBtn.textContent = "▲";
    collapseBtn.onclick = () => {
      const hidden = optBody.style.display === "none";
      optBody.style.display = hidden ? "" : "none";
      collapseBtn.textContent = hidden ? "▲" : "▼";
    };
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn-red remove-btn-small";
    removeBtn.textContent = "✕";
    removeBtn.onclick = () => option.remove();
    btnGroup.appendChild(collapseBtn);
    btnGroup.appendChild(removeBtn);
    optHeader.appendChild(titleSpan);
    optHeader.appendChild(btnGroup);
    option.appendChild(optHeader);
    option.appendChild(optBody);
    optionsContainer.appendChild(option);
  };
}

function addModalRow() {
  modalCount++;
  const row = document.createElement("div");
  row.className = "modal-row";
  const body = document.createElement("div");
  body.className = "component-body";
  body.innerHTML = `
    <div class="form-row">
      <input class="form-input modal-title" placeholder="Modal Title">
      <input class="form-input modal-id" placeholder="Custom ID">
    </div>
    <div class="modal-inputs-container" style="margin-top:1rem;"></div>
    <div style="display:flex;gap:0.75rem;margin-top:0.75rem;">
      <button class="add-field-btn add-modal-input-btn">+ Text Input</button>
    </div>
  `;
  row.appendChild(makeHeader(`Modal #${modalCount}`, body, () => row.remove()));
  row.appendChild(body);
  document.getElementById("dynamicFields").appendChild(row);

  let inputCount = 0;
  const inputsContainer = body.querySelector(".modal-inputs-container");
  body.querySelector(".add-modal-input-btn").onclick = () => {
    inputCount++;
    const input = document.createElement("div");
    input.className = "modal-input";
    const inpBody = document.createElement("div");
    inpBody.className = "modal-input-body";
    inpBody.innerHTML = `
      <div class="form-row" style="margin-top:0.5rem;">
        <input class="form-input input-label" placeholder="Label">
        <input class="form-input input-id" placeholder="Input ID">
        <select class="form-input input-style">
          <option value="short">Short</option>
          <option value="paragraph">Paragraph</option>
        </select>
        <input class="form-input input-placeholder" placeholder="Placeholder">
      </div>
      <div class="form-row" style="margin-top:0.5rem;">
        <input class="form-input input-minlen" type="number" placeholder="Min Length" min="0" max="4000">
        <input class="form-input input-maxlen" type="number" placeholder="Max Length" min="0" max="4000">
      </div>
      <label class="checkbox-label">
        <input type="checkbox" class="form-checkbox input-required" checked>
        <span>Required</span>
      </label>
    `;
    const inpHeader = document.createElement("div");
    inpHeader.className = "option-header";
    const titleSpan = document.createElement("span");
    titleSpan.className = "option-title";
    titleSpan.textContent = `Text Input #${inputCount}`;
    const btnGroup = document.createElement("div");
    btnGroup.style.cssText = "display:flex;gap:0.75rem;align-items:center;";
    const collapseBtn = document.createElement("button");
    collapseBtn.className = "collapse-btn";
    collapseBtn.textContent = "▲";
    collapseBtn.onclick = () => {
      const hidden = inpBody.style.display === "none";
      inpBody.style.display = hidden ? "" : "none";
      collapseBtn.textContent = hidden ? "▲" : "▼";
    };
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn-red remove-btn-small";
    removeBtn.textContent = "✕";
    removeBtn.onclick = () => input.remove();
    btnGroup.appendChild(collapseBtn);
    btnGroup.appendChild(removeBtn);
    inpHeader.appendChild(titleSpan);
    inpHeader.appendChild(btnGroup);
    input.appendChild(inpHeader);
    input.appendChild(inpBody);
    inputsContainer.appendChild(input);
  };
}

function generateNormalEmbed() {
  const error = document.getElementById("error");
  error.textContent = "";
  clearInlineErrors();
  let hasErrors = false;
  let code = "$nomention\n";

  const authorName = document.getElementById("authorName").value.trim();
  const authorIcon = document.getElementById("authorIcon").value.trim();
  const authorUrl = document.getElementById("authorUrl").value.trim();
  if ((authorIcon || authorUrl) && !authorName) {
    formRowError(
      document.getElementById("authorName"),
      "Author Name required when Icon/URL is set",
    );
    hasErrors = true;
  }
  if (authorIcon && !isValidUrl(authorIcon)) {
    formRowError(
      document.getElementById("authorIcon"),
      "Author Icon: invalid URL",
    );
    hasErrors = true;
  }
  if (authorUrl && !isValidUrl(authorUrl)) {
    formRowError(
      document.getElementById("authorUrl"),
      "Author URL: invalid URL",
    );
    hasErrors = true;
  }

  const titleVal = document.getElementById("title").value.trim();
  const titleUrl = document.getElementById("titleUrl").value.trim();
  if (titleUrl && !titleVal) {
    formRowError(
      document.getElementById("title"),
      "Title required when Title URL is set",
    );
    hasErrors = true;
  }
  if (titleUrl && !isValidUrl(titleUrl)) {
    formRowError(document.getElementById("titleUrl"), "Title URL: invalid URL");
    hasErrors = true;
  }

  const colorVal = document.getElementById("color").value.trim();
  if (colorVal && !isValidHex(colorVal)) {
    formRowError(
      document.getElementById("color"),
      "Color: must be a valid hex code (e.g. #5865F2)",
    );
    hasErrors = true;
  }

  const thumbnailVal = document.getElementById("thumbnail").value.trim();
  if (thumbnailVal && !isValidUrl(thumbnailVal)) {
    formRowError(
      document.getElementById("thumbnail"),
      "Thumbnail: invalid URL",
    );
    hasErrors = true;
  }
  const imageVal = document.getElementById("image").value.trim();
  if (imageVal && !isValidUrl(imageVal)) {
    formRowError(document.getElementById("image"), "Image: invalid URL");
    hasErrors = true;
  }

  const footerVal = document.getElementById("footer").value.trim();
  const footerIcon = document.getElementById("footerIcon").value.trim();
  if (footerIcon && !footerVal) {
    formRowError(
      document.getElementById("footer"),
      "Footer Text required when Footer Icon is set",
    );
    hasErrors = true;
  }
  if (footerIcon && !isValidUrl(footerIcon)) {
    formRowError(
      document.getElementById("footerIcon"),
      "Footer Icon: invalid URL",
    );
    hasErrors = true;
  }

  document.querySelectorAll(".field-row").forEach((row, i) => {
    const n = i + 1;
    const nameEl = row.querySelector(".field-name");
    const valueEl = row.querySelector(".field-value");
    const name = nameEl?.value.trim();
    const value = valueEl?.value.trim();
    const formRow = row.querySelector(".form-row");
    if (!name || !value) {
      bodyRowError(formRow, `Field ${n}: Name and Value required`);
      hasErrors = true;
    } else if (name === value) {
      bodyRowError(formRow, `Field ${n}: Name and Value can't be the same`);
      hasErrors = true;
    }
  });

  document.querySelectorAll(".button-row").forEach((row, i) => {
    const n = i + 1;
    const label = row.querySelector(".button-label")?.value.trim();
    const id = row.querySelector(".button-id")?.value.trim();
    const url = row.querySelector(".button-url")?.value.trim();
    const style = row.querySelector(".button-style")?.value;
    const formRow = row.querySelector(".form-row");
    if (!label) {
      bodyRowError(formRow, `Button ${n}: Label required`);
      hasErrors = true;
    }
    if (style === "link" && !url) {
      bodyRowError(formRow, `Button ${n}: URL required for Link style`);
      hasErrors = true;
    } else if (style === "link" && url && !isValidUrl(url)) {
      bodyRowError(formRow, `Button ${n}: invalid URL`);
      hasErrors = true;
    } else if (style !== "link" && !id) {
      bodyRowError(formRow, `Button ${n}: Custom ID required`);
      hasErrors = true;
    }
  });

  // Check for duplicate button IDs
  const buttonIdMap = {};
  document.querySelectorAll(".button-row").forEach((row, i) => {
    const id = row.querySelector(".button-id")?.value.trim();
    const style = row.querySelector(".button-style")?.value;
    if (id && style !== "link") {
      if (!buttonIdMap[id]) buttonIdMap[id] = [];
      buttonIdMap[id].push(i);
    }
  });
  document.querySelectorAll(".button-row").forEach((row, i) => {
    const n = i + 1;
    const id = row.querySelector(".button-id")?.value.trim();
    const style = row.querySelector(".button-style")?.value;
    const formRow = row.querySelector(".form-row");
    if (id && style !== "link" && buttonIdMap[id]?.length > 1) {
      bodyRowError(formRow, `Button ${n}: Duplicate ID "${id}"`);
      hasErrors = true;
    }
  });

  // Check for duplicate select menu IDs
  const selectIdMap = {};
  document.querySelectorAll(".select-row").forEach((row, i) => {
    const id = row.querySelector(".select-id")?.value.trim();
    if (id) {
      if (!selectIdMap[id]) selectIdMap[id] = [];
      selectIdMap[id].push(i);
    }
  });

  document.querySelectorAll(".select-row").forEach((row, i) => {
    const n = i + 1;
    const menuId = row.querySelector(".select-id")?.value.trim();
    const formRow = row.querySelector(".form-row");
    if (!menuId) {
      bodyRowError(formRow, `Select Menu ${n}: Menu ID required`);
      hasErrors = true;
      return;
    }
    if (selectIdMap[menuId]?.length > 1) {
      bodyRowError(formRow, `Select Menu ${n}: Duplicate ID "${menuId}"`);
      hasErrors = true;
    }
    const options = row.querySelectorAll(".select-option");
    if (options.length === 0) {
      bodyRowError(formRow, `Select Menu ${n}: Add at least one option`);
      hasErrors = true;
      return;
    }
    options.forEach((opt, j) => {
      const m = j + 1;
      const optFormRow = opt.querySelector(".form-row");
      const label = opt.querySelector(".option-label")?.value.trim();
      const value = opt.querySelector(".option-value")?.value.trim();
      const desc = opt.querySelector(".option-desc")?.value.trim();
      if (!label || !value || !desc) {
        bodyRowError(
          optFormRow,
          `Menu ${n} Option ${m}: Label, Value and Description required`,
        );
        hasErrors = true;
      } else if (value !== menuId) {
        bodyRowError(
          optFormRow,
          `Menu ${n} Option ${m}: Value must match Menu ID`,
        );
        hasErrors = true;
      }
    });
  });

  const modalIdMap = {};
  document.querySelectorAll(".modal-row").forEach((row, i) => {
    const id = row.querySelector(".modal-id")?.value.trim();
    if (id) {
      if (!modalIdMap[id]) modalIdMap[id] = [];
      modalIdMap[id].push(i);
    }
  });
  document.querySelectorAll(".modal-row").forEach((row, i) => {
    const n = i + 1;
    const title = row.querySelector(".modal-title")?.value.trim();
    const customId = row.querySelector(".modal-id")?.value.trim();
    const formRow = row.querySelector(".form-row");
    if (!title || !customId) {
      bodyRowError(formRow, `Modal ${n}: ID and Title required`);
      hasErrors = true;
    }
    if (customId && modalIdMap[customId]?.length > 1) {
      bodyRowError(formRow, `Modal ${n}: Duplicate ID "${customId}"`);
      hasErrors = true;
    }
    if (!title || !customId) return;
    const inputs = row.querySelectorAll(".modal-input");
    if (inputs.length === 0) {
      bodyRowError(formRow, `Modal ${n}: Add at least one text input`);
      hasErrors = true;
      return;
    }
    let validInputCount = 0;
    inputs.forEach((inp, j) => {
      const m = j + 1;
      const inpFormRow = inp.querySelector(".form-row");
      const label = inp.querySelector(".input-label")?.value.trim();
      const id = inp.querySelector(".input-id")?.value.trim();
      const placeholder =
        inp.querySelector(".input-placeholder")?.value.trim() || "";
      const minLen = parseInt(
        inp.querySelector(".input-minlen")?.value || "0",
        10,
      );
      const maxLen = parseInt(
        inp.querySelector(".input-maxlen")?.value || "0",
        10,
      );
      const lenRow = inp.querySelectorAll(".form-row")[1];
      if (!label) {
        bodyRowError(inpFormRow, `Modal ${n} Input ${m}: Label required`);
        hasErrors = true;
      } else if (label.length > 45) {
        bodyRowError(inpFormRow, `Modal ${n} Input ${m}: Label max 45 chars`);
        hasErrors = true;
      }
      if (placeholder.length > 100) {
        bodyRowError(
          inpFormRow,
          `Modal ${n} Input ${m}: Placeholder max 100 chars`,
        );
        hasErrors = true;
      }
      if (lenRow) {
        if (minLen > 4000 || maxLen > 4000) {
          bodyRowError(
            lenRow,
            `Modal ${n} Input ${m}: Length can't exceed 4000`,
          );
          hasErrors = true;
        } else if (maxLen > 0 && maxLen < minLen) {
          bodyRowError(lenRow, `Modal ${n} Input ${m}: Max < Min`);
          hasErrors = true;
        }
      }
      if (id) validInputCount++;
    });
    if (validInputCount === 0) {
      bodyRowError(
        row.querySelector(".form-row"),
        `Modal ${n}: All inputs need an Input ID`,
      );
      hasErrors = true;
    }
  });

  // Check for duplicate IDs across all component types (buttons, select menus, modals)
  const allComponentIds = {};

  // Collect button IDs
  document.querySelectorAll(".button-row").forEach((row, i) => {
    const id = row.querySelector(".button-id")?.value.trim();
    const style = row.querySelector(".button-style")?.value;
    if (id && style !== "link") {
      if (!allComponentIds[id]) allComponentIds[id] = [];
      allComponentIds[id].push({ type: "Button", index: i + 1, row });
    }
  });

  // Collect select menu IDs
  document.querySelectorAll(".select-row").forEach((row, i) => {
    const id = row.querySelector(".select-id")?.value.trim();
    if (id) {
      if (!allComponentIds[id]) allComponentIds[id] = [];
      allComponentIds[id].push({ type: "Select Menu", index: i + 1, row });
    }
  });

  // Collect modal IDs
  document.querySelectorAll(".modal-row").forEach((row, i) => {
    const id = row.querySelector(".modal-id")?.value.trim();
    if (id) {
      if (!allComponentIds[id]) allComponentIds[id] = [];
      allComponentIds[id].push({ type: "Modal", index: i + 1, row });
    }
  });

  // Report duplicates across all components
  Object.keys(allComponentIds).forEach((id) => {
    const components = allComponentIds[id];
    if (components.length > 1) {
      components.forEach((comp) => {
        const formRow = comp.row.querySelector(".form-row");
        bodyRowError(
          formRow,
          `${comp.type} ${comp.index}: ID "${id}" is already used by another component`,
        );
        hasErrors = true;
      });
    }
  });

  if (hasErrors) {
    const first = document.querySelector(".inline-error");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // Build code
  const authorNameS = sanitizeInput(authorName);
  const authorIconS = sanitizeInput(authorIcon);
  const authorUrlS = sanitizeInput(authorUrl);
  if (authorNameS) code += `$author[${authorNameS}]\n`;
  if (authorIconS) code += `$authorIcon[${authorIconS}]\n`;
  if (authorUrlS) code += `$authorURL[${authorUrlS}]\n`;

  const titleS = sanitizeInput(titleVal);
  const titleUrlS = sanitizeInput(titleUrl);
  if (titleS) code += `$title[${titleS}]\n`;
  if (titleUrlS) code += `$embeddedURL[${titleUrlS}]\n`;

  const desc = sanitizeInput(document.getElementById("description").value);
  if (desc) code += `$description[${desc}]\n`;

  const thumbnail = sanitizeInput(document.getElementById("thumbnail").value);
  if (thumbnail) code += `$thumbnail[${thumbnail}]\n`;

  const image = sanitizeInput(document.getElementById("image").value);
  if (image) code += `$image[${image}]\n`;

  const color = document.getElementById("color").value;
  if (color) code += `$color[${color}]\n`;

  const footerS = sanitizeInput(footerVal);
  const footerIconS = sanitizeInput(footerIcon);
  if (footerS) code += `$footer[${footerS}]\n`;
  if (footerIconS) code += `$footerIcon[${footerIconS}]\n`;

  if (document.getElementById("timestamp").checked) code += "$addTimestamp\n";

  document.querySelectorAll(".field-row").forEach((row) => {
    const name = sanitizeInput(row.querySelector(".field-name")?.value);
    const value = sanitizeInput(row.querySelector(".field-value")?.value);
    const inline = row.querySelector(".field-inline")?.checked ? "yes" : "no";
    if (name && value) code += `$addField[${name};${value};${inline}]\n`;
  });

  document.querySelectorAll(".button-row").forEach((row) => {
    const label = sanitizeInput(row.querySelector(".button-label")?.value);
    const customId = sanitizeInput(row.querySelector(".button-id")?.value);
    const style = row.querySelector(".button-style")?.value || "primary";
    const disabled = row.querySelector(".button-disabled")?.checked
      ? "yes"
      : "no";
    const newRow = row.querySelector(".button-newrow")?.checked ? "yes" : "no";
    const emoji = sanitizeInput(row.querySelector(".button-emoji")?.value);
    const url = sanitizeInput(row.querySelector(".button-url")?.value);
    if (label || emoji) {
      if (style === "link" && url) {
        // Format: $addButton[New row?;Interaction ID/URL;Label;Style;(Disable?;Emoji;Message ID)]
        code += `$addButton[${newRow};${url};${label || "Link"};link;${disabled};${emoji}]\n`;
      } else if (customId) {
        // Format: $addButton[New row?;Interaction ID/URL;Label;Style;(Disable?;Emoji;Message ID)]
        code += `$addButton[${newRow};${customId};${label};${style};${disabled};${emoji}]\n`;
      }
    }
  });

  document.querySelectorAll(".select-row").forEach((row) => {
    const placeholder = sanitizeInput(
      row.querySelector(".select-placeholder")?.value,
    );
    const customId = sanitizeInput(row.querySelector(".select-id")?.value);
    const minValues = row.querySelector(".select-min")?.value || "1";
    const maxValues = row.querySelector(".select-max")?.value || "1";
    if (customId) {
      code += `$addSelectMenu[${customId};${placeholder || "Select an option"};${minValues};${maxValues}]\n`;
      row.querySelectorAll(".select-option").forEach((opt) => {
        const label = sanitizeInput(opt.querySelector(".option-label")?.value);
        const value = sanitizeInput(opt.querySelector(".option-value")?.value);
        const desc = sanitizeInput(opt.querySelector(".option-desc")?.value);
        const emoji = sanitizeInput(opt.querySelector(".option-emoji")?.value);
        if (label && value)
          code += `$addSelectMenuOption[${customId};${label};${value};${desc};${emoji}]\n`;
      });
    }
  });

  document.querySelectorAll(".modal-row").forEach((row) => {
    const title = sanitizeInput(row.querySelector(".modal-title")?.value);
    const customId = sanitizeInput(row.querySelector(".modal-id")?.value);
    if (title && customId) {
      code += `$newModal[${customId};${title}]\n`;
      row.querySelectorAll(".modal-input").forEach((input) => {
        const label = sanitizeInput(input.querySelector(".input-label")?.value);
        const id = sanitizeInput(input.querySelector(".input-id")?.value);
        const style = input.querySelector(".input-style")?.value || "short";
        const required = input.querySelector(".input-required")?.checked
          ? "yes"
          : "no";
        const placeholder = sanitizeInput(
          input.querySelector(".input-placeholder")?.value,
        );
        if (label && id)
          code += `$addTextInput[${id};${style};${label};${required};${placeholder}]\n`;
      });
    }
  });

  const output = document.getElementById("output");
  const charCount = document.getElementById("charCount");
  output.textContent = code.trim();
  charCount.textContent = output.textContent.length + " characters";
  saveNormalState();
}

function generateSendEmbed() {
  const s_error = document.getElementById("s_error");
  const s_output = document.getElementById("s_output");
  const s_charCount = document.getElementById("s_charCount");
  s_error.textContent = "";
  clearInlineErrors();
  let hasErrors = false;

  const channelId = document.getElementById("s_channelId").value.trim();
  const content = document.getElementById("s_content").value.trim();
  const authorName = document.getElementById("s_authorName").value.trim();
  const authorIcon = document.getElementById("s_authorIcon").value.trim();
  const titleVal = document.getElementById("s_title").value.trim();
  const titleUrl = document.getElementById("s_titleUrl").value.trim();
  const desc = document.getElementById("s_description").value.trim();
  const thumbnail = document.getElementById("s_thumbnail").value.trim();
  const image = document.getElementById("s_image").value.trim();
  const colorVal = document.getElementById("s_color").value.trim();
  const footerVal = document.getElementById("s_footer").value.trim();
  const footerIcon = document.getElementById("s_footerIcon").value.trim();
  const timestamp = document.getElementById("s_timestamp").checked
    ? "yes"
    : "no";
  const returnId = document.getElementById("s_returnMsgId").checked
    ? "yes"
    : "no";

  // Validation
  if (!channelId) {
    formRowError(
      document.getElementById("s_channelId"),
      "Channel ID is required",
    );
    hasErrors = true;
  }
  if (authorIcon && !authorName) {
    formRowError(
      document.getElementById("s_authorName"),
      "Author Name required when Author Icon is set",
    );
    hasErrors = true;
  }
  if (authorIcon && !isValidUrl(authorIcon)) {
    formRowError(
      document.getElementById("s_authorIcon"),
      "Author Icon: invalid URL",
    );
    hasErrors = true;
  }
  if (titleUrl && !titleVal) {
    formRowError(
      document.getElementById("s_title"),
      "Title required when Title URL is set",
    );
    hasErrors = true;
  }
  if (titleUrl && !isValidUrl(titleUrl)) {
    formRowError(
      document.getElementById("s_titleUrl"),
      "Title URL: invalid URL",
    );
    hasErrors = true;
  }
  if (thumbnail && !isValidUrl(thumbnail)) {
    formRowError(
      document.getElementById("s_thumbnail"),
      "Thumbnail: invalid URL",
    );
    hasErrors = true;
  }
  if (image && !isValidUrl(image)) {
    formRowError(document.getElementById("s_image"), "Image: invalid URL");
    hasErrors = true;
  }
  if (colorVal && !isValidHex(colorVal)) {
    formRowError(
      document.getElementById("s_color"),
      "Color: must be a valid hex code (e.g. #5865F2)",
    );
    hasErrors = true;
  }
  if (footerIcon && !footerVal) {
    formRowError(
      document.getElementById("s_footer"),
      "Footer Text required when Footer Icon is set",
    );
    hasErrors = true;
  }
  if (footerIcon && !isValidUrl(footerIcon)) {
    formRowError(
      document.getElementById("s_footerIcon"),
      "Footer Icon: invalid URL",
    );
    hasErrors = true;
  }

  if (hasErrors) {
    const first = document.querySelector(".inline-error");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // Build $sendEmbedMessage[channelID;content;title;titleURL;description;color;author;authorIcon;footer;footerIcon;thumbnail;image;timestamp;returnMessageID]
  const parts = [
    channelId,
    sanitizeInput(content),
    sanitizeInput(titleVal),
    sanitizeInput(titleUrl),
    sanitizeInput(desc),
    colorVal,
    sanitizeInput(authorName),
    sanitizeInput(authorIcon),
    sanitizeInput(footerVal),
    sanitizeInput(footerIcon),
    sanitizeInput(thumbnail),
    sanitizeInput(image),
    timestamp,
    returnId,
  ];

  const code = `$sendEmbedMessage[${parts.join(";")}]`;
  s_output.textContent = code;
  s_charCount.textContent = code.length + " characters";
  saveSendState();
}

function copyOutput(outputId, btnEl) {
  const output = document.getElementById(outputId);
  if (
    !output ||
    !output.textContent ||
    output.textContent.includes("Generated code appears here")
  ) {
    showToast("Nothing to copy", true);
    return;
  }
  navigator.clipboard
    .writeText(output.textContent)
    .then(() => {
      const original = btnEl.textContent;
      btnEl.textContent = "Copied!";
      btnEl.style.background = "hsl(120deg 100% 30%)";
      setTimeout(() => {
        btnEl.textContent = original;
        btnEl.style.background = "";
      }, 2000);
    })
    .catch(() => showToast("Copy failed", true));
}

document.addEventListener("DOMContentLoaded", () => {
  // Apply saved mode on load
  const normalBuilder = document.getElementById("normalBuilder");
  const sendBuilder = document.getElementById("sendBuilder");
  const compV2Builder = document.getElementById("compV2Builder");
  const btnNormal = document.getElementById("modeNormal");
  const btnSend = document.getElementById("modeSend");
  const btnCV2 = document.getElementById("modeCompV2");

  // Hide all, show active
  normalBuilder.style.display = "none";
  sendBuilder.style.display = "none";
  compV2Builder.style.display = "none";
  btnNormal.classList.remove("active");
  btnSend.classList.remove("active");
  btnCV2.classList.remove("active");

  loadCV2State();

  if (currentMode === "send") {
    sendBuilder.style.display = "";
    btnSend.classList.add("active");
    loadSendState();
  } else if (currentMode === "compv2") {
    compV2Builder.style.display = "";
    btnCV2.classList.add("active");
    // loadCV2State() already called above
  } else {
    normalBuilder.style.display = "";
    btnNormal.classList.add("active");
    loadNormalState();
  }

  // Toggle buttons
  btnNormal.addEventListener("click", () => switchMode("normal"));
  btnSend.addEventListener("click", () => switchMode("send"));
  btnCV2.addEventListener("click", () => switchMode("compv2"));

  // ── Normal mode wiring ──────────────────────────────────────────────────────
  document
    .getElementById("generateBtn")
    .addEventListener("click", generateNormalEmbed);
  document.getElementById("copyBtn").addEventListener("click", function () {
    copyOutput("output", this);
  });
  document.getElementById("clearBtn").addEventListener("click", () => {
    clearInlineErrors();
    document.getElementById("error").textContent = "";
    document
      .querySelectorAll(
        "#normalBuilder .form-input, #normalBuilder .form-textarea",
      )
      .forEach((input) => {
        input.value = input.id === "color" ? "" : "";
      });
    document
      .querySelectorAll("#normalBuilder .form-checkbox")
      .forEach((cb) => (cb.checked = false));
    document.getElementById("dynamicFields").innerHTML = "";
    fieldCount = 0;
    buttonCount = 0;
    selectCount = 0;
    modalCount = 0;
    document.getElementById("output").textContent =
      "Generated code appears here...";
    document.getElementById("charCount").textContent = "0 characters";
    localStorage.removeItem(NORMAL_KEY);
    // Clear preview
    updateNormalPreview();
  });
  document.getElementById("addField").addEventListener("click", addFieldRow);
  document.getElementById("addButton").addEventListener("click", addButtonRow);
  document.getElementById("addSelect").addEventListener("click", addSelectRow);
  document.getElementById("addModal").addEventListener("click", addModalRow);
  document
    .getElementById("normalBuilder")
    .addEventListener("input", saveNormalState);
  document
    .getElementById("normalBuilder")
    .addEventListener("change", saveNormalState);

  document
    .getElementById("s_generateBtn")
    .addEventListener("click", generateSendEmbed);
  document.getElementById("s_copyBtn").addEventListener("click", function () {
    copyOutput("s_output", this);
  });
  document.getElementById("s_clearBtn").addEventListener("click", () => {
    clearInlineErrors();
    document.getElementById("s_error").textContent = "";
    SEND_FIELDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = id === "s_color" ? "" : "";
    });
    SEND_CHECKS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    document.getElementById("s_output").textContent =
      "Generated code appears here...";
    document.getElementById("s_charCount").textContent = "0 characters";
    localStorage.removeItem(SEND_KEY);
    // Clear preview
    updateSendPreview();
  });
  document
    .getElementById("sendBuilder")
    .addEventListener("input", saveSendState);
  document
    .getElementById("sendBuilder")
    .addEventListener("change", saveSendState);

  document
    .getElementById("cv2AddContainer")
    .addEventListener("click", () => cv2AddCard("container"));
  document
    .getElementById("cv2AddTextDisplay")
    .addEventListener("click", () => cv2AddCard("textdisplay"));
  document
    .getElementById("cv2AddSeparator")
    .addEventListener("click", () => cv2AddCard("separator"));
  document
    .getElementById("cv2AddSection")
    .addEventListener("click", () => cv2AddCard("section"));
  document
    .getElementById("cv2AddThumbnail")
    .addEventListener("click", () => cv2AddCard("thumbnail"));
  document
    .getElementById("cv2AddMediaGallery")
    .addEventListener("click", () => cv2AddCard("mediagallery"));
  document
    .getElementById("cv2AddMediaItem")
    .addEventListener("click", () => cv2AddCard("mediaitem"));
  document
    .getElementById("cv2AddActionRow")
    .addEventListener("click", () => cv2AddCard("actionrow"));
  document
    .getElementById("cv2AddButtonCV2")
    .addEventListener("click", () => cv2AddCard("buttoncv2"));
  document
    .getElementById("cv2AddStringSelect")
    .addEventListener("click", () => cv2AddCard("stringselect"));
  document
    .getElementById("cv2AddUserSelect")
    .addEventListener("click", () => cv2AddCard("userselect"));
  document
    .getElementById("cv2AddRoleSelect")
    .addEventListener("click", () => cv2AddCard("roleselect"));
  document
    .getElementById("cv2AddMentionable")
    .addEventListener("click", () => cv2AddCard("mentionable"));
  document
    .getElementById("cv2GenerateBtn")
    .addEventListener("click", generateCV2);
  document.getElementById("cv2CopyBtn").addEventListener("click", function () {
    copyOutput("cv2Output", this);
  });
  document.getElementById("cv2ClearBtn").addEventListener("click", () => {
    document.getElementById("cv2Components").innerHTML = "";
    // Reset per-type counters
    Object.keys(cv2Counters).forEach((k) => {
      cv2Counters[k] = 0;
    });
    document.getElementById("cv2Output").textContent =
      "Generated code appears here...";
    document.getElementById("cv2CharCount").textContent = "0 characters";
    document.getElementById("cv2Error").textContent = "";
    localStorage.removeItem(CV2_KEY);
    // Clear preview
    updateCV2Preview();
  });
});

// Track per-type counters for numbering (persists across mode switches)
const cv2Counters = {};

function saveCV2State() {
  const cards = [];
  document.querySelectorAll("#cv2Components [data-type]").forEach((card) => {
    const type = card.dataset.type;
    const fields = {};
    card.querySelectorAll("[data-cv2field]").forEach((el) => {
      fields[el.dataset.cv2field] =
        el.type === "checkbox" ? el.checked : el.value;
    });

    // Save stringselect options
    let options = null;
    if (type === "stringselect") {
      options = [];
      card.querySelectorAll(".stringselect-option").forEach((opt) => {
        const optData = {};
        opt.querySelectorAll("[data-optfield]").forEach((el) => {
          optData[el.dataset.optfield] =
            el.type === "checkbox" ? el.checked : el.value;
        });
        options.push(optData);
      });
    }

    cards.push({ type, fields, options });
  });
  localStorage.setItem(CV2_KEY, JSON.stringify({ components: cards }));
}

// Only called once on initial page load — never on mode switch
function loadCV2State() {
  const raw = localStorage.getItem(CV2_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    if (!state.components) return;
    // Restore each card and populate its fields BEFORE refreshing dropdowns
    state.components.forEach((comp) => {
      const card = cv2AddCard(comp.type, false); // doRefresh=false, no dropdown refresh yet
      if (!card) return;
      Object.entries(comp.fields).forEach(([key, val]) => {
        const el = card.querySelector(`[data-cv2field="${key}"]`);
        if (!el) return;
        if (el.type === "checkbox") el.checked = val;
        else el.value = val;
      });

      // Restore stringselect options
      if (comp.type === "stringselect" && comp.options) {
        const optionsContainer = card.querySelector(".stringselect-options");
        const addBtn = card.querySelector(".btn-add-option");
        if (optionsContainer && addBtn) {
          comp.options.forEach((optData) => {
            addBtn.click(); // Trigger add option
            const lastOption = optionsContainer.lastElementChild;
            if (lastOption) {
              Object.entries(optData).forEach(([key, val]) => {
                const el = lastOption.querySelector(`[data-optfield="${key}"]`);
                if (el) {
                  if (el.type === "checkbox") el.checked = val;
                  else el.value = val;
                }
              });
            }
          });
        }
      }
    });
    // Now that all name/id fields are populated, refresh dropdowns once
    cv2RefreshAllDropdowns();
  } catch (e) {}
}

// Collect names of a given component type from existing cards
function cv2GetNames(type) {
  const names = [];
  document
    .querySelectorAll(`#cv2Components [data-type="${type}"]`)
    .forEach((card) => {
      const nameEl =
        card.querySelector("[data-cv2field='name']") ||
        card.querySelector("[data-cv2field='id']");
      const val = nameEl ? nameEl.value.trim() : "";
      if (val) names.push(val);
    });
  return names;
}

// Build <optgroup> HTML
function cv2Optgroup(label, names, required) {
  if (names.length === 0) return "";
  const opts = names
    .map((n) => `<option value="${n.replace(/"/g, "&quot;")}">${n}</option>`)
    .join("");
  return `<optgroup label="${label}">${opts}</optgroup>`;
}

// Populate a <select> element with current names, preserving current value
function cv2PopulateSelect(sel, groups, required) {
  if (!sel) return;
  const prev = sel.value;

  // Determine what this select is for based on the field name
  const fieldName = sel.dataset.cv2field || "";
  let placeholder = "";

  if (fieldName === "actionRowId") {
    placeholder = required ? "Select the action row" : "Select the action row";
  } else if (fieldName === "container") {
    placeholder = required ? "Select the container" : "Select the container";
  } else if (fieldName === "sectionName") {
    placeholder = required ? "Select the section" : "Select the section";
  } else if (fieldName === "galleryId") {
    placeholder = required ? "Select the gallery" : "Select the gallery";
  } else if (fieldName === "actionRowOrSection") {
    placeholder = required
      ? "Select action row or section"
      : "Select action row or section";
  } else if (fieldName === "containerOrSection") {
    placeholder = required
      ? "Select container or section"
      : "Select container or section";
  } else {
    // Fallback to generic placeholders
    placeholder = required ? "Select an option" : "None";
  }

  sel.innerHTML = `<option value="">${placeholder}</option>`;
  groups.forEach(([label, names]) => {
    sel.innerHTML += cv2Optgroup(label, names, required);
  });
  // restore previous selection if still valid
  if (prev) {
    const opt = sel.querySelector(`option[value="${CSS.escape(prev)}"]`);
    if (opt) sel.value = prev;
  }
}

// Refresh ALL dropdowns in all CV2 cards
function cv2RefreshAllDropdowns() {
  const containers = cv2GetNames("container");
  const sections = cv2GetNames("section");
  const galleries = cv2GetNames("mediagallery");
  const actionRows = cv2GetNames("actionrow");

  document.querySelectorAll("#cv2Components [data-type]").forEach((card) => {
    const type = card.dataset.type;

    // Container/Section dropdown (Text Display)
    if (type === "textdisplay") {
      cv2PopulateSelect(
        card.querySelector("[data-cv2field='containerOrSection']"),
        [
          ["Containers", containers],
          ["Sections", sections],
        ],
        false,
      );
    }
    // Container dropdown (Separator, Media Gallery, Action Row, Section)
    if (["separator", "mediagallery", "actionrow", "section"].includes(type)) {
      cv2PopulateSelect(
        card.querySelector("[data-cv2field='container']"),
        [["Containers", containers]],
        false,
      );
    }
    // Section dropdown (Thumbnail)
    if (type === "thumbnail") {
      cv2PopulateSelect(
        card.querySelector("[data-cv2field='sectionName']"),
        [["Sections", sections]],
        true,
      );
    }
    // Gallery dropdown (Media Item)
    if (type === "mediaitem") {
      cv2PopulateSelect(
        card.querySelector("[data-cv2field='galleryId']"),
        [["Galleries", galleries]],
        true,
      );
    }
    // Action Row / Section dropdown (Button CV2)
    if (type === "buttoncv2") {
      cv2PopulateSelect(
        card.querySelector("[data-cv2field='actionRowOrSection']"),
        [
          ["Action Rows", actionRows],
          ["Sections", sections],
        ],
        true,
      );
    }
    // Action Row dropdown (Selects)
    if (
      ["stringselect", "userselect", "roleselect", "mentionable"].includes(type)
    ) {
      cv2PopulateSelect(
        card.querySelector("[data-cv2field='actionRowId']"),
        [["Action Rows", actionRows]],
        true,
      );
    }
  });
}

const CV2_BADGE_LABELS = {
  container: ["Container", "cv2-badge-container"],
  textdisplay: ["Text Display", "cv2-badge-textdisplay"],
  separator: ["Separator", "cv2-badge-separator"],
  section: ["Section", "cv2-badge-section"],
  thumbnail: ["Thumbnail", "cv2-badge-thumbnail"],
  mediagallery: ["Media Gallery", "cv2-badge-mediagallery"],
  mediaitem: ["Media Item", "cv2-badge-mediaitem"],
  actionrow: ["Action Row", "cv2-badge-actionrow"],
  buttoncv2: ["Button CV2", "cv2-badge-buttoncv2"],
  stringselect: ["String Select", "cv2-badge-stringselect"],
  userselect: ["User Select", "cv2-badge-userselect"],
  roleselect: ["Role Select", "cv2-badge-roleselect"],
  mentionable: ["Mentionable Select", "cv2-badge-mentionable"],
};

// Returns the card element (or null)
function cv2AddCard(type, doRefresh = true) {
  const info = CV2_BADGE_LABELS[type];
  if (!info) return null;

  // Increment per-type counter for numbering
  if (!cv2Counters[type]) cv2Counters[type] = 0;
  cv2Counters[type]++;
  const num = cv2Counters[type];
  const label = `${info[0]} #${num}`;

  // Outer wrapper — same class pattern as .field-row / .button-row in Normal mode
  const card = document.createElement("div");
  card.className = "field-row"; // reuse existing card CSS
  card.dataset.type = type;

  // Body created first so makeHeader's collapse btn can reference it
  const body = document.createElement("div");
  body.className = "component-body";
  body.innerHTML = cv2CardBody(type);

  // Header — collapse + ✕ remove, using the shared makeHeader pattern
  card.appendChild(
    makeHeader(label, body, () => {
      card.remove();
      cv2RefreshAllDropdowns();
      saveCV2State();
    }),
  );
  card.appendChild(body);

  document.getElementById("cv2Components").appendChild(card);

  // Wire name/id inputs to refresh dropdowns on change
  card
    .querySelectorAll("[data-cv2field='name'],[data-cv2field='id']")
    .forEach((el) => {
      el.addEventListener("input", () => {
        cv2RefreshAllDropdowns();
        saveCV2State();
      });
    });
  card.addEventListener("input", saveCV2State);
  card.addEventListener("change", saveCV2State);

  // String Select: Add Option button
  if (type === "stringselect") {
    const addOptionBtn = card.querySelector(".btn-add-option");
    const optionsContainer = card.querySelector(".stringselect-options");
    if (addOptionBtn && optionsContainer) {
      // Store counter on the card element
      card.dataset.optionCounter = "0";

      addOptionBtn.addEventListener("click", () => {
        const optionCounter = parseInt(card.dataset.optionCounter || "0") + 1;
        card.dataset.optionCounter = optionCounter.toString();

        const optionDiv = document.createElement("div");
        optionDiv.className = "stringselect-option field-row";
        optionDiv.style.cssText = "margin-top:0.5rem;";

        // Create option body
        const optionBody = document.createElement("div");
        optionBody.className = "component-body";
        optionBody.innerHTML = `
          <div class="form-row">
            <input class="form-input" data-optfield="label" placeholder="Label (required)" maxlength="100">
            <input class="form-input" data-optfield="value" placeholder="Value (required)" maxlength="100">
          </div>
          <div class="form-row" style="margin-top:0.5rem;">
            <input class="form-input" data-optfield="description" placeholder="Description (optional)" maxlength="100">
            <input class="form-input" data-optfield="emoji" placeholder="Emoji (optional)">
          </div>
          <div style="margin-top:0.5rem;">
            <label class="checkbox-label" style="margin:0;">
              <input type="checkbox" class="form-checkbox" data-optfield="default">
              <span>Default</span>
            </label>
          </div>
        `;

        // Add header with collapse and remove buttons
        optionDiv.appendChild(
          makeHeader(
            `String Select Option #${optionCounter}`,
            optionBody,
            () => {
              optionDiv.remove();
              saveCV2State();
            },
          ),
        );
        optionDiv.appendChild(optionBody);

        optionsContainer.appendChild(optionDiv);

        // Save on input
        optionDiv.addEventListener("input", saveCV2State);
        optionDiv.addEventListener("change", saveCV2State);

        saveCV2State();
      });
    }
  }

  if (doRefresh) cv2RefreshAllDropdowns();
  return card;
}

function cv2CardBody(type) {
  // Helpers that produce the same markup as Normal mode
  const fi = (field, placeholder, extra = "") =>
    `<input class="form-input" data-cv2field="${field}" placeholder="${placeholder}" ${extra}>`;
  const ta = (field, placeholder) =>
    `<textarea class="form-input form-textarea" data-cv2field="${field}" placeholder="${placeholder}"></textarea>`;
  const cb = (field, lbl) =>
    `<label class="checkbox-label" style="margin:0;">
       <input type="checkbox" class="form-checkbox" data-cv2field="${field}">
       <span>${lbl}</span>
     </label>`;
  const sel = (field, options) =>
    `<select class="form-input" data-cv2field="${field}">${options}</select>`;
  const dynSel = (field, placeholder) =>
    `<select class="form-input" data-cv2field="${field}">
       <option value="">${placeholder}</option>
     </select>`;
  const dynSelReq = (field, placeholder = "Select an option") =>
    `<select class="form-input" data-cv2field="${field}">
       <option value="">${placeholder}</option>
     </select>`;

  // Row helpers — use .form-row so the existing auto-fit grid CSS applies
  const row = (...cells) => `<div class="form-row">${cells.join("")}</div>`;
  const rowMt = (...cells) =>
    `<div class="form-row" style="margin-top:0.75rem;">${cells.join("")}</div>`;
  // Inline flex bar for checkboxes (left) — mirrors the bottom bar in Normal mode
  const cbBar = (...items) =>
    `<div style="display:flex;gap:1.5rem;align-items:center;margin-top:0.75rem;">${items.join("")}</div>`;

  switch (type) {
    case "container":
      return (
        row(
          fi("name", "Container Name (required)"),
          fi("color", "Color (hex, optional)"),
        ) + cbBar(cb("spoiler", "Spoiler"))
      );

    case "textdisplay":
      return (
        `${ta("content", "Content (required)")}` +
        rowMt(dynSel("containerOrSection", "Select container or section"))
      );

    case "separator":
      return (
        row(
          sel(
            "spacing",
            `<option value="">Spacing: Default</option><option value="small">Spacing: Small</option><option value="large">Spacing: Large</option>`,
          ),
          dynSel("container", "Select the container"),
        ) + cbBar(cb("divider", "Show Divider Line"))
      );

    case "section":
      return row(
        fi("name", "Section Name (required)"),
        dynSel("container", "Select the container"),
      );

    case "thumbnail":
      return (
        row(
          fi("url", "URL (required)"),
          fi("description", "Description (optional)"),
        ) +
        rowMt(dynSelReq("sectionName", "Select the section")) +
        cbBar(cb("spoiler", "Spoiler"))
      );

    case "mediagallery":
      return row(
        fi("id", "Gallery ID (required)"),
        dynSel("container", "Select the container"),
      );

    case "mediaitem":
      return (
        row(
          fi("url", "URL (required)"),
          fi("description", "Description (optional)"),
        ) +
        rowMt(dynSelReq("galleryId", "Select the gallery")) +
        cbBar(cb("spoiler", "Spoiler"))
      );

    case "actionrow":
      return row(
        fi("id", "Action Row ID (required)"),
        dynSel("container", "Select the container"),
      );

    case "buttoncv2":
      return (
        row(
          fi("id", "ID or URL (required)"),
          fi("label", "Label (optional)"),
          sel(
            "style",
            `<option value="">Style: Default</option><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="success">Success</option><option value="danger">Danger</option><option value="link">Link</option>`,
          ),
        ) +
        rowMt(
          fi("emoji", "Emoji (optional)"),
          dynSelReq("actionRowOrSection", "Select action row or section"),
        ) +
        cbBar(cb("disabled", "Disabled"))
      );

    case "stringselect":
      return (
        row(
          fi("id", "Select Menu ID (required)"),
          fi("placeholder", "Placeholder (optional)"),
        ) +
        rowMt(
          fi("min", "Min Values (0-25)", "type='number' min='0' max='25'"),
          fi("max", "Max Values (1-25)", "type='number' min='1' max='25'"),
          dynSelReq("actionRowId", "Select the action row"),
        ) +
        cbBar(cb("disabled", "Disabled")) +
        `<div style="margin-top:0.75rem;">
          <button type="button" class="btn-add-option" style="padding:0.4rem 0.8rem;background:#5865f2;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.9rem;">+ Add Option</button>
          <div class="stringselect-options" style="margin-top:0.5rem;"></div>
        </div>`
      );

    case "userselect":
    case "roleselect":
    case "mentionable":
      return (
        row(
          fi("id", "ID (required)"),
          fi("placeholder", "Placeholder (optional)"),
        ) +
        rowMt(
          fi("min", "Min (optional)", "type='number' min='0'"),
          fi("max", "Max (optional)", "type='number' min='0'"),
          dynSelReq("actionRowId", "Select the action row"),
        ) +
        cbBar(cb("disabled", "Disabled"))
      );

    default:
      return "";
  }
}
function cv2f(field, card) {
  const el = card.querySelector(`[data-cv2field="${field}"]`);
  if (!el) return "";
  if (el.type === "checkbox") return el.checked ? "true" : "false";
  return el.value.trim();
}

// Trim trailing empty params from an array
function cv2Trim(parts) {
  let last = parts.length - 1;
  while (last > 0 && parts[last] === "") last--;
  return parts.slice(0, last + 1);
}

function generateCV2() {
  clearInlineErrors();
  document.getElementById("cv2Error").textContent = "";
  let hasErrors = false;

  // Helper: show inline error after the first .form-row inside a card
  function cv2FieldError(card, msg) {
    const formRow = card.querySelector(".form-row");
    if (formRow) bodyRowError(formRow, msg);
    else {
      const body = card.querySelector(".component-body");
      if (body) {
        const span = document.createElement("div");
        span.className = "inline-error";
        span.textContent = msg;
        body.prepend(span);
      }
    }
    hasErrors = true;
  }

  // Helper: show inline error after the .form-row containing a specific field
  function cv2InputError(card, field, msg) {
    const el = card.querySelector(`[data-cv2field="${field}"]`);
    if (el) {
      const formRow = el.closest(".form-row");
      if (formRow) {
        bodyRowError(formRow, msg);
        hasErrors = true;
        return;
      }
    }
    cv2FieldError(card, msg);
  }

  const cards = Array.from(
    document.querySelectorAll("#cv2Components [data-type]"),
  );
  if (cards.length === 0) {
    document.getElementById("cv2Error").textContent =
      "Add at least one component first.";
    return;
  }

  // Collect names for uniqueness / cross-reference checks
  const containerNames = new Set();
  const sectionNames = new Set();
  const allNames = new Set();

  // First pass: uniqueness
  cards.forEach((card) => {
    const type = card.dataset.type;
    if (type === "container") {
      const name = cv2f("name", card);
      if (!name) {
        cv2InputError(card, "name", "Container Name is required");
        return;
      }
      if (containerNames.has(name))
        cv2InputError(card, "name", `Duplicate container name "${name}"`);
      if (allNames.has(name))
        cv2InputError(card, "name", `Name "${name}" clashes with a Section`);
      containerNames.add(name);
      allNames.add(name);
    }
    if (type === "section") {
      const name = cv2f("name", card);
      if (!name) {
        cv2InputError(card, "name", "Section Name is required");
        return;
      }
      if (sectionNames.has(name))
        cv2InputError(card, "name", `Duplicate section name "${name}"`);
      if (allNames.has(name))
        cv2InputError(card, "name", `Name "${name}" clashes with a Container`);
      sectionNames.add(name);
      allNames.add(name);
    }
  });

  // Second pass: per-component validation
  cards.forEach((card) => {
    const type = card.dataset.type;

    if (type === "container") {
      const color = cv2f("color", card);
      if (color && !isValidHex(color))
        cv2InputError(
          card,
          "color",
          "Color must be a valid hex (e.g. #5865F2)",
        );
    }

    if (type === "textdisplay") {
      if (!cv2f("content", card))
        cv2InputError(card, "content", "Content is required");
    }

    if (type === "section") {
      const name = cv2f("name", card);
      if (name) {
        const hasText = cards.some(
          (c) =>
            c.dataset.type === "textdisplay" &&
            cv2f("containerOrSection", c) === name,
        );
        if (!hasText)
          cv2FieldError(
            card,
            `Section "${name}": must have at least one Text Display attached`,
          );
        const hasAccessory = cards.some(
          (c) =>
            (c.dataset.type === "thumbnail" &&
              cv2f("sectionName", c) === name) ||
            (c.dataset.type === "buttoncv2" &&
              cv2f("actionRowOrSection", c) === name),
        );
        if (!hasAccessory)
          cv2FieldError(
            card,
            `Section "${name}": must have at least one Thumbnail or Button CV2 accessory`,
          );
        const textCount = cards.filter(
          (c) =>
            c.dataset.type === "textdisplay" &&
            cv2f("containerOrSection", c) === name,
        ).length;
        const thumbCount = cards.filter(
          (c) =>
            c.dataset.type === "thumbnail" && cv2f("sectionName", c) === name,
        ).length;
        if (textCount + thumbCount > 3)
          cv2FieldError(
            card,
            `Section "${name}": max 3 components (Text Displays + Thumbnails)`,
          );
      }
    }

    if (type === "thumbnail") {
      const url = cv2f("url", card);
      if (!url) cv2InputError(card, "url", "URL is required");
      else if (!isValidUrl(url))
        cv2InputError(card, "url", "URL must start with http:// or https://");
      if (!cv2f("sectionName", card))
        cv2InputError(card, "sectionName", "Section Name is required");
    }

    if (type === "mediagallery") {
      if (!cv2f("id", card))
        cv2InputError(card, "id", "Gallery ID is required");
    }

    if (type === "mediaitem") {
      const url = cv2f("url", card);
      if (!url) cv2InputError(card, "url", "URL is required");
      else if (!isValidUrl(url))
        cv2InputError(card, "url", "URL must start with http:// or https://");
      const gid = cv2f("galleryId", card);
      if (!gid) cv2InputError(card, "galleryId", "Gallery ID is required");
      else {
        const galleryExists = cards.some(
          (c) => c.dataset.type === "mediagallery" && cv2f("id", c) === gid,
        );
        if (!galleryExists)
          cv2InputError(
            card,
            "galleryId",
            `Gallery ID "${gid}" does not match any Media Gallery`,
          );
      }
    }

    if (type === "actionrow") {
      const rowId = cv2f("id", card);
      if (!rowId) {
        cv2InputError(card, "id", "Action Row ID is required");
        return;
      }
      const children = cards.filter(
        (c) =>
          [
            "buttoncv2",
            "stringselect",
            "userselect",
            "roleselect",
            "mentionable",
          ].includes(c.dataset.type) &&
          (cv2f("actionRowOrSection", c) === rowId ||
            cv2f("actionRowId", c) === rowId),
      );
      if (children.length === 0)
        cv2FieldError(
          card,
          `Action Row "${rowId}": must contain at least one Button or Select`,
        );
      const buttons = children.filter((c) => c.dataset.type === "buttoncv2");
      const selects = children.filter((c) =>
        ["stringselect", "userselect", "roleselect", "mentionable"].includes(
          c.dataset.type,
        ),
      );
      if (buttons.length > 0 && selects.length > 0)
        cv2FieldError(
          card,
          `Action Row "${rowId}": cannot mix Buttons and Selects`,
        );
      if (selects.length > 1)
        cv2FieldError(card, `Action Row "${rowId}": max 1 Select per row`);
      if (buttons.length > 5)
        cv2FieldError(card, `Action Row "${rowId}": max 5 Buttons per row`);
    }

    if (type === "buttoncv2") {
      if (!cv2f("id", card)) cv2InputError(card, "id", "ID/URL is required");
      if (!cv2f("label", card) && !cv2f("emoji", card))
        cv2InputError(card, "label", "Must have a Label or Emoji");
      if (!cv2f("actionRowOrSection", card))
        cv2InputError(
          card,
          "actionRowOrSection",
          "Action Row or Section is required",
        );
    }

    if (type === "stringselect") {
      if (!cv2f("id", card))
        cv2InputError(card, "id", "Select Menu ID is required");
      if (!cv2f("actionRowId", card))
        cv2InputError(card, "actionRowId", "Action Row ID is required");

      // Check for at least one option
      const options = card.querySelectorAll(".stringselect-option");
      if (options.length === 0) {
        cv2FieldError(card, "String Select: Add at least one option");
      } else {
        const optionValues = new Map(); // Track values and their indices

        // Validate each option
        options.forEach((opt, i) => {
          const label = opt
            .querySelector("[data-optfield='label']")
            ?.value.trim();
          const value = opt
            .querySelector("[data-optfield='value']")
            ?.value.trim();
          if (!label || !value) {
            cv2FieldError(
              card,
              `String Select Option ${i + 1}: Label and Value are required`,
            );
          } else if (value) {
            // Check for duplicate values
            if (optionValues.has(value)) {
              cv2FieldError(
                card,
                `String Select Option ${i + 1}: Value "${value}" is already used by Option ${optionValues.get(value) + 1}`,
              );
            } else {
              optionValues.set(value, i);
            }
          }
        });
      }
    }

    if (["userselect", "roleselect", "mentionable"].includes(type)) {
      if (!cv2f("id", card)) cv2InputError(card, "id", "ID is required");
      if (!cv2f("actionRowId", card))
        cv2InputError(card, "actionRowId", "Action Row ID is required");
    }
  });

  // Check for duplicate IDs/Names across all component types
  // Rules:
  // 1. Parent and child can share IDs (e.g., Action Row + its Buttons/Selects)
  // 2. Two of the same type cannot share IDs
  // 3. Two parent types cannot share IDs (e.g., Container + Action Row)
  const allComponentIds = {};

  cards.forEach((card) => {
    const type = card.dataset.type;
    let id = null;
    let componentLabel = "";
    let isParent = false; // Parent components: Container, Section, Action Row, Media Gallery

    // Collect IDs/Names from different component types
    if (type === "container") {
      id = cv2f("name", card);
      componentLabel = "Container";
      isParent = true;
    } else if (type === "section") {
      id = cv2f("name", card);
      componentLabel = "Section";
      isParent = true;
    } else if (type === "actionrow") {
      id = cv2f("id", card);
      componentLabel = "Action Row";
      isParent = true;
    } else if (type === "mediagallery") {
      id = cv2f("id", card);
      componentLabel = "Media Gallery";
      isParent = true;
    } else if (type === "buttoncv2") {
      id = cv2f("id", card);
      componentLabel = "Button CV2";
      isParent = false;
    } else if (type === "stringselect") {
      id = cv2f("id", card);
      componentLabel = "String Select";
      isParent = false;
    } else if (["userselect", "roleselect", "mentionable"].includes(type)) {
      id = cv2f("id", card);
      componentLabel =
        type === "userselect"
          ? "User Select"
          : type === "roleselect"
            ? "Role Select"
            : "Mentionable Select";
      isParent = false;
    } else if (type === "textdisplay") {
      // Text displays don't have IDs, they reference containers/sections
      id = null;
    } else if (type === "thumbnail") {
      // Thumbnails don't have IDs, they reference sections
      id = null;
    } else if (type === "mediaitem") {
      // Media items don't have IDs, they reference galleries
      id = null;
    }

    if (id) {
      if (!allComponentIds[id]) allComponentIds[id] = [];
      allComponentIds[id].push({
        type: componentLabel,
        card,
        isParent,
        componentType: type,
      });
    }
  });

  // Report duplicates based on rules
  Object.keys(allComponentIds).forEach((id) => {
    const components = allComponentIds[id];
    if (components.length > 1) {
      // Check for violations:
      // 1. Two of the same type (always invalid)
      const typeCount = {};
      components.forEach((comp) => {
        typeCount[comp.type] = (typeCount[comp.type] || 0) + 1;
      });

      const hasDuplicateTypes = Object.values(typeCount).some(
        (count) => count > 1,
      );

      // 2. Two parent types (always invalid)
      const parentComponents = components.filter((c) => c.isParent);
      const hasTwoParents = parentComponents.length > 1;

      // Report errors only on the violating components
      if (hasDuplicateTypes) {
        // Show error on components that have duplicate types
        Object.keys(typeCount).forEach((type) => {
          if (typeCount[type] > 1) {
            // This type has duplicates - show error on all of them
            const duplicates = components.filter((c) => c.type === type);
            duplicates.forEach((comp) => {
              const fieldName =
                comp.type === "Container" || comp.type === "Section"
                  ? "name"
                  : "id";
              const otherDuplicates = duplicates.filter((c) => c !== comp);
              cv2InputError(
                comp.card,
                fieldName,
                `${comp.type === "Container" || comp.type === "Section" ? "Name" : "ID"} "${id}" is already used by another ${comp.type}`,
              );
            });
          }
        });
      }

      if (hasTwoParents && !hasDuplicateTypes) {
        // Show error only on parent components (not children)
        parentComponents.forEach((comp) => {
          const fieldName =
            comp.type === "Container" || comp.type === "Section"
              ? "name"
              : "id";
          const otherParents = parentComponents.filter((c) => c !== comp);
          const otherTypes = otherParents.map((c) => c.type).join(", ");

          cv2InputError(
            comp.card,
            fieldName,
            `${comp.type === "Container" || comp.type === "Section" ? "Name" : "ID"} "${id}" is already used by ${otherTypes}`,
          );
        });
      }
    }
  });

  if (hasErrors) {
    const first = document.querySelector("#cv2Components .inline-error");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const lines = [];
  const generated = new Set(); // Track which cards have been generated

  // Helper function to generate code for a card and its dependencies
  function generateCard(card) {
    if (generated.has(card)) return;
    generated.add(card);

    const type = card.dataset.type;

    if (type === "container") {
      const parts = cv2Trim([
        cv2f("name", card),
        cv2f("color", card),
        cv2f("spoiler", card) === "true" ? "true" : "",
      ]);
      lines.push(`$addContainer[${parts.join(";")}]`);

      // Generate all children that use this container
      const containerName = cv2f("name", card);
      cards.forEach((c) => {
        const cType = c.dataset.type;
        if (
          cType === "textdisplay" &&
          cv2f("containerOrSection", c) === containerName
        ) {
          generateCard(c);
        } else if (
          cType === "separator" &&
          cv2f("container", c) === containerName
        ) {
          generateCard(c);
        } else if (
          cType === "section" &&
          cv2f("container", c) === containerName
        ) {
          generateCard(c);
        } else if (
          cType === "mediagallery" &&
          cv2f("container", c) === containerName
        ) {
          generateCard(c);
        } else if (
          cType === "actionrow" &&
          cv2f("container", c) === containerName
        ) {
          generateCard(c);
        }
      });
    } else if (type === "section") {
      const parts = cv2Trim([cv2f("name", card), cv2f("container", card)]);
      lines.push(`$addSection[${parts.join(";")}]`);

      // Generate all children that use this section
      const sectionName = cv2f("name", card);
      cards.forEach((c) => {
        const cType = c.dataset.type;
        if (
          cType === "textdisplay" &&
          cv2f("containerOrSection", c) === sectionName
        ) {
          generateCard(c);
        } else if (
          cType === "thumbnail" &&
          cv2f("sectionName", c) === sectionName
        ) {
          generateCard(c);
        } else if (
          cType === "buttoncv2" &&
          cv2f("actionRowOrSection", c) === sectionName
        ) {
          generateCard(c);
        }
      });
    } else if (type === "mediagallery") {
      const parts = cv2Trim([cv2f("id", card), cv2f("container", card)]);
      lines.push(`$addMediaGallery[${parts.join(";")}]`);

      // Generate all media items that use this gallery
      const galleryId = cv2f("id", card);
      cards.forEach((c) => {
        if (
          c.dataset.type === "mediaitem" &&
          cv2f("galleryId", c) === galleryId
        ) {
          generateCard(c);
        }
      });
    } else if (type === "actionrow") {
      const parts = cv2Trim([cv2f("id", card), cv2f("container", card)]);
      lines.push(`$addActionRow[${parts.join(";")}]`);

      // Generate all buttons and selects that use this action row
      const rowId = cv2f("id", card);
      cards.forEach((c) => {
        const cType = c.dataset.type;
        if (cType === "buttoncv2" && cv2f("actionRowOrSection", c) === rowId) {
          generateCard(c);
        } else if (
          ["stringselect", "userselect", "roleselect", "mentionable"].includes(
            cType,
          ) &&
          cv2f("actionRowId", c) === rowId
        ) {
          generateCard(c);
        }
      });
    } else if (type === "textdisplay") {
      const parts = cv2Trim([
        sanitizeInput(cv2f("content", card)),
        cv2f("containerOrSection", card),
      ]);
      lines.push(`$addTextDisplay[${parts.join(";")}]`);
    } else if (type === "separator") {
      const divider = cv2f("divider", card) === "true" ? "true" : "";
      const spacing = cv2f("spacing", card);
      const container = cv2f("container", card);
      const parts = cv2Trim([divider, spacing, container]);
      lines.push(
        parts.length === 0 || (parts.length === 1 && parts[0] === "")
          ? `$addSeparator[]`
          : `$addSeparator[${parts.join(";")}]`,
      );
    } else if (type === "thumbnail") {
      const parts = cv2Trim([
        cv2f("url", card),
        sanitizeInput(cv2f("description", card)),
        cv2f("spoiler", card) === "true" ? "true" : "",
        cv2f("sectionName", card),
      ]);
      lines.push(`$addThumbnail[${parts.join(";")}]`);
    } else if (type === "mediaitem") {
      const parts = cv2Trim([
        cv2f("url", card),
        sanitizeInput(cv2f("description", card)),
        cv2f("spoiler", card) === "true" ? "true" : "",
        cv2f("galleryId", card),
      ]);
      lines.push(`$addMediaGalleryItem[${parts.join(";")}]`);
    } else if (type === "buttoncv2") {
      const parts = cv2Trim([
        cv2f("id", card),
        sanitizeInput(cv2f("label", card)),
        cv2f("style", card),
        cv2f("disabled", card) === "true" ? "true" : "",
        sanitizeInput(cv2f("emoji", card)),
        cv2f("actionRowOrSection", card),
      ]);
      lines.push(`$addButtonCV2[${parts.join(";")}]`);
    } else if (type === "stringselect") {
      const parts = cv2Trim([
        cv2f("id", card),
        sanitizeInput(cv2f("placeholder", card)),
        cv2f("min", card),
        cv2f("max", card),
        cv2f("disabled", card) === "true" ? "true" : "",
        cv2f("actionRowId", card),
      ]);
      lines.push(`$addStringSelect[${parts.join(";")}]`);

      // Add options
      const options = card.querySelectorAll(".stringselect-option");
      options.forEach((opt) => {
        const label = sanitizeInput(
          opt.querySelector("[data-optfield='label']")?.value.trim(),
        );
        const value = sanitizeInput(
          opt.querySelector("[data-optfield='value']")?.value.trim(),
        );
        const description = sanitizeInput(
          opt.querySelector("[data-optfield='description']")?.value.trim(),
        );
        const emoji = sanitizeInput(
          opt.querySelector("[data-optfield='emoji']")?.value.trim(),
        );
        const isDefault = opt.querySelector("[data-optfield='default']")
          ?.checked
          ? "true"
          : "";
        const selectId = cv2f("id", card);

        const optParts = cv2Trim([
          label,
          value,
          description,
          emoji,
          isDefault,
          selectId,
        ]);
        lines.push(`$addStringSelectOption[${optParts.join(";")}]`);
      });
    } else if (type === "userselect") {
      const parts = cv2Trim([
        cv2f("id", card),
        sanitizeInput(cv2f("placeholder", card)),
        cv2f("min", card),
        cv2f("max", card),
        cv2f("disabled", card) === "true" ? "true" : "",
        cv2f("actionRowId", card),
      ]);
      lines.push(`$addUserSelect[${parts.join(";")}]`);
    } else if (type === "roleselect") {
      const parts = cv2Trim([
        cv2f("id", card),
        sanitizeInput(cv2f("placeholder", card)),
        cv2f("min", card),
        cv2f("max", card),
        cv2f("disabled", card) === "true" ? "true" : "",
        cv2f("actionRowId", card),
      ]);
      lines.push(`$addRoleSelect[${parts.join(";")}]`);
    } else if (type === "mentionable") {
      const parts = cv2Trim([
        cv2f("id", card),
        sanitizeInput(cv2f("placeholder", card)),
        cv2f("min", card),
        cv2f("max", card),
        cv2f("disabled", card) === "true" ? "true" : "",
        cv2f("actionRowId", card),
      ]);
      lines.push(`$addMentionableSelect[${parts.join(";")}]`);
    }
  }

  // Start with containers (top-level components)
  cards.forEach((card) => {
    if (card.dataset.type === "container") {
      generateCard(card);
    }
  });

  // Generate any orphaned components (not attached to containers)
  cards.forEach((card) => {
    generateCard(card);
  });

  const code = lines.join("\n");
  document.getElementById("cv2Output").textContent = code;
  document.getElementById("cv2CharCount").textContent =
    code.length + " characters";
  saveCV2State();
}

// Update timestamps
function updateTimestamps() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const timeStr = `Today at ${displayHours}:${minutes} ${ampm}`;

  const normalTs = document.getElementById("normalTimestamp");
  const sendTs = document.getElementById("sendTimestamp");
  const cv2Ts = document.getElementById("cv2Timestamp");
  if (normalTs) normalTs.textContent = timeStr;
  if (sendTs) sendTs.textContent = timeStr;
  if (cv2Ts) cv2Ts.textContent = timeStr;
}

// Render Discord markdown (basic support)
function renderMarkdown(text) {
  if (!text) return "";

  // Escape HTML first to prevent XSS
  const escape = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Process line by line for block-level elements, then inline
  const lines = text.split("\n");
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block (```)
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(escape(lines[i]));
        i++;
      }
      output.push(
        `<pre style="background:#1e1f22;border-radius:4px;padding:0.5rem 0.75rem;margin:0.25rem 0;overflow-x:auto;"><code style="font-family:monospace;font-size:0.875rem;color:#dbdee1;">${codeLines.join("\n")}</code></pre>`,
      );
      i++; // skip closing ```
      continue;
    }

    // Heading # (H1)
    if (/^# (.+)$/.test(line)) {
      output.push(
        `<h1 style="font-size:1.5rem;font-weight:700;margin:0.25rem 0;color:#fff;">${inlineMarkdown(escape(line.slice(2)))}</h1>`,
      );
      i++;
      continue;
    }

    // Heading ## (H2)
    if (/^## (.+)$/.test(line)) {
      output.push(
        `<h2 style="font-size:1.25rem;font-weight:700;margin:0.25rem 0;color:#fff;">${inlineMarkdown(escape(line.slice(3)))}</h2>`,
      );
      i++;
      continue;
    }

    // Heading ### (H3)
    if (/^### (.+)$/.test(line)) {
      output.push(
        `<h3 style="font-size:1rem;font-weight:700;margin:0.25rem 0;color:#fff;">${inlineMarkdown(escape(line.slice(4)))}</h3>`,
      );
      i++;
      continue;
    }

    // Subtext -# (Discord's small text)
    if (/^-# (.+)$/.test(line)) {
      output.push(
        `<span style="font-size:0.75rem;color:#80848e;">${inlineMarkdown(escape(line.slice(3)))}</span>`,
      );
      i++;
      continue;
    }

    // Blockquote > (supports multi-line consecutive quotes)
    if (/^> /.test(line) || line === ">") {
      const quoteLines = [];
      while (i < lines.length && (/^> /.test(lines[i]) || lines[i] === ">")) {
        quoteLines.push(inlineMarkdown(escape(lines[i].replace(/^> ?/, ""))));
        i++;
      }
      output.push(
        `<div style="display:flex;gap:0;margin:0.1rem 0;"><div style="width:4px;min-width:4px;background:#4e5058;border-radius:4px;margin-right:0.75rem;"></div><div style="color:#dbdee1;">${quoteLines.join("<br>")}</div></div>`,
      );
      continue;
    }

    // Unordered list - item
    if (/^[-*] (.+)$/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^[-*] (.+)$/.test(lines[i])) {
        listItems.push(
          `<li style="margin:0.1rem 0;">${inlineMarkdown(escape(lines[i].replace(/^[-*] /, "")))}</li>`,
        );
        i++;
      }
      output.push(
        `<ul style="margin:0.25rem 0;padding-left:1.25rem;list-style:disc;">${listItems.join("")}</ul>`,
      );
      continue;
    }

    // Ordered list 1. item
    if (/^\d+\. (.+)$/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+\. (.+)$/.test(lines[i])) {
        listItems.push(
          `<li style="margin:0.1rem 0;">${inlineMarkdown(escape(lines[i].replace(/^\d+\. /, "")))}</li>`,
        );
        i++;
      }
      output.push(
        `<ol style="margin:0.25rem 0;padding-left:1.25rem;">${listItems.join("")}</ol>`,
      );
      continue;
    }

    // Masked link [text](url)
    // (handled in inlineMarkdown)

    // Empty line → spacer
    if (line.trim() === "") {
      output.push(`<div style="height:0.5rem;"></div>`);
      i++;
      continue;
    }

    // Normal paragraph line
    output.push(`<span>${inlineMarkdown(escape(line))}</span>`);
    i++;
  }

  return output
    .join("<br>")
    .replace(/(<br>)+(<\/?(h[123]|ul|ol|pre|div))/g, "$2");
}

// Inline markdown (bold, italic, underline, strikethrough, code, spoiler, links)
function inlineMarkdown(text) {
  return (
    text
      // Inline code (must come first to avoid processing inside code)
      .replace(
        /`([^`]+)`/g,
        '<code style="background:#1e1f22;padding:0.1rem 0.3rem;border-radius:3px;font-family:monospace;font-size:0.875rem;">$1</code>',
      )
      // Spoiler ||text||
      .replace(
        /\|\|(.+?)\|\|/g,
        "<span style=\"background:#202225;color:transparent;border-radius:3px;padding:0 2px;cursor:pointer;\" onclick=\"this.style.color='#dbdee1';this.style.background='#36393f';\">$1</span>",
      )
      // Bold + Italic ***text***
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      // Bold **text**
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      // Italic *text* or _text_
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      // Underline __text__
      .replace(/__(.+?)__/g, "<u>$1</u>")
      // Strikethrough ~~text~~
      .replace(/~~(.+?)~~/g, "<del>$1</del>")
      // Masked link [text](url)
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
        '<a href="$2" style="color:#00aff4;text-decoration:none;" target="_blank">$1</a>',
      )
      // Plain URL
      .replace(
        /(?<![">])(https?:\/\/[^\s<]+)/g,
        '<a href="$1" style="color:#00aff4;text-decoration:none;" target="_blank">$1</a>',
      )
  );
}

function updateNormalPreview() {
  const content = document.getElementById("normalPreviewContent");
  if (!content) return;

  const authorName = document.getElementById("authorName")?.value.trim();
  const authorIcon = document.getElementById("authorIcon")?.value.trim();
  const authorUrl = document.getElementById("authorUrl")?.value.trim();
  const title = document.getElementById("title")?.value.trim();
  const titleUrl = document.getElementById("titleUrl")?.value.trim();
  const description = document.getElementById("description")?.value.trim();
  const thumbnail = document.getElementById("thumbnail")?.value.trim();
  const image = document.getElementById("image")?.value.trim();
  const color = document.getElementById("color")?.value.trim(); // NO DEFAULT
  const footer = document.getElementById("footer")?.value.trim();
  const footerIcon = document.getElementById("footerIcon")?.value.trim();
  const timestamp = document.getElementById("timestamp")?.checked;

  // Check if any REAL embed content exists (not just thumbnail)
  const hasEmbedContent = authorName || title || description || image || footer;
  const fields = Array.from(document.querySelectorAll(".field-row"));
  const buttons = Array.from(document.querySelectorAll(".button-row"));
  const selects = Array.from(document.querySelectorAll(".select-row"));
  const modals = Array.from(document.querySelectorAll(".modal-row"));

  // Count valid fields (both name AND value required for DISPLAY, but show name-only too)
  const validFields = fields.filter((field) => {
    const name = field.querySelector(".field-name")?.value.trim();
    return name; // Show if name exists, even without value
  });

  if (
    !hasEmbedContent &&
    validFields.length === 0 &&
    buttons.length === 0 &&
    selects.length === 0 &&
    modals.length === 0
  ) {
    content.innerHTML =
      '<div style="color:#dbdee1;font-size:1rem;line-height:1.375;white-space:pre-wrap;word-wrap:break-word;">Fill in the form to see a preview…</div>';
    return;
  }

  let html = "";

  // Only show embed if there's actual embed content (not just thumbnail alone)
  if (hasEmbedContent || validFields.length > 0) {
    const embedColor = color;
    html +=
      '<div class="preview-embed"' +
      (embedColor ? ` style="border-left-color:${embedColor};"` : "") +
      ">";

    // Thumbnail (floats right) - only show if there's other content
    if (thumbnail && isValidUrl(thumbnail) && hasEmbedContent) {
      html += `<img src="${thumbnail}" alt="Thumbnail" class="preview-embed-thumbnail" onerror="this.style.display='none'">`;
    }

    // Author
    if (authorName) {
      html += '<div class="preview-embed-author">';
      if (authorIcon && isValidUrl(authorIcon)) {
        html += `<img src="${authorIcon}" alt="Author" class="preview-embed-author-icon" onerror="this.style.display='none'">`;
      }
      if (authorUrl && isValidUrl(authorUrl)) {
        html += `<a href="${authorUrl}" class="preview-embed-author-name" target="_blank">${authorName}</a>`;
      } else {
        html += `<span class="preview-embed-author-name">${authorName}</span>`;
      }
      html += "</div>";
    }

    // Title - consistent styling whether link or not
    if (title) {
      if (titleUrl && isValidUrl(titleUrl)) {
        html += `<a href="${titleUrl}" class="preview-embed-title" target="_blank">${title}</a>`;
      } else {
        html += `<a class="preview-embed-title" style="color:#fff;cursor:default;text-decoration:none;">${title}</a>`;
      }
    }

    // Description
    if (description) {
      html += `<div class="preview-embed-description">${description}</div>`;
    }

    // Fields - show name even without value
    if (validFields.length > 0) {
      const hasInline = validFields.some(
        (f) => f.querySelector(".field-inline")?.checked,
      );
      html += `<div class="preview-embed-fields${hasInline ? " has-inline" : ""}">`;
      validFields.forEach((field) => {
        const name = field.querySelector(".field-name")?.value.trim();
        const value = field.querySelector(".field-value")?.value.trim();
        html += '<div class="preview-embed-field">';
        html += `<div class="preview-embed-field-name">${name}</div>`;
        if (value) {
          html += `<div class="preview-embed-field-value">${value}</div>`;
        }
        html += "</div>";
      });
      html += "</div>";
    }

    // Image
    if (image && isValidUrl(image)) {
      html += `<img src="${image}" alt="Image" class="preview-embed-image" onerror="this.style.display='none'">`;
    }

    // Footer
    if (footer || timestamp) {
      html += '<div class="preview-embed-footer">';
      if (footerIcon && isValidUrl(footerIcon)) {
        html += `<img src="${footerIcon}" alt="Footer" class="preview-embed-footer-icon" onerror="this.style.display='none'">`;
      }
      if (footer) {
        html += `<span>${footer}</span>`;
      }
      if (timestamp) {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const timeStr = now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        if (footer) html += "<span>•</span>";
        html += `<span>${dateStr} at ${timeStr}</span>`;
      }
      html += "</div>";
    }

    html += "</div>";
  }

  // Buttons
  if (buttons.length > 0) {
    html += '<div class="preview-buttons">';
    buttons.forEach((btn) => {
      const label = btn.querySelector(".button-label")?.value.trim();
      const style = btn.querySelector(".button-style")?.value || "primary";
      const disabled = btn.querySelector(".button-disabled")?.checked;
      const emoji = btn.querySelector(".button-emoji")?.value.trim();

      if (label || emoji) {
        let btnClass = "preview-button";
        if (style !== "primary") btnClass += " " + style;
        if (disabled) btnClass += " disabled";

        html += `<button class="${btnClass}">`;
        if (emoji) html += `<span>${emoji}</span>`;
        if (label) html += `<span>${label}</span>`;
        html += "</button>";
      }
    });
    html += "</div>";
  }

  // Select Menus
  if (selects.length > 0) {
    selects.forEach((select) => {
      const placeholder =
        select.querySelector(".select-placeholder")?.value.trim() ||
        "Select an option";
      html += '<div class="preview-buttons">';
      html += `<button class="preview-button secondary" style="max-width:400px;justify-content:space-between;display:flex;align-items:center;">`;
      html += `<span>${placeholder}</span>`;
      html += `<span>▼</span>`;
      html += "</button>";
      html += "</div>";
    });
  }

  // Modals (show as button that would trigger them)
  if (modals.length > 0) {
    modals.forEach((modal) => {
      const modalTitle = modal.querySelector(".modal-title")?.value.trim();
      if (modalTitle) {
        html +=
          '<div style="margin-top:0.5rem;padding:0.5rem;background:#2b2d31;border-radius:4px;font-size:0.875rem;color:#949ba4;">';
        html += `📝 Modal: "${modalTitle}" (opens on interaction)`;
        html += "</div>";
      }
    });
  }

  content.innerHTML =
    html ||
    '<div style="color:#dbdee1;font-size:1rem;line-height:1.375;white-space:pre-wrap;word-wrap:break-word;">Fill in the form to see a preview…</div>';
}

function updateSendPreview() {
  const content = document.getElementById("sendPreviewContent");
  if (!content) return;

  const messageContent = document.getElementById("s_content")?.value.trim();
  const authorName = document.getElementById("s_authorName")?.value.trim();
  const authorIcon = document.getElementById("s_authorIcon")?.value.trim();
  const title = document.getElementById("s_title")?.value.trim();
  const titleUrl = document.getElementById("s_titleUrl")?.value.trim();
  const description = document.getElementById("s_description")?.value.trim();
  const thumbnail = document.getElementById("s_thumbnail")?.value.trim();
  const image = document.getElementById("s_image")?.value.trim();
  const color = document.getElementById("s_color")?.value.trim(); // NO DEFAULT
  const footer = document.getElementById("s_footer")?.value.trim();
  const footerIcon = document.getElementById("s_footerIcon")?.value.trim();
  const timestamp = document.getElementById("s_timestamp")?.checked;

  const hasEmbedContent = authorName || title || description || image || footer;
  const hasContent = messageContent || hasEmbedContent;

  if (!hasContent) {
    content.innerHTML =
      '<div style="color:#dbdee1;font-size:1rem;line-height:1.375;white-space:pre-wrap;word-wrap:break-word;">Fill in the form to see a preview…</div>';
    return;
  }

  let html = "";

  // Message content (text above embed) - styled like Discord message
  if (messageContent) {
    html += `<div style="color:#dbdee1;font-size:1rem;margin-bottom:0.25rem;line-height:1.375;white-space:pre-wrap;word-wrap:break-word;">${messageContent}</div>`;
  }

  // Only show embed if there's embed content (not just thumbnail alone)
  if (hasEmbedContent) {
    const embedColor = color;
    html +=
      '<div class="preview-embed"' +
      (embedColor ? ` style="border-left-color:${embedColor};"` : "") +
      ">";

    // Thumbnail - only show if there's other content
    if (thumbnail && isValidUrl(thumbnail) && hasEmbedContent) {
      html += `<img src="${thumbnail}" alt="Thumbnail" class="preview-embed-thumbnail" onerror="this.style.display='none'">`;
    }

    // Author
    if (authorName) {
      html += '<div class="preview-embed-author">';
      if (authorIcon && isValidUrl(authorIcon)) {
        html += `<img src="${authorIcon}" alt="Author" class="preview-embed-author-icon" onerror="this.style.display='none'">`;
      }
      html += `<span class="preview-embed-author-name">${authorName}</span>`;
      html += "</div>";
    }

    // Title - consistent styling whether link or not
    if (title) {
      if (titleUrl && isValidUrl(titleUrl)) {
        html += `<a href="${titleUrl}" class="preview-embed-title" target="_blank">${title}</a>`;
      } else {
        html += `<a class="preview-embed-title" style="color:#fff;cursor:default;text-decoration:none;">${title}</a>`;
      }
    }

    // Description
    if (description) {
      html += `<div class="preview-embed-description">${description}</div>`;
    }

    // Image
    if (image && isValidUrl(image)) {
      html += `<img src="${image}" alt="Image" class="preview-embed-image" onerror="this.style.display='none'">`;
    }

    // Footer
    if (footer || timestamp) {
      html += '<div class="preview-embed-footer">';
      if (footerIcon && isValidUrl(footerIcon)) {
        html += `<img src="${footerIcon}" alt="Footer" class="preview-embed-footer-icon" onerror="this.style.display='none'">`;
      }
      if (footer) {
        html += `<span>${footer}</span>`;
      }
      if (timestamp) {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const timeStr = now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        if (footer) html += "<span>•</span>";
        html += `<span>${dateStr} at ${timeStr}</span>`;
      }
      html += "</div>";
    }

    html += "</div>";
  }

  content.innerHTML = html;
}

function updateCV2Preview() {
  const content = document.getElementById("cv2PreviewContent");
  if (!content) return;

  const cards = Array.from(
    document.querySelectorAll("#cv2Components [data-type]"),
  );

  if (cards.length === 0) {
    content.innerHTML =
      '<div style="color:#dbdee1;font-size:1rem;line-height:1.375;white-space:pre-wrap;word-wrap:break-word;">Add components to see a preview…</div>';
    return;
  }

  let html = "";
  const containers = {};
  const sections = {};
  const galleries = {};
  const actionRows = {};

  // First pass: organize components by container/section/gallery/actionrow
  cards.forEach((card) => {
    const type = card.dataset.type;

    if (type === "container") {
      const name = cv2f("name", card);
      if (name) {
        containers[name] = {
          color: cv2f("color", card),
          spoiler: cv2f("spoiler", card) === "true",
          items: [],
        };
      }
    } else if (type === "section") {
      const name = cv2f("name", card);
      if (name) {
        sections[name] = {
          container: cv2f("container", card),
          texts: [],
          accessories: [],
        };
      }
    } else if (type === "mediagallery") {
      const id = cv2f("id", card);
      if (id) {
        galleries[id] = {
          container: cv2f("container", card),
          items: [],
        };
      }
    } else if (type === "actionrow") {
      const id = cv2f("id", card);
      if (id) {
        actionRows[id] = {
          container: cv2f("container", card),
          buttons: [],
          selects: [],
        };
      }
    }
  });

  // Second pass: populate containers/sections/galleries/actionrows
  cards.forEach((card) => {
    const type = card.dataset.type;

    if (type === "textdisplay") {
      const contentText = cv2f("content", card);
      const target = cv2f("containerOrSection", card);
      if (contentText) {
        const item = { type: "text", content: renderMarkdown(contentText) };
        if (sections[target]) {
          sections[target].texts.push(item);
        } else if (containers[target]) {
          containers[target].items.push(item);
        } else {
          // Orphan text display
          html += `<div class="preview-text-display">${renderMarkdown(contentText)}</div>`;
        }
      }
    } else if (type === "separator") {
      const target = cv2f("container", card);
      const spacing = cv2f("spacing", card);
      const divider = cv2f("divider", card) === "true";
      const item = { type: "separator", spacing, divider };
      if (containers[target]) {
        containers[target].items.push(item);
      } else {
        // Orphan separator
        let sepClass = "preview-separator";
        if (spacing) sepClass += " " + spacing;
        if (!divider) sepClass += " no-divider";
        html += `<div class="${sepClass}"></div>`;
      }
    } else if (type === "thumbnail") {
      const url = cv2f("url", card);
      const sectionName = cv2f("sectionName", card);
      const spoiler = cv2f("spoiler", card) === "true";
      if (url && sections[sectionName]) {
        // Thumbnail takes priority - add it first
        sections[sectionName].accessories.unshift({
          type: "thumbnail",
          url,
          spoiler,
        });
      }
    } else if (type === "mediaitem") {
      const url = cv2f("url", card);
      const galleryId = cv2f("galleryId", card);
      const spoiler = cv2f("spoiler", card) === "true";
      if (url && galleries[galleryId]) {
        galleries[galleryId].items.push({ url, spoiler });
      }
    } else if (type === "buttoncv2") {
      const id = cv2f("id", card);
      const label = cv2f("label", card);
      const style = cv2f("style", card) || "primary";
      const disabled = cv2f("disabled", card) === "true";
      const emoji = cv2f("emoji", card);
      const target = cv2f("actionRowOrSection", card);

      if (id || label || emoji) {
        const btn = { label, style, disabled, emoji };
        if (actionRows[target]) {
          actionRows[target].buttons.push(btn);
        } else if (sections[target]) {
          sections[target].accessories.push({ type: "button", ...btn });
        }
      }
    } else if (
      type === "stringselect" ||
      type === "userselect" ||
      type === "roleselect" ||
      type === "mentionable"
    ) {
      const id = cv2f("id", card);
      const placeholder = cv2f("placeholder", card) || "Select...";
      const target = cv2f("actionRowId", card);

      if (id && actionRows[target]) {
        actionRows[target].selects.push({ placeholder });
      }
    }
  });

  // Render containers
  Object.entries(containers).forEach(([name, container]) => {
    let containerClass = "preview-container";
    let containerStyle = "";
    if (container.color && isValidHex(container.color)) {
      containerClass += " has-color";
      containerStyle = `border-left-color:${container.color};`;
    }
    if (container.spoiler) {
      containerClass += " spoiler";
    }

    html += `<div class="${containerClass}" style="${containerStyle}">`;

    // Render container items
    container.items.forEach((item) => {
      if (item.type === "text") {
        html += `<div class="preview-text-display">${item.content}</div>`;
      } else if (item.type === "separator") {
        let sepClass = "preview-separator";
        if (item.spacing) sepClass += " " + item.spacing;
        if (!item.divider) sepClass += " no-divider";
        html += `<div class="${sepClass}"></div>`;
      }
    });

    // Render sections in this container
    Object.entries(sections).forEach(([sectionName, section]) => {
      if (section.container === name) {
        html += '<div class="preview-section">';
        html += '<div class="preview-section-content">';
        section.texts.forEach((text) => {
          html += `<div class="preview-text-display">${text.content}</div>`;
        });
        html += "</div>";

        // Only show thumbnail (first accessory if it's a thumbnail)
        if (section.accessories.length > 0) {
          const firstAccessory = section.accessories[0];
          if (firstAccessory.type === "thumbnail") {
            html += '<div class="preview-section-accessory">';
            html += `<img src="${firstAccessory.url}" alt="Thumbnail" class="preview-section-thumbnail" onerror="this.style.display='none'">`;
            html += "</div>";
          } else if (firstAccessory.type === "button") {
            // Show button only if no thumbnail
            html += '<div class="preview-section-accessory">';
            let btnClass = "preview-button";
            if (firstAccessory.style !== "primary")
              btnClass += " " + firstAccessory.style;
            if (firstAccessory.disabled) btnClass += " disabled";
            html += `<button class="${btnClass}">`;
            if (firstAccessory.emoji)
              html += `<span>${firstAccessory.emoji}</span>`;
            if (firstAccessory.label)
              html += `<span>${firstAccessory.label}</span>`;
            html += "</button>";
            html += "</div>";
          }
        }
        html += "</div>";
      }
    });

    // Render galleries in this container
    Object.entries(galleries).forEach(([galleryId, gallery]) => {
      if (gallery.container === name && gallery.items.length > 0) {
        html += '<div class="preview-media-gallery">';
        gallery.items.forEach((item) => {
          html += `<img src="${item.url}" alt="Media" class="preview-media-item" onerror="this.style.display='none'">`;
        });
        html += "</div>";
      }
    });

    // Render action rows in this container
    Object.entries(actionRows).forEach(([rowId, row]) => {
      if (row.container === name) {
        if (row.buttons.length > 0) {
          html += '<div class="preview-buttons">';
          row.buttons.forEach((btn) => {
            let btnClass = "preview-button";
            if (btn.style !== "primary") btnClass += " " + btn.style;
            if (btn.disabled) btnClass += " disabled";
            html += `<button class="${btnClass}">`;
            if (btn.emoji) html += `<span>${btn.emoji}</span>`;
            if (btn.label) html += `<span>${btn.label}</span>`;
            html += "</button>";
          });
          html += "</div>";
        }
        if (row.selects.length > 0) {
          row.selects.forEach((sel) => {
            html += '<div class="preview-buttons">';
            html += `<button class="preview-button secondary" style="max-width:400px;justify-content:space-between;display:flex;align-items:center;">`;
            html += `<span>${sel.placeholder}</span>`;
            html += `<span>▼</span>`;
            html += "</button>";
            html += "</div>";
          });
        }
      }
    });

    html += "</div>";
  });

  // Render orphan sections (not in any container)
  Object.entries(sections).forEach(([sectionName, section]) => {
    if (!section.container) {
      html += '<div class="preview-section">';
      html += '<div class="preview-section-content">';
      section.texts.forEach((text) => {
        html += `<div class="preview-text-display">${text.content}</div>`;
      });
      html += "</div>";

      if (section.accessories.length > 0) {
        const firstAccessory = section.accessories[0];
        if (firstAccessory.type === "thumbnail") {
          html += '<div class="preview-section-accessory">';
          html += `<img src="${firstAccessory.url}" alt="Thumbnail" class="preview-section-thumbnail" onerror="this.style.display='none'">`;
          html += "</div>";
        } else if (firstAccessory.type === "button") {
          html += '<div class="preview-section-accessory">';
          let btnClass = "preview-button";
          if (firstAccessory.style !== "primary")
            btnClass += " " + firstAccessory.style;
          if (firstAccessory.disabled) btnClass += " disabled";
          html += `<button class="${btnClass}">`;
          if (firstAccessory.emoji)
            html += `<span>${firstAccessory.emoji}</span>`;
          if (firstAccessory.label)
            html += `<span>${firstAccessory.label}</span>`;
          html += "</button>";
          html += "</div>";
        }
      }
      html += "</div>";
    }
  });

  // Render orphan galleries
  Object.entries(galleries).forEach(([galleryId, gallery]) => {
    if (!gallery.container && gallery.items.length > 0) {
      html += '<div class="preview-media-gallery">';
      gallery.items.forEach((item) => {
        html += `<img src="${item.url}" alt="Media" class="preview-media-item" onerror="this.style.display='none'">`;
      });
      html += "</div>";
    }
  });

  // Render orphan action rows
  Object.entries(actionRows).forEach(([rowId, row]) => {
    if (!row.container) {
      if (row.buttons.length > 0) {
        html += '<div class="preview-buttons">';
        row.buttons.forEach((btn) => {
          let btnClass = "preview-button";
          if (btn.style !== "primary") btnClass += " " + btn.style;
          if (btn.disabled) btnClass += " disabled";
          html += `<button class="${btnClass}">`;
          if (btn.emoji) html += `<span>${btn.emoji}</span>`;
          if (btn.label) html += `<span>${btn.label}</span>`;
          html += "</button>";
        });
        html += "</div>";
      }
      if (row.selects.length > 0) {
        row.selects.forEach((sel) => {
          html += '<div class="preview-buttons">';
          html += `<button class="preview-button secondary" style="max-width:400px;justify-content:space-between;display:flex;align-items:center;">`;
          html += `<span>${sel.placeholder}</span>`;
          html += `<span>▼</span>`;
          html += "</button>";
          html += "</div>";
        });
      }
    }
  });

  content.innerHTML =
    html ||
    '<div style="color:#dbdee1;font-size:1rem;line-height:1.375;white-space:pre-wrap;word-wrap:break-word;">Add components to see a preview…</div>';
}

// Wrap initialization in a function to call after DOM is ready
function initializePreviews() {
  // Update timestamps every second
  updateTimestamps();
  setInterval(updateTimestamps, 1000);

  // Normal mode preview updates
  const normalBuilder = document.getElementById("normalBuilder");
  if (normalBuilder) {
    normalBuilder.addEventListener("input", updateNormalPreview);
    normalBuilder.addEventListener("change", updateNormalPreview);
    // Update when dynamic fields are added/removed
    const observer = new MutationObserver(updateNormalPreview);
    const dynamicFields = document.getElementById("dynamicFields");
    if (dynamicFields) {
      observer.observe(dynamicFields, { childList: true, subtree: true });
    }
    // Initial update
    setTimeout(updateNormalPreview, 100);
  }

  // Send mode preview updates
  const sendBuilder = document.getElementById("sendBuilder");
  if (sendBuilder) {
    sendBuilder.addEventListener("input", updateSendPreview);
    sendBuilder.addEventListener("change", updateSendPreview);
    setTimeout(updateSendPreview, 100);
  }

  // CompV2 mode preview updates
  const cv2Components = document.getElementById("cv2Components");
  if (cv2Components) {
    const cv2Observer = new MutationObserver(updateCV2Preview);
    cv2Observer.observe(cv2Components, { childList: true, subtree: true });
    cv2Components.addEventListener("input", updateCV2Preview);
    cv2Components.addEventListener("change", updateCV2Preview);
    setTimeout(updateCV2Preview, 100);
  }
}

// Call initialization after existing DOMContentLoaded handler
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePreviews);
} else {
  initializePreviews();
}
