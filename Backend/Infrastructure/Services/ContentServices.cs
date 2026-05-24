using Domain.Constants;
using Domain.DTOs.Content;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

// ─── BannerService ────────────────────────────────────────────────────────
public class BannerService(AppDbContext db, IFileStorageService storage) : IBannerService
{
    public async Task<IEnumerable<BannerDto>> GetAllAsync(bool activeOnly = true)
    {
        var q = db.Banners.AsQueryable();
        if (activeOnly) q = q.Where(b => b.IsActive);
        return await q.OrderBy(b => b.SortOrder).Select(b => Map(b)).ToListAsync();
    }

    public async Task<BannerDto> CreateAsync(BannerCreateDto dto, IFormFile image)
    {
        var url = await storage.SaveAsync(image, "banners");
        var b = new Banner
        {
            ImageUrl    = url,
            LinkUrl     = dto.LinkUrl,
            Title       = dto.Title,
            Description = dto.Description,
            SortOrder   = dto.SortOrder,
            IsActive    = dto.IsActive
        };
        db.Banners.Add(b);
        await db.SaveChangesAsync();
        return Map(b);
    }

    public async Task<BannerDto> UpdateAsync(int id, BannerUpdateDto dto, IFormFile? image)
    {
        var b = await db.Banners.FindAsync(id)
            ?? throw new AppException(ErrorMessages.Banner_Not_Found);

        if (!string.IsNullOrWhiteSpace(dto.LinkUrl)) b.LinkUrl = dto.LinkUrl;
        if (dto.Title       is not null) b.Title       = dto.Title;
        if (dto.Description is not null) b.Description = dto.Description;
        if (dto.SortOrder   is not null) b.SortOrder   = dto.SortOrder.Value;
        if (dto.IsActive    is not null) b.IsActive    = dto.IsActive.Value;

        if (image is not null)
        {
            await storage.DeleteAsync(b.ImageUrl);
            b.ImageUrl = await storage.SaveAsync(image, "banners");
        }

        await db.SaveChangesAsync();
        return Map(b);
    }

    public async Task DeleteAsync(int id)
    {
        var b = await db.Banners.FindAsync(id)
            ?? throw new AppException(ErrorMessages.Banner_Not_Found);
        await storage.DeleteAsync(b.ImageUrl);
        db.Banners.Remove(b);
        await db.SaveChangesAsync();
    }

    private static BannerDto Map(Banner b) =>
        new(b.Id, b.ImageUrl, b.LinkUrl, b.Title, b.Description, b.SortOrder, b.IsActive);
}

// ─── FaqService ───────────────────────────────────────────────────────────
public class FaqService(AppDbContext db) : IFaqService
{
    public async Task<IEnumerable<FaqItemDto>> GetAllAsync() =>
        await db.FaqItems.OrderBy(f => f.SortOrder)
                         .Select(f => Map(f))
                         .ToListAsync();

    public async Task<FaqItemDto> CreateAsync(FaqItemCreateDto dto)
    {
        var item = new FaqItem { Question = dto.Question, Answer = dto.Answer, SortOrder = dto.SortOrder };
        db.FaqItems.Add(item);
        await db.SaveChangesAsync();
        return Map(item);
    }

    public async Task<FaqItemDto> UpdateAsync(int id, FaqItemCreateDto dto)
    {
        var item = await db.FaqItems.FindAsync(id)
            ?? throw new AppException(ErrorMessages.Faq_Not_Found);
        item.Question  = dto.Question;
        item.Answer    = dto.Answer;
        item.SortOrder = dto.SortOrder;
        await db.SaveChangesAsync();
        return Map(item);
    }

    public async Task DeleteAsync(int id)
    {
        var item = await db.FaqItems.FindAsync(id)
            ?? throw new AppException(ErrorMessages.Faq_Not_Found);
        db.FaqItems.Remove(item);
        await db.SaveChangesAsync();
    }

