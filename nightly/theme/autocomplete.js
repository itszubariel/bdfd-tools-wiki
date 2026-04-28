// Setting
let autocompleteEnabled = true;

// Hoisted so updateAutocompleteState() can reference them
let updateAutocomplete = () => {};
let updateTooltip = () => {};

function changeAutocomplete() {
  autocompleteEnabled = !autocompleteEnabled;
  const autocompleteElement = document.getElementById("autocomplete");
  autocompleteElement.style.display = autocompleteEnabled ? "block" : "none";
  autoSettingChange("changeAutocompleteButton", autocompleteEnabled);
  updateAutocompleteState();
}

function autoSettingChange(buttonName, status) {
  const button = document.getElementById(buttonName);
  if (!button) {
    console.error(`Failed to find "${buttonName}" button.`);
    return;
  }
  const activeGradient =
    "linear-gradient(to right, rgb(255 255 255 / 40%), rgb(1 192 36 / 75%))";
  const inactiveGradient =
    "linear-gradient(to left, rgb(255 255 255 / 40%), rgb(192 1 1 / 75%))";
  button.style.background = status ? activeGradient : inactiveGradient;
}

// Main autocomplete
function autocomplete() {
  const base = window.location.pathname.substring(
    0,
    window.location.pathname.lastIndexOf("/") + 1,
  );
  fetch(base + "../tools/functions_tag.json")
    .then((res) => res.json())
    .then((data) => {
      const functions = data.functions || [];
      const textarea = document.getElementById("editor");
      const autocompleteOutput = document.getElementById("autocomplete");
      let cursorInactiveTimeout;
      let selectedIndex = -1;

      // Move autocomplete inside the editor's parent so position: absolute works correctly
      const scriptDiv =
        textarea.closest(".scriptdiv") ?? textarea.parentElement;
      scriptDiv.style.position = "relative";
      scriptDiv.appendChild(autocompleteOutput);

      function hideAutocomplete() {
        autocompleteOutput.innerHTML = "";
        autocompleteOutput.style.display = "none";
        clearTimeout(cursorInactiveTimeout);
        selectedIndex = -1;
        Array.from(autocompleteOutput.children).forEach((child) =>
          child.classList.remove("selected"),
        );
      }

      updateAutocomplete = function () {
        if (!autocompleteEnabled) {
          hideAutocomplete();
          return;
        }
        const inputText = textarea.value;
        const cursorPosition = textarea.selectionStart;
        let dollarIndex = inputText
          .substring(0, cursorPosition)
          .lastIndexOf("$");
        if (dollarIndex === -1) {
          hideAutocomplete();
          return;
        }
        const searchTerm = inputText
          .substring(dollarIndex, cursorPosition)
          .toLowerCase();
        autocompleteOutput.innerHTML = "";
        const matchingFunctions = functions.filter((entry) =>
          entry.tag.toLowerCase().startsWith(searchTerm),
        );
        const displayedFunctions = matchingFunctions.slice(0, 6);
        selectedIndex = -1;
        Array.from(autocompleteOutput.children).forEach((child) =>
          child.classList.remove("selected"),
        );

        displayedFunctions.forEach((entry) => {
          const span = document.createElement("span");
          const displayName = entry.tag.includes("[")
            ? entry.tag.substring(0, entry.tag.indexOf("["))
            : entry.tag;
          const preview =
            entry.tag.length > 40
              ? entry.tag.substring(0, 40) + "..."
              : entry.tag;

          span.style.display = "flex";
          span.style.justifyContent = "space-between";
          span.style.gap = "1rem";

          const nameEl = document.createElement("span");
          nameEl.textContent = displayName;

          const previewEl = document.createElement("span");
          previewEl.textContent = preview;
          previewEl.style.color = "rgba(255,255,255,0.35)";
          previewEl.style.fontSize = "0.9em";
          previewEl.style.whiteSpace = "nowrap";
          previewEl.style.overflow = "hidden";
          previewEl.style.textOverflow = "ellipsis";
          previewEl.style.maxWidth = "55%";
          previewEl.style.display = "none";

          span.addEventListener("mouseenter", () => {
            previewEl.style.display = "block";
          });
          span.addEventListener("mouseleave", () => {
            previewEl.style.display = "none";
          });

          span.appendChild(nameEl);
          span.appendChild(previewEl);
          span.dataset.tag = entry.tag;
          span.addEventListener("click", () =>
            selectFunction(entry.tag, dollarIndex, cursorPosition, inputText),
          );
          autocompleteOutput.appendChild(span);
        });

        clearTimeout(cursorInactiveTimeout);
        cursorInactiveTimeout = setTimeout(hideAutocomplete, 10000);

        // Position dropdown above or below the editor box
        const lineHeight =
          parseInt(window.getComputedStyle(textarea).lineHeight) || 24;
        const lines = inputText.substring(0, cursorPosition).split("\n").length;
        const cursorY = lines * lineHeight - textarea.scrollTop;
        const textareaHeight = textarea.offsetHeight;
        const dropdownHeight = autocompleteOutput.offsetHeight || 250;
        const spaceBelow = textareaHeight - cursorY;

        if (spaceBelow < dropdownHeight + 8) {
          autocompleteOutput.style.bottom = textareaHeight + "px";
          autocompleteOutput.style.top = "auto";
        } else {
          autocompleteOutput.style.top = textareaHeight + "px";
          autocompleteOutput.style.bottom = "auto";
        }

        autocompleteOutput.style.display = "block";
      };

      function selectFunction(func, dollarIndex, cursorPosition, inputText) {
        textarea.value =
          inputText.substring(0, dollarIndex) +
          func +
          inputText.substring(cursorPosition);
        textarea.selectionStart = textarea.selectionEnd =
          dollarIndex + func.length;
        hideAutocomplete();
        textarea.focus();
        hideAutocomplete();
      }

      function handleArrowKeys(event) {
        if (autocompleteOutput.children.length === 0) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          selectedIndex = Math.min(
            selectedIndex + 1,
            autocompleteOutput.children.length - 1,
          );
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, 0);
        } else if (event.key === "Enter" && selectedIndex !== -1) {
          event.preventDefault();
          const selectedFunction =
            autocompleteOutput.children[selectedIndex].dataset.tag;
          const inputText = textarea.value;
          const cursorPosition = textarea.selectionStart;
          let dollarIndex = inputText
            .substring(0, cursorPosition)
            .lastIndexOf("$");
          selectFunction(
            selectedFunction,
            dollarIndex,
            cursorPosition,
            inputText,
          );
          return;
        }
        highlightSelected();
      }

      function highlightSelected() {
        Array.from(autocompleteOutput.children).forEach((child, index) => {
          const isSelected = index === selectedIndex;
          child.classList.toggle("selected", isSelected);
          const preview = child.querySelector("span:last-child");
          if (preview) preview.style.display = isSelected ? "block" : "none";
        });
      }

      if (textarea) {
        textarea.addEventListener("input", updateAutocomplete);
        textarea.addEventListener("mouseup", updateAutocomplete);
        textarea.addEventListener("keydown", (event) => {
          if (
            event.key === "ArrowDown" ||
            event.key === "ArrowUp" ||
            event.key === "Enter"
          ) {
            handleArrowKeys(event);
          }
        });

        textarea.addEventListener("blur", () => {
          setTimeout(hideAutocomplete, 200);
        });

        document.addEventListener("click", (event) => {
          if (
            !autocompleteOutput.contains(event.target) &&
            event.target !== textarea
          ) {
            hideAutocomplete();
          }
        });
      }
    })
    .catch((err) => console.error("Failed to load functions_tag.json:", err));
}

