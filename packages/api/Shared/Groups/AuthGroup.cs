using FastEndpoints;

namespace QLNP.Api.Shared.Groups;

public class AuthGroup : Group {
    public AuthGroup() {
        Configure("api/auth", ep => {
            ep.Description(x => x.WithTags("Auth"));
        });
    }
}