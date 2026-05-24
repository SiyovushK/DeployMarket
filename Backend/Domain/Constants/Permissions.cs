namespace Domain.Constants;

public static class Permissions
{
    // Products
    public const string ProductsCreate = "products.create";
    public const string ProductsUpdate = "products.update";
    public const string ProductsDelete = "products.delete";

    // Categories
    public const string CategoriesManage = "categories.manage";

    // Articles / Blog
    public const string ArticlesManage = "articles.manage";

    // Banners
    public const string BannersManage = "banners.manage";

    // FAQ
    public const string FaqManage = "faq.manage";

    // Page content (About, Company, etc.)
    public const string ContentManage = "content.manage";

    // Users (buyers list — view only)
    public const string UsersView = "users.view";

    // Staff management (SuperAdmin only)
    public const string UsersManage = "users.manage";

    // Global settings (SuperAdmin only)
    public const string SettingsManage = "settings.manage";

    /// <summary>All permissions assigned to ContentManager role.</summary>
    public static readonly string[] ContentManagerPermissions =
    [
        ProductsCreate, ProductsUpdate, ProductsDelete,
        CategoriesManage,
        ArticlesManage,
        BannersManage,
        FaqManage,
        ContentManage,
    ];

    /// <summary>Additional permissions for SuperAdmin (on top of ContentManager).</summary>
    public static readonly string[] SuperAdminExtra =
    [
        UsersView,
        UsersManage,
        SettingsManage,
    ];
}
