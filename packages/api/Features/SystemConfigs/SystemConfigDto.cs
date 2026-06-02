namespace QLNP.Api.Features.SystemConfigs;

public sealed record SystemConfigDto(
    long Id, string ConfigKey, string ConfigValue, string? Description, DateTime UpdatedAt);
