# Contributing to MindMap Hub

Thank you for your interest in contributing! This document explains our development process and how you can help.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Setup

### Prerequisites

- Node.js 20.17.0 or higher
- npm 9.0.0 or higher
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mindmap-hub.git
cd mindmap-hub
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Create Environment Files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 4. Start Development Server

```bash
npm run dev
```

This starts both backend (http://localhost:3001) and frontend (http://localhost:5173).

## Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or for fixes:
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Follow the code style (ESLint + Prettier will help)
- Write clear commit messages
- Keep commits atomic and focused
- Comment complex logic

### 3. Test Your Changes

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build

# Run tests
npm test
```

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with a clear message
git commit -m "feat: add user authentication"
```

Commit message format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation updates
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring without behavior change
- `perf:` Performance improvements
- `test:` Test additions or updates
- `chore:` Build, dependencies, or tooling changes

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

- Clear title describing the change
- Detailed description of what was changed and why
- Reference to any related issues
- Screenshots for UI changes

## Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint rules (run `npm run lint`)
- Use Prettier for formatting (run with `--fix`)
- Avoid `any` types - use proper type definitions

### File Structure

```
backend/src/
├── ai/                 # AI orchestration
├── middleware/         # Express middleware
├── routes/            # API routes
├── services/          # Business logic
├── types/             # Type definitions
└── utils/             # Utilities

frontend/src/
├── components/        # React components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and API clients
├── pages/            # Page components
├── services/         # External services
├── stores/           # Zustand stores
└── types/            # Type definitions
```

### Naming Conventions

```typescript
// Components (PascalCase)
function MyComponent() {}

// Functions and variables (camelCase)
function myFunction() {}
const myVariable = 5;

// Constants (UPPER_SNAKE_CASE)
const MAX_SIZE = 100;

// Types and Interfaces (PascalCase)
interface MyInterface {}
type MyType = string | number;

// Files
// Components: PascalCase (MyComponent.tsx)
// Utilities: camelCase (myUtility.ts)
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments to exported functions
- Document complex logic with inline comments
- Keep API documentation up to date

### Example JSDoc

```typescript
/**
 * Create a new mind map node
 *
 * @param mapId The parent map ID
 * @param data Node data including label and type
 * @returns Promise resolving to the created node ID
 * @throws Error if map not found or validation fails
 *
 * @example
 * const nodeId = await createNode('map-123', {
 *   label: 'New Idea',
 *   type: 'idea'
 * });
 */
async function createNode(mapId: string, data: NodeData): Promise<string> {
  // ...
}
```

## Testing Standards

- Write tests for new features
- Maintain test coverage above 70%
- Use descriptive test names
- Test both happy path and error cases

### Test File Naming

- Unit tests: `fileName.test.ts(x)`
- Integration tests: `fileName.integration.test.ts(x)`
- E2E tests: `feature.e2e.test.ts(x)`

## Performance Guidelines

- Use React.memo for expensive components
- Implement code splitting with dynamic imports
- Optimize bundle size (avoid unnecessary dependencies)
- Use efficient algorithms (O(n) vs O(n²))
- Profile before optimizing

## Accessibility (a11y)

- Use semantic HTML elements
- Add alt text to images
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios (WCAG AA)

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers

## Pull Request Review Process

### Before Submitting

- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] Commit history is clean
- [ ] Branch is up to date with main

### Review Checklist

Reviewers will check:

1. **Code Quality**: Is the code well-written and maintainable?
2. **Tests**: Are there appropriate tests?
3. **Performance**: Does it impact performance?
4. **Security**: Any security concerns?
5. **Documentation**: Is it documented?
6. **Breaking Changes**: Does it break existing functionality?

## Deployment

Changes are automatically tested and deployed via GitHub Actions:

1. **Pull Request**: Runs tests, linting, and build checks
2. **Merge to develop**: Deploys to staging environment
3. **Merge to main**: Deploys to production

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Discussions**: Ask questions in GitHub Discussions
- **Discord**: Join our community Discord server
- **Email**: Contact us at team@mindmap-hub.dev

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Appreciation

We truly appreciate your contributions! Every PR, issue, and discussion helps make MindMap Hub better.

---

**Happy Contributing! 🎉**
