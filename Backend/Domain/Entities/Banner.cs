namespace Domain.Entities;

public class Banner
{
    public int     Id          { get; set; }
    public string  ImageUrl    { get; set; } = null!;
    public string? LinkUrl     { get; set; }
    public string? Title       { get; set; }
    public string? Description { get; set; }
    public int     SortOrder   { get; set; }
    public bool    IsActive    { get; set; } = true;
}
