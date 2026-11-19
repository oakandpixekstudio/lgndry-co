const STEPS = ["Bag", "Details & delivery", "Payment"];

/** Progress cue for the buying flow: 1 = bag, 2 = details, 3 = payment. */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 px-[var(--offset)] pb-10" aria-label="Checkout progress">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={s} aria-current={state === "current" ? "step" : undefined} className="flex items-center gap-4">
            <span className={`label flex items-center gap-2.5 ${state === "todo" ? "text-ash" : "text-ink"}`}>
              <span
                className={`grid size-5 place-items-center border text-[9px] ${state === "current" ? "border-ink bg-ink text-paper" : state === "done" ? "border-ink" : "border-line"}`}
              >
                {state === "done" ? "✓" : n}
              </span>
              {s}
            </span>
            {n < STEPS.length && <span aria-hidden="true" className="hidden h-px w-10 bg-line sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}
