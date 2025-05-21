module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // CSS and style files
  '*.{css,scss}': ['stylelint --fix', 'prettier --write'],

  // JSON and Markdown files
  '*.{json,md}': ['prettier --write'],

  // Run type checking on staged TypeScript files
  '*.{ts,tsx}': () => 'tsc-files --noEmit',

  // Run tests related to staged files
  '*.{ts,tsx}': files => {
    const testFiles = files
      .map(file => file.replace(/\.(ts|tsx)$/, '.test.$1'))
      .filter(file => file.includes('.test.'));
    return testFiles.length
      ? `jest --bail --findRelatedTests ${testFiles.join(' ')} --passWithNoTests`
      : [];
  },
};
