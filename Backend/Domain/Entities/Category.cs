namespace Domain.Entities;

public class Category
{
    public int    Id        { get; set; }
    public string Name      { get; set; } = null!;
    public string Slug      { get; set; } = null!;
    public int    SortOrder { get; set; }

    public int?     ParentId { get; set; }
    public Category? Parent  { get; set; }

    public ICollection<Category> Children { get; set; } = [];
    public ICollection<Product>  Products { get; set; } = [];
}
