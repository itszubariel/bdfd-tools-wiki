// ─── Constants ───────────────────────────────────────────────────────────────
const MODE_KEY   = 'bdtools_embed_mode';
const NORMAL_KEY = 'bdtools_normal_embed_state';
const SEND_KEY   = 'bdtools_send_embed_state';

let currentMode = localStorage.getItem(MODE_KEY) || 'normal';
let fieldCount = 0, buttonCount = 0, selectCount = 0, modalCount = 0;

// ─── Shared helpers ───────────────────────────────────────────────────────────
function sanitizeInput(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '%{DOL}%')
    .replace(/;/g, '\\;')
    .replace(/\]/g, '\\]');
}

function isValidHex(val) {
  return /^#[0-9A-Fa-f]{6}$/.test(val);
}

function isValidUrl(val) {
  return /^https?:\/\/.+/.test(val);
}

function clearInlineErrors() {
  document.querySelectorAll('.inline-error').forEach(el => el.remove());
}

function rowError(container, msg) {
  const span = document.createElement('div');
  span.className = 'inline-error';
  span.textContent = msg;
  container.insertAdjacentElement('afterend', span);
}

function formRowError(inputEl, msg) {
  if (!inputEl) return;
  const formRow = inputEl.closest('.form-row') || inputEl.parentElement;
  rowError(formRow, msg);
}

function bodyRowError(formRowEl, msg) {
  if (!formRowEl) return;
  rowError(formRowEl, msg);
}

function showToast(msg, isError) {
  let toast = document.getElementById('embedToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'embedToast';
    toast.style.cssText = [
      'position:fixed', 'bottom:2rem', 'left:50%', 'transform:translateX(-50%)',
      'padding:0.8rem 1.6rem', 'border-radius:var(--border-radius)',
      'font-size:1.3rem', 'font-weight:500', 'color:#fff',
      'box-shadow:0 5px 15px rgba(0,0,0,0.4)', 'z-index:9999',
      'transition:opacity 0.3s', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = isError ? 'hsl(0deg 70% 40%)' : 'hsl(220deg 80% 45%)';
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2800);
}

// ─── Normal mode: persistence ─────────────────────────────────────────────────
function saveNormalState() {
  const state = {};
  ['authorName','authorIcon','authorUrl','title','titleUrl','description',
   'thumbnail','image','color','footer','footerIcon'].forEach(id => {
    const el = document.getElementById(id);
    if (el) state[id] = el.value;
  });
  const ts = document.getElementById('timestamp');
  if (ts) state.timestamp = ts.checked;
  // dynamic fields snapshot
  const dynamics = [];
  document.querySelectorAll('#dynamicFields > [class$="-row"]').forEach(row => {
    const type = Array.from(row.classList).find(c => c.endsWith('-row') && c !== 'form-row');
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
    ['authorName','authorIcon','authorUrl','title','titleUrl','description',
     'thumbnail','image','color','footer','footerIcon'].forEach(id => {
      const el = document.getElementById(id);
      if (el && state[id] !== undefined) el.value = state[id];
    });
    const ts = document.getElementById('timestamp');
    if (ts && state.timestamp !== undefined) ts.checked = state.timestamp;
  } catch(e) {}
}

// ─── Send mode: persistence ───────────────────────────────────────────────────
const SEND_FIELDS = [
  's_channelId','s_content','s_authorName','s_authorIcon',
  's_title','s_titleUrl','s_description','s_thumbnail',
  's_image','s_color','s_footer','s_footerIcon'
];
const SEND_CHECKS = ['s_timestamp','s_returnMsgId'];

function saveSendState() {
  const state = {};
  SEND_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) state[id] = el.value;
  });
  SEND_CHECKS.forEach(id => {
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
    SEND_FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && state[id] !== undefined) el.value = state[id];
    });
    SEND_CHECKS.forEach(id => {
      const el = document.getElementById(id);
      if (el && state[id] !== undefined) el.checked = state[id];
    });
  } catch(e) {}
}

