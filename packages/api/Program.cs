using System.Text;
using System.Text.Json.Serialization;
using FastEndpoints;
using FastEndpoints.Swagger;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Data;
using QLNP.Api.Shared.Domain;
using QLNP.Api.Shared.Contracts;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFastEndpoints()
    .SwaggerDocument(o => {
        o.DocumentSettings = s => {
            s.Title = "QLNP API";
            s.Version = "v1";
        };
    });

builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull);

builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtConfig = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => {
        o.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig["Issuer"],
            ValidAudience = jwtConfig["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtConfig["SigningKey"]!)),
            RoleClaimType = "Roles"
        };
    });

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5100", "http://192.168.1.75:5100", "http://localhost:8001"];
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Current User Provider
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserProvider, CurrentUserProvider>();

// Services
builder.Services.AddScoped<ILeaveBalanceService, LeaveBalanceService>();

var app = builder.Build();

// Auto-apply pending EF Core migrations and seed leave balances (skip in test environment)
if (!app.Environment.IsEnvironment("Test")) {
    using (var scope = app.Services.CreateScope()) {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
        await SeedHelper.MigrateLegacyStatusesAsync(db);
        await SeedHelper.SeedLeaveBalancesAsync(db);
    }
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

var frameAncestors = app.Configuration["Security:FrameAncestors"] ?? "'self'";
app.Use(async (ctx, next) => {
    ctx.Response.Headers.Append("Content-Security-Policy", $"frame-ancestors {frameAncestors}");
    await next(ctx);
});

app.UseFastEndpoints(config => {
    config.Errors.ResponseBuilder = (failures, ctx, statusCode) => {
        return Result<object>.Fail("Validation failed", failures.Select(f => f.ErrorMessage).ToArray());
    };
})
.UseSwaggerGen();

app.Run();