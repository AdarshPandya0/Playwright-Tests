# JavaScript → TypeScript Conversion & Playwright Standardization

This document explains **what changed, why it changed, and the TypeScript
concepts you need to read the new code** — written for someone who knows this
Playwright suite well in JavaScript but hasn't used TypeScript before.

Branch: `feature/js-to-ts-conversion` (branched off `feature/js-to-ts`, which
had already converted `TopBar.ts`, `fixtures.ts`, `ScheduleAptPOSTAPI.ts` and
`playwright.config.ts`). This branch finishes the conversion for everything
that was still `.js`, and cleans up some Playwright anti-patterns along the way.

---

## 1. TypeScript, in the terms this repo already uses

TypeScript is JavaScript **plus a type checker**. Every `.ts` file is executed
as the equivalent JavaScript at runtime (Playwright transpiles it on the fly —
you don't run a separate build step). The only thing TypeScript adds is a tool
that reads your code *before* it runs and complains if you're about to do
something like call `.click()` on a `string` or pass a `number` where the code
expects a `Page`.

### 1.1 Type annotations

```ts
async searchForPatient(firstName: string): Promise<void> {
```

- `firstName: string` — this parameter must be a string. Pass a number and
  the editor underlines it red before you ever run the test.
- `Promise<void>` — this `async` method returns a promise that resolves to
  nothing. Compare with `DocumentCenterPage.openLastDocument()`:

  ```ts
  async openLastDocument(): Promise<string> {
  ```

  which promises to resolve to a `string` (the file name). If you ever wrote
  `return 5;` inside that method, TypeScript would refuse to compile.

You'll see this pattern on every converted method: `Promise<void>` for
actions, `Promise<string>` / `Promise<number>` / `Promise<boolean>` for
methods that return data.

### 1.2 Declaring class fields (Page Objects)

The old `PatientListPage.js` created locators directly in the constructor
with no declaration anywhere else. The new `PatientListPage.ts` declares each
field's type up top:

```ts
export class PatientListPage {
    readonly page: Page;
    readonly filterToggleBtn: Locator;
    ...
    constructor(page: Page) {
        this.page = page;
        this.filterToggleBtn = page.locator('#ui-panel-0-label');
```

- `readonly` means "assign this once, in the constructor, and never again."
  It's a TypeScript-only safety rail — nothing stops you from reassigning a
  `Locator` in JS, but there's never a legitimate reason to in a Page Object,
  so `readonly` documents that intent and the compiler enforces it.
- `page: Page` and `filterToggleBtn: Locator` — `Page` and `Locator` are types
  imported from `@playwright/test` itself. That's how autocomplete knows
  `filterToggleBtn.` should offer `.click()`, `.fill()`, `.isVisible()`, etc.
  In the old `.js` files your editor had to *guess* what `page.locator(...)`
  returned; now it knows for certain.

Every Page Object (`BasePage`, `Cico`, `DocumentCenterPage`, `PatientListPage`,
`Scheduler`) follows this same shape now, matching `TopBar.ts`, which was
already converted.

### 1.3 `interface` and `type` — describing the shape of data

`utils/api/ScheduleAptPOSTAPI.ts` (already converted before this branch)
defines:

```ts
export interface ScheduleApiResponse {
    status: string;
    data?: {
        result?: { id?: number; lastModifiedDate?: number } | number;
        messages?: unknown[];
    };
}
```

An `interface` is a named shape for an object. `data?:` means the `data`
field is optional (`?`). This is how `CicoUiRegression.spec.ts` knows, at
edit time, that `apiResponse.data.result` might not exist and might be
either an object or a plain number — and the compiler forces you to handle
both possibilities instead of finding out in a failed test run three weeks
later. See §3.1 below for the real bug this caught.

`pages/Cico.ts` defines a similar helper:

```ts
export type StatusBadge = (typeof StatusBadgeList)[keyof typeof StatusBadgeList];
```

Don't worry about memorizing this one — it just means "whatever string
values live inside `StatusBadgeList`" (i.e. `'name' | 'I' | 'O'`), so
`getPostCheckInStatusBadgeFromGrid()` can promise to return one of those
three exact strings, not just "some string."

### 1.4 Strict null checking — the most useful thing TypeScript does here

This project's `tsconfig.json` has `"strict": true`. The single most valuable
part of that setting is that TypeScript tracks **which values might be
`null`/`undefined`** and won't let you use them without checking first.

Example — `DocumentCenterPage.openLastDocument()`:

```ts
const fileName = await lastFile.textContent(); // Playwright types this as `string | null`
...
return (fileName ?? '').trim();
```

`textContent()` can legitimately return `null` if the element has no text
node. The original JS did `fileName.trim()` directly — fine 99% of the time,
a crash the one time it isn't. TypeScript refuses to compile `fileName.trim()`
until you handle the `null` case, so we added `?? ''` ("if `fileName` is
`null` or `undefined`, use `''` instead"). This is the **nullish coalescing
operator** — different from `||`, because `0` and `''` are valid real values
that `||` would incorrectly replace, while `??` only reacts to `null`/`undefined`.

### 1.5 `unknown` vs `any`

`any` tells TypeScript "stop checking this value, trust me." `unknown` says
"this could be anything, so you must narrow it before using it." We changed
`messages?: any[]` to `messages?: unknown[]` in `ScheduleAptPOSTAPI.ts` — the
field's actual shape isn't used anywhere yet, so `unknown` keeps type safety
intact without pretending we know more than we do. Reach for `unknown` over
`any` whenever you're tempted to silence the compiler.

### 1.6 The non-null assertion (`!`) — the one escape hatch you'll see

```ts
const liveAuthToken = xTokenCookie!.value;
```

`xTokenCookie` comes from `.find()`, which is typed as returning
`Cookie | undefined`. Two lines above, `expect(xTokenCookie, '...').toBeDefined()`
already fails the test if it's missing — but TypeScript's compiler can't
"see" that a Playwright assertion guarantees anything at compile time, so it
still considers the value possibly `undefined`. The `!` after `xTokenCookie`
says "trust me, by this point it's defined." Use this sparingly and only
right after a check that actually guarantees it, exactly as done here.

### 1.7 Running the type checker and linter yourself

Two new `npm` scripts:

```bash
npm run typecheck   # tsc --noEmit — checks types across the whole project, emits nothing
npm run lint        # eslint . — style + Playwright best-practice checks
```

Run these before pushing. They catch the class of mistake tests can't catch
(passing the wrong type, a typo'd property name, an unused import) without
ever opening a browser.

---

## 2. What moved where

| Old file | New file |
|---|---|
| `pages/BasePage.js` | `pages/BasePage.ts` |
| `pages/Cico.js` | `pages/Cico.ts` |
| `pages/DocumentCenterPage.js` | `pages/DocumentCenterPage.ts` |
| `pages/PatientListPage.js` | `pages/PatientListPage.ts` |
| `pages/Scheduler.js` | `pages/Scheduler.ts` |
| `utils/cleanup.js` | `utils/cleanup.ts` |
| `utils/hoist-blobs.js` | `utils/hoist-blobs.ts` |
| `tests/*.spec.js` (10 files) | `tests/*.spec.ts` |
| `tests/schedulerDrag&Drop.spec.js` | `tests/schedulerDragAndDrop.spec.ts` (renamed — see §3.5) |

`utils/cleanup.ts` and `utils/hoist-blobs.ts` are plain Node scripts run
outside the Playwright test runner (via `npm run clean`), so they can't rely
on Playwright's built-in TypeScript support. We added **`tsx`** (a
zero-config TypeScript runner) as a dev dependency and pointed those two
`package.json` scripts at it:

```json
"clean": "tsx utils/cleanup.ts",
"report:merge": "tsx utils/hoist-blobs.ts && ...",
```

### New tooling added

- **`typescript`** — the compiler, used only for `npm run typecheck` (Playwright
  itself doesn't need it to run tests; it has its own fast transform).
- **`tsx`** — runs the two standalone utility scripts.
- **`eslint` + `typescript-eslint` + `eslint-plugin-playwright`** — a linter
  configured in `eslint.config.mjs`, with the official Playwright rule set
  layered on top of the standard TypeScript rules. This is the single biggest
  "industry standard" addition: it's what caught most of the real bugs
  described below, and it will keep catching this class of mistake in future
  PRs. Run it with `npm run lint`.

---

## 3. Playwright standardization — what was fixed and why

### 3.1 Two real bugs the conversion caught

TypeScript's strict mode isn't just pedantry — it found two genuine bugs
while converting:

1. **`Cico.js` → `Cico.ts`, `getPostCheckInStatusBadgeFromGrid()`**: the
   original code returned `StatusBadgeList.CheckedOut`, a property that
   doesn't exist on `StatusBadgeList` (only `Waiting`, `InProgress`, and
   `CheckOut` exist). In JavaScript this silently evaluated to `undefined` —
   the function would return `undefined` for a checked-out patient and no
   error would ever surface. TypeScript refused to compile until it was
   fixed to `StatusBadgeList.CheckOut`.

2. **`schedulerDragAndDrop.spec.js` → `.ts`**: `boundingBox()` can return
   `null`, and the code did `columnBox.width` straight after an
   `expect(columnBox).not.toBeNull()` call. That assertion protects you at
   *runtime*, but TypeScript can't infer anything from a Playwright
   `expect()` call, so it still flagged `columnBox` as possibly `null`. Fixed
   with `columnBox?.width ?? 0`.

### 3.2 Test data extracted out of test files

Three specs had large, hand-typed JSON literals inline in the test body:

- `apiPatientCreation.spec.js` — a ~90-field patient payload → now
  `data/newPatientTemplate.json`, spread with the two dynamic fields
  overridden: `{ ...newPatientTemplate, firstName: uniqueFirstName, uID: uniqueUID }`.
- `errormsg.spec.js` — a mocked backend error response → now `data/mockDrugCheckError.json`.
- `eventTypeSnapshotRegression.spec.js` — a mocked event-type list → now `data/mockEventTypeList.json`.

This mirrors the pattern the suite already used for
`data/patientSearch.json`. Separating fixture data from test logic is
standard practice: the test file stays readable, and the payload can be
edited without touching (or accidentally breaking) test code.

### 3.3 Dead code removed

- `BasePage.js` declared a `noBtn` locator that was never used — removed.
- `schedulerDrag&Drop.spec.js` had ~18 lines of commented-out manual
  mouse-drag code sitting above the working `dragTo()` call — removed.
- `CicoUiRegression.spec.js` declared `patientChartNumber` and never used it —
  removed.
- `playwright.config.ts` had a commented-out, superseded `dotenv.config(...)`
  line and an unused `path` import — removed.
- `ehrlogin.spec.js`'s **"Find Locator" test** navigated to a page and waited
  3 seconds with **no assertions at all** — it was pure manual-exploration
  scratch code, and the same page is already covered for real by
  `eventTypeSnapshotRegression.spec.ts`. It was removed rather than converted.
  **Flagging this explicitly**: if you wanted that test kept (e.g. you still
  use it for manually poking at locators), say so and it's a one-line revert.

### 3.4 `_privateMethod` convention → real `private`

JavaScript has no access modifiers, so this codebase used a leading
underscore (`_clearFiltersAndWait`) as a convention for "don't call this from
outside the class." TypeScript has an actual `private` keyword that the
compiler enforces, so `Cico.ts` now has:

```ts
private async clearFiltersAndWait(): Promise<void> { ... }
```

Calling `cicoPage.clearFiltersAndWait()` from a test file is now a compile
error, not just a broken convention.

### 3.5 Renamed `schedulerDrag&Drop.spec.js` → `schedulerDragAndDrop.spec.ts`

`&` in a filename is legal on Windows and most CI runners, but it's a shell
metacharacter that can bite you in scripts, globs, and some report tooling.
Renaming it removes a class of "works on my machine" risk for no downside.

### 3.6 Insecure/redundant line removed from `apiPatientCreation.spec.ts`

The original had, at file scope:

```js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // ignore TLS errors for self-signed certs
```

This disables TLS certificate validation for the **entire Node process**,
not just this one request — a real security smell, and broader than it needs
to be. `playwright.config.ts` already sets `ignoreHTTPSErrors: true` on the
shared `use` block, which covers `page.request` calls (this spec's only use
of self-signed-cert-sensitive requests) through Playwright's own context
options. The line was redundant as well as risky, so it was removed. (The
test itself is still `test.skip()`, exactly as before — this didn't change
its skip status.)

### 3.7 `test.step` / structure comments left as-is where they were already good

Several files already used clear `// PHASE 1 / PHASE 2` banner comments
(`apiPatientCreation.spec.ts`, `CicoUiRegression.spec.ts`). These were kept
rather than converted to `test.step()` blocks — that's a legitimate follow-up
if you want richer HTML-report step breakdowns, but it changes report output
shape and felt like a separate decision from "convert to TypeScript," so it
was left as a suggestion rather than made unilaterally.

### 3.8 What was **intentionally left alone**, and why

The linter (`eslint-plugin-playwright`'s recommended rules) flags several
patterns already present throughout this suite:

- `playwright/no-networkidle` — `waitForLoadState('networkidle')` is used
  everywhere. Official Playwright guidance discourages it because
  single-page apps with polling/websockets may never truly go idle. It's
  used pervasively and deliberately here, though, and rewriting every call
  site to web-first assertions is a real behavioral change that needs
  verification against the live app — not something to do silently as part
  of a JS→TS rename. **Decision**: downgraded this rule from error to
  **warning** in `eslint.config.mjs` (with a comment explaining why), so it
  stays visible for future cleanup instead of either silently vanishing or
  blocking every lint run.
- `playwright/no-wait-for-timeout` — same reasoning: `page.waitForTimeout(...)`
  calls that compensate for animations/render cycles were kept as-is rather
  than guessed at and replaced with different waits that couldn't be
  verified without running against the real app.
- `playwright/expect-expect` ("test has no assertions") fires on tests that
  call Page Object methods with assertions buried inside them (e.g.
  `cicoPage.verifyPatientInWaitingOrInProgress(...)` calls `expect()`
  internally) — the linter can't see into those methods, so this is a known
  false-positive shape for POM-style suites. It also fires, correctly, on
  the two remaining `ehrlogin.spec.ts` tests, which really don't assert
  anything — see §3.3.
- `playwright/no-skipped-test` fires on every pre-existing `test.skip(...)`.
  None of those skips were touched — removing a skip means the test starts
  running in CI, which is a product decision, not a syntax one.

Run `npm run lint` any time to see the current list (24 warnings, 0 errors as
of this branch) — it's a to-do list, not a blocker.

---

## 4. Config changes

- **`tsconfig.json`**: added `resolveJsonModule: true` (needed to `import` the
  `data/*.json` fixture files with type-checking), `isolatedModules: true`
  (a standard safety setting for projects using a per-file transpiler like
  `tsx`/esbuild instead of the full `tsc` type-checker to run code), and
  `noEmit: true` (this project only ever type-checks `.ts` files — Playwright
  and `tsx` handle running them — so `tsc` should never try to write `.js`
  output files).
- **`eslint.config.mjs`** (new): flat-config ESLint setup — `typescript-eslint`'s
  recommended rules everywhere, plus `eslint-plugin-playwright`'s recommended
  rules scoped to `tests/**/*.ts`.
- **`package.json`**: added `typecheck` and `lint` scripts; repointed `clean`
  and `report:merge` at the new `.ts` files via `tsx`.

## 5. Suggested next steps (not done on this branch)

- Consider a CI job step running `npm run typecheck && npm run lint` before
  `npm run test:prod:sharded`, so a type error or lint regression fails fast
  instead of surfacing as a confusing runtime error.
- The two remaining `ehrlogin.spec.ts` tests ("Page Navigator to find
  locators", "CICO Page Navigator to find locators") don't assert anything —
  worth deciding whether they should gain real assertions or be deleted like
  their sibling was.
- `data/mockEventTypeList.json`'s companion baseline screenshot
  (`event-type-snapshot.png`) wasn't touched by this branch — if the
  screenshot ever needs regenerating, that's unrelated to this conversion.
