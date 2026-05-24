using System.IdentityModel.Tokens.Jwt;
using System.Text.Json.Serialization;
using CloudinaryDotNet;
using Infrastructure.Data;
using Infrastructure.Data.Seed;
using Infrastructure.DI;
using Infrastructure.Extensions;
using Infrastructure.Services;
using Microsoft.AspNetCore.HttpOverrides;
using WebApi.Handlers;
using WebApi.Swagger;

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

// ── Port (Render sets PORT env-var) ──────────────────────────────────────
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://*:{port}");

// ── Configuration ────────────────────────────────────────────────────────
builder.Configuration
    .AddJsonFile("appsettings.json")
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddJsonFile("appsettings.Local.json", optional: true)  // local dev secrets
    .AddEnvironmentVariables();                              // Render env-vars win

// ── Database connection string ────────────────────────────────────────────
// Priority: DATABASE_URL env-var (Render) → appsettings.Local.json → appsettings.json
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrEmpty(databaseUrl))
    builder.Configuration["ConnectionStrings:DefaultConnection"] = databaseUrl;

// Convert PostgreSQL URI to Npgsql keyword=value format if needed
// (handles both DATABASE_URL env-var from Render AND URI in appsettings.Local.json)
static string ConvertToNpgsql(string raw)
{
    if (!raw.StartsWith("postgresql://") && !raw.StartsWith("postgres://"))
        return raw; // already keyword=value

    var uri      = new Uri(raw);
    var userInfo = uri.UserInfo.Split(':');
    var dbName   = uri.AbsolutePath.TrimStart('/').Split('?')[0];
    return $"Host={uri.Host};" +
           $"Port={(uri.Port > 0 ? uri.Port : 5432)};" +
           $"Database={dbName};" +
           $"User Id={Uri.UnescapeDataString(userInfo[0])};" +
           $"Password={Uri.UnescapeDataString(userInfo.Length > 1 ? userInfo[1] : "")};" +
           $"Ssl Mode=Require;Trust Server Certificate=true";
}

var rawConn = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
if (!string.IsNullOrWhiteSpace(rawConn))
    builder.Configuration["ConnectionStrings:DefaultConnection"] = ConvertToNpgsql(rawConn);

// ── JWT key: JWT_KEY env-var overrides appsettings ───────────────────────
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
if (!string.IsNullOrEmpty(jwtKey))
    builder.Configuration["Jwt:Key"] = jwtKey;

// ── Cloudinary ────────────────────────────────────────────────────────────
var cloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME")
                ?? builder.Configuration["Cloudinary:CloudName"];
var apiKey    = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY")
                ?? builder.Configuration["Cloudinary:ApiKey"];
var apiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET")
                ?? builder.Configuration["Cloudinary:ApiSecret"];

bool useCloudinary = !string.IsNullOrWhiteSpace(cloudName)
                  && !string.IsNullOrWhiteSpace(apiKey)
                  && !string.IsNullOrWhiteSpace(apiSecret);

if (useCloudinary)
{
    var account    = new Account(cloudName, apiKey, apiSecret);
    var cloudinary = new Cloudinary(account) { Api = { Secure = true } };
    builder.Services.AddSingleton(cloudinary);
    builder.Services.AddScoped<Infrastructure.Interfaces.IFileStorageService,
                               CloudinaryFileStorageService>();
}
else
{
    builder.Services.AddScoped<Infrastructure.Interfaces.IFileStorageService,
                               LocalFileStorageService>();
}

// ── Logging ──────────────────────────────────────────────────────────────
builder.Logging.AddFilter(
    "Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl", LogLevel.None);
builder.Logging.AddFilter("WebApi.Handlers.GlobalExceptionHandler", LogLevel.Error);

// ── Services ─────────────────────────────────────────────────────────────
builder.Services
    .AddControllers()
    .AddJsonOptions(opt =>
        opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerConfiguration();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAuthenticationConfiguration(builder.Configuration);
builder.Services.AddAuthorizationConfiguration();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddHttpContextAccessor();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor  |
        ForwardedHeaders.XForwardedHost |
        ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// ── CORS ─────────────────────────────────────────────────────────────────
var frontendUrl    = Environment.GetEnvironmentVariable("FRONTEND_URL");
var allowedOrigins = string.IsNullOrEmpty(frontendUrl)
    ? builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
      ?? ["http://localhost:5173"]
    : [frontendUrl, "http://localhost:5173"];

builder.Services.AddCors(opt =>
    opt.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// ── App ──────────────────────────────────────────────────────────────────
var app = builder.Build();

app.UseForwardedHeaders();

// Auto-migrate + seed on startup
using (var scope = app.Services.CreateScope())
{
    var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var retries = 5;
    while (retries-- > 0)
    {
        try { await DbSeeder.SeedAsync(db); break; }
        catch (Exception ex) when (retries > 0)
        {
            logger.LogWarning("DB not ready ({R} retries left): {M}", retries, ex.Message);
            await Task.Delay(3_000);
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors("Frontend");
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
