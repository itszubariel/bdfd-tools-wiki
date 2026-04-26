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

function makeHeader(title, body) {
  const header = document.createElement("div");
  header.className = "component-header";
  const titleEl = document.createElement("span");
  titleEl.className = "component-title";
  titleEl.textContent = title;
  const collapseBtn = document.createElement("button");
  collapseBtn.className = "collapse-btn";
  collapseBtn.textContent = "▲";
  collapseBtn.onclick = () => {
    const collapsed = body.style.display === "none";
    body.style.display = collapsed ? "" : "none";
    collapseBtn.textContent = collapsed ? "▲" : "▼";
  };
  header.appendChild(titleEl);
  header.appendChild(collapseBtn);
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
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;">
      <label class="checkbox-label" style="margin:0;">
        <input type="checkbox" class="form-checkbox field-inline">
        <span>Inline</span>
      </label>
      <button class="remove-btn-red remove-btn-small">Remove</button>
    </div>
  `;
  row.appendChild(makeHeader(`Field #${fieldCount}`, body));
  row.appendChild(body);
  document.getElementById("dynamicFields").appendChild(row);
  body.querySelector(".remove-btn-red").onclick = () => row.remove();
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
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;">
      <div style="display:flex;gap:1.5rem;align-items:center;">
        <label class="checkbox-label" style="margin:0;">
          <input type="checkbox" class="form-checkbox button-disabled">
          <span>Disabled</span>
        </label>
        <label class="checkbox-label" style="margin:0;">
          <input type="checkbox" class="form-checkbox button-newrow">
          <span>New Row</span>
        </label>
      </div>
      <button class="remove-btn-red remove-btn-small">Remove</button>
    </div>
  `;
  row.appendChild(makeHeader(`Button #${buttonCount}`, body));
  row.appendChild(body);
  document.getElementById("dynamicFields").appendChild(row);
  body.querySelector(".remove-btn-red").onclick = () => row.remove();
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
      <button class="add-field-btn remove-btn-red">Remove Menu</button>
    </div>
  `;
  row.appendChild(makeHeader(`Select Menu #${selectCount}`, body));
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
  const removeMenuBtns = body.querySelectorAll(".remove-btn-red");
  removeMenuBtns[removeMenuBtns.length - 1].onclick = () => row.remove();
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
      <button class="add-field-btn remove-btn-red">Remove Modal</button>
    </div>
  `;
  row.appendChild(makeHeader(`Modal #${modalCount}`, body));
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
  const btns = body.querySelectorAll(".remove-btn-red");
  btns[btns.length - 1].onclick = () => row.remove();
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
      "Color: must be a valid hex code (e.g. #7289da)",
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

  document.querySelectorAll(".select-row").forEach((row, i) => {
    const n = i + 1;
    const menuId = row.querySelector(".select-id")?.value.trim();
    const formRow = row.querySelector(".form-row");
    if (!menuId) {
      bodyRowError(formRow, `Select Menu ${n}: Menu ID required`);
      hasErrors = true;
      return;
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

  if (hasErrors) {
    const first = document.querySelector(".inline-error");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // Build code
  const authorNameS = sanitizeInput(authorName);
  const authorIconS = sanitizeInput(authorIcon);
  const authorUrlS = sanitizeInput(authorUrl);
  if (authorNameS) {
    code += `$author[${authorNameS}`;
    if (authorIconS) code += `;${authorIconS}`;
    if (authorUrlS) code += `;${authorUrlS}`;
    code += "]\n";
  }

  const titleS = sanitizeInput(titleVal);
  const titleUrlS = sanitizeInput(titleUrl);
  if (titleS) {
    code += `$title[${titleS}`;
    if (titleUrlS) code += `;${titleUrlS}`;
    code += "]\n";
  }

  const desc = sanitizeInput(document.getElementById("description").value);
  if (desc) code += `$description[${desc}]\n`;

  const thumbnail = sanitizeInput(document.getElementById("thumbnail").value);
  if (thumbnail) code += `$thumbnail[${thumbnail}]\n`;

  const image = sanitizeInput(document.getElementById("image").value);
  if (image) code += `$image[${image}]\n`;

  const color = document.getElementById("color").value || "#7289da";
  code += `$color[${color}]\n`;

  const footerS = sanitizeInput(footerVal);
  const footerIconS = sanitizeInput(footerIcon);
  if (footerS) {
    code += `$footer[${footerS}`;
    if (footerIconS) code += `;${footerIconS}`;
    code += "]\n";
  }

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
        code += `$addButton[1;${label || "Link"};${url};${disabled};${emoji}]\n`;
      } else if (customId) {
        const styleNum =
          { primary: 1, secondary: 2, success: 3, danger: 4 }[style] || 1;
        code += `$addButton[${newRow};${label};${styleNum};${customId};${disabled};${emoji}]\n`;
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
    colorVal || "#7289da",
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

  // Always load CV2 state once on startup — cards live in the DOM even when hidden
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
        input.value = input.id === "color" ? "#7289da" : "";
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

  // ── Send mode wiring ────────────────────────────────────────────────────────
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
      if (el) el.value = id === "s_color" ? "#7289da" : "";
    });
    SEND_CHECKS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    document.getElementById("s_output").textContent =
      "Generated code appears here...";
    document.getElementById("s_charCount").textContent = "0 characters";
    localStorage.removeItem(SEND_KEY);
  });
  document
    .getElementById("sendBuilder")
    .addEventListener("input", saveSendState);
  document
    .getElementById("sendBuilder")
    .addEventListener("change", saveSendState);

  // ── CompV2 mode wiring ──────────────────────────────────────────────────────
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
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPV2 BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CV2 state persistence ────────────────────────────────────────────────────

// Track per-type counters for numbering (persists across mode switches)
const cv2Counters = {};

function saveCV2State() {
  const cards = [];
  document.querySelectorAll("#cv2Components .cv2-comp-card").forEach((card) => {
    const type = card.dataset.type;
    const fields = {};
    card.querySelectorAll("[data-cv2field]").forEach((el) => {
      fields[el.dataset.cv2field] =
        el.type === "checkbox" ? el.checked : el.value;
    });
    cards.push({ type, fields });
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
    });
    // Now that all name/id fields are populated, refresh dropdowns once
    cv2RefreshAllDropdowns();
  } catch (e) {}
}