function addTooltips() {
  const textarea = document.getElementById("editor");
  const tooltip = document.createElement("div");
  tooltip.id = "tooltip";
  tooltip.style.position = "absolute";
  tooltip.style.display = "none";
  tooltip.style.zIndex = "1001";
  document.body.appendChild(tooltip);

  textarea.addEventListener("keyup", updateTooltip);
  textarea.addEventListener("mouseup", updateTooltip);

  function updateTooltip() {
    if (!autocompleteEnabled) {
      tooltip.style.display = "none";
      return;
    }

    const text = textarea.value;
    const cursor = textarea.selectionStart;
    const commandTrigger = "$commandTrigger";
    const isSlashTrigger = "$isSlash";
    const timestampTrigger = "$getTimestamp";
    let tooltipText = "";

    if (
      text.substring(cursor - commandTrigger.length, cursor) === commandTrigger
    ) {
      const name = document.getElementById("name").value || "trigger";
      tooltipText = `Returns '${name}'`;
    } else if (
      text.substring(cursor - isSlashTrigger.length, cursor) === isSlashTrigger
    ) {
      const slash = document
        .getElementById("scriptType")
        .textContent.includes("Slash Command")
        ? "true"
        : "false";
      tooltipText = `Returns '${slash}'`;
    } else if (
      text
        .substring(cursor - timestampTrigger.length, cursor)
        .startsWith(timestampTrigger)
    ) {
      const timestamp = Math.floor(Date.now() / 1000);
      tooltipText = `Returns '${timestamp}'`;
    }

    if (tooltipText) {
      const { left, top } = textarea.getBoundingClientRect();
      const textareaStyle = window.getComputedStyle(textarea);
      let lineHeight = parseInt(textareaStyle.lineHeight);
      lineHeight = isNaN(lineHeight) ? 16 : lineHeight;
      const paddingTop = parseInt(textareaStyle.paddingTop) || 0;
      const borderTopWidth = parseInt(textareaStyle.borderTopWidth) || 0;
      const x = left + cursor * 8;
      const y =
        top +
        paddingTop +
        borderTopWidth +
        Math.floor(
          textarea.value.substring(0, textarea.selectionStart).split("\n")
            .length,
        ) *
          lineHeight +
        30;

      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.textContent = tooltipText;
      tooltip.style.display = "block";
    } else {
      tooltip.style.display = "none";
    }
  }
}

