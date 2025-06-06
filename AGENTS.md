# AGENTS Instructions

These instructions apply to the entire `FinSight-AI-Dashboard` repository.

## Development Workflow

- Install dependencies with `npm install` when `package.json` changes.
- Before committing, run the following checks:
  1. `npm run lint`
  2. `npm run type-check`
  3. `npm run test:all`
  4. `npm run build`
- If any command fails because of environment limitations, state this in the PR body.

## Code Style

- Use ESLint and Prettier (`npm run lint` and `npm run format`).
- TypeScript must stay in strict mode. Avoid `any` unless accompanied by an eslint disable comment and an explanation.
- Keep styling consistent with Tailwind and run `npx stylelint "**/*.{css,tsx,jsx}"` when CSS is modified.

## Commit Messages

- Write concise commit messages in the imperative mood.
- Group related changes in a single commit when possible.

## Pull Requests

- Summarize the purpose of the changes.
- Include a **Testing** section listing the commands run and their outcome. If tests cannot run, mention it explicitly.
- Cite relevant files or terminal output lines when describing changes.

## Documentation

- Update `README.md`, `project.md`, and inline JSDoc when introducing or changing features.
- Follow the folder structure and conventions described in `project.md` and the rules under `.cursor/rules/`.

## Accessibility & Security

- Adhere to accessibility guidelines in `.cursor/rules/a11y-rules.mdc`.
- Never commit secrets. Use environment variables through `src/lib/config.ts`.

---

Following these instructions helps maintain code quality, security, and clarity for future contributors.
