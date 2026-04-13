// Setting
let autocompleteEnabled = true;

function changeAutocomplete() {
  autocompleteEnabled = !autocompleteEnabled;
  autoSettingChange('changeAutocompleteButton', autocompleteEnabled);
  if (!autocompleteEnabled) {
    const ac = document.getElementById('autocomplete');
    if (ac) { ac.innerHTML = ''; ac.style.display = 'none'; }
    const tt = document.getElementById('tooltip');
    if (tt) tt.style.display = 'none';
  }
}

function autoSettingChange(buttonName, status) {
  const button = document.getElementById(buttonName);
  if (!button) { console.error('Failed to find "' + buttonName + '" button.'); return; }
  const activeGradient = 'linear-gradient(to right, rgb(255 255 255 / 40%), rgb(1 192 36 / 75%))';
  const inactiveGradient = 'linear-gradient(to left, rgb(255 255 255 / 40%), rgb(192 1 1 / 75%))';
  button.style.background = status ? activeGradient : inactiveGradient;
}

// Main autocomplete - loads functions from functions.json
function autocomplete() {
  var jsonPath = (typeof path_to_root !== 'undefined' ? path_to_root : '') + 'tools/functions.json';
  fetch(jsonPath)
    .then(function(r) { return r.json(); })
    .then(function(data) { initAutocomplete(data.functions); })
    .catch(function(err) { console.warn('autocomplete: failed to load functions.json', err); });
}

function initAutocomplete(functions) {
  var textarea = document.getElementById('editor');
  if (!textarea) return;

  var dropdown = document.createElement('div');
  dropdown.id = 'autocomplete';
  dropdown.style.position = 'absolute';
  dropdown.style.zIndex = '9999';
  dropdown.style.display = 'none';
  document.body.appendChild(dropdown);

  var hideTimer = null;
  var selectedIndex = -1;

  function hide() {
    dropdown.innerHTML = '';
    dropdown.style.display = 'none';
    clearTimeout(hideTimer);
    selectedIndex = -1;
  }

  function show(inputText, cursorPosition, dollarIndex, matches) {
    dropdown.innerHTML = '';
    selectedIndex = -1;

    matches.forEach(function(func) {
      var span = document.createElement('span');
      span.textContent = func;
      span.addEventListener('mousedown', function(e) {
        e.preventDefault();
        insert(func, dollarIndex, cursorPosition, inputText);
      });
      dropdown.appendChild(span);
    });

    // Position near the cursor line, not the bottom of the textarea
    var rect = textarea.getBoundingClientRect();
    var style = window.getComputedStyle(textarea);
    var lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 20;
    var paddingTop = parseFloat(style.paddingTop) || 0;
    var paddingLeft = parseFloat(style.paddingLeft) || 0;
    var charWidth = parseFloat(style.fontSize) * 0.6;

    var textBefore = inputText.substring(0, cursorPosition);
    var lines = textBefore.split('\n');
    var lineIndex = lines.length - 1;
    var currentLine = lines[lineIndex];

    // Cursor X based on current line char count; cursor Y accounts for textarea.scrollTop
    var cursorX = rect.left + window.scrollX + paddingLeft + currentLine.length * charWidth;
    var cursorY = rect.top + window.scrollY + paddingTop + (lineIndex + 1) * lineHeight - textarea.scrollTop;

    // Clamp to viewport width
    var dropdownWidth = 220;
    var maxLeft = window.scrollX + window.innerWidth - dropdownWidth - 8;
    cursorX = Math.min(cursorX, maxLeft);
    cursorX = Math.max(cursorX, window.scrollX + 4);

    dropdown.style.left = cursorX + 'px';
    dropdown.style.top = (cursorY + 4) + 'px';
    dropdown.style.minWidth = dropdownWidth + 'px';
    dropdown.style.display = 'block';

    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 10000);
  }

  function update() {
    if (!autocompleteEnabled) { hide(); return; }
    var inputText = textarea.value;
    var cursorPosition = textarea.selectionStart;
    var textBefore = inputText.substring(0, cursorPosition);
    var dollarIndex = textBefore.lastIndexOf('$');
    if (dollarIndex === -1) { hide(); return; }
    var searchTerm = textBefore.substring(dollarIndex).toLowerCase();
    var matches = functions
      .filter(function(f) { return f.toLowerCase().startsWith(searchTerm); })
      .slice(0, 8);
    if (matches.length === 0) { hide(); return; }
    show(inputText, cursorPosition, dollarIndex, matches);
  }

  function insert(func, dollarIndex, cursorPosition, inputText) {
    textarea.value = inputText.substring(0, dollarIndex) + func + inputText.substring(cursorPosition);
    textarea.selectionStart = textarea.selectionEnd = dollarIndex + func.length;
    hide();
    textarea.focus();
    textarea.dispatchEvent(new Event('input'));
  }

  function highlight() {
    Array.from(dropdown.children).forEach(function(child, i) {
      child.classList.toggle('selected', i === selectedIndex);
    });
  }

  textarea.addEventListener('input', update);
  textarea.addEventListener('keyup', update);
  textarea.addEventListener('keydown', function(e) {
    if (dropdown.style.display === 'none') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, dropdown.children.length - 1);
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      highlight();
    } else if (e.key === 'Escape') {
      hide();
    } else if (e.key === 'Enter' && selectedIndex !== -1) {
      e.preventDefault();
      var func = dropdown.children[selectedIndex].textContent;
      var inputText = textarea.value;
      var cursorPosition = textarea.selectionStart;
      var dollarIndex = inputText.substring(0, cursorPosition).lastIndexOf('$');
      insert(func, dollarIndex, cursorPosition, inputText);
    }
  });
  textarea.addEventListener('blur', function() {
    setTimeout(hide, 150);
  });
  document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target) && e.target !== textarea) hide();
  });
}

