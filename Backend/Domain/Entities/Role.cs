namespace Domain.Entities;

public class Role
{
    public int Id { get; set; }

    /// <summary>e.g. "Buyer", "ContentManager", "SuperAdmin"</summary>
    public string Name { get; set; } = null!;

    public ICollection<User>           Users           { get; set; } = [];
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}
