using FastEndpoints;

namespace QLNP.Api.Shared.Groups;

public class LeaveRequestGroup : Group {
    public LeaveRequestGroup() {
        Configure("api/leave-requests", ep => {
            ep.Description(x => x.WithTags("Leave Requests"));
        });
    }
}