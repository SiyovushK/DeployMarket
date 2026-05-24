using Domain.Constants;
using Domain.DTOs.Auth;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class AuthService(AppDbContext db, JwtService jwt) : IAuthService
{
    // ── Register ──────────────────────────────────────────────────────────
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (await db.Users.AnyAsync(u => u.Email == dto.Email.ToLowerInvariant()))
            throw new AppException(ErrorMessages.Email_Already_Exists);

        var buyerRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Buyer")
            ?? throw new AppException(ErrorMessages.Role_Not_Found);

        var user = new User
        {
            Email        = dto.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName    = dto.FirstName,
            LastName     = dto.LastName,
            Phone        = dto.Phone,
            RoleId       = buyerRole.Id,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Buyer role has no permissions
        return await IssueTokenPairAsync(user, buyerRole.Name, []);
    }

    // ── Login ─────────────────────────────────────────────────────────────
    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await db.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLowerInvariant())
            ?? throw new AppException(ErrorMessages.Invalid_Credentials);

        if (user.Status == UserStatus.Blocked)
            throw new AppException(ErrorMessages.User_Blocked);

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new AppException(ErrorMessages.Invalid_Credentials);

        var permissions = user.Role.RolePermissions.Select(rp => rp.Permission.Name);
        return await IssueTokenPairAsync(user, user.Role.Name, permissions);
    }

    // ── Refresh ───────────────────────────────────────────────────────────
    public async Task<AuthResponseDto> RefreshAsync(string refreshToken)
    {
        var stored = await db.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken)
            ?? throw new AppException(ErrorMessages.Invalid_Credentials);

        if (stored.IsRevoked)
            throw new AppException(ErrorMessages.Invalid_Credentials);

        if (stored.ExpiresAt < DateTime.UtcNow)
            throw new AppException(ErrorMessages.Invalid_Credentials);

        if (stored.User.Status == UserStatus.Blocked)
            throw new AppException(ErrorMessages.User_Blocked);

        // Rotate: revoke old, issue new pair
        stored.IsRevoked = true;
        await db.SaveChangesAsync();

        var permissions = stored.User.Role.RolePermissions.Select(rp => rp.Permission.Name);
        return await IssueTokenPairAsync(stored.User, stored.User.Role.Name, permissions);
    }

    // ── Logout ────────────────────────────────────────────────────────────
    public async Task LogoutAsync(string refreshToken)
    {
        var stored = await db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (stored is null || stored.IsRevoked) return;

        stored.IsRevoked = true;
        await db.SaveChangesAsync();
    }

    // ── Change password ───────────────────────────────────────────────────
    public async Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
    {
        var user = await db.Users.FindAsync(userId)
            ?? throw new AppException(ErrorMessages.User_Not_Found);

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            throw new AppException(ErrorMessages.Invalid_Credentials);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        // Revoke all refresh tokens on password change
        var tokens = await db.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();
        tokens.ForEach(t => t.IsRevoked = true);

        await db.SaveChangesAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private async Task<AuthResponseDto> IssueTokenPairAsync(
        User user, string roleName, IEnumerable<string> permissions)
    {
        var permList = permissions.ToList();

        var (accessToken, accessExpiry)   = jwt.GenerateAccessToken(user, roleName, permList);
        var (refreshToken, refreshExpiry) = jwt.GenerateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            Token     = refreshToken,
            UserId    = user.Id,
            ExpiresAt = refreshExpiry,
        });

        await db.SaveChangesAsync();

        return new AuthResponseDto(
            accessToken, refreshToken, accessExpiry,
            user.Email, user.FirstName, user.LastName, roleName);
    }
}
