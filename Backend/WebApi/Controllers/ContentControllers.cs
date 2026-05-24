using Domain.Constants;
using Domain.DTOs.Content;
using Infrastructure.Authorization;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

// ─── Banners ──────────────────────────────────────────────────────────────
[ApiController]
[Route("api/banners")]
public class BannersController(IBannerService bannerService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActive()
        => Ok(await bannerService.GetAllAsync(activeOnly: true));

    [HttpGet("admin")]
    [HasPermission(Permissions.BannersManage)]
    public async Task<IActionResult> GetAll()
        => Ok(await bannerService.GetAllAsync(activeOnly: false));

    [HttpPost]
    [HasPermission(Permissions.BannersManage)]
    public async Task<IActionResult> Create([FromForm] BannerCreateDto dto, IFormFile image)
        => Ok(await bannerService.CreateAsync(dto, image));

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.BannersManage)]
    public async Task<IActionResult> Update(int id, [FromForm] BannerUpdateDto dto, IFormFile? image)
        => Ok(await bannerService.UpdateAsync(id, dto, image));

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.BannersManage)]
    public async Task<IActionResult> Delete(int id)
    {
        await bannerService.DeleteAsync(id);
        return NoContent();
    }
}

// ─── FAQ ──────────────────────────────────────────────────────────────────
[ApiController]
[Route("api/faq")]
public class FaqController(IFaqService faqService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await faqService.GetAllAsync());

    [HttpPost]
    [HasPermission(Permissions.FaqManage)]
    public async Task<IActionResult> Create([FromBody] FaqItemCreateDto dto)
        => Ok(await faqService.CreateAsync(dto));

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.FaqManage)]
    public async Task<IActionResult> Update(int id, [FromBody] FaqItemCreateDto dto)
        => Ok(await faqService.UpdateAsync(id, dto));

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.FaqManage)]
    public async Task<IActionResult> Delete(int id)
    {
        await faqService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("reorder")]
    [HasPermission(Permissions.FaqManage)]
    public async Task<IActionResult> Reorder([FromBody] IEnumerable<FaqReorderItem> items)
    {
        await faqService.ReorderAsync(items.Select(i => (i.Id, i.SortOrder)));
        return NoContent();
    }
}

public record FaqReorderItem(int Id, int SortOrder);

// ─── Page Content ─────────────────────────────────────────────────────────
[ApiController]
[Route("api/pages")]
public class PageContentController(IPageContentService pageService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await pageService.GetAllAsync());

    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key)
        => Ok(await pageService.GetByKeyAsync(key));

    [HttpPut("{key}")]
    [HasPermission(Permissions.ContentManage)]
    public async Task<IActionResult> Update(
        string key,
        [FromForm] PageContentUpdateDto dto,
        IFormFile? image)
        => Ok(await pageService.UpdateAsync(key, dto, image));

    [HttpPost]
    [HasPermission(Permissions.ContentManage)]
    public async Task<IActionResult> Create(
        [FromForm] PageContentCreateDto dto,
        IFormFile? image)
        => Ok(await pageService.CreateAsync(dto, image));

    [HttpDelete("{key}")]
    [HasPermission(Permissions.ContentManage)]
    public async Task<IActionResult> Delete(string key)
    {
        await pageService.DeleteAsync(key);
        return NoContent();
    }
}

// ─── Site Settings ────────────────────────────────────────────────────────
[ApiController]
[Route("api/settings")]
public class SiteSettingsController(ISiteSettingService settingService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await settingService.GetAllAsync());

    [HttpGet("{key}")]
    public async Task<IActionResult> Get(string key)
        => Ok(await settingService.GetAsync(key));

    [HttpPut("{key}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<IActionResult> Update(string key, [FromBody] SiteSettingUpdateDto dto)
        => Ok(await settingService.UpdateAsync(key, dto));

    [HttpPost("logo")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<IActionResult> UploadLogo(
        IFormFile image,
        [FromServices] IFileStorageService storage)
    {
        var url = await storage.SaveAsync(image, "settings");
        var result = await settingService.UpdateAsync("site_logo_url", new SiteSettingUpdateDto(url));
        return Ok(result);
    }
}

// ─── Gallery (generic page image upload) ─────────────────────────────────
[ApiController]
[Route("api/gallery")]
public class GalleryController(
    IFileStorageService storage,
    ILogger<GalleryController> logger) : ControllerBase
{
    /// <summary>Upload a single image for any gallery (certificates, about, etc.).</summary>
    [HttpPost("upload")]
    [HasPermission(Permissions.ContentManage)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        var url = await storage.SaveAsync(file, "pages");
        return Ok(new { url });
    }

    /// <summary>Delete an image from disk (called when removed from gallery JSON).</summary>
    [HttpDelete("file")]
    [HasPermission(Permissions.ContentManage)]
    public async Task<IActionResult> DeleteFile([FromQuery] string url)
    {
        await storage.DeleteAsync(url);
        return NoContent();
    }
}
