# Contributing to Coupon Dispenser

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/coupon-dispenser.git
   cd coupon-dispenser
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment**
   ```bash
   cp .env.example .env
   # Fill in your credentials
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Code Standards

### TypeScript

- Use strict TypeScript
- Avoid `any` types
- Export types from dedicated files
- Use proper type inference

### React

- Use functional components
- Prefer hooks over class components
- Use `'use client'` only when necessary
- Keep components small and focused

### Styling

- Use Tailwind CSS utility classes
- Follow the design system in `globals.css`
- Keep responsive design in mind
- Test on mobile devices

### Code Style

We use Prettier and ESLint:

```bash
npm run lint        # Check for issues
npm run format      # Format code
```

## Git Workflow

### Branching

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation

### Commit Messages

Follow conventional commits:

```
feat: add CSV export for reports
fix: resolve monthly claim limit bug
docs: update deployment guide
test: add vendor API tests
refactor: simplify coupon claim logic
```

### Pull Requests

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit PR to `develop`

PR template:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass
- [ ] Documentation updated
```

## Testing

All contributions must include tests:

```bash
npm test                # Run tests
npm run test:coverage   # Check coverage
```

Minimum coverage: 90%

## Documentation

Update documentation when:
- Adding new features
- Changing APIs
- Modifying configuration
- Updating dependencies

## Feature Requests

Create an issue with:
- Clear description
- Use case
- Expected behavior
- Acceptance criteria

## Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details

## Code Review

All PRs require:
- Passing CI/CD
- Code review approval
- Updated tests
- Updated documentation

## Security

Report security issues privately to security@your-domain.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions

Open an issue or discussion for questions about:
- Implementation details
- Design decisions
- Feature proposals
- General help

Thank you for contributing!