function updateAutocompleteState() {
  const textarea = document.getElementById("editor");
  const autocompleteOutput = document.getElementById("autocomplete");
  if (!autocompleteEnabled) {
    autocompleteOutput.innerHTML = ""; // Clear autocomplete
    textarea.removeEventListener("input", updateAutocomplete);
    textarea.removeEventListener("mouseup", updateAutocomplete);
    document.getElementById("tooltip").style.display = "none"; // Hide tooltip
    textarea.removeEventListener("keyup", updateTooltip);
    textarea.removeEventListener("mouseup", updateTooltip);
  } else {
    textarea.addEventListener("input", updateAutocomplete);
    textarea.addEventListener("mouseup", updateAutocomplete);
    textarea.addEventListener("keyup", updateTooltip);
    textarea.addEventListener("mouseup", updateTooltip);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  if (window.location.href.includes("editor.html")) {
    autocomplete();
    addTooltips();
    updateAutocompleteState();
  }
});

window.addEventListener("beforeunload", function (event) {
  const textarea = document.getElementById("editor");

  if (textarea.value.trim() === "") {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
  const confirmationMessage = "Are you sure you want to leave the page?";
  return confirmationMessage;
});

function updateInternetConnection() {
  const text = document.getElementById("internetConnection");

  if (text) {
    if (window.navigator.onLine) {
      text.textContent = "👍 All services work stably.";
      text.style.color = "green";
    } else {
      text.textContent =
        "🛜 Check your internet connection! It may affect some services...";
      text.style.color = "red";
    }
  } else {
    clearInterval(intervalId);
  }
}

const intervalId = setInterval(updateInternetConnection, 1000);
