namespace QLNP.Api.Features.Config.Update;

internal sealed record Request(IReadOnlyList<ConfigDto> Items);
internal sealed record Response(string Message);
