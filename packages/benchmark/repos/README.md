# Benchmark Repositories

This directory contains sample repositories for benchmarking.

## Directory Structure

```
repos/
  small/       # < 10K LOC
    nodejs-express/
    python-flask-api/
    go-cli-tool/
  medium/      # 10K-100K LOC
    python-django-monolith/
    rust-web-server/
  large/       # > 100K LOC
    java-spring-enterprise/
```

## Usage

Benchmark repos should be real-world projects with:
- Working test suites
- Common bug patterns for testing
- Refactoring opportunities
- Feature extension points

## Adding New Repos

1. Clone or create a sample repo
2. Ensure it has `package.json` or equivalent with test script
3. Add tasks to `packages/benchmark/src/index.ts`