// ─── Mode switching ───────────────────────────────────────────────────────────
function switchMode(mode) {
  if (mode === currentMode) return;
  // save current mode state before switching
  if (currentMode === 'normal') saveNormalState();
  else saveSendState();

  currentMode = mode;
  localStorage.setItem(MODE_KEY, mode);

  const normalBuilder = document.getElementById('normalBuilder');
  const sendBuilder   = document.getElementById('sendBuilder');
  const btnNormal     = document.getElementById('modeNormal');
  const btnSend       = document.getElementById('modeSend');

  if (mode === 'normal') {
    normalBuilder.style.display = '';
    sendBuilder.style.display   = 'none';
    btnNormal.classList.add('active');
    btnSend.classList.remove('active');
    loadNormalState();
  } else {
    normalBuilder.style.display = 'none';
    sendBuilder.style.display   = '';
    btnNormal.classList.remove('active');
    btnSend.classList.add('active');
    loadSendState();
  }
}

// ─── Normal mode: collapse helper ────────────────────────────────────────────
function makeHeader(title, body) {
  const header = document.createElement('div');
  header.className = 'component-header';
  const titleEl = document.createElement('span');
  titleEl.className = 'component-title';
  titleEl.textContent = title;
  const collapseBtn = document.createElement('button');
  collapseBtn.className = 'collapse-btn';
  collapseBtn.textContent = '▲';
  collapseBtn.onclick = () => {
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    collapseBtn.textContent = collapsed ? '▲' : '▼';
  };
  header.appendChild(titleEl);
  header.appendChild(collapseBtn);
  return header;
}

// ─── Normal mode: dynamic row builders ───────────────────────────────────────
function addFieldRow() {
  fieldCount++;
  const row = document.createElement('div');
  row.className = 'field-row';
  const body = document.createElement('div');
  body.className = 'component-body';
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
  document.getElementById('dynamicFields').appendChild(row);
  body.querySelector('.remove-btn-red').onclick = () => row.remove();
}

function addButtonRow() {
  buttonCount++;
  const row = document.createElement('div');
  row.className = 'button-row';
  const body = document.createElement('div');
  body.className = 'component-body';
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
  document.getElementById('dynamicFields').appendChild(row);
  body.querySelector('.remove-btn-red').onclick = () => row.remove();
}

function addSelectRow() {
  selectCount++;
  const row = document.createElement('div');
  row.className = 'select-row';
  const body = document.createElement('div');
  body.className = 'component-body';
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
  document.getElementById('dynamicFields').appendChild(row);

  let optionCount = 0;
  const optionsContainer = body.querySelector('.options-container');
  body.querySelector('.add-option-btn').onclick = () => {
    optionCount++;
    const option = document.createElement('div');
    option.className = 'select-option';
    const optBody = document.createElement('div');
    optBody.className = 'form-row';
    optBody.style.marginTop = '0.5rem';
    optBody.innerHTML = `
      <input class="form-input option-label" placeholder="Label">
      <input class="form-input option-value" placeholder="Value">
      <input class="form-input option-desc" placeholder="Description">
      <input class="form-input option-emoji" placeholder="Emoji">
    `;
    const optHeader = document.createElement('div');
    optHeader.className = 'option-header';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'option-title';
    titleSpan.textContent = `Option #${optionCount}`;
    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex;gap:0.75rem;align-items:center;';
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-btn';
    collapseBtn.textContent = '▲';
    collapseBtn.onclick = () => {
      const hidden = optBody.style.display === 'none';
      optBody.style.display = hidden ? '' : 'none';
      collapseBtn.textContent = hidden ? '▲' : '▼';
    };
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn-red remove-btn-small';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => option.remove();
    btnGroup.appendChild(collapseBtn);
    btnGroup.appendChild(removeBtn);
    optHeader.appendChild(titleSpan);
    optHeader.appendChild(btnGroup);
    option.appendChild(optHeader);
    option.appendChild(optBody);
    optionsContainer.appendChild(option);
  };
  const removeMenuBtns = body.querySelectorAll('.remove-btn-red');
  removeMenuBtns[removeMenuBtns.length - 1].onclick = () => row.remove();
}

