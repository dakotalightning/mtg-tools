```
Implement a responsive “Shopping Lists” feature in the Card Cloud frontend.

Use the attached mockup as the visual reference. Treat it as design direction rather than a pixel-perfect specification. Match the existing codebase’s conventions, components, navigation, card-search APIs, types, styling, and tests before introducing anything new.

## Important implementation constraint

For this first version, persist shopping-list data entirely in the browser using `localStorage`.

Do not add:

- Prisma models or migrations
- GraphQL shopping-list queries or mutations
- Backend endpoints
- Account-based synchronization
- Membership gating
- Advertising logic
- Seller inventory, purchasing, or checkout

Keep the storage layer abstracted so it can later be replaced by GraphQL/cloud persistence without rewriting the UI.

## Product goal

Users should be able to:

1. Create a shopping list in advance.
2. Add cards manually or through bulk import.
3. Review unresolved or ambiguous imported names.
4. See cards in a clean shopping checklist.
5. See a compact summary of the sets/printings each card belongs to.
6. Select a preferred printing or accept any printing.
7. Check off cards or increment acquired quantities while shopping.
8. Filter between all, still-needed, and found cards.
9. Return later and find the lists preserved on the same browser.

The interface must work cleanly on phones and desktops without becoming another deck builder.

## Begin with repository discovery

Before changing code:

- Inspect the frontend folder structure and routing.
- Find existing card search, card details, printing/set data, navigation, responsive components, deck-list parsing, Apollo queries, and design-system components.
- Find existing client-side state and browser-storage utilities.
- Determine whether the app already uses a validated or versioned storage pattern.
- Reuse existing card search and printing data instead of duplicating card data in storage.
- Summarize the implementation plan and affected files before editing.
- Do not modify unrelated functionality.

## Local storage architecture

Create a small repository or persistence adapter, for example:

```ts
interface ShoppingListRepository {
  getLists(): Promise<ShoppingList[]>;
  getList(id: string): Promise<ShoppingList | null>;
  saveList(list: ShoppingList): Promise<void>;
  deleteList(id: string): Promise<void>;
  clear(): Promise<void>;
}
```

Implement it with `localStorage` now, while keeping UI code independent of the storage mechanism.

Suggested key:

```tsx
card-cloud:shopping-lists
```

Do not scatter direct `localStorage` calls through components.

### Browser-safety requirements

- Never access `window` or `localStorage` during server rendering.
- Load persisted state after client hydration.
- Show an intentional loading state until hydration completes.
- Catch unavailable-storage, quota, serialization, and malformed-data errors.
- Do not overwrite valid saved data when one record is malformed.
- Listen for the browser `storage` event so updates made in another tab appear without refreshing.
- Avoid writing on every render.
- Debounce rapid non-critical writes where appropriate.
- Save important check-off and quantity changes immediately.

## Versioned storage format

Use a versioned envelope:

```tsx
type ShoppingListStorage = {
  version: 1;
  lists: ShoppingList[];
  updatedAt: string;
};
```

Validate unknown JSON before using it. Use an existing validation library if the project already has one; otherwise add a small explicit type guard rather than a large new dependency.

Keep migrations centralized:

```tsx
function migrateShoppingListStorage(value: unknown): ShoppingListStorage;
```

If the data cannot be recovered:

- preserve a backup under a timestamped recovery key
- initialize an empty valid state
- notify the user that saved lists could not be loaded
- do not crash the page

## Data model

Adapt names to the codebase, but use a structure equivalent to:

```tsx
type ShoppingList = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
};

