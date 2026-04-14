let fieldCount = 0, buttonCount = 0, selectCount = 0, modalCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const addField = document.getElementById('addField');
  const addButton = document.getElementById('addButton');
  const addSelect = document.getElementById('addSelect');
  const addModal = document.getElementById('addModal');
  const output = document.getElementById('output');
  const charCount = document.getElementById('charCount');
  const error = document.getElementById('error');
  const dynamicFields = document.getElementById('dynamicFields');

  generateBtn.onclick = generateEmbed;
  copyBtn.onclick = copyOutput;
  clearBtn.onclick = clearAll;
  addField.onclick = () => addFieldRow();
  addButton.onclick = () => addButtonRow();
  addSelect.onclick = () => addSelectRow();
  addModal.onclick = () => addModalRow();

  function sanitize(str) {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\$/g, '%{DOL}%')
      .replace(/;/g, '\\;')
      .replace(/\]/g, '\\]');
  }

  function generateEmbed() {
    error.textContent = '';
    let code = '$nomention\n';
    
    // Author
    const authorName = sanitize(document.getElementById('authorName').value);
    const authorIcon = sanitize(document.getElementById('authorIcon').value);
    const authorUrl = sanitize(document.getElementById('authorUrl').value);
    if (authorName) {
      code += `$author[${authorName}`;
      if (authorIcon) code += `;${authorIcon}`;
      if (authorUrl) code += `;${authorUrl}`;
      code += ']\n';
    }

    // Title
    const title = sanitize(document.getElementById('title').value);
    const titleUrl = sanitize(document.getElementById('titleUrl').value);
    if (title) {
      code += `$title[${title}`;
      if (titleUrl) code += `;${titleUrl}`;
      code += ']\n';
    }

    // Description
    const desc = sanitize(document.getElementById('description').value);
    if (desc) code += `$description[${desc}]\n`;

    // Thumbnail
    const thumbnail = sanitize(document.getElementById('thumbnail').value);
    if (thumbnail) code += `$thumbnail[${thumbnail}]\n`;

    // Image
    const image = sanitize(document.getElementById('image').value);
    if (image) code += `$image[${image}]\n`;

    // Color
    const color = document.getElementById('color').value || '#7289da';
    code += `$color[${color}]\n`;

    // Footer
    const footer = sanitize(document.getElementById('footer').value);
    const footerIcon = sanitize(document.getElementById('footerIcon').value);
    if (footer) {
      code += `$footer[${footer}`;
      if (footerIcon) code += `;${footerIcon}`;
      code += ']\n';
    }

    // Timestamp
    if (document.getElementById('timestamp').checked) code += '$addTimestamp\n';

    // Dynamic fields
    document.querySelectorAll('.field-row').forEach(row => {
      const name = sanitize(row.querySelector('.field-name')?.value);
      const value = sanitize(row.querySelector('.field-value')?.value);
      const inline = row.querySelector('.field-inline')?.checked ? 'yes' : 'no';
      if (name && value) code += `$addField[${name};${value};${inline}]\n`;
    });

    // Buttons
    document.querySelectorAll('.button-row').forEach(row => {
      const label = sanitize(row.querySelector('.button-label')?.value);
      const customId = sanitize(row.querySelector('.button-id')?.value);
      const style = row.querySelector('.button-style')?.value || 'primary';
      const disabled = row.querySelector('.button-disabled')?.checked ? 'yes' : 'no';
      const emoji = sanitize(row.querySelector('.button-emoji')?.value);
      const url = sanitize(row.querySelector('.button-url')?.value);
      
      if (label || emoji) {
        if (style === 'link' && url) {
          code += `$addButton[1;${label || 'Link'};${url};${disabled};${emoji}]\n`;
        } else if (customId) {
          const styleNum = {primary: 1, secondary: 2, success: 3, danger: 4}[style] || 1;
          code += `$addButton[no;${label};${styleNum};${customId};${disabled};${emoji}]\n`;
        }
      }
    });

    // Select menus
    document.querySelectorAll('.select-row').forEach(row => {
      const placeholder = sanitize(row.querySelector('.select-placeholder')?.value);
      const customId = sanitize(row.querySelector('.select-id')?.value);
      const minValues = row.querySelector('.select-min')?.value || '1';
      const maxValues = row.querySelector('.select-max')?.value || '1';
      
      if (customId) {
        code += `$addSelectMenu[${customId};${placeholder || 'Select an option'};${minValues};${maxValues}]\n`;
        
        row.querySelectorAll('.select-option').forEach(opt => {
          const label = sanitize(opt.querySelector('.option-label')?.value);
          const value = sanitize(opt.querySelector('.option-value')?.value);
          const desc = sanitize(opt.querySelector('.option-desc')?.value);
          const emoji = sanitize(opt.querySelector('.option-emoji')?.value);
          
          if (label && value) {
            code += `$addSelectMenuOption[${customId};${label};${value};${desc};${emoji}]\n`;
          }
        });
      }
    });

    // Modals
    document.querySelectorAll('.modal-row').forEach(row => {
      const title = sanitize(row.querySelector('.modal-title')?.value);
      const customId = sanitize(row.querySelector('.modal-id')?.value);
      
      if (title && customId) {
        code += `$newModal[${customId};${title}]\n`;
        
        row.querySelectorAll('.modal-input').forEach(input => {
          const label = sanitize(input.querySelector('.input-label')?.value);
          const id = sanitize(input.querySelector('.input-id')?.value);
          const style = input.querySelector('.input-style')?.value || 'short';
          const required = input.querySelector('.input-required')?.checked ? 'yes' : 'no';
          const placeholder = sanitize(input.querySelector('.input-placeholder')?.value);
          
          if (label && id) {
            code += `$addTextInput[${id};${style};${label};${required};${placeholder}]\n`;
          }
        });
      }
    });

    output.textContent = code.trim();
    charCount.textContent = output.textContent.length + ' characters';
  }

  function copyOutput() {
    if (!output.textContent || output.textContent === 'Generated code appears here...') {
      error.textContent = 'Nothing to copy';
      return;
    }
    
    navigator.clipboard.writeText(output.textContent).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.style.background = 'hsl(120deg 100% 30%)';
      setTimeout(() => {
        copyBtn.textContent = original;
        copyBtn.style.background = '';
      }, 2000);
    }).catch(() => {
      error.textContent = 'Copy failed';
    });
  }

  function clearAll() {
    document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
      if (input.id === 'color') {
        input.value = '#7289da';
      } else {
        input.value = '';
      }
    });
    document.querySelectorAll('.form-checkbox').forEach(cb => cb.checked = false);
    dynamicFields.innerHTML = '';
    fieldCount = 0;
    buttonCount = 0;
    selectCount = 0;
    modalCount = 0;
    output.textContent = 'Generated code appears here...';
    charCount.textContent = '0 characters';
    error.textContent = '';
  }

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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
        <label class="checkbox-label" style="margin: 0;">
          <input type="checkbox" class="form-checkbox field-inline">
          <span>Inline</span>
        </label>
        <button class="remove-btn remove-btn-red">Remove</button>
      </div>
    `;
    row.appendChild(makeHeader(`Field #${fieldCount}`, body));
    row.appendChild(body);
    dynamicFields.appendChild(row);
    body.querySelector('.remove-btn').onclick = () => row.remove();
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
      <div class="form-row" style="margin-top: 0.75rem;">
        <input class="form-input button-emoji" placeholder="Emoji">
        <input class="form-input button-url" placeholder="URL (for Link style)">
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
        <label class="checkbox-label" style="margin: 0;">
          <input type="checkbox" class="form-checkbox button-disabled">
          <span>Disabled</span>
        </label>
        <button class="remove-btn remove-btn-red">Remove</button>
      </div>
    `;
    row.appendChild(makeHeader(`Button #${buttonCount}`, body));
    row.appendChild(body);
    dynamicFields.appendChild(row);
    body.querySelector('.remove-btn').onclick = () => row.remove();
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
      <div class="options-container" style="margin-top: 1rem;"></div>
      <div style="display: flex; gap: 0.75rem; margin-top: 0.75rem;">
        <button class="add-field-btn add-option-btn">+ Option</button>
        <button class="remove-btn remove-btn-red">Remove Menu</button>
      </div>
    `;
    row.appendChild(makeHeader(`Select Menu #${selectCount}`, body));
    row.appendChild(body);
    dynamicFields.appendChild(row);

    let optionCount = 0;
    const optionsContainer = body.querySelector('.options-container');
    body.querySelector('.add-option-btn').onclick = () => {
      optionCount++;
      const option = document.createElement('div');
      option.className = 'select-option';
      option.innerHTML = `
        <div class="option-header">
          <span class="option-title">Option #${optionCount}</span>
          <button class="remove-btn remove-btn-red remove-btn-small">✕</button>
        </div>
        <div class="form-row" style="margin-top: 0.5rem;">
          <input class="form-input option-label" placeholder="Label">
          <input class="form-input option-value" placeholder="Value">
          <input class="form-input option-desc" placeholder="Description">
          <input class="form-input option-emoji" placeholder="Emoji">
        </div>
      `;
      optionsContainer.appendChild(option);
      option.querySelector('.remove-btn').onclick = () => option.remove();
    };
    const removeMenuBtn = body.querySelectorAll('.remove-btn-red');
    removeMenuBtn[removeMenuBtn.length - 1].onclick = () => row.remove();
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
      <div class="modal-inputs-container" style="margin-top: 1rem;"></div>
      <div style="display: flex; gap: 0.75rem; margin-top: 0.75rem;">
        <button class="add-field-btn add-modal-input-btn">+ Text Input</button>
        <button class="remove-btn remove-btn-red">Remove Modal</button>
      </div>
    `;
    row.appendChild(makeHeader(`Modal #${modalCount}`, body));
    row.appendChild(body);
    dynamicFields.appendChild(row);

    let inputCount = 0;
    const inputsContainer = body.querySelector('.modal-inputs-container');
    body.querySelector('.add-modal-input-btn').onclick = () => {
      inputCount++;
      const input = document.createElement('div');
      input.className = 'modal-input';
      input.innerHTML = `
        <div class="option-header">
          <span class="option-title">Text Input #${inputCount}</span>
          <button class="remove-btn remove-btn-red remove-btn-small">✕</button>
        </div>
        <div class="form-row" style="margin-top: 0.5rem;">
          <input class="form-input input-label" placeholder="Label">
          <input class="form-input input-id" placeholder="Input ID">
          <select class="form-input input-style">
            <option value="short">Short</option> 
            <option value="paragraph">Paragraph</option>
          </select>
          <input class="form-input input-placeholder" placeholder="Placeholder">
        </div>
        <label class="checkbox-label">
          <input type="checkbox" class="form-checkbox input-required" checked>
          <span>Required</span>
        </label>
      `;
      inputsContainer.appendChild(input);
      input.querySelector('.remove-btn').onclick = () => input.remove();
    };
    const btns = body.querySelectorAll('.remove-btn-red');
    btns[btns.length - 1].onclick = () => row.remove();
  }
});
