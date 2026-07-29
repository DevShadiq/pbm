<template>
  <Teleport to="body">
    <section class="toast-region" aria-live="polite" aria-label="Notifications">
      <TransitionGroup name="toast">
        <article
          v-for="toast in notificationState.toasts"
          :key="toast.id"
          class="toast-card"
          :class="`toast-${toast.type}`"
          role="status"
        >
          <span class="toast-icon" aria-hidden="true">
            <svg v-if="toast.type === 'success'" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
            <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24"><path d="M12 8v5m0 3h.01" /><circle cx="12" cy="12" r="9" /></svg>
            <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M4.5 19h15L12 4 4.5 19Z" /></svg>
            <svg v-else viewBox="0 0 24 24"><path d="M12 11v6m0-10h.01" /><circle cx="12" cy="12" r="9" /></svg>
          </span>

          <span class="toast-copy">
            <strong v-if="toast.title">{{ toast.title }}</strong>
            <span>{{ toast.message }}</span>
          </span>

          <button class="toast-close" type="button" aria-label="Dismiss notification" @click="notify.dismiss(toast.id)">
            <svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg>
          </button>

          <span
            v-if="toast.duration > 0"
            class="toast-progress"
            :style="{ animationDuration: `${toast.duration}ms` }"
            aria-hidden="true"
          />
        </article>
      </TransitionGroup>
    </section>

    <Transition name="dialog">
      <div
        v-if="notificationState.dialog"
        class="dialog-overlay"
        role="presentation"
        @click.self="cancelDialog"
      >
        <section
          ref="dialogElement"
          class="dialog-card"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="dialogTitleId"
          :aria-describedby="dialogDescriptionId"
          @keydown.esc.prevent="cancelDialog"
        >
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="cancelDialog">
            <svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg>
          </button>

          <div class="dialog-symbol" :class="`symbol-${notificationState.dialog.type}`" aria-hidden="true">
            <svg v-if="notificationState.dialog.type === 'danger'" viewBox="0 0 24 24">
              <path d="M9 10v7m6-7v7M5 7h14m-10 0V4h6v3m2 0-1 13H8L7 7" />
            </svg>
            <svg v-else-if="notificationState.dialog.type === 'warning'" viewBox="0 0 24 24">
              <path d="M12 9v4m0 4h.01M4.5 19h15L12 4 4.5 19Z" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <path d="M12 11v6m0-10h.01" /><circle cx="12" cy="12" r="9" />
            </svg>
          </div>

          <div class="dialog-copy">
            <p class="dialog-eyebrow">{{ notificationState.dialog.mode === "confirm" ? "Please confirm" : "Quick update" }}</p>
            <h2 :id="dialogTitleId">{{ notificationState.dialog.title }}</h2>
            <p v-if="notificationState.dialog.message" :id="dialogDescriptionId">
              {{ notificationState.dialog.message }}
            </p>
          </div>

          <label v-if="notificationState.dialog.mode === 'prompt'" class="dialog-field">
            <span v-if="notificationState.dialog.label">{{ notificationState.dialog.label }}</span>
            <input
              ref="dialogInput"
              v-model="inputValue"
              :type="notificationState.dialog.inputType"
              :placeholder="notificationState.dialog.placeholder"
              @keydown.enter.prevent="confirmDialog"
            />
          </label>

          <footer class="dialog-actions">
            <button type="button" class="dialog-button button-secondary" @click="cancelDialog">
              {{ notificationState.dialog.cancelText }}
            </button>
            <button
              ref="confirmButton"
              type="button"
              class="dialog-button"
              :class="`button-${notificationState.dialog.type}`"
              @click="confirmDialog"
            >
              {{ notificationState.dialog.confirmText }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import {
  notificationState,
  notify,
  resolveNotificationDialog,
} from "../../services/notification";

const dialogElement = ref(null);
const dialogInput = ref(null);
const confirmButton = ref(null);
const inputValue = ref("");
const dialogTitleId = "global-notification-dialog-title";
const dialogDescriptionId = "global-notification-dialog-description";

watch(
  () => notificationState.dialog,
  async (dialog) => {
    if (!dialog) return;
    inputValue.value = dialog.value || "";
    await nextTick();
    (dialog.mode === "prompt" ? dialogInput.value : confirmButton.value)?.focus();
  }
);

function cancelDialog() {
  resolveNotificationDialog(false);
}

function confirmDialog() {
  resolveNotificationDialog(true, inputValue.value);
}
</script>

<style scoped>
.toast-region {
  position: fixed;
  z-index: 5000;
  top: 20px;
  right: 20px;
  display: grid;
  width: min(390px, calc(100vw - 32px));
  gap: 12px;
  pointer-events: none;
}

.toast-card {
  --accent: #2563eb;
  --accent-soft: #dbeafe;
  position: relative;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 12px;
  min-height: 76px;
  overflow: hidden;
  padding: 14px 13px 14px 14px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.07);
  backdrop-filter: blur(18px);
  pointer-events: auto;
}

