const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'refactor', // A code change that neither fixes a bug nor adds a feature
        'revert', // Revert to a commit
        'style', // Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
        'test', // Adding missing tests or correcting existing tests
        'docs', // Documentation changes
        'chore', // Changes to the build process or auxiliary tools and libraries such as documentation generation
      ],
    ],
  },
};

export default config;
