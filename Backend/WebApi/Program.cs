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

// Prevent ASP.NET from remapping JWT "sub" → ClaimTypes.NameIdentifier.
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

// ── Port (Render sets PORT env-var) ───────────────────────────────────────
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://*:{port}");

// ── Configuration (local overrides via appsettings.Local.json) ────────────
builder.Configuration
    .AddJsonFile("appsettings.json")
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddJsonFile("appsettings.Local.json", optional: true)
    .AddEnvironmentVariables(); // Render env-vars override everything

// ── Connection string: env-var DATABASE_URL takes priority ───────────────
var databaseUrl = Environment.GetEnvironmentVariable(
    "postgresql://neondb_owner:npg_sZc3OLWy0HPV@ep-sweet-recipe-al53l4ci.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");
if (!string.IsNullOrEmpty(databaseUrl))
{
    // Neon/Render provide "postgresql://user:pass@host/db?sslmode=require"
    // Convert to Npgsql keyword=value format
    var uri      = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    var npgsql   = $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};" +
                   $"Database={uri.AbsolutePath.TrimStart('/')};" +
                   $"User Id={Uri.UnescapeDataString(userInfo[0])};" +
                   $"Password={Uri.UnescapeDataString(userInfo.Length > 1 ? userInfo[1] : "")};" +
                   $"Ssl Mode=Require;Trust Server Certificate=true";
    builder.Configuration["ConnectionStrings:DefaultConnection"] = npgsql;
}

// ── Cloudinary: register when credentials are present ────────────────────
var cloudName  = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME")
                 ?? builder.Configuration["Cloudinary:CloudName"];
var apiKey     = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY")
                 ?? builder.Configuration["Cloudinary:ApiKey"];
var apiSecret  = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET")
                 ?? builder.Configuration["Cloudinary:ApiSecret"];

var useCloudinary = !string.IsNullOrEmpty(cloudName)
                 && !string.IsNullOrEmpty(apiKey)
                 && !string.IsNullOrEmpty(apiSecret);

if (useCloudinary)
{
    var account  = new Account(cloudName, apiKey, apiSecret);
    var cloudinary = new Cloudinary(account) { Api = { Secure = true } };
    builder.Services.AddSingleton(cloudinary);
    builder.Services.AddScoped<Infrastructure.Interfaces.IFileStorageService,
                               CloudinaryFileStorageService>();
}
else
{
    // Local dev: serve files from wwwroot/uploads
    builder.Services.AddScoped<Infrastructure.Interfaces.IFileStorageService,
                               LocalFileStorageService>();
}

// ── Logging ───────────────────────────────────────────────────────────────
builder.Logging.AddFilter(
    "Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl", LogLevel.None);
builder.Logging.AddFilter(
    "WebApi.Handlers.GlobalExceptionHandler", LogLevel.Error);

// ── Services ──────────────────────────────────────────────────────────────
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

// ── CORS ──────────────────────────────────────────────────────────────────
// FRONTEND_URL env-var is set on Render with your Vercel URL.
// Falls back to the array in appsettings.json for local dev.
var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
var allowedOrigins = string.IsNullOrEmpty(frontendUrl)
    ? builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
      ?? ["http://localhost:5173"]
    : [frontendUrl, "http://localhost:5173"]; // always allow local dev

builder.Services.AddCors(opt =>
    opt.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// ── App ───────────────────────────────────────────────────────────────────
var app = builder.Build();

app.UseForwardedHeaders();

// Migrate DB + seed on startup
using (var scope = app.Services.CreateScope())
{
    var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var retries = 5;
    while (retries-- > 0)
    {
        try { await Infrastructure.Data.Seed.DbSeeder.SeedAsync(db); break; }
        catch (Exception ex) when (retries > 0)
        {
            logger.LogWarning("DB not ready ({Remaining} retries left): {Msg}", retries, ex.Message);
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