// ─── CV2 dropdown helpers ─────────────────────────────────────────────────────

// Collect names of a given component type from existing cards
function cv2GetNames(type) {
  const names = [];
  document
    .querySelectorAll(`#cv2Components .cv2-comp-card[data-type="${type}"]`)
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
  // Required fields get a "— select —" placeholder; optional get "— none —"
  sel.innerHTML = required
    ? '<option value="">— select —</option>'
    : '<option value="">— none —</option>';
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

  document.querySelectorAll("#cv2Components .cv2-comp-card").forEach((card) => {
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
    if (["userselect", "roleselect", "mentionable"].includes(type)) {
      cv2PopulateSelect(
        card.querySelector("[data-cv2field='actionRowId']"),
        [["Action Rows", actionRows]],
        true,
      );
    }
  });
}

// ─── CV2 card builder ─────────────────────────────────────────────────────────

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

  const card = document.createElement("div");
  card.className = "cv2-comp-card";
  card.dataset.type = type;

  // Body (created first so collapse-btn can reference it)
  const body = document.createElement("div");
  body.className = "cv2-comp-body";
  body.innerHTML = cv2CardBody(type);

  // Header — identical pattern to Normal Embed Builder's makeHeader()
  const hdr = document.createElement("div");
  hdr.className = "component-header";

  const titleEl = document.createElement("span");
  titleEl.className = "component-title";
  titleEl.textContent = label;

  // Button group: collapse + remove
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

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn-red remove-btn-small";
  removeBtn.textContent = "Remove";
  removeBtn.onclick = () => {
    card.remove();
    cv2RefreshAllDropdowns();
    saveCV2State();
  };

  btnGroup.appendChild(collapseBtn);
  btnGroup.appendChild(removeBtn);
  hdr.appendChild(titleEl);
  hdr.appendChild(btnGroup);

  card.appendChild(hdr);
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
  // Auto-save all other fields
  card.addEventListener("input", saveCV2State);
  card.addEventListener("change", saveCV2State);

  if (doRefresh) cv2RefreshAllDropdowns();
  return card;
}

