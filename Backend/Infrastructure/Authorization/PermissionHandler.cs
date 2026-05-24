using Microsoft.AspNetCore.Authorization;

namespace Infrastructure.Authorization;

// ─── Requirement ─────────────────────────────────────────────────────────
public class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}

// ─── Handler ─────────────────────────────────────────────────────────────
public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var hasClaim = context.User.Claims
            .Any(c => c.Type == "permission" && c.Value == requirement.Permission);

        if (hasClaim)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
