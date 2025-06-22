# Contributing

This code base is for a program whose sole user is me, in case a different human
is reading this, you likely aren't looking to contribute; if you are, reach out.

What remains is general remarks for how I contribute to this code base and how
Claude Code should.

I will start with a list and flesh this out later.
This document is linked from `CLAUDE.md` which is ignored until I triage all of
what Claude Code initialized there.

- Use Bun features over Node features
- Do not add dependencies
- Check your changes for React best practices
- Beware these is no linter and do not attempt to add one
- Name callbacks based on the established pattern
- Use default exports when introducing new modules
- Import React types directly using named imports, not via `React.*`
- Split multi-line statements/expressions and single-line ones via an empty line
- Use an underscore to mark unused but required members for TypeScript
- Check TypeScript errors after every change
- Make throwaway test files to check assumptions and validate runtime behaviors