function addTooltips() {
  var textarea = document.getElementById('editor');
  if (!textarea) return;

  var tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.display = 'none';
  tooltip.style.zIndex = '1001';
  document.body.appendChild(tooltip);

  function updateTooltip() {
    if (!autocompleteEnabled) { tooltip.style.display = 'none'; return; }
    var text = textarea.value;
    var cursor = textarea.selectionStart;
    var commandTrigger = '$commandTrigger';
    var isSlashTrigger = '$isSlash';
    var timestampTrigger = '$getTimestamp';
    var tooltipText = '';

    if (text.substring(cursor - commandTrigger.length, cursor) === commandTrigger) {
      var name = document.getElementById('name').value || 'trigger';
      tooltipText = "Returns '" + name + "'";
    } else if (text.substring(cursor - isSlashTrigger.length, cursor) === isSlashTrigger) {
      var slash = document.getElementById('scriptType').textContent.includes('Slash Command') ? 'true' : 'false';
      tooltipText = "Returns '" + slash + "'";
    } else if (text.substring(cursor - timestampTrigger.length, cursor).startsWith(timestampTrigger)) {
      tooltipText = "Returns '" + Math.floor(Date.now() / 1000) + "'";
    }

    if (tooltipText) {
      var rect = textarea.getBoundingClientRect();
      var style = window.getComputedStyle(textarea);
      var lineHeight = parseInt(style.lineHeight) || 16;
      var paddingTop = parseInt(style.paddingTop) || 0;
      var lines = text.substring(0, cursor).split('\n').length;
      tooltip.style.left = (rect.left + window.scrollX + cursor * 8) + 'px';
      tooltip.style.top = (rect.top + window.scrollY + paddingTop + lines * lineHeight + 4) + 'px';
      tooltip.textContent = tooltipText;
      tooltip.style.display = 'block';
    } else {
      tooltip.style.display = 'none';
    }
  }

  textarea.addEventListener('keyup', updateTooltip);
  textarea.addEventListener('mouseup', updateTooltip);
}

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('editor')) {
    autocomplete();
    addTooltips();
  }
});

window.addEventListener('beforeunload', function(event) {
  var textarea = document.getElementById('editor');
  if (!textarea || textarea.value.trim() === '') return;
  event.preventDefault();
  event.returnValue = '';
});

function updateInternetConnection() {
  var text = document.getElementById('internetConnection');
  if (text) {
    if (window.navigator.onLine) {
      text.textContent = '\uD83D\uDC4D All services work stably.';
      text.style.color = 'green';
    } else {
      text.textContent = '\uD83D\uDEDC Check your internet connection! It may affect some services...';
      text.style.color = 'red';
    }
  } else {
    clearInterval(intervalId);
  }
}

var intervalId = setInterval(updateInternetConnection, 1000);
