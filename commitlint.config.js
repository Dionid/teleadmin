module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "test",
        "refactor",
        "perf",
        "revert",
        "docs",
        "style",
        "deploy",
      ],
    ],
  },
};
