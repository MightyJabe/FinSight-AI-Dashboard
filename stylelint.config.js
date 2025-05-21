// TEMPORARY stylelint.config.js for debugging
module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-prettier',
  ],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'layer', 'screen', 'variants', 'responsive'],
      },
    ],
    'declaration-block-trailing-semicolon': null,
    'no-descending-specificity': null,
    'no-duplicate-selectors': null,
    'no-empty-source': null,
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['v-deep'],
      },
    ],
    'function-name-case': null,
    'function-no-unknown': null,
    'value-keyword-case': null,
  },
  ignoreFiles: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'public/**', '*.js'],
  overrides: [
    {
      files: ['**/*.tsx', '**/*.jsx'],
      customSyntax: '@stylelint/postcss-css-in-js',
    },
  ],
};
