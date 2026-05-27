using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace QLNP.Api.Shared;

public static class LinqExtension
{
    public static IQueryable<TSource> WhereIf<TSource>(
        this IQueryable<TSource> source,
        bool when,
        Expression<Func<TSource, bool>> predicateTrue,
        Expression<Func<TSource, bool>>? predicateFalse = null)
    {
        if (when) return source.Where(predicateTrue);
        return predicateFalse != null ? source.Where(predicateFalse) : source;
    }

    public static async Task<int> CountIf<TSource, TResult>(
        this IQueryable<TSource> source,
        bool when,
        Expression<Func<TSource, TResult>>? selector = null,
        CancellationToken cancellationToken = default)
    {
        if (!when) return 0;
        return selector != null
            ? await source.Select(selector).CountAsync(cancellationToken)
            : await source.CountAsync(cancellationToken);
    }

    public static IQueryable<TSource> Paging<TSource>(
        this IQueryable<TSource> source, int skip, int take)
        => source.Paging(true, skip, take);

    public static IQueryable<TSource> Paging<TSource>(
        this IQueryable<TSource> source, bool when, int skip, int take)
        => when ? source.Skip(skip).Take(take) : source;
}