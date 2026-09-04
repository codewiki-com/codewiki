/**
 * The component map every topic renders with:
 *
 *     const { Content } = await render(entry);
 *     <Content components={mdxComponents} />
 *
 * Only the components the editorial standard allows in a topic body are listed. Plain HTML
 * elements — `pre` included, which `rehype-codebox` has already wrapped — are left untouched.
 */
import Callout from './Callout.astro';
import Checkpoint from './Checkpoint.astro';
import Depth from './Depth.astro';
import TLDR from './TLDR.astro';
import TLDRCell from './TLDRCell.astro';
import Term from './Term.astro';

export const mdxComponents = { TLDR, TLDRCell, Depth, Callout, Term, Checkpoint };

export default mdxComponents;
