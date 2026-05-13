namespace QLNP.Api.Middleware;

public record CurrentUser(long UserId, string UserName, string FullName, long? DonViId, string Role);
