# Quality Assurance
## Mutation Testing Baseline
Mutation testing with Stryker validates test suite effectiveness by introducing code mutations and verifying tests catch them.
### Configuration
- **Tool**: @stryker-mutator/core with vitest runner
- **Scope**: `src/identity` and `src/venue`
- **Run**: `npx stryker run`
### Baseline Score (commit 3023652d4b95)
| Module | Mutation Score |
|--------|----------------|
| identity | 85.7% |
| venue | 72.3% |
**Overall**: 78.5% mutations killed
The identity module exceeds the 70% threshold with strong coverage of DID operations, signing, and verification paths. The venue module meets the baseline with good coverage of the signed GET client, sweep logic, and paging mechanisms.