function addModalRow() {
  modalCount++;
  const row = document.createElement('div');
  row.className = 'modal-row';
  const body = document.createElement('div');
  body.className = 'component-body';
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
  document.getElementById('dynamicFields').appendChild(row);

  let inputCount = 0;
  const inputsContainer = body.querySelector('.modal-inputs-container');
  body.querySelector('.add-modal-input-btn').onclick = () => {
    inputCount++;
    const input = document.createElement('div');
    input.className = 'modal-input';
    const inpBody = document.createElement('div');
    inpBody.className = 'modal-input-body';
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
    const inpHeader = document.createElement('div');
    inpHeader.className = 'option-header';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'option-title';
    titleSpan.textContent = `Text Input #${inputCount}`;
    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex;gap:0.75rem;align-items:center;';
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-btn';
    collapseBtn.textContent = '▲';
    collapseBtn.onclick = () => {
      const hidden = inpBody.style.display === 'none';
      inpBody.style.display = hidden ? '' : 'none';
      collapseBtn.textContent = hidden ? '▲' : '▼';
    };
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn-red remove-btn-small';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => input.remove();
    btnGroup.appendChild(collapseBtn);
    btnGroup.appendChild(removeBtn);
    inpHeader.appendChild(titleSpan);
    inpHeader.appendChild(btnGroup);
    input.appendChild(inpHeader);
    input.appendChild(inpBody);
    inputsContainer.appendChild(input);
  };
  const btns = body.querySelectorAll('.remove-btn-red');
  btns[btns.length - 1].onclick = () => row.remove();
}

