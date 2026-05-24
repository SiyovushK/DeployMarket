using Microsoft.AspNetCore.Authorization;

namespace Infrastructure.Authorization;

public class HasPermissionAttribute(string permission)
    : AuthorizeAttribute(policy: permission);
