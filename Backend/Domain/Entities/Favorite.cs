namespace Domain.Entities;

public class Favorite
{
    public Guid UserId { get; set; }
    public User User   { get; set; } = null!;

    public int     ProductId { get; set; }
    public Product Product   { get; set; } = null!;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
