import type * as Hast from 'hast';
import { toString as htmlToString } from 'hast-util-to-string';
import GithubSlugger from 'github-slugger';

/**
 * Wraps each heading and the content under it in a
 * `<section data-slug="…">`, so the TOC can observe sections crossing the
 * viewport (see components/docs/TocList.astro). The heading keeps the slug
 * id Astro's pipeline gives it; the section's data-slug matches that id.
 */
export function rehypeSectionize() {
  return function (tree: Hast.Root) {
    const slugger = new GithubSlugger();
    const sections: Hast.Content[] = [];

    for (const child of tree.children) {
      const childType = (child as { type: string }).type;
      // MDX constructs must stay at the tree root or the compiler loses the
      // imports and expressions they carry.
      if (childType === 'mdxjsEsm' || childType === 'mdxFlowExpression') {
        sections.push(child as Hast.Content);
      } else if (child.type === 'element' && child.tagName === 'section') {
        sections.push(child);
      } else if (child.type === 'element' && child.tagName.match(/^h[1-6]$/)) {
        child.properties = child.properties ?? {};
        const slug =
          typeof child.properties.id === 'string'
            ? child.properties.id
            : slugger.slug(htmlToString(child));
        child.properties.id = slug;
        sections.push({
          type: 'element',
          tagName: 'section',
          properties: { 'data-slug': slug },
          children: [child],
        });
      } else if (sections.length === 0) {
        sections.push({
          type: 'element',
          tagName: 'section',
          properties: {},
          children: [child as Hast.ElementContent],
        });
      } else {
        const current = sections[sections.length - 1];
        if (current.type === 'element') current.children.push(child as Hast.ElementContent);
        else
          sections.push({
            type: 'element',
            tagName: 'section',
            properties: {},
            children: [child as Hast.ElementContent],
          });
      }
    }

    tree.children = sections;
    return tree;
  };
}
