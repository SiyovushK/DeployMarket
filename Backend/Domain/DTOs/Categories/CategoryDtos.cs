using System.ComponentModel.DataAnnotations;

namespace Domain.DTOs.Categories;

public record CategoryDto(
    int     Id,
    string  Name,
    string  Slug,
    int     SortOrder,
    int?    ParentId,
    IEnumerable<CategoryDto> Children
);

public record CategoryFlatDto(
    int     Id,
    string  Name,
    string  Slug,
    int     SortOrder,
    int?    ParentId,
    string? ParentName
);

public record CategoryCreateDto(
    [Required] string Name,
    int? ParentId   = null,
    int  SortOrder  = 0
);

public record CategoryUpdateDto(
    string? Name      = null,
    int?    ParentId  = null,
    int?    SortOrder = null
);
