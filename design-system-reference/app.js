const dialog = document.querySelector("[data-dialog]");
const message = document.querySelector("[data-message]");
const form = document.querySelector("[data-profile-form]");
const phone = document.querySelector("#phone");
const email = document.querySelector("#email");
const closeButton = dialog.querySelector("[data-close]");
let returnFocus = null;

document.body.classList.add("dialog-closed");

function closeDialog() {
  document.body.classList.add("dialog-closed");
  dialog.hidden = true;
  document.querySelector("[data-scrim]").hidden = true;
  returnFocus?.focus();
}

function openDialog(trigger) {
  returnFocus = trigger;
  document.body.classList.remove("dialog-closed");
  dialog.hidden = false;
  document.querySelector("[data-scrim]").hidden = false;
  dialog.querySelector("[data-close]").focus();
}

document.querySelector("[data-close]").addEventListener("click", closeDialog);
document.querySelector("[data-scrim]").addEventListener("click", closeDialog);
document.querySelectorAll(".profile-trigger").forEach((trigger) => trigger.addEventListener("click", () => openDialog(trigger)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !document.body.classList.contains("dialog-closed")) closeDialog();
  if (event.key === "Tab" && !document.body.classList.contains("dialog-closed")) {
    const controls = [...dialog.querySelectorAll("button, input")].filter((control) => !control.disabled);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "";
  if (!phone.value.trim() && !email.value.trim()) {
    message.textContent = "Udfyld mobil eller email for at gemme.";
    (window.matchMedia("(max-width: 760px)").matches ? phone : email).focus();
    return;
  }
  if (email.value && !email.validity.valid) {
    message.textContent = "Indtast en gyldig emailadresse.";
    email.focus();
    return;
  }
  message.textContent = "Dine oplysninger er gemt.";
});
