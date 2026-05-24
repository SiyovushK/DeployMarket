using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Extensions;

public static class AuthConfiguration
{
    public static void AddAuthenticationConfiguration(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddAuthentication(options =>
        {
            options.DefaultForbidScheme       = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(o =>
        {
            var key = Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!);
            o.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = configuration["Jwt:Issuer"],
                ValidAudience            = configuration["Jwt:Audience"],
                IssuerSigningKey         = new SymmetricSecurityKey(key),
                ClockSkew                = TimeSpan.Zero
            };
        });
    }
}
