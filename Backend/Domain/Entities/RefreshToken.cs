namespace Domain.Entities;

public class RefreshToken
{
    public Guid   Id        { get; set; } = Guid.NewGuid();
    public string Token     { get; set; } = null!;   // high-entropy random string
    public bool   IsRevoked { get; set; }
    public DateTime ExpiresAt  { get; set; }
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;

    public Guid UserId { get; set; }
    public User User   { get; set; } = null!;
}
