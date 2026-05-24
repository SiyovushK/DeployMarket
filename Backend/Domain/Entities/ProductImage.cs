namespace Domain.Entities;

public class ProductImage
{
    public int    Id            { get; set; }
    public string Url           { get; set; } = null!;
    public bool   IsMain        { get; set; }
    public bool   IsCertificate { get; set; }   // скан сертификата
    public int    SortOrder     { get; set; }

    public int     ProductId { get; set; }
    public Product Product   { get; set; } = null!;
}
