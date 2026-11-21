/** Length of the dialog exit animation. Keep in sync with `.is-closing` in workspaces.css. */
export const DIALOG_EXIT_MS = 260;

/** Plays the exit animation on a dialog scrim, then runs `done`. Falls back to instant when motion is reduced. */
export function animateDialogClose(scrim: Element | null, done: () => void) {
  if (!scrim || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    done();
    return;
  }
  if (scrim.classList.contains("is-closing")) return;
  scrim.classList.add("is-closing");
  window.setTimeout(done, DIALOG_EXIT_MS);
}
