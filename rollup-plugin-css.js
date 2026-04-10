/**
 * Simple Rollup plugin to import CSS as a string
 */
export default function css() {
  return {
    name: 'css',
    transform(code, id) {
      if (!id.endsWith('.css')) return null;

      // Escape special characters for JavaScript string
      const escapedCSS = code
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

      return {
        code: `export default \`${escapedCSS}\`;`,
        map: { mappings: '' }
      };
    }
  };
}
