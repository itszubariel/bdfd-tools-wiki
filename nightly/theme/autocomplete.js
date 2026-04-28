// Setting
let autocompleteEnabled = true;

// Hoisted stubs — kept for any legacy references in updateAutocompleteState
let updateAutocomplete = () => {};
let updateTooltip = () => {};

function changeAutocomplete() {
  autocompleteEnabled = !autocompleteEnabled;
  autoSettingChange("changeAutocompleteButton", autocompleteEnabled);

  // Toggle CodeMirror autocompletion extension
  if (window.cmEditor && window._cmCompartments && window._cmExtensions) {
    const { autocompleteCompartment } = window._cmCompartments;
    const { autocompletion, completeFromList, completions } =
      window._cmExtensions;
    window.cmEditor.dispatch({
      effects: autocompleteCompartment.reconfigure(
        autocompleteEnabled
          ? autocompletion({
              override: [completeFromList(completions)],
              activateOnTyping: true,
            })
          : autocompletion({ override: [] }),
      ),
    });
  }
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

function updateAutocompleteState() {
  // No-op: CodeMirror manages its own autocomplete state
}

// Content is saved to localStorage automatically — no warning needed on unload

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
