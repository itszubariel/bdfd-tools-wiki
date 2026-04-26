// Enhanced JSON Validator Application with search and key management

// DOM Elements
const jsonInput = document.getElementById('jsonInput');
const validateBtn = document.getElementById('validateBtn');
const formatBtn = document.getElementById('formatBtn');
const clearBtn = document.getElementById('clearBtn');
const searchSection = document.getElementById('searchSection');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchStats = document.getElementById('searchStats');
const advancedControls = document.getElementById('advancedControls');
const addKeyBtn = document.getElementById('addKeyBtn');
const duplicateKeyBtn = document.getElementById('duplicateKeyBtn');
const deleteKeyBtn = document.getElementById('deleteKeyBtn');
const addKeyDialog = document.getElementById('addKeyDialog');
const newKeyName = document.getElementById('newKeyName');
const newKeyValue = document.getElementById('newKeyValue');
const newKeyPath = document.getElementById('newKeyPath');
const saveNewKeyBtn = document.getElementById('saveNewKeyBtn');
const cancelNewKeyBtn = document.getElementById('cancelNewKeyBtn');
const statsSection = document.getElementById('statsSection');
const statsGrid = document.getElementById('statsGrid');
const keysSection = document.getElementById('keysSection');
const keysCount = document.getElementById('keysCount');
const keysContainer = document.getElementById('keysContainer');
const errorsSection = document.getElementById('errorsSection');
const errorList = document.getElementById('errorList');
const previewSection = document.getElementById('previewSection');
const jsonPreview = document.getElementById('jsonPreview');

// Current state
let currentJson = null;
let editingItem = null;
let keyIndexMap = new Map();
let selectedKeys = new Set();
let searchQuery = '';
let searchType = 'name';
let allKeysData = [];

// Initialize the application
function initializeApp() {
    // Add event listeners
    validateBtn.addEventListener('click', validateJson);
    formatBtn.addEventListener('click', formatJson);
    clearBtn.addEventListener('click', clearJson);
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    document.querySelectorAll('input[name="searchType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            searchType = e.target.value;
            handleSearch();
        });
    });
    
    // Advanced controls
    addKeyBtn.addEventListener('click', showAddKeyDialog);
    duplicateKeyBtn.addEventListener('click', duplicateSelectedKeys);
    deleteKeyBtn.addEventListener('click', deleteSelectedKeys);
    
    // Add key dialog
    saveNewKeyBtn.addEventListener('click', saveNewKey);
    cancelNewKeyBtn.addEventListener('click', hideAddKeyDialog);
    
    // Auto-validate on input with debounce
    let debounceTimer;
    jsonInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(validateJson, 500);
    });
    
    // Initial validation
    validateJson();
}

// Validate JSON function
function validateJson() {
    const input = jsonInput.value.trim();
    
    // Clear previous results
    clearResults();
    keyIndexMap.clear();
    selectedKeys.clear();
    allKeysData = [];
    
    if (!input) {
        showNoInputMessage();
        return;
    }
    
    try {
        // Parse JSON
        currentJson = JSON.parse(input);
        
        // Update UI for valid JSON
        jsonInput.classList.remove('invalid');
        jsonInput.classList.add('valid');
        
        // Show controls
        searchSection.style.display = 'block';
        advancedControls.style.display = 'flex';
        
        // Show statistics
        showStatistics(currentJson);
        
        // Show keys
        collectAllKeys(currentJson);
        showKeys(allKeysData);
        
        // Show preview
        showPreview(currentJson);
        
    } catch (error) {
        // Handle JSON parsing errors
        jsonInput.classList.remove('valid');
        jsonInput.classList.add('invalid');
        searchSection.style.display = 'none';
        advancedControls.style.display = 'none';
        
        showError(error);
    }
}

// Format JSON function
function formatJson() {
    const input = jsonInput.value.trim();
    
    if (!input) {
        alert('Please enter some JSON to format.');
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        jsonInput.value = formatted;
        
        // Re-validate after formatting
        validateJson();
        
    } catch (error) {
        alert('Invalid JSON. Cannot format.');
    }
}

