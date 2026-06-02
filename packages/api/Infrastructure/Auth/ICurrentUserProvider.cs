using QLNP.Api.Shared.Middleware;

namespace QLNP.Api.Infrastructure.Auth;

public interface ICurrentUserProvider {
    CurrentUser GetCurrentUser();
}
