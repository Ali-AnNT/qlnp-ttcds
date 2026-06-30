namespace QLNP.Api.Features.Auth.Me;

internal sealed record Response(
    long UserId,
    string? UserName,
    string FullName,
    long? DonViId,
    string Role
);
