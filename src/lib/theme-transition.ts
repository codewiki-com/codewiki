/**
 * The circular reveal that plays when the theme changes: a View Transition whose new snapshot is
 * clipped to a circle growing out of the theme button.
 *
 * Every length in the `circle()` is a percentage of the transition pseudo-element's own box.
 * Chrome 152 on Linux at devicePixelRatio 2 paints `::view-transition-new(root)` treating px in
 * `clip-path` as device pixels, so a px circle lands at half its centre and radius; percentages
 * resolve against the pseudo-element itself and keep their proportion whichever unit the
 * compositor uses. Firefox is unaffected either way.
 */

/** `circle()` geometry, in percent of the clipped box, that grows from (x, y) to cover it. */
export function revealCircle(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number; r: number } {
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
  // A percentage radius in circle() resolves against sqrt(width² + height²) / sqrt(2).
  const reference = Math.hypot(width, height) / Math.SQRT2;
  return { x: (x / width) * 100, y: (y / height) * 100, r: (radius / reference) * 100 };
}

const DURATION_MS = 450;
const PSEUDO = '::view-transition-new(root)';

/** The transition area: the pseudo-element's used size, or the viewport where it cannot be read. */
function transitionArea(root: HTMLElement): { width: number; height: number } {
  const style = getComputedStyle(root, PSEUDO);
  const width = parseFloat(style.width);
  const height = parseFloat(style.height);
  if (width > 0 && height > 0) return { width, height };
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Runs `change` inside a View Transition that reveals the new theme from `origin`, a 1px marker
 * inside the button. Without View Transitions, or with reduced motion, `change` just runs.
 */
export function revealTheme(origin: Element | null, change: () => void): void {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!origin || reduced || typeof document.startViewTransition !== 'function') {
    change();
    return;
  }

  const marker = origin.getBoundingClientRect();
  root.classList.add('theme-transition');
  const transition = document.startViewTransition(change);
  transition.ready
    .then(() => {
      const { width, height } = transitionArea(root);
      const circle = revealCircle(
        marker.left + marker.width / 2,
        marker.top + marker.height / 2,
        width,
        height,
      );
      const at = `at ${circle.x}% ${circle.y}%`;
      root.animate(
        { clipPath: [`circle(0% ${at})`, `circle(${circle.r}% ${at})`] },
        { duration: DURATION_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: PSEUDO },
      );
    })
    .catch(() => undefined);
  transition.finished.finally(() => root.classList.remove('theme-transition'));
}