// Clear JSON function
function clearJson() {
    jsonInput.value = '';
    clearResults();
    jsonInput.classList.remove('valid', 'invalid');
    searchSection.style.display = 'none';
    advancedControls.style.display = 'none';
    hideAddKeyDialog();
    showNoInputMessage();
}

// Clear all result sections
function clearResults() {
    statsSection.style.display = 'none';
    keysSection.style.display = 'none';
    errorsSection.style.display = 'none';
    previewSection.style.display = 'none';
    statsGrid.innerHTML = '';
    keysContainer.innerHTML = '';
    errorList.innerHTML = '';
    jsonPreview.innerHTML = '';
    selectedKeys.clear();
    updateSelectedCount();
}

// Show message when no input
function showNoInputMessage() {
    previewSection.style.display = 'block';
    jsonPreview.innerHTML = '<div class="no-results">Enter JSON data to begin validation</div>';
}

// Show error message
function showError(error) {
    errorsSection.style.display = 'block';
    
    const errorItem = document.createElement('li');
    errorItem.innerHTML = `
        <span class="error-icon">❌</span>
        <div>
            <strong>${error.name}:</strong> ${error.message}
            ${error.lineNumber ? `<br><small>Line: ${error.lineNumber}</small>` : ''}
        </div>
    `;
    
    errorList.appendChild(errorItem);
}

// Collect all keys from JSON
function collectAllKeys(json) {
    allKeysData = [];
    
    function collect(obj, path = '') {
        if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => {
                const fullPath = path ? `${path}.${key}` : key;
                const value = obj[key];
                const valueType = getValueType(value);
                
                allKeysData.push({
                    key: key,
                    path: fullPath,
                    value: value,
                    valueType: valueType,
                    displayValue: formatValueForDisplay(value),
                    parentPath: path
                });
                
                if (typeof value === 'object' && value !== null) {
                    collect(value, fullPath);
                }
            });
        }
    }
    
    collect(json);
}

// Calculate and display JSON statistics
function showStatistics(json) {
    statsSection.style.display = 'block';
    
    const stats = calculateStatistics(json);
    
    const statItems = [
        { label: 'Total Keys', value: stats.totalKeys },
        { label: 'Unique Keys', value: stats.uniqueKeys },
        { label: 'Duplicate Keys', value: stats.duplicateKeys },
        { label: 'Nesting Depth', value: stats.maxDepth },
        { label: 'Object Count', value: stats.objectCount },
        { label: 'Array Count', value: stats.arrayCount },
        { label: 'String Values', value: stats.stringCount },
        { label: 'Number Values', value: stats.numberCount },
        { label: 'Boolean Values', value: stats.booleanCount },
        { label: 'Null Values', value: stats.nullCount },
        { label: 'Total Size', value: `${stats.totalSize} bytes` },
        { label: 'JSON Type', value: getRootType(json) }
    ];
    
    statsGrid.innerHTML = '';
    statItems.forEach(stat => {
        const statElement = document.createElement('div');
        statElement.className = 'stat-item';
        statElement.innerHTML = `
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value">${stat.value}</div>
        `;
        statsGrid.appendChild(statElement);
    });
}

// Calculate various statistics about the JSON
function calculateStatistics(obj, depth = 0) {
    const stats = {
        totalKeys: 0,
        uniqueKeys: new Set(),
        duplicateKeys: 0,
        maxDepth: depth,
        objectCount: 0,
        arrayCount: 0,
        stringCount: 0,
        numberCount: 0,
        booleanCount: 0,
        nullCount: 0,
        totalSize: JSON.stringify(obj).length
    };
    
    function traverse(current, currentDepth) {
        stats.maxDepth = Math.max(stats.maxDepth, currentDepth);
        
        if (Array.isArray(current)) {
            stats.arrayCount++;
            current.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    traverse(item, currentDepth + 1);
                }
            });
        } else if (typeof current === 'object' && current !== null) {
            stats.objectCount++;
            
            Object.keys(current).forEach(key => {
                stats.totalKeys++;
                
                if (stats.uniqueKeys.has(key)) {
                    stats.duplicateKeys++;
                } else {
                    stats.uniqueKeys.add(key);
                }
                
                const value = current[key];
                
                if (typeof value === 'string') {
                    stats.stringCount++;
                } else if (typeof value === 'number') {
                    stats.numberCount++;
                } else if (typeof value === 'boolean') {
                    stats.booleanCount++;
                } else if (value === null) {
                    stats.nullCount++;
                } else if (typeof value === 'object') {
                    traverse(value, currentDepth + 1);
                }
            });
        }
    }
    
    traverse(obj, depth);
    stats.uniqueKeys = stats.uniqueKeys.size;
    
    return stats;
}

