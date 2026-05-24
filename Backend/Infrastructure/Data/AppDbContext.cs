using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User>              Users              { get; set; }
    public DbSet<Role>              Roles              { get; set; }
    public DbSet<Permission>        Permissions        { get; set; }
    public DbSet<RolePermission>    RolePermissions    { get; set; }
    public DbSet<RefreshToken>      RefreshTokens      { get; set; }
    public DbSet<Category>          Categories         { get; set; }
    public DbSet<Product>           Products           { get; set; }
    public DbSet<ProductImage>      ProductImages      { get; set; }
    public DbSet<ProductIngredient> ProductIngredients { get; set; }
    public DbSet<Favorite>          Favorites          { get; set; }
    public DbSet<Article>           Articles           { get; set; }
    public DbSet<Banner>            Banners            { get; set; }
    public DbSet<FaqItem>           FaqItems           { get; set; }
    public DbSet<PageContent>       PageContents       { get; set; }
    public DbSet<SiteSetting>       SiteSettings       { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<RolePermission>().HasKey(rp => new { rp.RoleId, rp.PermissionId });
        mb.Entity<Favorite>().HasKey(f => new { f.UserId, f.ProductId });

        mb.Entity<User>().HasIndex(u => u.Email).IsUnique();
        mb.Entity<User>().Property(u => u.Status).HasConversion<string>();

        mb.Entity<RefreshToken>().HasIndex(rt => rt.Token).IsUnique();
        mb.Entity<RefreshToken>()
          .HasOne(rt => rt.User).WithMany()
          .HasForeignKey(rt => rt.UserId).OnDelete(DeleteBehavior.Cascade);

        mb.Entity<Product>().HasIndex(p => p.SKU).IsUnique();
        mb.Entity<Product>().Property(p => p.Status).HasConversion<string>();
        mb.Entity<Product>().Property(p => p.Price).HasPrecision(18, 2);

        mb.Entity<Category>()
          .HasOne(c => c.Parent).WithMany(c => c.Children)
          .HasForeignKey(c => c.ParentId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Category>().HasIndex(c => c.Slug).IsUnique();

        mb.Entity<Article>().HasIndex(a => a.Slug).IsUnique();
        mb.Entity<SiteSetting>().HasIndex(s => s.Key).IsUnique();
        mb.Entity<PageContent>().HasIndex(p => p.Key).IsUnique();
    }
}
