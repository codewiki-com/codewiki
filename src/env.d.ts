/// <reference types="astro/client" />

// `astro check` resolves `.astro` imports through the language server, but the plain
// `tsc --noEmit` pass in `pnpm check` needs a declaration to type `src/components/mdx.ts`.
// The wildcard is only consulted when no real module type is found, so it never shadows
// the generated per-component props.
declare module '*.astro' {
  const component: (props: Record<string, unknown>) => unknown;
  export default component;
}
