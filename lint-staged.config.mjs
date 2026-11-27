export default {
  '*.{ts,tsx,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,mdx,css,scss,yaml,yml,html}': ['prettier --write'],
}