// Handle search input
function handleSearch() {
    searchQuery = searchInput.value.trim().toLowerCase();
    
    if (!searchQuery) {
        showKeys(allKeysData);
        searchStats.textContent = '';
        return;
    }
    
    const filteredKeys = allKeysData.filter(item => {
        if (searchType === 'name') {
            return item.key.toLowerCase().includes(searchQuery);
        } else if (searchType === 'value') {
            return JSON.stringify(item.value).toLowerCase().includes(searchQuery);
        } else if (searchType === 'both') {
            return item.key.toLowerCase().includes(searchQuery) || 
                   JSON.stringify(item.value).toLowerCase().includes(searchQuery);
        }
        return false;
    });
    
    showKeys(filteredKeys, true);
    
    // Update search stats
    searchStats.textContent = `Found ${filteredKeys.length} matching key${filteredKeys.length !== 1 ? 's' : ''}`;
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    showKeys(allKeysData);
    searchStats.textContent = '';
}

// Show keys with search highlighting
function showKeys(keysData, highlightMatches = false) {
    keysSection.style.display = 'block';
    keysContainer.innerHTML = '';
    
    if (keysData.length === 0) {
        keysCount.textContent = '0';
        keysContainer.innerHTML = '<div class="no-results">No keys found</div>';
        return;
    }
    
    keysCount.textContent = keysData.length;
    
    // Group keys by name
    const keyGroups = new Map();
    keysData.forEach(item => {
        if (!keyGroups.has(item.key)) {
            keyGroups.set(item.key, []);
        }
        keyGroups.get(item.key).push(item);
    });
    
    // Create UI for each key group
    keyGroups.forEach((items, keyName) => {
        const groupElement = document.createElement('div');
        groupElement.className = 'key-group';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'key-group-title';
        titleElement.innerHTML = `
            <span>${highlightText(keyName, searchQuery)}</span>
            <div class="key-group-info">
                <span class="key-count">${items.length}</span>
                <div class="key-group-controls">
                    <button class="group-button delete-all" title="Delete all ${keyName} keys">
                        🗑️
                    </button>
                </div>
            </div>
        `;
        
        // Add delete all functionality
        titleElement.querySelector('.delete-all').addEventListener('click', () => {
            if (confirm(`Delete all "${keyName}" keys?`)) {
                deleteKeysByName(keyName);
            }
        });
        
        const keysListElement = document.createElement('div');
        keysListElement.className = 'keys-list';
        
        items.forEach((item, index) => {
            const keyElement = createKeyElement(item, index, highlightMatches);
            keysListElement.appendChild(keyElement);
        });
        
        groupElement.appendChild(titleElement);
        groupElement.appendChild(keysListElement);
        keysContainer.appendChild(groupElement);
    });
}