function cv2CardBody(type) {
  const fi = (field, placeholder, extra = "") =>
    `<div class="cv2-field-group">
       <input class="form-input" data-cv2field="${field}" placeholder="${placeholder}" ${extra}>
     </div>`;
  const ta = (field, placeholder) =>
    `<div class="cv2-field-group">
       <textarea class="form-input form-textarea" data-cv2field="${field}" placeholder="${placeholder}" style="min-height:7rem;"></textarea>
     </div>`;
  // Checkbox rendered as a full-height cell so it aligns with adjacent inputs
  const cbCell = (field, label) =>
    `<div class="cv2-field-group" style="display:flex;align-items:center;padding-top:0.25rem;">
       <label class="checkbox-label" style="margin:0;">
         <input type="checkbox" class="form-checkbox" data-cv2field="${field}">
         <span>${label}</span>
       </label>
     </div>`;
  const sel = (field, options, label = "") =>
    `<div class="cv2-field-group">
       ${label ? `<span class="cv2-field-label">${label}</span>` : ""}
       <select class="form-input" data-cv2field="${field}">${options}</select>
     </div>`;
  const dynSel = (field, label = "") =>
    `<div class="cv2-field-group">
       ${label ? `<span class="cv2-field-label">${label}</span>` : ""}
       <select class="form-input" data-cv2field="${field}"><option value="">— none —</option></select>
     </div>`;
  // Required dynamic select — starts with a "— select —" placeholder so it's never visually empty
  const dynSelReq = (field, label = "") =>
    `<div class="cv2-field-group">
       ${label ? `<span class="cv2-field-label">${label}</span>` : ""}
       <select class="form-input" data-cv2field="${field}"><option value="">— select —</option></select>
     </div>`;

  switch (type) {
    case "container":
      return `<div class="cv2-grid3">
        ${fi("name", "Container Name (required)")}
        ${fi("color", "Color (hex, optional)")}
        ${cbCell("spoiler", "Spoiler")}
      </div>`;

    case "textdisplay":
      return `${ta("content", "Content (required)")}
      <div class="cv2-mt">${dynSel("containerOrSection", "Container or Section (optional)")}</div>`;

    case "separator":
      return `<div class="cv2-grid3">
        ${cbCell("divider", "Show Divider Line")}
        ${sel("spacing", `<option value="">Default</option><option value="small">Small</option><option value="large">Large</option>`, "Spacing")}
        ${dynSel("container", "Container (optional)")}
      </div>`;

    case "section":
      return `<div class="cv2-grid2">
        ${fi("name", "Section Name (required)")}
        ${dynSel("container", "Container (optional)")}
      </div>`;

    case "thumbnail":
      return `<div class="cv2-grid2">
        ${fi("url", "URL (required)")}
        ${fi("description", "Description (optional)")}
      </div>
      <div class="cv2-grid2 cv2-mt">
        ${cbCell("spoiler", "Spoiler")}
        ${dynSelReq("sectionName", "Section Name (required)")}
      </div>`;

    case "mediagallery":
      return `<div class="cv2-grid2">
        ${fi("id", "Gallery ID (required)")}
        ${dynSel("container", "Container (optional)")}
      </div>`;

    case "mediaitem":
      return `<div class="cv2-grid2">
        ${fi("url", "URL (required)")}
        ${fi("description", "Description (optional)")}
      </div>
      <div class="cv2-grid2 cv2-mt">
        ${cbCell("spoiler", "Spoiler")}
        ${dynSelReq("galleryId", "Gallery ID (required)")}
      </div>`;

    case "actionrow":
      return `<div class="cv2-grid2">
        ${fi("id", "Action Row ID (required)")}
        ${dynSel("container", "Container (optional)")}
      </div>`;

    case "buttoncv2":
      return `<div class="cv2-grid3">
        ${fi("id", "ID or URL (required)")}
        ${fi("label", "Label (optional)")}
        ${sel("style", `<option value="">Default</option><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="success">Success</option><option value="danger">Danger</option><option value="link">Link</option>`, "Style")}
      </div>
      <div class="cv2-grid2 cv2-mt">
        ${fi("emoji", "Emoji (optional)")}
        ${cbCell("disabled", "Disabled")}
      </div>
      <div class="cv2-mt">${dynSelReq("actionRowOrSection", "Action Row or Section (required)")}</div>`;

    case "userselect":
    case "roleselect":
    case "mentionable":
      return `<div class="cv2-grid2">
        ${fi("id", "ID (required)")}
        ${fi("placeholder", "Placeholder (optional)")}
      </div>
      <div class="cv2-grid3 cv2-mt">
        ${fi("min", "Min (optional)", "type='number' min='0'")}
        ${fi("max", "Max (optional)", "type='number' min='0'")}
        ${cbCell("disabled", "Disabled")}
      </div>
      <div class="cv2-mt">${dynSelReq("actionRowId", "Action Row ID (required)")}</div>`;

    default:
      return "";
  }
}

