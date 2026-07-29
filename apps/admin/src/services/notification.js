import { reactive } from "vue";

export const notificationState = reactive({
  toasts: [],
  dialog: null,
});

let toastId = 0;
let dialogResolver = null;

function removeToast(id) {
  const index = notificationState.toasts.findIndex((toast) => toast.id === id);
  if (index !== -1) notificationState.toasts.splice(index, 1);
}

function showToast(message, type = "info", options = {}) {
  const text = String(message || "").trim();
  if (!text) return null;

  const id = ++toastId;
  const duration = options.duration ?? (type === "error" ? 6500 : 4500);

  notificationState.toasts.push({
    id,
    message: text,
    title: options.title || "",
    type,
    duration,
  });

  if (duration > 0) {
    window.setTimeout(() => removeToast(id), duration);
  }

  return id;
}

export const notify = {
  show: showToast,
  success(message, options) {
    return showToast(message, "success", options);
  },
  error(message, options) {
    return showToast(message, "error", options);
  },
  warning(message, options) {
    return showToast(message, "warning", options);
  },
  info(message, options) {
    return showToast(message, "info", options);
  },
  dismiss: removeToast,
};

function openDialog(mode, options = {}) {
  if (dialogResolver) dialogResolver(mode === "prompt" ? null : false);

  return new Promise((resolve) => {
    dialogResolver = resolve;
    notificationState.dialog = {
      mode,
      type: options.type || (mode === "confirm" ? "danger" : "info"),
      title: options.title || (mode === "confirm" ? "Confirm action" : "Enter information"),
      message: options.message || "",
      confirmText: options.confirmText || (mode === "confirm" ? "Confirm" : "Continue"),
      cancelText: options.cancelText || "Cancel",
      label: options.label || "",
      placeholder: options.placeholder || "",
      inputType: options.inputType || "text",
      value: options.value == null ? "" : String(options.value),
    };
  });
}

export function confirmAction(options = {}) {
  return openDialog(
    "confirm",
    typeof options === "string" ? { message: options } : options
  );
}

export function promptAction(options = {}) {
  return openDialog(
    "prompt",
    typeof options === "string" ? { message: options } : options
  );
}

export function resolveNotificationDialog(confirmed, value = "") {
  if (!dialogResolver) return;

  const mode = notificationState.dialog?.mode;
  const resolve = dialogResolver;
  dialogResolver = null;
  notificationState.dialog = null;
  resolve(mode === "prompt" ? (confirmed ? value : null) : Boolean(confirmed));
}
