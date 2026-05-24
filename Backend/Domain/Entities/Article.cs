namespace Domain.Entities;

public class Article
{
    public int      Id            { get; set; }
    public string   Title         { get; set; } = null!;
    public string   Slug          { get; set; } = null!;
    public string?  CoverImageUrl { get; set; }
    public string   Content       { get; set; } = null!;   // HTML from WYSIWYG
    public bool     IsPublished   { get; set; }
    public DateTime? PublishedAt  { get; set; }
    public DateTime  CreatedAt    { get; set; } = DateTime.UtcNow;
}
