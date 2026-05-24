namespace Domain.DTOs.Favorites;

public record FavoriteItemDto(
    int     ProductId,
    string  Name,
    decimal Price,
    string? MainImageUrl,
    string? OzonUrl,
    string? WildberriesUrl,
    DateTime AddedAt
);

// ─── Shared pagination wrapper ──────────────────────────────────────────────
public record PagedResult<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int Page,
    int PageSize
)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
