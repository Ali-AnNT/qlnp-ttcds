# CQRS-lite Naming Conventions & Feature Organization

## Naming Rules

### Commands (Write — alters state)

| Prefix | Meaning | Example |
|--------|---------|---------|
| `Save` | Create or update | `SaveStory`, `SaveProfile` |
| `Create` | New resource | `CreateAccount`, `CreateComment` |
| `Publish` | Make visible/public | `PublishStory`, `PublishArticle` |
| `Approve` | Accept pending item | `ApproveStory`, `ApproveComment` |
| `Deny` / `Reject` | Reject pending item | `DenyStory`, `RejectPayment` |
| `Delete` / `Remove` | Delete resource | `DeleteAccount`, `RemoveBookmark` |
| `Update` | Partial update | `UpdateProfile`, `UpdateSettings` |
| `Make` | Action/transaction | `MakePayment`, `MakeReservation` |
| `Add` | Add to collection | `AddStoryToPublication` |

### Queries (Read — retrieves data)

| Prefix | Meaning | Example |
|--------|---------|---------|
| `Get` | Single item | `GetStory`, `GetProfile` |
| `GetMy` | Current user's items | `GetMyStories`, `GetMyPayments` |
| `List` | Collection | `ListStories`, `ListComments` |
| `Search` | Filtered collection | `SearchStories`, `SearchAuthors` |
| `Check` | Boolean result | `CheckAvailability`, `CheckPermission` |

### Namespace Convention

```txt
{Entity}.{Feature}.{Action}

Examples:
Author.Stories.SaveStory
Author.Stories.PublishStory
Author.Stories.GetStory
Author.Stories.GetMyStories
Admin.Stories.ApproveStory
Reader.Bookmarks.BookmarkStory
Reader.Follows.FollowAuthor
```

### Route Convention

```txt
/{entity}/{action} or /{entity}/{sub-entity}/{action}

Examples:
POST   /author/savestory
POST   /author/publishstory
GET    /author/stories/{id}
GET    /author/mystories
POST   /admin/approvestory/{id}
POST   /reader/bookmarkstory/{storyId}
POST   /reader/followauthor/{authorId}
```

---

## Feature Organization Patterns

### Pattern 1: Entity-First (Recommended)

Best for domains with clear business entities.

```txt
Project/
├── Admin/
│   ├── Login/
│   ├── GetStoriesToReview/
│   └── ApproveStory/
├── Author/
│   ├── SignUp/
│   ├── MakePayment/
│   └── Stories/
│       ├── SaveStory/
│       ├── PublishStory/
│       ├── GetStory/
│       └── GetMyStories/
├── Reader/
│   ├── SignUp/
│   ├── BookmarkStory/
│   └── FollowAuthor/
└── Stats/
    └── GetStoryStats/
```

### Pattern 2: Bounded Context-First

Best for large systems with distinct subdomains.

```txt
Project/
├── ContentManagement/
│   ├── CreateStory/
│   ├── PublishStory/
│   └── ReviewStory/
├── Identity/
│   ├── SignUp/
│   ├── Login/
│   └── GetProfile/
├── Social/
│   ├── FollowAuthor/
│   ├── BookmarkStory/
│   └── GetFeed/
└── Billing/
    ├── MakePayment/
    └── GetPaymentHistory/
```

### Pattern 3: Use Case-First

Best for event-sourced or CQRS-heavy systems.

```txt
Project/
├── Commands/
│   ├── SaveStory/
│   ├── PublishStory/
│   ├── ApproveStory/
│   └── MakePayment/
├── Queries/
│   ├── GetStory/
│   ├── GetMyStories/
│   ├── GetStoryStats/
│   └── GetPaymentHistory/
└── Events/
    ├── StoryCreated/
    ├── StoryPublished/
    └── PaymentProcessed/
```

---

## Decision Guide: Which Pattern?

| Scenario | Recommended Pattern |
|----------|-------------------|
| Small-medium API, clear entities | Entity-First |
| Large system, distinct subdomains | Bounded Context-First |
| Event Sourcing / full CQRS | Use Case-First |
| Starting new project | Entity-First (refactor later) |

---

## Anti-Patterns to Avoid

1. **Shared Service layer** — defeats purpose of vertical slices
2. **Cross-slice calls** — each slice must be independent
3. **Generic Repository** — each slice owns its data access
4. **AutoMapper between slices** — explicit mapping per slice
5. **God endpoints** — 1 endpoint doing multiple things
6. **Feature folders with shared Models.cs** — each endpoint = its own models
