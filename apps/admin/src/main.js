import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import "./assets/main.css";

// Entry forms must only close through their own Save, Cancel, or Close action.
// This prevents accidental data loss when the overlay is clicked.
document.addEventListener(
  "click",
  (event) => {
    const target = event.target;
    if (target instanceof Element && target.classList.contains("backdrop")) {
      event.stopImmediatePropagation();
    }
  },
  true
);

createApp(App).use(router).mount("#app");