.toast-success { --accent: #059669; --accent-soft: #d1fae5; }
.toast-error { --accent: #dc2626; --accent-soft: #fee2e2; }
.toast-warning { --accent: #d97706; --accent-soft: #fef3c7; }

.toast-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 13px;
  background: var(--accent-soft);
  color: var(--accent);
}

.toast-icon svg,
.toast-close svg,
.dialog-close svg,
.dialog-symbol svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.toast-copy {
  display: grid;
  gap: 3px;
  color: #475569;
  font-size: 13.5px;
  line-height: 1.45;
}

.toast-copy strong {
  color: #0f172a;
  font-size: 14px;
}

.toast-close,
.dialog-close {
  display: grid;
  border: 0;
  background: transparent;
  color: #94a3b8;
  place-items: center;
}

.toast-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.toast-close:hover,
.dialog-close:hover {
  background: #f1f5f9;
  color: #334155;
}

.toast-progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  transform-origin: left;
  animation: toast-countdown linear forwards;
}

@keyframes toast-countdown {
  to { transform: scaleX(0); }
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(28px) scale(0.96);
}

.dialog-overlay {
  position: fixed;
  z-index: 4900;
  inset: 0;
  display: grid;
  padding: 20px;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(8px);
  place-items: center;
}

.dialog-card {
  position: relative;
  width: min(460px, 100%);
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 26px;
  background: #fff;
  box-shadow: 0 30px 90px rgba(15, 23, 42, 0.34);
}

.dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 11px;
}

.dialog-symbol {
  display: grid;
  width: 62px;
  height: 62px;
  margin-bottom: 20px;
  border-radius: 20px;
  background: #dbeafe;
  color: #2563eb;
  place-items: center;
  transform: rotate(-3deg);
}

.dialog-symbol svg {
  width: 30px;
  height: 30px;
}

.symbol-danger { background: #fee2e2; color: #dc2626; }
.symbol-warning { background: #fef3c7; color: #d97706; }

.dialog-copy {
  padding-right: 22px;
}

.dialog-eyebrow {
  margin: 0 0 7px !important;
  color: #64748b !important;
  font-size: 11px !important;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.dialog-copy h2 {
  margin: 0;
  color: #0f172a;
  font-size: 23px;
  line-height: 1.25;
}

.dialog-copy > p:last-child {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.65;
}

.dialog-field {
  display: grid;
  gap: 7px;
  margin-top: 20px;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.dialog-field input {
  width: 100%;
  height: 46px;
  padding: 0 13px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  outline: 0;
  background: #f8fafc;
  color: #0f172a;
  font: inherit;
  font-weight: 500;
}

.dialog-field input:focus {
  border-color: #60a5fa;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.dialog-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 26px;
}

.dialog-button {
  min-height: 46px;
  border: 0;
  border-radius: 13px;
  padding: 0 16px;
  background: #2563eb;
  color: #fff;
  font: inherit;
  font-weight: 850;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.dialog-button:hover {
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
  transform: translateY(-1px);
}

.button-secondary {
  border: 1px solid #dbe3ee;
  background: #fff;
  color: #475569;
}

.button-secondary:hover {
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.button-danger { background: #dc2626; }
.button-danger:hover { box-shadow: 0 10px 24px rgba(220, 38, 38, 0.23); }
.button-warning { background: #d97706; }
.button-warning:hover { box-shadow: 0 10px 24px rgba(217, 119, 6, 0.23); }

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog-card,
.dialog-leave-active .dialog-card {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-card,
.dialog-leave-to .dialog-card {
  transform: translateY(18px) scale(0.96);
}

@media (max-width: 540px) {
  .toast-region { top: 12px; right: 16px; }
  .dialog-overlay { align-items: end; padding: 10px; }
  .dialog-card { padding: 26px 20px 20px; border-radius: 24px; }
  .dialog-actions { grid-template-columns: 1fr; }
  .button-secondary { order: 2; }
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .dialog-enter-active,
  .dialog-leave-active,
  .dialog-enter-active .dialog-card,
  .dialog-leave-active .dialog-card {
    transition: none;
  }
  .toast-progress { animation: none; }
}
</style>
