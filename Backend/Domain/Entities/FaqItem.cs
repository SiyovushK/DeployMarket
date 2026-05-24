namespace Domain.Entities;

public class FaqItem
{
    public int    Id        { get; set; }
    public string Question  { get; set; } = null!;
    public string Answer    { get; set; } = null!;
    public int    SortOrder { get; set; }
}
