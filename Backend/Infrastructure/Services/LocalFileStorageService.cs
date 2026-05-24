using Domain.Constants;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class LocalFileStorageService(
    IWebHostEnvironment env,
    IHttpContextAccessor httpContextAccessor,
    ILogger<LocalFileStorageService> logger) : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions =
        [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private string WebRoot =>
        string.IsNullOrEmpty(env.WebRootPath)
            ? Path.Combine(env.ContentRootPath, "wwwroot")
            : env.WebRootPath;

    public async Task<string> SaveAsync(IFormFile file, string folder)
    {
        if (file is null || file.Length == 0)
            throw new AppException(ErrorMessages.File_Upload_Failed);

        if (file.Length > MaxFileSizeBytes)
            throw new AppException(ErrorMessages.Invalid_File_Type);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            throw new AppException(ErrorMessages.Invalid_File_Type);

        var safeFolder = Path.GetFileName(folder);
        var uploadsDir = Path.Combine(WebRoot, "uploads", safeFolder);
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(uploadsDir, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
        {
            await file.CopyToAsync(stream);
        }

        // Return just the relative path — never store a host-dependent full URL.
        // The frontend will prepend the base URL when displaying images.
        return $"/uploads/{safeFolder}/{fileName}";
    }

    public Task DeleteAsync(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return Task.CompletedTask;

        try
        {
            // Extract relative path whether stored as full URL or relative path
            string relativePath;
            if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                relativePath = new Uri(url).AbsolutePath; // e.g. /uploads/banners/x.jpg
            }
            else
            {
                relativePath = url; // already a path like /uploads/banners/x.jpg
            }

            // Normalize: remove leading slash, convert to OS path separator
            var cleanPath = relativePath.TrimStart('/', '\\')
                                        .Replace('/', Path.DirectorySeparatorChar)
                                        .Replace('\\', Path.DirectorySeparatorChar);

            // Block path traversal
            if (cleanPath.Contains(".."))
            {
                logger.LogWarning("Path traversal blocked: {Path}", cleanPath);
                return Task.CompletedTask;
            }

            // Resolve to absolute path and verify it's inside WebRoot
            var webRoot = WebRoot;
            var fullPath = Path.GetFullPath(Path.Combine(webRoot, cleanPath));

            if (!fullPath.StartsWith(webRoot, StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning("Path outside WebRoot blocked: {FullPath}", fullPath);
                return Task.CompletedTask;
            }

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                logger.LogInformation("File deleted: {FullPath}", fullPath);
            }
            else
            {
                logger.LogWarning("File not found, skipping delete: {FullPath}", fullPath);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting file: {Url}", url);
        }

        return Task.CompletedTask;
    }
}
