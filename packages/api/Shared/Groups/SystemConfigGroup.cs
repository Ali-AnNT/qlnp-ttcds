using FastEndpoints;

namespace QLNP.Api.Shared.Groups;

public class SystemConfigGroup : Group {
    public SystemConfigGroup() {
        Configure("api/system-configs", ep => {
            ep.Description(x => x.WithTags("System Configs"));
        });
    }
}