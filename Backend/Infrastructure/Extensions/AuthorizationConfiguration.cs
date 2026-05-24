using Domain.Constants;
using Infrastructure.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Extensions;

public static class AuthorizationConfiguration
{
    public static void AddAuthorizationConfiguration(this IServiceCollection services)
    {
        services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

        services.AddAuthorizationBuilder()
            .AddPolicy(Permissions.ProductsCreate,   p => p.AddRequirements(new PermissionRequirement(Permissions.ProductsCreate)))
            .AddPolicy(Permissions.ProductsUpdate,   p => p.AddRequirements(new PermissionRequirement(Permissions.ProductsUpdate)))
            .AddPolicy(Permissions.ProductsDelete,   p => p.AddRequirements(new PermissionRequirement(Permissions.ProductsDelete)))
            .AddPolicy(Permissions.CategoriesManage, p => p.AddRequirements(new PermissionRequirement(Permissions.CategoriesManage)))
            .AddPolicy(Permissions.ArticlesManage,   p => p.AddRequirements(new PermissionRequirement(Permissions.ArticlesManage)))
            .AddPolicy(Permissions.BannersManage,    p => p.AddRequirements(new PermissionRequirement(Permissions.BannersManage)))
            .AddPolicy(Permissions.FaqManage,        p => p.AddRequirements(new PermissionRequirement(Permissions.FaqManage)))
            .AddPolicy(Permissions.ContentManage,    p => p.AddRequirements(new PermissionRequirement(Permissions.ContentManage)))
            .AddPolicy(Permissions.UsersView,        p => p.AddRequirements(new PermissionRequirement(Permissions.UsersView)))
            .AddPolicy(Permissions.UsersManage,      p => p.AddRequirements(new PermissionRequirement(Permissions.UsersManage)))
            .AddPolicy(Permissions.SettingsManage,   p => p.AddRequirements(new PermissionRequirement(Permissions.SettingsManage)));
    }
}
