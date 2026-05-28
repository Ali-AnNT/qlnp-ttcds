using FastEndpoints;

namespace QLNP.Api.Shared.Groups;

public class LeaveBalanceGroup : Group {
    public LeaveBalanceGroup() {
        Configure("api/leave-balances", ep => {
            ep.Description(x => x.WithTags("Leave Balances"));
        });
    }
}