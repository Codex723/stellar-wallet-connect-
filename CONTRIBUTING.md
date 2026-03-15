# Contributing to Stellar Wallet Connect

Thank you for your interest in contributing to Stellar Wallet Connect! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- PNPM 8.0.0 or higher
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/stellar-wallet-connect.git
   cd stellar-wallet-connect
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start development:
   ```bash
   pnpm dev
   ```

## 📁 Project Structure

```
stellar-wallet-connect/
├── packages/
│   ├── core/          # Vanilla JS SDK
│   ├── react/         # React hooks and provider
│   └── ui/            # UI components
├── examples/
│   └── demo-app/      # Example application
├── .github/           # GitHub workflows and templates
├── docs/              # Documentation
└── scripts/           # Build and utility scripts
```

## 🛠️ Development Workflow

### Making Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Test your changes thoroughly
4. Commit your changes using [conventional commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add new wallet adapter"
   ```
5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Create a Pull Request

### Testing

Before submitting a PR, ensure:

- All tests pass: `pnpm test`
- Code builds successfully: `pnpm build`
- Type checking passes: `pnpm type-check`
- Linting passes: `pnpm lint`
- Example app works: `pnpm example`

### Code Style

- Use TypeScript with strict mode
- Follow the existing code style
- Use descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## 📝 Commit Message Guidelines

We use [conventional commits](https://www.conventionalcommits.org/) to standardize commit messages:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for code style changes (formatting, etc.)
- `refactor:` for code refactoring
- `test:` for adding or updating tests
- `chore:` for maintenance tasks

Examples:
```
feat: add support for new wallet
fix: resolve connection issue with Freighter
docs: update API documentation
```

## 🐛 Bug Reports

When reporting bugs, please:

1. Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
2. Provide detailed information about the issue
3. Include steps to reproduce
4. Specify your environment (OS, browser, wallet versions)
5. Add relevant code samples or screenshots

## ✨ Feature Requests

When requesting features, please:

1. Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)
2. Describe the problem you're trying to solve
3. Explain the proposed solution
4. Consider alternative approaches
5. Provide use cases and implementation ideas

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write unit tests for new functionality
- Test edge cases and error conditions
- Mock external dependencies
- Aim for high code coverage

## 📦 Building and Publishing

### Building Packages

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @stellar-wallet-connect/core build
```

### Publishing

Releases are automated through GitHub Actions. To publish a new version:

1. Update the version in package.json files
2. Create a release tag: `git tag v1.0.0`
3. Push the tag: `git push origin v1.0.0`
4. The release workflow will automatically publish to npm

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and considerate
- Use inclusive language
- Focus on constructive feedback
- Help others learn and grow

## 📚 Documentation

### API Documentation

- Document all public APIs with JSDoc
- Include usage examples
- Specify parameter types and return values
- Document error conditions

### README Updates

When adding new features, update the README.md to:

- Document new functionality
- Update installation instructions
- Add usage examples
- Update the changelog

## 🎯 Release Process

1. All changes must be reviewed and approved
2. Tests must pass
3. Documentation must be updated
4. Version numbers must be updated following [semantic versioning](https://semver.org/)
5. Release notes must be created

## 🆘 Getting Help

- Create an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues and discussions
- Read the documentation

## 🏆 Recognition

Contributors who make significant contributions will be:

- Listed in the README.md
- Mentioned in release notes
- Invited to become maintainers (for consistent, high-quality contributions)

Thank you for contributing to Stellar Wallet Connect! 🌟