type ShoppingListItem = {
  id: string;

  // Store stable references, not the entire card database record.
  oracleCardId?: string;
  cardId?: string;
  cardName: string;

  selectedPrintingId?: string;
  selectedSetCode?: string;

  quantityWanted: number;
  quantityFound: number;

  note?: string;
  position: number;

  // Preserve enough information to display the list if card data
  // is temporarily unavailable, but do not cache full card objects.
  snapshot?: {
    imageUrl?: string;
    typeLine?: string;
  };

  createdAt: string;
  updatedAt: string;
};
```

Use `crypto.randomUUID()` when available and an existing project utility as the fallback.

Store stable identifiers and small display snapshots only. Do not store complete card, set, price, or printing payloads in `localStorage`.

## Local repository operations

Provide functions equivalent to:

- `createList`
- `updateList`
- `deleteList`
- `duplicateList`
- `addItem`
- `addItemsBulk`
- `updateItem`
- `removeItem`
- `setQuantityWanted`
- `setQuantityFound`
- `incrementQuantityFound`
- `decrementQuantityFound`
- `toggleItemComplete`
- `selectPreferredPrinting`
- `reorderItems`

All writes should:

1. Read the latest stored version.
2. Apply an immutable update.
3. Update relevant timestamps.
4. Validate the result.
5. Save it.
6. Notify subscribed UI state.
7. handle write failures without discarding the in-memory user action.

If multiple components can write concurrently, use one central store/provider to serialize updates.

## Data ownership warning

Because this version uses browser storage:

- Lists remain on the current browser/device.
- Clearing site data removes them.
- They do not sync with the user’s Card Cloud account.
- Private/incognito sessions may not retain them.
- Another browser or device will have a separate list.

Show this unobtrusively in the interface:

> Saved on this device only. Cloud sync will be added later.
>

Do not repeatedly show a disruptive warning.

## Import and export

Because local data can be lost, add JSON backup and restore.

### Export

Allow the user to download:

```
card-cloud-shopping-lists-YYYY-MM-DD.json
```

The file should contain the versioned storage envelope.

### Import backup

Allow the user to choose a previously exported JSON file.

Before restoring:

- validate the file
- show how many lists and items it contains
- offer “Merge” and “Replace”
- confirm before replacing current data
- resolve ID collisions predictably
- never execute or render imported HTML

This backup import is separate from card-list bulk import.

## Bulk card-list import

Support inputs such as:

```
Sol Ring
1 Sol Ring
4 Llanowar Elves
1 Rhystic Study [WOT]
4 Lightning Bolt (CLB)
```

Reuse existing deck-list parsing and card-search logic where practical.

The flow should:

1. Parse quantity, name, and optional set code.
2. Resolve exact card names first.
3. Resolve optional set preferences.
4. Merge duplicate resolved lines.
5. Present ambiguous and unresolved entries for review.
6. Let users correct, search, or skip invalid lines.
7. Commit valid results to local storage in one operation.
8. Report cards added, quantities merged, ambiguous lines, and unresolved lines.

Do not silently choose among materially different matches.

If the user imports an existing card again, merge quantities based on canonical card identity and preferred-printing selection.

## Card-data fetching

Continue using the existing card/printing APIs for:

- card-name resolution
- card images
- type lines
- set membership
- printing details
- prices, when reliable data already exists

The shopping-list feature’s own state remains local.

When loading a saved list:

- fetch fresh card and printing information using stored identifiers
- fall back to the saved name and display snapshot if unavailable
- do not delete an item merely because card enrichment failed
- provide a retry action

Batch enrichment requests where possible and avoid one request per rendered item.

## Desktop interface

Add a “Shopping lists” destination to the appropriate navigation.

The page should include:

### Header

- Current list name
- Short explanatory text
- “Bulk import”
- “Add cards”
- overflow menu for rename, duplicate, export, and delete

### Sidebar

- Saved shopping lists
- Card count for each list
- Create-list action
- All cards
- Still needed
- Found
- Sorting/grouping options
- Import/export backup access

### Progress

Display:

- completed items versus total
- percentage complete
- remaining quantities or items

An item needing four copies with only two found remains incomplete.

### Card rows

Each row should show:

- completion control
- compact card image
- card name
- type line when available
- quantity wanted
- quantity found
- compact set/printing choices
- selected-printing state
- price only when reliable existing data is available
- context-appropriate action such as “Mark found,” “Add copy,” or “Undo”

Completed cards should remain visible and readable but visually subdued.

## Sets and printings

For each card:

- Initially show no more than three set/printing choices.
- Put the selected printing first.
- Show set code and, when space allows, year and rarity.
- Add a “+ N sets” control when more printings exist.
- Open the full printing list in a searchable modal, drawer, or bottom sheet.
- Show art, full set name, set code, collector number, finish, release date, and price when available.
- Clearly distinguish “Any printing” from a specific preferred printing.
- Do not render dozens of chips in the card row.

If the user imports a set code, select the matching printing when the match is unambiguous.

## Mobile interface

Optimize for approximately 390px width.

- Collapse list navigation into a selector or drawer.
- Keep list name, progress, search, and filters compact.
- Use one item per row.
- Keep controls at least 44×44px.
- Show image, name, quantity progress, and two or three set codes.
- Open the full printing selector in a bottom sheet or dedicated panel.
- Do not introduce horizontal page scrolling.
- Make check-off and quantity changes comfortable with one hand.
- Preserve scroll position after updates.

## Filtering and sorting

Support:

- All
- Still needed
- Found
- Search within the list
- Original/list order
- Alphabetical
- Optional grouping by selected set

When grouping by set, provide an “Any printing” or “Unspecified printing” group.

Persist the user’s most recently selected list. Persist filters only if that matches existing application behavior.

## Interaction rules

- Completing a one-copy item sets `quantityFound` to `quantityWanted`.
- Multi-copy items use increment and decrement actions.
- Clamp `quantityFound` between zero and `quantityWanted`.
- Unchecking a completed item should use a predictable rule and be covered by tests.
- Show undo after removing an item.
- Confirm deleting an entire list.
- Display useful empty, hydration, enrichment-error, and storage-error states.

## Optional React structure

Adapt this to existing conventions rather than forcing it:

```
shopping-lists/
  components/
    ShoppingListHeader
    ShoppingListSidebar
    ShoppingListProgress
    ShoppingListItemRow
    PrintingChips
    PrintingPicker
    BulkImportDialog
    AddCardDialog
    LocalStorageNotice
    BackupImportDialog
  storage/
    shoppingListRepository
    schema
    migrations
  state/
    ShoppingListProvider
    useShoppingLists
  utils/
    parseShoppingList
    mergeShoppingListItems
