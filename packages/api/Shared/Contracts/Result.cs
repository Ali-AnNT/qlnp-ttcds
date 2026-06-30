using System.Text.Json.Serialization;

namespace QLNP.Api.Shared.Contracts;

public record Result<T> {
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public string[]? Errors { get; init; }

    public static Result<T> Ok(T data) => new() { Success = true, Data = data };
    public static Result<T> Fail(string message, string[]? errors = null) =>
        new() { Success = false, Message = message, Errors = errors };
}