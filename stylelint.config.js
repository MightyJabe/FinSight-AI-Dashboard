module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-prettier',
  ],
  plugins: ['stylelint-order'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'layer', 'screen', 'variants', 'responsive', 'container'],
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
    // Order properties alphabetically for consistency
    'order/properties-alphabetical-order': true,
    // Custom property pattern for CSS variables
    'custom-property-pattern': '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
    // Selector patterns
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      {
        message: 'Expected class selector to be camelCase',
      },
    ],
    // Color hex case
    'color-hex-case': 'lower',
    // Color hex length
    'color-hex-length': 'short',
    // Font weight notation
    'font-weight-notation': 'numeric',
    // Length zero no unit
    'length-zero-no-unit': true,
    // Shorthand property no redundant values
    'shorthand-property-no-redundant-values': true,
  },
  ignoreFiles: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'public/**', 'coverage/**', '*.js'],
  overrides: [
    {
      files: ['**/*.tsx', '**/*.jsx'],
      customSyntax: '@stylelint/postcss-css-in-js',
    },
  ],
};