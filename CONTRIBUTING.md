# Contributing

This code base is for a program whose sole user is me, in case a different human
is reading this, you likely aren't looking to contribute; if you are, reach out.

The program is made in React+TypeScript and it uses Bun as the runtime for both
the BE and the FE.
Bun is also used as the test runner via `bun test`.
Some tests are inlined in a `import.meta.main` condition in the same module that
is being tested until they are graduated to a test `.test.ts` file.

The program uses web sockets for communication between the BE and the FE.
There are a few regular HTTP endpoints all of which are secured with HTTP Basic
authorization which runs over TLS when deployed on Sliplane.
The HTTP Basic auth user name is used to differentiate different devices I use
the program on and the password is set via the `PASSWORD` environment variable.
Locally, run using `PASSWORD=… bun start`.
Until Bun supports returning `HTMLBundle` from dynamic route handlers, `index`
is served as a static route on a nonce-based URL and proxied via the `/` route
handler.

On Sliplane, there is an attached volume for persistent data.
When running locally, we use the repository directory as if it was this volume.
Sliplane is based on Docker so there is a Dockerfile it uses for deployment.
A new deployment is triggered whenever I push changes to the GitHub repository.

SQLite is used for data persistence via Bun's native SQLite support.
No ORM is used.
The schema is defined in `db.ts` and the data can be inspected with `sqlite3`.

The web socket messages have a `type` field set to the same name for the request
and response messages and this name corresponds to a handler procedure used to
process the message.
These handler procedures sit in their own files also named after themselves and
are all linked from `handlers` in `index.ts`.

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
- Name the argument in state setters after the state name, not `prev`
