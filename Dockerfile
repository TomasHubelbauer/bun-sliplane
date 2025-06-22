FROM oven/bun
COPY . .
RUN bun install
CMD bun index.ts; echo "Bun exited with code $?!"
