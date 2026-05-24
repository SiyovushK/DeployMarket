using System.Security.Claims;
using Domain.DTOs.Auth;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Register new buyer account.</summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        => Ok(await authService.RegisterAsync(dto));

    /// <summary>Login and receive access + refresh tokens.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        => Ok(await authService.LoginAsync(dto));

    /// <summary>Exchange a valid refresh token for a new token pair.</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshRequestDto dto)
        => Ok(await authService.RefreshAsync(dto.RefreshToken));

    /// <summary>Revoke a refresh token (logout from one device).</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequestDto dto)
    {
        await authService.LogoutAsync(dto.RefreshToken);
        return NoContent();
    }

    /// <summary>Change password. Revokes all refresh tokens for security.</summary>
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        await authService.ChangePasswordAsync(userId, dto);
        return NoContent();
    }
}
