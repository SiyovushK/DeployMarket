namespace Domain.Entities;

/// <summary>
/// Static editable page blocks.
/// Key examples: "about_person", "about_company", "certificates".
/// </summary>
public class PageContent
{
    public int     Id         { get; set; }
    public string  Key        { get; set; } = null!;   // unique page identifier
    public string  Title      { get; set; } = null!;
    public string? Content    { get; set; }             // HTML
    public string? ImageUrl   { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
