using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Domain.DTOs.Products;

// ─── Query params for catalog ──────────────────────────────────────────────
public record ProductQueryParams
{
    public string?        Search       { get; init; }
    public int?           CategoryId   { get; init; }
    public ProductStatus? Status       { get; init; }   // null = Published only (public)
    public string?        Purpose      { get; init; }   // "для сна", "для энергии" — stored in tags / future
    public string?        Form         { get; init; }   // "капсулы", "таблетки"
    public string?        Audience     { get; init; }   // "для мужчин"
    public decimal?       PriceMin     { get; init; }
    public decimal?       PriceMax     { get; init; }
    public bool?          IsHit        { get; init; }
    public bool?          IsNew        { get; init; }
    public string         SortBy       { get; init; } = "createdAt";  // price_asc | price_desc | popular | createdAt
    public int            Page         { get; init; } = 1;
    public int            PageSize     { get; init; } = 20;
}

// ─── List item (mini-card) ──────────────────────────────────────────────────
public record ProductListItemDto(
    int     Id,
    string  Name,
    string  SKU,
    decimal Price,
    string? MainImageUrl,
    string  Status,
    bool    IsHit,
    bool    IsNew,
    string  CategoryName
);

// ─── Full detail DTO ────────────────────────────────────────────────────────
public record ProductDto(
    int     Id,
    string  Name,
    string  SKU,
    decimal Price,
    string? ShortDescription,
    string? FullDescription,
    string? Usage,
    string? Contraindications,
    string? OzonUrl,
    string? WildberriesUrl,
    string  Status,
    bool    IsHit,
    bool    IsNew,
    DateTime CreatedAt,
    int     CategoryId,
    string  CategoryName,
    IEnumerable<ProductImageDto>      Images,
    IEnumerable<ProductIngredientDto> Ingredients
);

public record ProductImageDto(
    int    Id,
    string Url,
    bool   IsMain,
    bool   IsCertificate,
    int    SortOrder
);

public record ProductIngredientDto(
    int     Id,
    string  Name,
    string  Dosage,
    string? DailyValuePercent,
    int     SortOrder
);

// ─── Create / Update ────────────────────────────────────────────────────────
public record ProductCreateDto(
    [Required] string Name,
    [Required] string SKU,
    [Required] decimal Price,
    [Required] int CategoryId,
    string? ShortDescription    = null,
    string? FullDescription     = null,
    string? Usage               = null,
    string? Contraindications   = null,
    string? OzonUrl             = null,
    string? WildberriesUrl      = null,
    bool IsHit                  = false,
    bool IsNew                  = false
);

public record ProductUpdateDto(
    string?  Name               = null,
    decimal? Price              = null,
    int?     CategoryId         = null,
    string?  ShortDescription   = null,
    string?  FullDescription    = null,
    string?  Usage              = null,
    string?  Contraindications  = null,
    string?  OzonUrl            = null,
    string?  WildberriesUrl     = null,
    bool?    IsHit              = null,
    bool?    IsNew              = null,
    ProductStatus? Status       = null
);

public record IngredientUpsertDto(
    [Required] string Name,
    [Required] string Dosage,
    string? DailyValuePercent,
    int     SortOrder = 0
);

// ─── Admin dashboard stats ──────────────────────────────────────────────────
public record DashboardDto(
    int ActiveProductsCount,
    int RegisteredBuyersCount,
    IEnumerable<ProductListItemDto> LatestProducts
);
