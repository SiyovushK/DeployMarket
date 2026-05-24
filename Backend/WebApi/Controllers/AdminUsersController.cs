using Domain.Constants;
using Domain.DTOs.Users;
using Infrastructure.Authorization;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[ApiController]
[Route("api/admin/users")]
public class AdminUsersController(IUserService userService) : BaseController
{
    /// <summary>List of registered buyers with optional search.</summary>
    [HttpGet("buyers")]
    [HasPermission(Permissions.UsersView)]
    public async Task<IActionResult> GetBuyers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await userService.GetBuyersAsync(page, pageSize, search));

    /// <summary>List of staff/admin accounts with optional search.</summary>
    [HttpGet("staff")]
    [HasPermission(Permissions.UsersView)]
    public async Task<IActionResult> GetStaff(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
        => Ok(await userService.GetStaffAsync(page, pageSize, search));

    /// <summary>Create a new staff account (SuperAdmin only).</summary>
    [HttpPost("staff")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto)
    {
        await userService.CreateStaffAsync(dto);
        return NoContent();
    }

    /// <summary>Block or unblock a staff member (also works for buyers).</summary>
    [HttpPatch("staff/{id:guid}/status")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<IActionResult> SetStaffStatus(Guid id, [FromBody] UpdateStaffStatusDto dto)
    {
        await userService.SetUserBlockedAsync(id, CurrentUserId, dto.Block);
        return NoContent();
    }
}
