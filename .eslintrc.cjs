module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["airbnb", "prettier"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    indent: "off",
    "no-restricted-syntax": "off",
    "no-await-in-loop": "off",
    "import/extensions": "off",
    "array-callback-return": "off",
  },
};