// Create a key element
function createKeyElement(item, index, highlightMatches = false) {
    const keyElement = document.createElement('div');
    keyElement.className = 'key-item';
    keyElement.dataset.path = item.path;
    keyElement.dataset.keyIndex = index;
    
    if (selectedKeys.has(item.path)) {
        keyElement.classList.add('selected');
    }
    
    if (highlightMatches && searchQuery && 
        (item.key.toLowerCase().includes(searchQuery) || 
         JSON.stringify(item.value).toLowerCase().includes(searchQuery))) {
        keyElement.classList.add('highlighted');
    }
    
    const keyNameElement = document.createElement('div');
    keyNameElement.className = 'key-name';
    keyNameElement.textContent = highlightText(item.key, searchQuery);
    
    const keyPathElement = document.createElement('div');
    keyPathElement.className = 'key-path';
    keyPathElement.textContent = item.path;
    
    const keyValueElement = document.createElement('div');
    keyValueElement.className = `key-value ${item.valueType}`;
    keyValueElement.textContent = highlightText(item.displayValue, searchQuery);
    
    const actionsElement = document.createElement('div');
    actionsElement.className = 'key-actions';
    
    const editNameBtn = createActionButton('edit-name', '✏️', 'Edit Name', () => 
        startEditingKey(item, keyElement, 'name'));
    
    const editValueBtn = createActionButton('edit-value', '📝', 'Edit Value', () => 
        startEditingKey(item, keyElement, 'value'));
    
    const duplicateBtn = createActionButton('duplicate', '📋', 'Duplicate', () => 
        duplicateKey(item));
    
    const deleteBtn = createActionButton('delete', '🗑️', 'Delete', () => 
        deleteKey(item));
    
    const selectBtn = createActionButton('select', selectedKeys.has(item.path) ? '✅' : '☐', 
        selectedKeys.has(item.path) ? 'Deselect' : 'Select', () => 
        toggleKeySelection(item.path, keyElement, selectBtn));
    
    actionsElement.appendChild(editNameBtn);
    actionsElement.appendChild(editValueBtn);
    actionsElement.appendChild(duplicateBtn);
    actionsElement.appendChild(deleteBtn);
    actionsElement.appendChild(selectBtn);
    
    keyElement.appendChild(keyNameElement);
    keyElement.appendChild(keyPathElement);
    keyElement.appendChild(keyValueElement);
    keyElement.appendChild(actionsElement);
    
    return keyElement;
}

// Create action button
function createActionButton(type, icon, title, onClick) {
    const button = document.createElement('button');
    button.className = `key-button ${type}`;
    button.innerHTML = icon;
    button.title = title;
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });
    return button;
}

// Toggle key selection
function toggleKeySelection(path, element, button) {
    if (selectedKeys.has(path)) {
        selectedKeys.delete(path);
        element.classList.remove('selected');
        button.innerHTML = '☐';
        button.title = 'Select';
    } else {
        selectedKeys.add(path);
        element.classList.add('selected');
        button.innerHTML = '✅';
        button.title = 'Deselect';
    }
    updateSelectedCount();
}

// Update selected keys count
function updateSelectedCount() {
    const count = selectedKeys.size;
    if (count > 0) {
        duplicateKeyBtn.textContent = `Duplicate (${count})`;
        deleteKeyBtn.textContent = `Delete (${count})`;
    } else {
        duplicateKeyBtn.textContent = 'Duplicate Selected';
        deleteKeyBtn.textContent = 'Delete Selected';
    }
}

// Highlight search text
function highlightText(text, query) {
    if (!query || !text) return text;
    
    const lowerText = String(text).toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return `${before}<span style="background-color: #faa61a; color: #000; padding: 2px 0; border-radius: 3px;">${match}</span>${after}`;
}

// Get value type for CSS class
function getValueType(value) {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'unknown';
}

// Format value for display
function formatValueForDisplay(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value.length > 30 ? value.substring(0, 27) + '...' : value}"`;
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return `[${value.length} items]`;
        } else {
            return `{${Object.keys(value).length} keys}`;
        }
    }
    return String(value);
}

// Show add key dialog
function showAddKeyDialog() {
    addKeyDialog.style.display = 'block';
    newKeyName.value = '';
    newKeyValue.value = '';
    newKeyPath.value = '';
    newKeyName.focus();
}

// Hide add key dialog
function hideAddKeyDialog() {
    addKeyDialog.style.display = 'none';
}

