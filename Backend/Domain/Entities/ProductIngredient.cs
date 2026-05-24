namespace Domain.Entities;

public class ProductIngredient
{
    public int    Id                { get; set; }
    public string Name              { get; set; } = null!;   // Ингредиент
    public string Dosage            { get; set; } = null!;   // мг / мкг
    public string? DailyValuePercent { get; set; }            // % от нормы
    public int    SortOrder         { get; set; }

    public int     ProductId { get; set; }
    public Product Product   { get; set; } = null!;
}
