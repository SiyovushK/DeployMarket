using Domain.Constants;
using Domain.DTOs.Content;
using Domain.DTOs.Favorites;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class ArticleService(AppDbContext db, IFileStorageService storage) : IArticleService
{
    public async Task<PagedResult<ArticleListItemDto>> GetListAsync(int page, int pageSize, bool publishedOnly = true)
    {
        var query = db.Articles.AsQueryable();
        if (publishedOnly) query = query.Where(a => a.IsPublished);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.PublishedAt ?? a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ArticleListItemDto(
                a.Id, a.Title, a.Slug, a.CoverImageUrl,
                a.IsPublished, a.PublishedAt, a.CreatedAt))
            .ToListAsync();

        return new PagedResult<ArticleListItemDto>(items, total, page, pageSize);
    }

    public async Task<ArticleDto> GetBySlugAsync(string slug)
    {
        var a = await db.Articles.FirstOrDefaultAsync(a => a.Slug == slug)
            ?? throw new AppException(ErrorMessages.Article_Not_Found);
        return Map(a);
    }

    public async Task<ArticleDto> GetByIdAsync(int id)
    {
        var a = await db.Articles.FindAsync(id)
            ?? throw new AppException(ErrorMessages.Article_Not_Found);
        return Map(a);
    }

    public async Task<ArticleDto> CreateAsync(ArticleCreateDto dto, IFormFile? cover)
    {
        var slug = dto.Slug ?? Slugify(dto.Title);
        if (await db.Articles.AnyAsync(a => a.Slug == slug))
            slug = slug + "-" + Guid.NewGuid().ToString("N")[..6];

        string? coverUrl = cover is not null ? await storage.SaveAsync(cover, "articles") : null;

        var article = new Article
        {
            Title        = dto.Title,
            Slug         = slug,
            Content      = dto.Content,
            CoverImageUrl = coverUrl,
            IsPublished  = dto.IsPublished,
            PublishedAt  = dto.IsPublished ? DateTime.UtcNow : null
        };

        db.Articles.Add(article);
        await db.SaveChangesAsync();
        return Map(article);
    }

    public async Task<ArticleDto> UpdateAsync(int id, ArticleUpdateDto dto, IFormFile? cover)
    {
        var article = await db.Articles.FindAsync(id)
            ?? throw new AppException(ErrorMessages.Article_Not_Found);

        if (!string.IsNullOrWhiteSpace(dto.Title)) article.Title = dto.Title;
        if (!string.IsNullOrWhiteSpace(dto.Content)) article.Content = dto.Content;

        if (dto.IsPublished.HasValue)
        {
            article.IsPublished = dto.IsPublished.Value;
            if (dto.IsPublished.Value && article.PublishedAt is null)
                article.PublishedAt = DateTime.UtcNow;
        }

        if (cover is not null)
        {
            if (article.CoverImageUrl is not null)
                await storage.DeleteAsync(article.CoverImageUrl);
            article.CoverImageUrl = await storage.SaveAsync(cover, "articles");
        }

        await db.SaveChangesAsync();
        return Map(article);
    }

    public async Task DeleteAsync(int id)
    {
        var article = await db.Articles.FindAsync(id)
            ?? throw new AppException(ErrorMessages.Article_Not_Found);

        if (article.CoverImageUrl is not null)
            await storage.DeleteAsync(article.CoverImageUrl);

        db.Articles.Remove(article);
        await db.SaveChangesAsync();
    }

    private static ArticleDto Map(Article a) =>
        new(a.Id, a.Title, a.Slug, a.CoverImageUrl, a.Content, a.IsPublished, a.PublishedAt, a.CreatedAt);

    private static string Slugify(string s) =>
        s.ToLower().Replace(' ', '-').Replace("'", "").Replace("\"", "");
}
