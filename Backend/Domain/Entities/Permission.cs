namespace Domain.Entities;

public class Permission
{
    public int Id { get; set; }

    /// <summary>e.g. "products.create"</summary>
    public string Name { get; set; } = null!;

    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}
