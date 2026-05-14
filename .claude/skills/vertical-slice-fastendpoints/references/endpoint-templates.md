# Endpoint Templates — Vertical Slice + FastEndpoints

## Models.cs (Request, Validator, Response)

```csharp
using FastEndpoints;
using FluentValidation;

namespace {Namespace}
{
    internal sealed class Request
    {
        // Properties matching API input
        public string Title { get; set; }
        public string Content { get; set; }
        public List<string> Tags { get; set; }
    }

    internal sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Title is Required.")
                .MinimumLength(10)
                .WithMessage("Title Too Short")
                .MaximumLength(50)
                .WithMessage("Title Too Long");

            RuleFor(x => x.Content)
                .NotEmpty()
                .WithMessage("Content is Required.")
                .MinimumLength(10)
                .WithMessage("Content Too Short")
                .MaximumLength(1000)
                .WithMessage("Content Too Long");
        }
    }

    internal sealed class Response
    {
        public string Message { get; set; }
        // Add response DTO properties as needed
    }
}
```

### Notes
- `Request` = input DTO (what the client sends)
- `Validator` = FluentValidation rules, lives alongside Request
- `Response` = output DTO (what the client receives)
- All three are `internal sealed` by convention

---

## Mapper.cs

```csharp
using FastEndpoints;
using {DomainEntityNamespace};

namespace {Namespace}
{
    internal sealed class Mapper : Mapper<Request, Response, {DomainEntity}>
    {
        public override {DomainEntity} ToEntity(Request r) => new()
        {
            Title = r.Title,
            Content = r.Content,
            Tags = r.Tags
        };

        // Optional: override FromEntity for response mapping
        // public override Response FromEntity({DomainEntity} e) => new()
        // {
        //     Message = $"Created: {e.Title}"
        // };
    }
}
```

### Notes
- Maps Request DTO → Domain Entity and vice versa
- No AutoMapper — explicit mapping per endpoint
- `ToEntity()` for command input mapping
- `FromEntity()` for query output mapping

---

## Data.cs

```csharp
namespace {Namespace}
{
    internal sealed class Data
    {
        // Business logic and repository calls go here
        // This is the "service layer" within the slice
        
        // Example:
        // private readonly AppDbContext _db;
        // public Data(AppDbContext db) => _db = db;
        //
        // public async Task<{DomainEntity}> SaveStory({DomainEntity} entity)
        // {
        //     _db.Stories.Add(entity);
        //     await _db.SaveChangesAsync();
        //     return entity;
        // }
    }
}
```

### Notes
- Contains all business logic for this specific feature
- Inject repositories/DbContext via constructor
- This is where CQRS-lite diverges: no separate read/write models, just naming convention
- Keep logic specific to this slice — no cross-slice calls

---

## Endpoint.cs

```csharp
using FastEndpoints;

namespace {Namespace}
{
    internal sealed class Endpoint : Endpoint<Request, Response, Mapper>
    {
        public override void Configure()
        {
            {HttpMethod}("{route}");
            AllowAnonymous(); // Replace with proper auth
        }

        public override async Task HandleAsync(Request r, CancellationToken c)
        {
            // 1. Map request to domain entity
            var entity = Map.ToEntity(r);

            // 2. Execute business logic (call Data class methods)
            // var result = await _data.SaveStory(entity);

            // 3. Return response
            await SendAsync(new Response
            {
                Message = "Operation completed successfully"
            });
        }
    }
}
```

### Notes
- `Configure()` — defines HTTP method, route, auth policies
- `HandleAsync()` — orchestrates: map → execute → respond
- One endpoint class = one route = one action
- Available HTTP methods: `Get`, `Post`, `Put`, `Patch`, `Delete`
- Auth methods: `AllowAnonymous()`, `Roles()`, `Policies()`

---

## Query Endpoint Variant (GET)

```csharp
using FastEndpoints;

namespace {Namespace}
{
    // Query: no request body, route params or query string
    internal sealed class GetStoryEndpoint : EndpointWithoutRequest<Response>
    {
        public override void Configure()
        {
            Get("/author/stories/{id}");
            AllowAnonymous();
        }

        public override async Task HandleAsync(CancellationToken c)
        {
            var id = Route<string>("id");
            // Fetch from Data class
            await SendAsync(new Response { Message = $"Story {id}" });
        }
    }
}
```

### Notes
- `EndpointWithoutRequest<TResponse>` for GET endpoints with no body
- Access route params via `Route<T>("paramName")`
- Access query string via `Query<T>("paramName")`
