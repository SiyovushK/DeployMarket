using Domain.Enums;

namespace Domain.Entities;

public class Product
{
    public int    Id               { get; set; }
    public string Name             { get; set; } = null!;
    public string SKU              { get; set; } = null!;  // артикул
    public decimal Price           { get; set; }

    // Content
    public string? ShortDescription   { get; set; }
    public string? FullDescription    { get; set; }
    public string? Usage              { get; set; }   // инструкция
    public string? Contraindications  { get; set; }   // противопоказания

    // Marketplace links
    public string? OzonUrl       { get; set; }
    public string? WildberriesUrl { get; set; }

    // Visibility / flags
    public ProductStatus Status  { get; set; } = ProductStatus.Draft;
    public bool IsHit            { get; set; }
    public bool IsNew            { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int      CategoryId { get; set; }
    public Category Category   { get; set; } = null!;

    public ICollection<ProductImage>      Images      { get; set; } = [];
    public ICollection<ProductIngredient> Ingredients { get; set; } = [];
    public ICollection<Favorite>          Favorites   { get; set; } = [];
}
