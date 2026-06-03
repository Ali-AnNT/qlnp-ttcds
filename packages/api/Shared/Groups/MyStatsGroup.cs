using FastEndpoints;

namespace QLNP.Api.Shared.Groups;

public class MyStatsGroup : Group {
    public MyStatsGroup() {
        Configure("api/my-stats", ep => {
            ep.Description(x => x.WithTags("My Stats"));
        });
    }
}
