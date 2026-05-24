using System.Security.Claims;
using Domain.DTOs.Users;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController(IUserService userService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

    [HttpGet]
    public async Task<ActionResult<UserProfileDto>> Get()
        => Ok(await userService.GetProfileAsync(UserId));

    [HttpPut]
    public async Task<ActionResult<UserProfileDto>> Update([FromBody] UpdateProfileDto dto)
        => Ok(await userService.UpdateProfileAsync(UserId, dto));
}
