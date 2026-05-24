using Domain.Enums;

namespace Domain.Entities;

public class User
{
    public Guid   Id           { get; set; } = Guid.NewGuid();
    public string Email        { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string FirstName    { get; set; } = null!;
    public string LastName     { get; set; } = string.Empty;
    public string? Phone       { get; set; }

    public UserStatus Status    { get; set; } = UserStatus.Active;
    public DateTime  CreatedAt  { get; set; } = DateTime.UtcNow;

    public int  RoleId { get; set; }
    public Role Role   { get; set; } = null!;

    public ICollection<Favorite> Favorites { get; set; } = [];
}
