namespace QLNP.Api.Shared.Contracts;

public record PagedData<T>(List<T> Items, int TotalCount, int Page, int PageSize);