// Save new key
function saveNewKey() {
    const keyName = newKeyName.value.trim();
    const keyValue = parseValue(newKeyValue.value.trim());
    const keyPath = newKeyPath.value.trim();
    
    if (!keyName) {
        alert('Please enter a key name');
        return;
    }
    
    try {
        let updatedJson = JSON.parse(jsonInput.value);
        
        if (keyPath) {
            // Add to nested path
            const pathParts = keyPath.split('.');
            let current = updatedJson;
            
            for (let i = 0; i < pathParts.length; i++) {
                if (!current[pathParts[i]] || typeof current[pathParts[i]] !== 'object') {
                    current[pathParts[i]] = {};
                }
                if (i < pathParts.length - 1) {
                    current = current[pathParts[i]];
                } else {
                    current[pathParts[i]][keyName] = keyValue;
                }
            }
        } else {
            // Add to root
            updatedJson[keyName] = keyValue;
        }
        
        jsonInput.value = JSON.stringify(updatedJson, null, 2);
        validateJson();
        hideAddKeyDialog();
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Duplicate selected keys
function duplicateSelectedKeys() {
    if (selectedKeys.size === 0) {
        alert('Please select keys to duplicate');
        return;
    }
    
    const suffix = '_copy';
    try {
        let updatedJson = JSON.parse(jsonInput.value);
        
        selectedKeys.forEach(path => {
            const item = allKeysData.find(k => k.path === path);
            if (item) {
                const newKeyName = item.key + suffix;
                updateKeyInJson(updatedJson, item.path, newKeyName);
            }
        });
        
        jsonInput.value = JSON.stringify(updatedJson, null, 2);
        validateJson();
        selectedKeys.clear();
        updateSelectedCount();
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Delete selected keys
function deleteSelectedKeys() {
    if (selectedKeys.size === 0) {
        alert('Please select keys to delete');
        return;
    }
    
    if (!confirm(`Delete ${selectedKeys.size} selected key${selectedKeys.size !== 1 ? 's' : ''}?`)) {
        return;
    }
    
    try {
        let updatedJson = JSON.parse(jsonInput.value);
        
        selectedKeys.forEach(path => {
            updatedJson = deleteKeyByPath(updatedJson, path);
        });
        
        jsonInput.value = JSON.stringify(updatedJson, null, 2);
        validateJson();
        selectedKeys.clear();
        updateSelectedCount();
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Delete keys by name
function deleteKeysByName(keyName) {
    try {
        let updatedJson = JSON.parse(jsonInput.value);
        const itemsToDelete = allKeysData.filter(item => item.key === keyName);
        
        itemsToDelete.forEach(item => {
            updatedJson = deleteKeyByPath(updatedJson, item.path);
        });
        
        jsonInput.value = JSON.stringify(updatedJson, null, 2);
        validateJson();
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Delete a single key
function deleteKey(item) {
    if (!confirm(`Delete key "${item.key}" at path "${item.path}"?`)) {
        return;
    }
    
    try {
        let updatedJson = JSON.parse(jsonInput.value);
        updatedJson = deleteKeyByPath(updatedJson, item.path);
        
        jsonInput.value = JSON.stringify(updatedJson, null, 2);
        validateJson();
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Duplicate a single key
function duplicateKey(item) {
    const suffix = '_copy';
    try {
        let updatedJson = JSON.parse(jsonInput.value);
        const newKeyName = item.key + suffix;
        updateKeyInJson(updatedJson, item.path, newKeyName);
        
        jsonInput.value = JSON.stringify(updatedJson, null, 2);
        validateJson();
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Start editing a key or value
function startEditingKey(item, element, editType) {
    if (editingItem) {
        cancelEditing(editingItem.element, editingItem.item, editingItem.editType);
    }
    
    editingItem = { element, item, editType };
    element.classList.add('editing');
    
    // Clear the element content
    element.innerHTML = '';
    
    if (editType === 'name') {
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'key-input';
        nameInput.value = item.key;
        nameInput.placeholder = 'Enter new key name';
        
        element.appendChild(nameInput);
        nameInput.focus();
        nameInput.select();
        
        nameInput.addEventListener('blur', () => finishEditingKey(nameInput.value, null));
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finishEditingKey(nameInput.value, null);
            if (e.key === 'Escape') cancelEditing(element, item, editType);
        });
        
    } else if (editType === 'value') {
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'value-input';
        valueInput.value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        valueInput.placeholder = 'Enter new value';
        
        element.appendChild(valueInput);
        valueInput.focus();
        valueInput.select();
        
        valueInput.addEventListener('blur', () => finishEditingKey(null, valueInput.value));
        valueInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finishEditingKey(null, valueInput.value);
            if (e.key === 'Escape') cancelEditing(element, item, editType);
        });
    }
}

// Finish editing
function finishEditingKey(newKey, newValue) {
    if (!editingItem) return;
    
    const { item, element, editType } = editingItem;
    
    try {
        let updatedJson = JSON.parse(jsonInput.value);
        
        if (editType === 'name' && newKey && newKey !== item.key) {
            updatedJson = updateKeyInJson(updatedJson, item.path, newKey);
        } else if (editType === 'value' && newValue !== undefined) {
            updatedJson = updateValueInJson(updatedJson, item.path, parseValue(newValue));
        }
        
        jsonInput.value = JSON.stringify(updatedJson, null, 2);
        validateJson();
        
    } catch (error) {
        alert(`Error: ${error.message}`);
        cancelEditing(element, item, editType);
    }
    
    editingItem = null;
}

// Cancel editing
function cancelEditing(element, item, editType) {
    element.classList.remove('editing');
    
    const newElement = createKeyElement(item, element.dataset.keyIndex, searchQuery !== '');
    element.parentNode.replaceChild(newElement, element);
    
    editingItem = null;
}

// Update a key in JSON structure by path
function updateKeyInJson(json, path, newKey) {
    const pathParts = path.split('.');
    let current = json;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]] === undefined) {
            throw new Error(`Path not found: ${pathParts[i]}`);
        }
        current = current[pathParts[i]];
    }
    
    const oldKey = pathParts[pathParts.length - 1];
    
    if (current[oldKey] !== undefined) {
        current[newKey] = current[oldKey];
        delete current[oldKey];
    }
    
    return json;
}

// Update a value in JSON structure by path
function updateValueInJson(json, path, newValue) {
    const pathParts = path.split('.');
    let current = json;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]] === undefined) {
            throw new Error(`Path not found: ${pathParts[i]}`);
        }
        current = current[pathParts[i]];
    }
    
    const key = pathParts[pathParts.length - 1];
    
    if (current[key] !== undefined) {
        current[key] = newValue;
    }
    
    return json;
}