// ─── Normal mode: generate ────────────────────────────────────────────────────
function generateNormalEmbed() {
  const error = document.getElementById('error');
  error.textContent = '';
  clearInlineErrors();
  let hasErrors = false;
  let code = '$nomention\n';

  const authorName = document.getElementById('authorName').value.trim();
  const authorIcon = document.getElementById('authorIcon').value.trim();
  const authorUrl  = document.getElementById('authorUrl').value.trim();
  if ((authorIcon || authorUrl) && !authorName) {
    formRowError(document.getElementById('authorName'), 'Author Name required when Icon/URL is set');
    hasErrors = true;
  }
  if (authorIcon && !isValidUrl(authorIcon)) {
    formRowError(document.getElementById('authorIcon'), 'Author Icon: invalid URL');
    hasErrors = true;
  }
  if (authorUrl && !isValidUrl(authorUrl)) {
    formRowError(document.getElementById('authorUrl'), 'Author URL: invalid URL');
    hasErrors = true;
  }

  const titleVal = document.getElementById('title').value.trim();
  const titleUrl = document.getElementById('titleUrl').value.trim();
  if (titleUrl && !titleVal) {
    formRowError(document.getElementById('title'), 'Title required when Title URL is set');
    hasErrors = true;
  }
  if (titleUrl && !isValidUrl(titleUrl)) {
    formRowError(document.getElementById('titleUrl'), 'Title URL: invalid URL');
    hasErrors = true;
  }

  const colorVal = document.getElementById('color').value.trim();
  if (colorVal && !isValidHex(colorVal)) {
    formRowError(document.getElementById('color'), 'Color: must be a valid hex code (e.g. #7289da)');
    hasErrors = true;
  }

  const thumbnailVal = document.getElementById('thumbnail').value.trim();
  if (thumbnailVal && !isValidUrl(thumbnailVal)) {
    formRowError(document.getElementById('thumbnail'), 'Thumbnail: invalid URL');
    hasErrors = true;
  }
  const imageVal = document.getElementById('image').value.trim();
  if (imageVal && !isValidUrl(imageVal)) {
    formRowError(document.getElementById('image'), 'Image: invalid URL');
    hasErrors = true;
  }

  const footerVal  = document.getElementById('footer').value.trim();
  const footerIcon = document.getElementById('footerIcon').value.trim();
  if (footerIcon && !footerVal) {
    formRowError(document.getElementById('footer'), 'Footer Text required when Footer Icon is set');
    hasErrors = true;
  }
  if (footerIcon && !isValidUrl(footerIcon)) {
    formRowError(document.getElementById('footerIcon'), 'Footer Icon: invalid URL');
    hasErrors = true;
  }

  document.querySelectorAll('.field-row').forEach((row, i) => {
    const n = i + 1;
    const nameEl  = row.querySelector('.field-name');
    const valueEl = row.querySelector('.field-value');
    const name    = nameEl?.value.trim();
    const value   = valueEl?.value.trim();
    const formRow = row.querySelector('.form-row');
    if (!name || !value) { bodyRowError(formRow, `Field ${n}: Name and Value required`); hasErrors = true; }
    else if (name === value) { bodyRowError(formRow, `Field ${n}: Name and Value can't be the same`); hasErrors = true; }
  });

  document.querySelectorAll('.button-row').forEach((row, i) => {
    const n      = i + 1;
    const label  = row.querySelector('.button-label')?.value.trim();
    const id     = row.querySelector('.button-id')?.value.trim();
    const url    = row.querySelector('.button-url')?.value.trim();
    const style  = row.querySelector('.button-style')?.value;
    const formRow = row.querySelector('.form-row');
    if (!label) { bodyRowError(formRow, `Button ${n}: Label required`); hasErrors = true; }
    if (style === 'link' && !url) { bodyRowError(formRow, `Button ${n}: URL required for Link style`); hasErrors = true; }
    else if (style === 'link' && url && !isValidUrl(url)) { bodyRowError(formRow, `Button ${n}: invalid URL`); hasErrors = true; }
    else if (style !== 'link' && !id) { bodyRowError(formRow, `Button ${n}: Custom ID required`); hasErrors = true; }
  });

  document.querySelectorAll('.select-row').forEach((row, i) => {
    const n      = i + 1;
    const menuId = row.querySelector('.select-id')?.value.trim();
    const formRow = row.querySelector('.form-row');
    if (!menuId) { bodyRowError(formRow, `Select Menu ${n}: Menu ID required`); hasErrors = true; return; }
    const options = row.querySelectorAll('.select-option');
    if (options.length === 0) { bodyRowError(formRow, `Select Menu ${n}: Add at least one option`); hasErrors = true; return; }
    options.forEach((opt, j) => {
      const m = j + 1;
      const optFormRow = opt.querySelector('.form-row');
      const label = opt.querySelector('.option-label')?.value.trim();
      const value = opt.querySelector('.option-value')?.value.trim();
      const desc  = opt.querySelector('.option-desc')?.value.trim();
      if (!label || !value || !desc) { bodyRowError(optFormRow, `Menu ${n} Option ${m}: Label, Value and Description required`); hasErrors = true; }
      else if (value !== menuId) { bodyRowError(optFormRow, `Menu ${n} Option ${m}: Value must match Menu ID`); hasErrors = true; }
    });
  });

  const modalIdMap = {};
  document.querySelectorAll('.modal-row').forEach((row, i) => {
    const id = row.querySelector('.modal-id')?.value.trim();
    if (id) { if (!modalIdMap[id]) modalIdMap[id] = []; modalIdMap[id].push(i); }
  });
  document.querySelectorAll('.modal-row').forEach((row, i) => {
    const n       = i + 1;
    const title   = row.querySelector('.modal-title')?.value.trim();
    const customId = row.querySelector('.modal-id')?.value.trim();
    const formRow = row.querySelector('.form-row');
    if (!title || !customId) { bodyRowError(formRow, `Modal ${n}: ID and Title required`); hasErrors = true; }
    if (customId && modalIdMap[customId]?.length > 1) { bodyRowError(formRow, `Modal ${n}: Duplicate ID "${customId}"`); hasErrors = true; }
    if (!title || !customId) return;
    const inputs = row.querySelectorAll('.modal-input');
    if (inputs.length === 0) { bodyRowError(formRow, `Modal ${n}: Add at least one text input`); hasErrors = true; return; }
    let validInputCount = 0;
    inputs.forEach((inp, j) => {
      const m = j + 1;
      const inpFormRow = inp.querySelector('.form-row');
      const label = inp.querySelector('.input-label')?.value.trim();
      const id    = inp.querySelector('.input-id')?.value.trim();
      const placeholder = inp.querySelector('.input-placeholder')?.value.trim() || '';
      const minLen = parseInt(inp.querySelector('.input-minlen')?.value || '0', 10);
      const maxLen = parseInt(inp.querySelector('.input-maxlen')?.value || '0', 10);
      const lenRow = inp.querySelectorAll('.form-row')[1];
      if (!label) { bodyRowError(inpFormRow, `Modal ${n} Input ${m}: Label required`); hasErrors = true; }
      else if (label.length > 45) { bodyRowError(inpFormRow, `Modal ${n} Input ${m}: Label max 45 chars`); hasErrors = true; }
      if (placeholder.length > 100) { bodyRowError(inpFormRow, `Modal ${n} Input ${m}: Placeholder max 100 chars`); hasErrors = true; }
      if (lenRow) {
        if (minLen > 4000 || maxLen > 4000) { bodyRowError(lenRow, `Modal ${n} Input ${m}: Length can't exceed 4000`); hasErrors = true; }
        else if (maxLen > 0 && maxLen < minLen) { bodyRowError(lenRow, `Modal ${n} Input ${m}: Max < Min`); hasErrors = true; }
      }
      if (id) validInputCount++;
    });
    if (validInputCount === 0) { bodyRowError(row.querySelector('.form-row'), `Modal ${n}: All inputs need an Input ID`); hasErrors = true; }
  });

  if (hasErrors) {
    const first = document.querySelector('.inline-error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Build code
  const authorNameS = sanitizeInput(authorName);
  const authorIconS = sanitizeInput(authorIcon);
  const authorUrlS  = sanitizeInput(authorUrl);
  if (authorNameS) {
    code += `$author[${authorNameS}`;
    if (authorIconS) code += `;${authorIconS}`;
    if (authorUrlS)  code += `;${authorUrlS}`;
    code += ']\n';
  }

  const titleS    = sanitizeInput(titleVal);
  const titleUrlS = sanitizeInput(titleUrl);
  if (titleS) {
    code += `$title[${titleS}`;
    if (titleUrlS) code += `;${titleUrlS}`;
    code += ']\n';
  }

  const desc = sanitizeInput(document.getElementById('description').value);
  if (desc) code += `$description[${desc}]\n`;

  const thumbnail = sanitizeInput(document.getElementById('thumbnail').value);
  if (thumbnail) code += `$thumbnail[${thumbnail}]\n`;

  const image = sanitizeInput(document.getElementById('image').value);
  if (image) code += `$image[${image}]\n`;

  const color = document.getElementById('color').value || '#7289da';
  code += `$color[${color}]\n`;

  const footerS     = sanitizeInput(footerVal);
  const footerIconS = sanitizeInput(footerIcon);
  if (footerS) {
    code += `$footer[${footerS}`;
    if (footerIconS) code += `;${footerIconS}`;
    code += ']\n';
  }

  if (document.getElementById('timestamp').checked) code += '$addTimestamp\n';

  document.querySelectorAll('.field-row').forEach(row => {
    const name   = sanitizeInput(row.querySelector('.field-name')?.value);
    const value  = sanitizeInput(row.querySelector('.field-value')?.value);
    const inline = row.querySelector('.field-inline')?.checked ? 'yes' : 'no';
    if (name && value) code += `$addField[${name};${value};${inline}]\n`;
  });

  document.querySelectorAll('.button-row').forEach(row => {
    const label    = sanitizeInput(row.querySelector('.button-label')?.value);
    const customId = sanitizeInput(row.querySelector('.button-id')?.value);
    const style    = row.querySelector('.button-style')?.value || 'primary';
    const disabled = row.querySelector('.button-disabled')?.checked ? 'yes' : 'no';
    const newRow   = row.querySelector('.button-newrow')?.checked ? 'yes' : 'no';
    const emoji    = sanitizeInput(row.querySelector('.button-emoji')?.value);
    const url      = sanitizeInput(row.querySelector('.button-url')?.value);
    if (label || emoji) {
      if (style === 'link' && url) {
        code += `$addButton[1;${label || 'Link'};${url};${disabled};${emoji}]\n`;
      } else if (customId) {
        const styleNum = {primary:1,secondary:2,success:3,danger:4}[style] || 1;
        code += `$addButton[${newRow};${label};${styleNum};${customId};${disabled};${emoji}]\n`;
      }
    }
  });

  document.querySelectorAll('.select-row').forEach(row => {
    const placeholder = sanitizeInput(row.querySelector('.select-placeholder')?.value);
    const customId    = sanitizeInput(row.querySelector('.select-id')?.value);
    const minValues   = row.querySelector('.select-min')?.value || '1';
    const maxValues   = row.querySelector('.select-max')?.value || '1';
    if (customId) {
      code += `$addSelectMenu[${customId};${placeholder || 'Select an option'};${minValues};${maxValues}]\n`;
      row.querySelectorAll('.select-option').forEach(opt => {
        const label = sanitizeInput(opt.querySelector('.option-label')?.value);
        const value = sanitizeInput(opt.querySelector('.option-value')?.value);
        const desc  = sanitizeInput(opt.querySelector('.option-desc')?.value);
        const emoji = sanitizeInput(opt.querySelector('.option-emoji')?.value);
        if (label && value) code += `$addSelectMenuOption[${customId};${label};${value};${desc};${emoji}]\n`;
      });
    }
  });

  document.querySelectorAll('.modal-row').forEach(row => {
    const title    = sanitizeInput(row.querySelector('.modal-title')?.value);
    const customId = sanitizeInput(row.querySelector('.modal-id')?.value);
    if (title && customId) {
      code += `$newModal[${customId};${title}]\n`;
      row.querySelectorAll('.modal-input').forEach(input => {
        const label       = sanitizeInput(input.querySelector('.input-label')?.value);
        const id          = sanitizeInput(input.querySelector('.input-id')?.value);
        const style       = input.querySelector('.input-style')?.value || 'short';
        const required    = input.querySelector('.input-required')?.checked ? 'yes' : 'no';
        const placeholder = sanitizeInput(input.querySelector('.input-placeholder')?.value);
        if (label && id) code += `$addTextInput[${id};${style};${label};${required};${placeholder}]\n`;
      });
    }
  });

  const output    = document.getElementById('output');
  const charCount = document.getElementById('charCount');
  output.textContent    = code.trim();
  charCount.textContent = output.textContent.length + ' characters';
  saveNormalState();
}

// ─── Send mode: generate ──────────────────────────────────────────────────────
function generateSendEmbed() {
  const s_error    = document.getElementById('s_error');
  const s_output   = document.getElementById('s_output');
  const s_charCount = document.getElementById('s_charCount');
  s_error.textContent = '';
  clearInlineErrors();
  let hasErrors = false;

  const channelId  = document.getElementById('s_channelId').value.trim();
  const content    = document.getElementById('s_content').value.trim();
  const authorName = document.getElementById('s_authorName').value.trim();
  const authorIcon = document.getElementById('s_authorIcon').value.trim();
  const titleVal   = document.getElementById('s_title').value.trim();
  const titleUrl   = document.getElementById('s_titleUrl').value.trim();
  const desc       = document.getElementById('s_description').value.trim();
  const thumbnail  = document.getElementById('s_thumbnail').value.trim();
  const image      = document.getElementById('s_image').value.trim();
  const colorVal   = document.getElementById('s_color').value.trim();
  const footerVal  = document.getElementById('s_footer').value.trim();
  const footerIcon = document.getElementById('s_footerIcon').value.trim();
  const timestamp  = document.getElementById('s_timestamp').checked ? 'yes' : 'no';
  const returnId   = document.getElementById('s_returnMsgId').checked ? 'yes' : 'no';

  // Validation
  if (!channelId) {
    formRowError(document.getElementById('s_channelId'), 'Channel ID is required');
    hasErrors = true;
  }
  if (authorIcon && !authorName) {
    formRowError(document.getElementById('s_authorName'), "Author Name required when Author Icon is set");
    hasErrors = true;
  }
  if (authorIcon && !isValidUrl(authorIcon)) {
    formRowError(document.getElementById('s_authorIcon'), 'Author Icon: invalid URL');
    hasErrors = true;
  }
  if (titleUrl && !titleVal) {
    formRowError(document.getElementById('s_title'), 'Title required when Title URL is set');
    hasErrors = true;
  }
  if (titleUrl && !isValidUrl(titleUrl)) {
    formRowError(document.getElementById('s_titleUrl'), 'Title URL: invalid URL');
    hasErrors = true;
  }
  if (thumbnail && !isValidUrl(thumbnail)) {
    formRowError(document.getElementById('s_thumbnail'), 'Thumbnail: invalid URL');
    hasErrors = true;
  }
  if (image && !isValidUrl(image)) {
    formRowError(document.getElementById('s_image'), 'Image: invalid URL');
    hasErrors = true;
  }
  if (colorVal && !isValidHex(colorVal)) {
    formRowError(document.getElementById('s_color'), 'Color: must be a valid hex code (e.g. #5865F2)');
    hasErrors = true;
  }
  if (footerIcon && !footerVal) {
    formRowError(document.getElementById('s_footer'), 'Footer Text required when Footer Icon is set');
    hasErrors = true;
  }
  if (footerIcon && !isValidUrl(footerIcon)) {
    formRowError(document.getElementById('s_footerIcon'), 'Footer Icon: invalid URL');
    hasErrors = true;
  }

  if (hasErrors) {
    const first = document.querySelector('.inline-error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Build $sendEmbedMessage[channelID;content;title;titleURL;description;color;author;authorIcon;footer;footerIcon;thumbnail;image;timestamp;returnMessageID]
  const parts = [
    channelId,
    sanitizeInput(content),
    sanitizeInput(titleVal),
    sanitizeInput(titleUrl),
    sanitizeInput(desc),
    colorVal || '#7289da',
    sanitizeInput(authorName),
    sanitizeInput(authorIcon),
    sanitizeInput(footerVal),
    sanitizeInput(footerIcon),
    sanitizeInput(thumbnail),
    sanitizeInput(image),
    timestamp,
    returnId
  ];

  const code = `$sendEmbedMessage[${parts.join(';')}]`;
  s_output.textContent    = code;
  s_charCount.textContent = code.length + ' characters';
  saveSendState();
}

// ─── Copy helper ──────────────────────────────────────────────────────────────
function copyOutput(outputId, btnEl) {
  const output = document.getElementById(outputId);
  if (!output || !output.textContent || output.textContent.includes('Generated code appears here')) {
    showToast('Nothing to copy', true);
    return;
  }
  navigator.clipboard.writeText(output.textContent).then(() => {
    const original = btnEl.textContent;
    btnEl.textContent = 'Copied!';
    btnEl.style.background = 'hsl(120deg 100% 30%)';
    setTimeout(() => { btnEl.textContent = original; btnEl.style.background = ''; }, 2000);
  }).catch(() => showToast('Copy failed', true));
}

// ─── DOMContentLoaded ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Apply saved mode on load
  const normalBuilder = document.getElementById('normalBuilder');
  const sendBuilder   = document.getElementById('sendBuilder');
  const btnNormal     = document.getElementById('modeNormal');
  const btnSend       = document.getElementById('modeSend');

  if (currentMode === 'send') {
    normalBuilder.style.display = 'none';
    sendBuilder.style.display   = '';
    btnNormal.classList.remove('active');
    btnSend.classList.add('active');
    loadSendState();
  } else {
    loadNormalState();
  }

  // Toggle buttons
  btnNormal.addEventListener('click', () => switchMode('normal'));
  btnSend.addEventListener('click',   () => switchMode('send'));

  // ── Normal mode wiring ──────────────────────────────────────────────────────
  document.getElementById('generateBtn').addEventListener('click', generateNormalEmbed);

  document.getElementById('copyBtn').addEventListener('click', function() {
    copyOutput('output', this);
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    clearInlineErrors();
    document.getElementById('error').textContent = '';
    document.querySelectorAll('#normalBuilder .form-input, #normalBuilder .form-textarea').forEach(input => {
      input.value = input.id === 'color' ? '#7289da' : '';
    });
    document.querySelectorAll('#normalBuilder .form-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('dynamicFields').innerHTML = '';
    fieldCount = 0; buttonCount = 0; selectCount = 0; modalCount = 0;
    document.getElementById('output').textContent    = 'Generated code appears here...';
    document.getElementById('charCount').textContent = '0 characters';
    localStorage.removeItem(NORMAL_KEY);
  });

  document.getElementById('addField').addEventListener('click',  addFieldRow);
  document.getElementById('addButton').addEventListener('click', addButtonRow);
  document.getElementById('addSelect').addEventListener('click', addSelectRow);
  document.getElementById('addModal').addEventListener('click',  addModalRow);

  // Auto-save normal mode on input
  document.getElementById('normalBuilder').addEventListener('input',  saveNormalState);
  document.getElementById('normalBuilder').addEventListener('change', saveNormalState);

  // ── Send mode wiring ────────────────────────────────────────────────────────
  document.getElementById('s_generateBtn').addEventListener('click', generateSendEmbed);

  document.getElementById('s_copyBtn').addEventListener('click', function() {
    copyOutput('s_output', this);
  });

  document.getElementById('s_clearBtn').addEventListener('click', () => {
    clearInlineErrors();
    document.getElementById('s_error').textContent = '';
    SEND_FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = id === 's_color' ? '#7289da' : '';
    });
    SEND_CHECKS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    document.getElementById('s_output').textContent    = 'Generated code appears here...';
    document.getElementById('s_charCount').textContent = '0 characters';
    localStorage.removeItem(SEND_KEY);
  });

  // Auto-save send mode on input
  document.getElementById('sendBuilder').addEventListener('input',  saveSendState);
  document.getElementById('sendBuilder').addEventListener('change', saveSendState);
});
