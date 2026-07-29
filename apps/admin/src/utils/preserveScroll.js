import { nextTick } from "vue";

function afterPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

function captureScrollState() {
  const documentScroller = document.scrollingElement;
  const nestedScrollers = Array.from(document.querySelectorAll("*"))
    .filter((element) => element !== documentScroller && (element.scrollTop || element.scrollLeft))
    .map((element) => ({
      element,
      left: element.scrollLeft,
      top: element.scrollTop,
    }));

  return {
    left: window.scrollX,
    top: window.scrollY,
    nestedScrollers,
  };
}

async function restoreScrollState(state) {
  await nextTick();
  await afterPaint();

  window.scrollTo(state.left, state.top);
  state.nestedScrollers.forEach(({ element, left, top }) => {
    if (element.isConnected) element.scrollTo(left, top);
  });
}

export async function withPreservedScroll(action) {
  const state = captureScrollState();

  try {
    return await action();
  } finally {
    await restoreScrollState(state);
  }
}
