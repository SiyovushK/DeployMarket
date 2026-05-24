using System.ComponentModel.DataAnnotations;

namespace Domain.DTOs.Auth;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string FirstName,
    string LastName = "",
    string? Phone = null
);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    string Email,
    string FirstName,
    string LastName,
    string Role
);

public record RefreshRequestDto(
    [Required] string RefreshToken
);

public record ChangePasswordDto(
    [Required] string CurrentPassword,
    [Required, MinLength(8)] string NewPassword
);
