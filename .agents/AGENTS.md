# Project Rules

## The Golden Rule of Modernization
- **Zero Behavior Regression**: When performing library upgrades (such as React 19, Tailwind CSS v4, TypeScript 6), the system's operational logic, APIs, and rendering behavior must remain completely unchanged.
- **Zero Style Deviation**: Upgrading UI libraries (like Tailwind v4) must preserve the existing look and feel, colors, fonts, responsive layouts, and UI transitions exactly.
- **Verification Gates**: Every upgrade step must be validated locally via TypeScript compiler checks, builds, lint runs, and local dev server visual inspection before deployment.

## Dependency Management Rule
- **Package Manager**: Use pnpm exclusively for all JavaScript/TypeScript subdirectories (worker/, frontend/). Do NOT use npm or yarn as they lead to bloated local installations. The project has been optimized to use pnpm's global store.

## Git Commit Anonymity Rule
- **CRITICAL GIT PROHIBITION**: Never append, inject, or suggest any "Co-Authored-By" trailers, metadata, or attribution lines (e.g., "Co-Authored-By: Claude...") in git commit messages, code blocks, or automated git scripts. All git commit messages must remain completely anonymous or strictly limited to the user's explicit content.