// ─── CV2 generate ─────────────────────────────────────────────────────────────

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
  const errEl = document.getElementById("cv2Error");
  errEl.textContent = "";
  const errors = [];

  const cards = Array.from(
    document.querySelectorAll("#cv2Components .cv2-comp-card"),
  );
  if (cards.length === 0) {
    showToast("Add at least one component first", true);
    return;
  }

  // Collect names for uniqueness checks
  const containerNames = new Set();
  const sectionNames = new Set();
  const allNames = new Set(); // containers + sections combined (must not clash)

  // First pass: uniqueness
  cards.forEach((card, i) => {
    const type = card.dataset.type;
    const n = i + 1;
    if (type === "container") {
      const name = cv2f("name", card);
      if (!name) {
        errors.push(`Component ${n} (Container): Name is required`);
        return;
      }
      if (containerNames.has(name))
        errors.push(`Component ${n} (Container): Duplicate name "${name}"`);
      if (allNames.has(name))
        errors.push(
          `Component ${n} (Container): Name "${name}" clashes with a Section`,
        );
      containerNames.add(name);
      allNames.add(name);
    }
    if (type === "section") {
      const name = cv2f("name", card);
      if (!name) {
        errors.push(`Component ${n} (Section): Name is required`);
        return;
      }
      if (sectionNames.has(name))
        errors.push(`Component ${n} (Section): Duplicate name "${name}"`);
      if (allNames.has(name))
        errors.push(
          `Component ${n} (Section): Name "${name}" clashes with a Container`,
        );
      sectionNames.add(name);
      allNames.add(name);
    }
  });

  // Second pass: per-component validation
  cards.forEach((card, i) => {
    const type = card.dataset.type;
    const n = i + 1;

    if (type === "container") {
      const color = cv2f("color", card);
      if (color && !isValidHex(color))
        errors.push(
          `Component ${n} (Container): Color must be a valid hex (e.g. #5865F2)`,
        );
    }

    if (type === "textdisplay") {
      if (!cv2f("content", card))
        errors.push(`Component ${n} (Text Display): Content is required`);
    }

    if (type === "section") {
      const name = cv2f("name", card);
      if (name) {
        // Must have at least one Text Display attached
        const hasText = cards.some(
          (c) =>
            c.dataset.type === "textdisplay" &&
            cv2f("containerOrSection", c) === name,
        );
        if (!hasText)
          errors.push(
            `Component ${n} (Section "${name}"): Must have at least one Text Display attached`,
          );
        // Must have at least one accessory (Thumbnail or Button CV2)
        const hasAccessory = cards.some(
          (c) =>
            (c.dataset.type === "thumbnail" &&
              cv2f("sectionName", c) === name) ||
            (c.dataset.type === "buttoncv2" &&
              cv2f("actionRowOrSection", c) === name),
        );
        if (!hasAccessory)
          errors.push(
            `Component ${n} (Section "${name}"): Must have at least one Thumbnail or Button CV2 accessory`,
          );
        // Max 3 components (Text Displays + Thumbnails)
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
          errors.push(
            `Component ${n} (Section "${name}"): Max 3 components (Text Displays + Thumbnails)`,
          );
      }
    }

    if (type === "thumbnail") {
      const url = cv2f("url", card);
      if (!url) errors.push(`Component ${n} (Thumbnail): URL is required`);
      else if (!isValidUrl(url))
        errors.push(
          `Component ${n} (Thumbnail): URL must start with http:// or https://`,
        );
      if (!cv2f("sectionName", card))
        errors.push(`Component ${n} (Thumbnail): Section Name is required`);
    }

    if (type === "mediagallery") {
      if (!cv2f("id", card))
        errors.push(`Component ${n} (Media Gallery): Gallery ID is required`);
    }

    if (type === "mediaitem") {
      const url = cv2f("url", card);
      if (!url) errors.push(`Component ${n} (Media Item): URL is required`);
      else if (!isValidUrl(url))
        errors.push(
          `Component ${n} (Media Item): URL must start with http:// or https://`,
        );
      const gid = cv2f("galleryId", card);
      if (!gid)
        errors.push(`Component ${n} (Media Item): Gallery ID is required`);
      else {
        const galleryExists = cards.some(
          (c) => c.dataset.type === "mediagallery" && cv2f("id", c) === gid,
        );
        if (!galleryExists)
          errors.push(
            `Component ${n} (Media Item): Gallery ID "${gid}" does not match any Media Gallery`,
          );
      }
    }

    if (type === "actionrow") {
      const rowId = cv2f("id", card);
      if (!rowId) {
        errors.push(`Component ${n} (Action Row): Action Row ID is required`);
        return;
      }
      // Must contain at least one button or select
      const children = cards.filter(
        (c) =>
          ["buttoncv2", "userselect", "roleselect", "mentionable"].includes(
            c.dataset.type,
          ) &&
          (cv2f("actionRowOrSection", c) === rowId ||
            cv2f("actionRowId", c) === rowId),
      );
      if (children.length === 0)
        errors.push(
          `Component ${n} (Action Row "${rowId}"): Must contain at least one Button or Select`,
        );
      const buttons = children.filter((c) => c.dataset.type === "buttoncv2");
      const selects = children.filter((c) =>
        ["userselect", "roleselect", "mentionable"].includes(c.dataset.type),
      );
      if (buttons.length > 0 && selects.length > 0)
        errors.push(
          `Component ${n} (Action Row "${rowId}"): Cannot mix Buttons and Selects`,
        );
      if (selects.length > 1)
        errors.push(
          `Component ${n} (Action Row "${rowId}"): Max 1 Select per row`,
        );
      if (buttons.length > 5)
        errors.push(
          `Component ${n} (Action Row "${rowId}"): Max 5 Buttons per row`,
        );
    }

    if (type === "buttoncv2") {
      if (!cv2f("id", card))
        errors.push(`Component ${n} (Button CV2): ID/URL is required`);
      const label = cv2f("label", card);
      const emoji = cv2f("emoji", card);
      if (!label && !emoji)
        errors.push(`Component ${n} (Button CV2): Must have a Label or Emoji`);
      if (!cv2f("actionRowOrSection", card))
        errors.push(
          `Component ${n} (Button CV2): Action Row or Section is required`,
        );
    }

    if (["userselect", "roleselect", "mentionable"].includes(type)) {
      const label = {
        userselect: "User Select",
        roleselect: "Role Select",
        mentionable: "Mentionable Select",
      }[type];
      if (!cv2f("id", card))
        errors.push(`Component ${n} (${label}): ID is required`);
      if (!cv2f("actionRowId", card))
        errors.push(`Component ${n} (${label}): Action Row ID is required`);
    }
  });

  if (errors.length > 0) {
    errors.forEach((e, i) => setTimeout(() => showToast(e, true), i * 150));
    errEl.textContent = errors[0];
    return;
  }

  // Code generation — containers first, then rest in order
  const containerCards = cards.filter((c) => c.dataset.type === "container");
  const otherCards = cards.filter((c) => c.dataset.type !== "container");
  const ordered = [...containerCards, ...otherCards];

  const lines = [];
  ordered.forEach((card) => {
    const type = card.dataset.type;
    let parts;

    if (type === "container") {
      parts = cv2Trim([
        cv2f("name", card),
        cv2f("color", card),
        cv2f("spoiler", card) === "true" ? "true" : "",
      ]);
      lines.push(`$addContainer[${parts.join(";")}]`);
    } else if (type === "textdisplay") {
      parts = cv2Trim([
        sanitizeInput(cv2f("content", card)),
        cv2f("containerOrSection", card),
      ]);
      lines.push(`$addTextDisplay[${parts.join(";")}]`);
    } else if (type === "separator") {
      const divider = cv2f("divider", card) === "true" ? "true" : "";
      const spacing = cv2f("spacing", card);
      const container = cv2f("container", card);
      parts = cv2Trim([divider, spacing, container]);
      if (parts.length === 0 || (parts.length === 1 && parts[0] === ""))
        lines.push(`$addSeparator[]`);
      else lines.push(`$addSeparator[${parts.join(";")}]`);
    } else if (type === "section") {
      parts = cv2Trim([cv2f("name", card), cv2f("container", card)]);
      lines.push(`$addSection[${parts.join(";")}]`);
    } else if (type === "thumbnail") {
      parts = cv2Trim([
        cv2f("url", card),
        sanitizeInput(cv2f("description", card)),
        cv2f("spoiler", card) === "true" ? "true" : "",
        cv2f("sectionName", card),
      ]);
      lines.push(`$addThumbnail[${parts.join(";")}]`);
    } else if (type === "mediagallery") {
      parts = cv2Trim([cv2f("id", card), cv2f("container", card)]);
      lines.push(`$addMediaGallery[${parts.join(";")}]`);
    } else if (type === "mediaitem") {
      parts = cv2Trim([
        cv2f("url", card),
        sanitizeInput(cv2f("description", card)),
        cv2f("spoiler", card) === "true" ? "true" : "",
        cv2f("galleryId", card),
      ]);
      lines.push(`$addMediaGalleryItem[${parts.join(";")}]`);
    } else if (type === "actionrow") {
      parts = cv2Trim([cv2f("id", card), cv2f("container", card)]);
      lines.push(`$addActionRow[${parts.join(";")}]`);
    } else if (type === "buttoncv2") {
      parts = cv2Trim([
        cv2f("id", card),
        sanitizeInput(cv2f("label", card)),
        cv2f("style", card),
        cv2f("disabled", card) === "true" ? "true" : "",
        sanitizeInput(cv2f("emoji", card)),
        cv2f("actionRowOrSection", card),
      ]);
      lines.push(`$addButtonCV2[${parts.join(";")}]`);
    } else if (type === "userselect") {
      parts = cv2Trim([
        cv2f("id", card),
        sanitizeInput(cv2f("placeholder", card)),
        cv2f("min", card),
        cv2f("max", card),
        cv2f("disabled", card) === "true" ? "true" : "",
        cv2f("actionRowId", card),
      ]);
      lines.push(`$addUserSelect[${parts.join(";")}]`);
    } else if (type === "roleselect") {
      parts = cv2Trim([
        cv2f("id", card),
        sanitizeInput(cv2f("placeholder", card)),
        cv2f("min", card),
        cv2f("max", card),
        cv2f("disabled", card) === "true" ? "true" : "",
        cv2f("actionRowId", card),
      ]);
      lines.push(`$addRoleSelect[${parts.join(";")}]`);
    } else if (type === "mentionable") {
      parts = cv2Trim([
        cv2f("id", card),
        sanitizeInput(cv2f("placeholder", card)),
        cv2f("min", card),
        cv2f("max", card),
        cv2f("disabled", card) === "true" ? "true" : "",
        cv2f("actionRowId", card),
      ]);
      lines.push(`$addMentionableSelect[${parts.join(";")}]`);
    }
  });

  const code = lines.join("\n");
  document.getElementById("cv2Output").textContent = code;
  document.getElementById("cv2CharCount").textContent =
    code.length + " characters";
  saveCV2State();
}
