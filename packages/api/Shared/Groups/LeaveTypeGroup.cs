using FastEndpoints;
using QLNP.Api.Infrastructure.Auth;

namespace QLNP.Api.Shared.Groups;

public class LeaveTypeGroup : Group {
    public LeaveTypeGroup() {
        Configure("api/leave-types", ep => {
            ep.Description(x => x.WithTags("Leave Types"));
        });
    }
}