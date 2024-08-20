module.exports = {
    root: true,
    env: { 
      browser: true, 
      es2020: true, 
      node: true 
    },
    extends: [
      'eslint:recommended',
      // Add TypeScript plugin only if necessary
    ],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      // Custom rules
    },
    ignorePatterns: ['dist', '.eslintrc.cjs'],
  };
  