    public async Task ReorderAsync(IEnumerable<(int Id, int SortOrder)> items)
    {
        foreach (var (id, order) in items)
        {
            var item = await db.FaqItems.FindAsync(id);
            if (item != null) item.SortOrder = order;
        }
        await db.SaveChangesAsync();
    }

    private static FaqItemDto Map(FaqItem f) =>
        new(f.Id, f.Question, f.Answer, f.SortOrder);
}

// ─── PageContentService ───────────────────────────────────────────────────
public class PageContentService(AppDbContext db, IFileStorageService storage) : IPageContentService
{
    public async Task<IEnumerable<PageContentDto>> GetAllAsync() =>
        await db.PageContents.Select(p => Map(p)).ToListAsync();

    public async Task<PageContentDto> GetByKeyAsync(string key)
    {
        var p = await db.PageContents.FirstOrDefaultAsync(p => p.Key == key)
            ?? throw new AppException(ErrorMessages.PageContent_Not_Found);
        return Map(p);
    }

    public async Task<PageContentDto> UpdateAsync(string key, PageContentUpdateDto dto, IFormFile? image)
    {
        var p = await db.PageContents.FirstOrDefaultAsync(p => p.Key == key)
            ?? throw new AppException(ErrorMessages.PageContent_Not_Found);

        if (!string.IsNullOrWhiteSpace(dto.Title)) p.Title = dto.Title;
        if (!string.IsNullOrWhiteSpace(dto.Content)) p.Content = dto.Content;

        if (image is not null)
        {
            if (p.ImageUrl is not null) await storage.DeleteAsync(p.ImageUrl);
            p.ImageUrl = await storage.SaveAsync(image, "pages");
        }

        p.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Map(p);
    }

    public async Task DeleteAsync(string key)
    {
        var p = await db.PageContents.FirstOrDefaultAsync(p => p.Key == key)
            ?? throw new AppException(ErrorMessages.PageContent_Not_Found);
        if (p.ImageUrl is not null) await storage.DeleteAsync(p.ImageUrl);
        db.PageContents.Remove(p);
        await db.SaveChangesAsync();
    }

    public async Task<PageContentDto> CreateAsync(PageContentCreateDto dto, IFormFile? image)
    {
        if (await db.PageContents.AnyAsync(p => p.Key == dto.Key))
            throw new AppException(ErrorMessages.PageContent_Key_Exists);

        var p = new PageContent
        {
            Key = dto.Key,
            Title = dto.Title,
            Content = dto.Content,
            ImageUrl = image is not null ? await storage.SaveAsync(image, "pages") : null,
            UpdatedAt = DateTime.UtcNow
        };
        db.PageContents.Add(p);
        await db.SaveChangesAsync();
        return Map(p);
    }

    private static PageContentDto Map(PageContent p) =>
        new(p.Id, p.Key, p.Title, p.Content, p.ImageUrl, p.UpdatedAt);
}

// ─── SiteSettingService ───────────────────────────────────────────────────
public class SiteSettingService(AppDbContext db) : ISiteSettingService
{
    public async Task<IEnumerable<SiteSettingDto>> GetAllAsync() =>
        await db.SiteSettings.Select(s => new SiteSettingDto(s.Key, s.Value)).ToListAsync();

    public async Task<SiteSettingDto> GetAsync(string key)
    {
        var s = await db.SiteSettings.FirstOrDefaultAsync(s => s.Key == key)
            ?? throw new AppException(ErrorMessages.Setting_Not_Found);
        return new SiteSettingDto(s.Key, s.Value);
    }

    public async Task<SiteSettingDto> UpdateAsync(string key, SiteSettingUpdateDto dto)
    {
        var s = await db.SiteSettings.FirstOrDefaultAsync(s => s.Key == key)
            ?? throw new AppException(ErrorMessages.Setting_Not_Found);
        s.Value = dto.Value;
        await db.SaveChangesAsync();
        return new SiteSettingDto(s.Key, s.Value);
    }
}
