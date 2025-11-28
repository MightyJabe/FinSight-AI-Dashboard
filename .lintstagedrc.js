module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // CSS and style files
  '*.{css,scss}': ['prettier --write'],

  // JSON and Markdown files
  '*.{json,md}': ['prettier --write'],

  // Run type checking on staged TypeScript files
  '*.{ts,tsx}': () => 'tsc --noEmit',
};
