module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
    commonjs: true
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/typescript/recommended",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true
    },
    parser: "babel-eslint"
  },
  plugins: ["vue", "prettier"],
  rules: {
    "block-spacing": "error",
    "no-unused-vars": "warn",
    "@typescript-eslint/no-var-requires": "off",
    "object-curly-spacing": "off",
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "prettier/prettier": "error"
  }
}