// Delete key by path
function deleteKeyByPath(json, path) {
    const pathParts = path.split('.');
    let current = json;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]] === undefined) {
            throw new Error(`Path not found: ${pathParts[i]}`);
        }
        current = current[pathParts[i]];
    }
    
    const key = pathParts[pathParts.length - 1];
    
    if (current[key] !== undefined) {
        delete current[key];
    }
    
    return json;
}

// Parse input value to appropriate type
function parseValue(input) {
    const trimmed = input.trim();
    
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {}
    }
    
    if (!isNaN(trimmed) && trimmed !== '') {
        const num = Number(trimmed);
        if (!isNaN(num)) return num;
    }
    
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    if (trimmed.toLowerCase() === 'null') return null;
    
    return trimmed;
}

// Get the root type of JSON
function getRootType(obj) {
    if (Array.isArray(obj)) return 'Array';
    if (typeof obj === 'object' && obj !== null) return 'Object';
    return typeof obj;
}

// Display formatted JSON preview
function showPreview(json) {
    previewSection.style.display = 'block';
    jsonPreview.innerHTML = syntaxHighlight(JSON.stringify(json, null, 2));
}

// Syntax highlighting for JSON
function syntaxHighlight(json) {
    if (!json) return '';
    
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
                match = match.replace(/:$/, '<span class="json-bracket">:</span>');
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        } else if (/\d/.test(match)) {
            cls = 'json-number';
        }
        
        return `<span class="${cls}">${match}</span>`;
    })
    .replace(/{|}|\[|\]/g, (match) => {
        return `<span class="json-bracket">${match}</span>`;
    })
    .replace(/\n/g, '<br>')
    .replace(/ /g, '&nbsp;');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export functions for testing
window.validateJson = validateJson;
window.formatJson = formatJson;
window.clearJson = clearJson;