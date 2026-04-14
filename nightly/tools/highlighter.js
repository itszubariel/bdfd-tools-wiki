(function () {
  'use strict';

  let allFunctions = [];

  const baseItems = [
    { name: "Default Text", color: "#e4e4e7", style: 0 },
    { name: "Fallback", color: "#cbcbdf", style: 0 },
    { name: "Numbers", color: "#cbcbdf", style: 0 },
    { name: "Brackets", color: "#ff006e", style: 1 },
    { name: "Semicolon", color: "#ff4500", style: 1 },
    { name: "$nomention", color: "#8b5cf6", style: 0 },
    { name: "$catch", color: "#8b5cf6", style: 0 },
    { name: "$else", color: "#8b5cf6", style: 0 },
    { name: "$elseif", color: "#8b5cf6", style: 0 },
    { name: "$endif", color: "#8b5cf6", style: 0 },
    { name: "$error", color: "#8b5cf6", style: 0 },
    { name: "$if", color: "#8b5cf6", style: 0 }
  ];

  fetch('functions.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Failed to load functions');
      return response.json();
    })
    .then(function (data) {
      allFunctions = (data.functions || []).map(function (fn) {
        return fn.includes('[') ? fn.split('[')[0] + '[]' : fn;
      });
      console.log('Loaded ' + allFunctions.length + ' functions from functions.json');
    })
    .catch(function (error) {
      console.error('Error loading functions:', error);
      allFunctions = ['$nomention', '$if', '$else', '$endif', '$error', '$catch'];
    });

  window.addEventListener('load', function () {
    const addFunctionBtn = document.getElementById('addFunctionBtn');
    const functionDropdown = document.getElementById('functionDropdown');
    const functionSearch = document.getElementById('functionSearch');
    const functionList = document.getElementById('functionList');
    const functionsGrid = document.getElementById('functionsGrid');
    const generateBtn = document.getElementById('generateBtn');
    const output = document.getElementById('output');
    const copyOutputBtn = document.getElementById('copyOutputBtn');
    const infoText = document.getElementById('infoText');
    const errorText = document.getElementById('errorText');
    const importThemeBtn = document.getElementById('importThemeBtn');
    const deleteAllBtn = document.getElementById('deleteAllBtn');

    const editModal = document.getElementById('editModal');
    const modalClose = document.getElementById('modalClose');
    const colorPickerVisual = document.getElementById('colorPickerVisual');
    const hexInput = document.getElementById('hexInput');
    const modalPreview = document.getElementById('modalPreview');
    const modalSave = document.getElementById('modalSave');
    const styleButtons = document.querySelectorAll('.style-btn');

    const importModal = document.getElementById('importModal');
    const importModalClose = document.getElementById('importModalClose');
    const importTextarea = document.getElementById('importTextarea');
    const importError = document.getElementById('importError');
    const cancelImport = document.getElementById('cancelImport');
    const applyImport = document.getElementById('applyImport');

    const deleteModal = document.getElementById('deleteModal');
    const deleteModalClose = document.getElementById('deleteModalClose');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');

    const deleteAllModal = document.getElementById('deleteAllModal');
    const deleteAllModalClose = document.getElementById('deleteAllModalClose');
    const cancelDeleteAll = document.getElementById('cancelDeleteAll');
    const confirmDeleteAll = document.getElementById('confirmDeleteAll');

    if (!addFunctionBtn || !generateBtn) {
      console.error('Required elements not found');
      return;
    }

    const savedTheme = localStorage.getItem('savedTheme');
    let theme = {};

    if (savedTheme) {
      Object.assign(theme, JSON.parse(savedTheme));
    } else {
      baseItems.forEach(function (item) {
        theme[item.name] = { color: item.color, style: item.style };
      });
    }

    let currentEditFunction = null;
    let currentEditStyle = 0;
    let functionToDelete = null;

    function hexToUInt32(hex) {
      return parseInt(hex.replace('#', '0xFF'), 16) >>> 0;
    }

    function uint32ToHex(uint32) {
      const red = (uint32 >> 16) & 0xff;
      const green = (uint32 >> 8) & 0xff;
      const blue = uint32 & 0xff;
      return '#' + red.toString(16).padStart(2, '0') + green.toString(16).padStart(2, '0') + blue.toString(16).padStart(2, '0');
    }

    function renderFunctions() {
      functionsGrid.innerHTML = '';
      let count = 0;

      Object.keys(theme).forEach(function (fn, idx) {
        count++;
        const card = document.createElement('div');
        card.className = 'function-card';

        const info = document.createElement('div');
        info.className = 'function-info';

        const badge = document.createElement('div');
        badge.className = 'color-badge';
        badge.style.backgroundColor = theme[fn].color;

        const name = document.createElement('div');
        name.className = 'function-name';
        name.textContent = fn;

        info.appendChild(badge);
        info.appendChild(name);

        const actions = document.createElement('div');
        actions.className = 'function-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.innerHTML = '✏️';
        editBtn.dataset.fn = fn;
        editBtn.onclick = function () { openEditModal(fn); };

        actions.appendChild(editBtn);

        if (idx >= 5) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'action-btn';
          deleteBtn.innerHTML = '🗑️';
          deleteBtn.dataset.fn = fn;
          deleteBtn.onclick = function () { openDeleteModal(fn); };
          actions.appendChild(deleteBtn);
        }

        card.appendChild(info);
        card.appendChild(actions);
        functionsGrid.appendChild(card);
      });

      infoText.textContent = count + ' function' + (count !== 1 ? 's' : '');
    }

    function renderFunctionList() {
      const query = functionSearch.value.toLowerCase();
      functionList.innerHTML = '';

      allFunctions
        .filter(function (fn) { return fn.toLowerCase().includes(query) && !theme[fn]; })
        .forEach(function (fn) {
          const item = document.createElement('div');
          item.className = 'function-item';
          item.textContent = fn;
          item.onclick = function () {
            theme[fn] = { color: '#8b5cf6', style: 0 };
            renderFunctions();
            functionDropdown.classList.remove('active');
            localStorage.setItem('savedTheme', JSON.stringify(theme));
          };
          functionList.appendChild(item);
        });
    }

    function openEditModal(fn) {
      currentEditFunction = fn;
      currentEditStyle = theme[fn].style;
      hexInput.value = theme[fn].color;
      colorPickerVisual.style.backgroundColor = theme[fn].color;

      styleButtons.forEach(function (btn) {
        btn.classList.toggle('active', parseInt(btn.dataset.style) === currentEditStyle);
      });

      updateModalPreview();
      editModal.classList.add('active');
    }

    function updateModalPreview() {
      if (!currentEditFunction) return;

      modalPreview.style.color = hexInput.value;
      modalPreview.style.fontWeight = (currentEditStyle === 1 || currentEditStyle === 3) ? 'bold' : 'normal';
      modalPreview.style.fontStyle = (currentEditStyle === 2 || currentEditStyle === 3) ? 'italic' : 'normal';
      modalPreview.textContent = currentEditFunction;
    }

    function openDeleteModal(fn) {
      functionToDelete = fn;
      deleteModal.classList.add('active');
    }

    addFunctionBtn.onclick = function () {
      functionDropdown.classList.toggle('active');
      if (functionDropdown.classList.contains('active')) {
        functionSearch.value = '';
        renderFunctionList();
        functionSearch.focus();
      }
    };

    functionSearch.oninput = renderFunctionList;

    document.addEventListener('click', function (e) {
      if (!functionDropdown.contains(e.target) && !addFunctionBtn.contains(e.target)) {
        functionDropdown.classList.remove('active');
      }
    });

    styleButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentEditStyle = parseInt(btn.dataset.style);
        styleButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        updateModalPreview();
      });
    });

    hexInput.oninput = function () {
      let val = hexInput.value.toUpperCase().trim();
      if (!val.startsWith('#')) {
        val = '#' + val;
        hexInput.value = val;
      }
      if (val.length > 7) {
        val = val.substring(0, 7);
        hexInput.value = val;
      }
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        colorPickerVisual.style.backgroundColor = val;
        updateModalPreview();
      }
    };

    colorPickerVisual.onclick = function () {
      const input = document.createElement('input');
      input.type = 'color';
      input.value = hexInput.value;
      input.style.cssText = 'position:fixed;top:-100px;left:-100px;opacity:0;width:1px;height:1px;';
      document.body.appendChild(input);
      input.oninput = function () {
        hexInput.value = input.value;
        colorPickerVisual.style.backgroundColor = input.value;
        updateModalPreview();
      };
      input.onchange = function () {
        hexInput.value = input.value;
        colorPickerVisual.style.backgroundColor = input.value;
        updateModalPreview();
        document.body.removeChild(input);
      };
      input.click();
    };

    modalClose.onclick = function () {
      editModal.classList.remove('active');
      currentEditFunction = null;
    };

    modalSave.onclick = function () {
      if (currentEditFunction) {
        theme[currentEditFunction].color = hexInput.value;
        theme[currentEditFunction].style = currentEditStyle;
        renderFunctions();
        editModal.classList.remove('active');
        currentEditFunction = null;
        localStorage.setItem('savedTheme', JSON.stringify(theme));
      }
    };

    deleteModalClose.onclick = function () {
      deleteModal.classList.remove('active');
      functionToDelete = null;
    };

    cancelDelete.onclick = function () {
      deleteModal.classList.remove('active');
      functionToDelete = null;
    };

    confirmDelete.onclick = function () {
      if (functionToDelete) {
        delete theme[functionToDelete];
        renderFunctions();
        deleteModal.classList.remove('active');
        functionToDelete = null;
        localStorage.setItem('savedTheme', JSON.stringify(theme));
      }
    };

    importThemeBtn.onclick = function () {
      importTextarea.value = '';
      importError.textContent = '';
      importModal.classList.add('active');
    };

    importModalClose.onclick = function () {
      importModal.classList.remove('active');
    };

    cancelImport.onclick = function () {
      importModal.classList.remove('active');
    };

    applyImport.onclick = function () {
      const text = importTextarea.value.trim();
      if (!text) {
        importError.textContent = 'Please paste a JSON theme.';
        return;
      }

      let importedTheme;
      try {
        importedTheme = JSON.parse(text);
      } catch (e) {
        importError.textContent = 'Invalid JSON format.';
        return;
      }

      const baseKeyMap = {
        defaultTextHighlight: "Default Text",
        fallbackHighlight: "Fallback",
        numberHighlight: "Numbers",
        bracketHighlight: "Brackets",
        semicolonHighlight: "Semicolon"
      };

      Object.keys(theme).forEach(function (k) { delete theme[k]; });

      for (const key in importedTheme) {
        if (key === 'functionsHighlights') continue;
        if (baseKeyMap[key] && importedTheme[key] && typeof importedTheme[key].color === 'number' && typeof importedTheme[key].style === 'number') {
          theme[baseKeyMap[key]] = {
            color: uint32ToHex(importedTheme[key].color),
            style: importedTheme[key].style
          };
        }
      }

      if (importedTheme.functionsHighlights && typeof importedTheme.functionsHighlights === 'object') {
        for (const fn in importedTheme.functionsHighlights) {
          const val = importedTheme.functionsHighlights[fn];
          if (val && typeof val.color === 'number' && typeof val.style === 'number') {
            theme[fn] = {
              color: uint32ToHex(val.color),
              style: val.style
            };
          }
        }
      }

      renderFunctions();
      localStorage.setItem('savedTheme', JSON.stringify(theme));
      importModal.classList.remove('active');
      infoText.textContent = 'Theme imported successfully';
    };

    deleteAllBtn.onclick = function () {
      deleteAllModal.classList.add('active');
    };

    deleteAllModalClose.onclick = function () {
      deleteAllModal.classList.remove('active');
    };

    cancelDeleteAll.onclick = function () {
      deleteAllModal.classList.remove('active');
    };

    confirmDeleteAll.onclick = function () {
      localStorage.removeItem('savedTheme');
      Object.keys(theme).forEach(function (k) { delete theme[k]; });
      baseItems.forEach(function (item) {
        theme[item.name] = { color: item.color, style: item.style };
      });
      renderFunctions();
      deleteAllModal.classList.remove('active');
      infoText.textContent = 'Saved theme deleted and reset.';
    };

    generateBtn.onclick = function () {
      const baseKeys = {
        'Default Text': 'defaultTextHighlight',
        'Fallback': 'fallbackHighlight',
        'Numbers': 'numberHighlight',
        'Brackets': 'bracketHighlight',
        'Semicolon': 'semicolonHighlight'
      };

      const result = {};

      Object.keys(baseKeys).forEach(function (key) {
        if (theme[key]) {
          result[baseKeys[key]] = {
            color: hexToUInt32(theme[key].color),
            style: theme[key].style
          };
        }
      });

      const funcHighlights = {};
      Object.keys(theme).forEach(function (fn) {
        if (!baseKeys[fn] && fn !== 'Semicolon') {
          funcHighlights[fn] = {
            color: hexToUInt32(theme[fn].color),
            style: theme[fn].style
          };
        }
      });

      if (Object.keys(funcHighlights).length > 0) {
        result.functionsHighlights = funcHighlights;
      }

      output.textContent = JSON.stringify(result, null, 2);
    };

    copyOutputBtn.onclick = function () {
      if (!output.textContent || output.textContent === 'Your highlighted code will appear here...') {
        errorText.textContent = 'Generate code first';
        return;
      }

      navigator.clipboard.writeText(output.textContent).then(function () {
        const original = copyOutputBtn.innerHTML;
        copyOutputBtn.innerHTML = '✅ Copied!';
        setTimeout(function () {
          copyOutputBtn.innerHTML = original;
        }, 2000);
      }).catch(function () {
        errorText.textContent = 'Copy failed';
      });
    };

    renderFunctions();
  });
})();
