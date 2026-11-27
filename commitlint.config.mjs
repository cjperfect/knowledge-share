export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 120],
    // 允许中文 subject，不做大小写/句号限制
    'subject-case': [0],
    'subject-full-stop': [0],
    'scope-enum': [
      1,
      'always',
      ['web', 'backend', 'docs', 'deps', 'ci', 'repo', 'config', 'release'],
    ],
  },
}
