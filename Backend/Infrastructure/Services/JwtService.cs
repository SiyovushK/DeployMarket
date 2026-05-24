using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Services;

public class JwtService(IConfiguration config)
{
    // ── Access token ──────────────────────────────────────────────────────
    public (string Token, DateTime ExpiresAt) GenerateAccessToken(
        User user,
        string roleName,
        IEnumerable<string> permissions)
    {
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddMinutes(
            double.Parse(config["Jwt:AccessTokenMinutes"] ?? "15"));

        // NOTE: DefaultInboundClaimTypeMap is cleared in Program.cs,
        //       so we use raw "sub" everywhere — no remapping to ClaimTypes.NameIdentifier.
        var claims = new List<Claim>
        {
            new("sub",       user.Id.ToString()),
            new("email",     user.Email),
            new("role",      roleName),
            new("firstName", user.FirstName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        claims.AddRange(permissions.Select(p => new Claim("permission", p)));

        var token = new JwtSecurityToken(
            issuer:             config["Jwt:Issuer"],
            audience:           config["Jwt:Audience"],
            claims:             claims,
            expires:            expiry,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiry);
    }

    // ── Refresh token ─────────────────────────────────────────────────────
    public (string Token, DateTime ExpiresAt) GenerateRefreshToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        var token  = Convert.ToBase64String(bytes);
        var expiry = DateTime.UtcNow.AddDays(
            double.Parse(config["Jwt:RefreshTokenDays"] ?? "30"));
        return (token, expiry);
    }
}
