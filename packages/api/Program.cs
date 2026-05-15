using FastEndpoints;
using FastEndpoints.Swagger;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QLNP.Api.Auth;
using QLNP.Api.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFastEndpoints()
    .SwaggerDocument(o =>
    {
        o.DocumentSettings = s =>
        {
            s.Title = "QLNP API";
            s.Version = "v1";
        };
    });

builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtConfig = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
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

// Current User Provider
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserProvider, CurrentUserProvider>();

// Data classes
builder.Services.AddScoped<QLNP.Api.Features.LeaveTypes.Create.Data>();
builder.Services.AddScoped<QLNP.Api.Features.LeaveTypes.Update.Data>();
builder.Services.AddScoped<QLNP.Api.Features.LeaveTypes.List.Data>();
builder.Services.AddScoped<QLNP.Api.Features.LeaveTypes.Delete.Data>();
builder.Services.AddScoped<QLNP.Api.Features.Auth.Me.Data>();
builder.Services.AddScoped<QLNP.Api.Features.LeaveRequests.List.Data>();
builder.Services.AddScoped<QLNP.Api.Features.LeaveRequests.Create.Data>();
builder.Services.AddScoped<QLNP.Api.Features.LeaveRequests.Update.Data>();

var app = builder.Build();

// Auto-apply pending EF Core migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseAuthentication();
app.UseAuthorization();

var frameAncestors = app.Configuration["Security:FrameAncestors"] ?? "'self'";
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Append("Content-Security-Policy", $"frame-ancestors {frameAncestors}");
    await next(ctx);
});

app.UseFastEndpoints()
    .UseSwaggerGen();

app.Run();
