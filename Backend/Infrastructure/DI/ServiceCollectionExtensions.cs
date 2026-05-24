using Infrastructure.Data;
using Infrastructure.Interfaces;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.DI;

public static class ServiceCollectionExtensions
{
    public static void AddInfrastructure(
        this IServiceCollection services,
        IConfiguration config)
    {
        // ── HTTP context accessor ─────────────────────────────────────────
        services.AddHttpContextAccessor();

        // ── Database ──────────────────────────────────────────────────────
        services.AddDbContext<AppDbContext>(opt =>
            opt.UseNpgsql(config.GetConnectionString("DefaultConnection")));

        // ── JWT helper (not an interface — used only inside AuthService) ──
        services.AddScoped<JwtService>();

        // ── Domain services ───────────────────────────────────────────────
        services.AddScoped<IAuthService,        AuthService>();
        services.AddScoped<IUserService,        UserService>();
        services.AddScoped<IProductService,     ProductService>();
        services.AddScoped<ICategoryService,    CategoryService>();
        services.AddScoped<IFavoriteService,    FavoriteService>();
        services.AddScoped<IArticleService,     ArticleService>();
        services.AddScoped<IBannerService,      BannerService>();
        services.AddScoped<IFaqService,         FaqService>();
        services.AddScoped<IPageContentService, PageContentService>();
        services.AddScoped<ISiteSettingService, SiteSettingService>();

        // ── File storage ──────────────────────────────────────────────────
        // IFileStorageService is registered in Program.cs (Cloudinary or Local based on env)
    }
}
