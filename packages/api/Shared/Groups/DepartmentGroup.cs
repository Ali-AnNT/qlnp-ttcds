using FastEndpoints;

namespace QLNP.Api.Shared.Groups;

public class DepartmentGroup : Group {
    public DepartmentGroup() {
        Configure("api/departments", ep => {
            ep.Description(x => x.WithTags("Departments"));
        });
    }
}