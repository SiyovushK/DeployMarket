using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Stores uploaded files on Cloudinary.
/// Used automatically when CLOUDINARY_URL (or the three individual env-vars) are set.
/// Falls back to LocalFileStorageService when running locally without Cloudinary credentials.
/// </summary>
public class CloudinaryFileStorageService(
    Cloudinary cloudinary,
    ILogger<CloudinaryFileStorageService> logger) : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions =
        [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public async Task<string> SaveAsync(IFormFile file, string folder)
    {
        if (file is null || file.Length == 0)
            throw new InvalidOperationException("File is empty.");

        if (file.Length > MaxFileSizeBytes)
            throw new InvalidOperationException("File exceeds the 10 MB limit.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException($"File type '{ext}' is not allowed.");

        await using var stream = file.OpenReadStream();

        // PDFs go as raw resources; images go as images
        var isPdf   = ext == ".pdf";
        var pubId   = $"{folder}/{Guid.NewGuid()}";

        if (isPdf)
        {
            var rawParams = new RawUploadParams
            {
                File       = new FileDescription(file.FileName, stream),
                PublicId   = pubId,
                Folder     = folder,
                Overwrite  = false,
            };
            var rawResult = await cloudinary.UploadAsync(rawParams);
            if (rawResult.Error is not null)
                throw new InvalidOperationException($"Cloudinary upload error: {rawResult.Error.Message}");
            return rawResult.SecureUrl.ToString();
        }
        else
        {
            var imgParams = new ImageUploadParams
            {
                File      = new FileDescription(file.FileName, stream),
                PublicId  = pubId,
                Folder    = folder,
                Overwrite = false,
            };
            var imgResult = await cloudinary.UploadAsync(imgParams);
            if (imgResult.Error is not null)
                throw new InvalidOperationException($"Cloudinary upload error: {imgResult.Error.Message}");
            return imgResult.SecureUrl.ToString();
        }
    }

    public async Task DeleteAsync(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return;

        try
        {
            // Extract public_id from Cloudinary URL
            // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{ver}/{folder}/{id}.{ext}
            var uri  = new Uri(url);
            var path = uri.AbsolutePath; // e.g. /demo/image/upload/v123/banners/abc.jpg

            // Remove /v{version}/ segment and extension to get public_id
            var segments = path.TrimStart('/').Split('/');
            // Find the index after "upload"
            var uploadIdx = Array.FindIndex(segments, s => s == "upload");
            if (uploadIdx < 0)
            {
                logger.LogWarning("Could not determine Cloudinary public_id from URL: {Url}", url);
                return;
            }

            // Skip the version segment (starts with 'v' followed by digits) if present
            var start = uploadIdx + 1;
            if (start < segments.Length && segments[start].Length > 1 && segments[start][0] == 'v'
                && segments[start][1..].All(char.IsDigit))
                start++;

            var publicIdWithExt = string.Join("/", segments[start..]);
            var publicId = Path.ChangeExtension(publicIdWithExt, null); // remove extension

            var isPdf    = Path.GetExtension(url).ToLowerInvariant() == ".pdf";
            var resType  = isPdf ? ResourceType.Raw : ResourceType.Image;

            var delParams = new DeletionParams(publicId) { ResourceType = resType };
            var result    = await cloudinary.DestroyAsync(delParams);

            if (result.Result != "ok" && result.Result != "not found")
                logger.LogWarning("Cloudinary deletion returned '{Result}' for {PublicId}", result.Result, publicId);
            else
                logger.LogInformation("Cloudinary file deleted: {PublicId}", publicId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting Cloudinary file: {Url}", url);
        }
    }
}