```

Use the project’s existing state library if appropriate. Do not add a new global-state dependency solely for this feature.

## Accessibility

- Use semantic controls and headings.
- Provide labels for icon-only buttons.
- Support full keyboard navigation.
- Maintain visible focus states.
- Meet WCAG AA contrast.
- Do not communicate completion or printing selection through colour alone.
- Announce saved, failed, quantity, and completion changes appropriately.
- Respect reduced-motion preferences.

## Tests

Add tests following current project conventions.

### Storage tests

- empty initialization
- valid version-one hydration
- malformed JSON recovery
- unknown-version handling
- migration entry point
- create, update, and delete
- quantity updates
- selected printing
- duplicate merging
- quota/write failure
- cross-tab storage event
- merge and replace backup imports

### Parser tests

- card name only
- quantity plus name
- bracketed set code
- parenthesized set code
- duplicate lines
- blank lines
- invalid quantities
- ambiguous names
- unresolved names

### Component/browser tests

- hydration without server/client mismatch
- list creation
- individual card addition
- bulk-import review
- check-off and partial quantities
- set chips and printing picker
- filters
- desktop layout
- layout around 390px
- empty, loading, and error states
- data retained after reload
- JSON export and restore
- another-tab update

Run lint, type-checking, unit tests, and relevant browser tests.

## Acceptance criteria

The implementation is complete when:

- Users can create and manage multiple shopping lists without backend changes.
- Lists survive a normal browser refresh.
- Cards can be added manually or in bulk.
- Ambiguous and unresolved imports are reviewable.
- Wanted and found quantities are tracked correctly.
- Cards show a compact, uncluttered selection of available sets.
- Preferred printing can be selected or left as “Any printing.”
- Search and found/needed filters work without page reloads.
- Desktop and approximately 390px layouts are both usable.
- Direct `localStorage` access is isolated behind a repository or adapter.
- Persisted data is versioned and validated.
- Cross-tab changes are handled.
- Users can export and restore a JSON backup.
- The interface clearly says the lists are stored on the current device.
- No Prisma migration, GraphQL shopping-list operation, or backend endpoint is added.
- Existing Card Cloud tests continue to pass.

Finish by reporting:

- implementation summary
- key files changed
- local-storage schema and key
- tests run and results
- screenshots of desktop and mobile states
- known limitations
- recommended path for replacing local storage with cloud sync later

```

```
