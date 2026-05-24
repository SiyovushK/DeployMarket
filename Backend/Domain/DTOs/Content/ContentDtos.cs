using System.ComponentModel.DataAnnotations;

namespace Domain.DTOs.Content;

// ─── Banners ──────────────────────────────────────────────────────────────
// NOTE: ImageUrl is NOT part of the create DTO — it is resolved from the
//       uploaded IFormFile inside BannerService and stored by IFileStorageService.
public record BannerCreateDto(
    string? LinkUrl     = null,
    string? Title       = null,
    string? Description = null,
    int     SortOrder   = 0,
    bool    IsActive    = true
);

public record BannerUpdateDto(
    string? LinkUrl     = null,
    string? Title       = null,
    string? Description = null,
    int?    SortOrder   = null,
    bool?   IsActive    = null
);

// ─── FAQ ──────────────────────────────────────────────────────────────────
public record FaqItemCreateDto(
    [Required] string Question,
    [Required] string Answer,
    int SortOrder = 0
);

// ─── Articles ────────────────────────────────────────────────────────────
public record ArticleCreateDto(
    [Required] string Title,
    string? Slug = null,
    [Required] string Content = "",
    bool IsPublished = false
);

public record ArticleUpdateDto(
    string? Title = null,
    string? Content = null,
    bool? IsPublished = null
);

// ─── Page content ─────────────────────────────────────────────────────────
public record PageContentCreateDto(
    [Required] string Key,
    [Required] string Title,
    string? Content = null
);

public record PageContentUpdateDto(
    string? Title   = null,
    string? Content = null
);

// ─── Site settings ────────────────────────────────────────────────────────
public record SiteSettingUpdateDto([Required] string Value);

// ─── DTOs ─────────────────────────────────────────────────────────────────
public record ArticleListItemDto(
    int Id,
    string Title,
    string Slug,
    string? CoverImageUrl,
    bool IsPublished,
    DateTime? PublishedAt,
    DateTime CreatedAt
);

public record ArticleDto(
    int Id,
    string Title,
    string Slug,
    string? CoverImageUrl,
    string Content,
    bool IsPublished,
    DateTime? PublishedAt,
    DateTime CreatedAt
);

public record BannerDto(int Id, string ImageUrl, string? LinkUrl, string? Title, string? Description, int SortOrder, bool IsActive);
public record FaqItemDto(int Id, string Question, string Answer, int SortOrder);
public record PageContentDto(int Id, string Key, string Title, string? Content, string? ImageUrl, DateTime UpdatedAt);
public record SiteSettingDto(string Key, string Value);
