using Domain.Constants;
using Domain.DTOs.Content;
using Infrastructure.Authorization;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[ApiController]
[Route("api/articles")]
public class ArticlesController(IArticleService articleService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
        => Ok(await articleService.GetListAsync(page, pageSize, publishedOnly: true));

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
        => Ok(await articleService.GetBySlugAsync(slug));

    // ── Admin ─────────────────────────────────────────────────────────────

    [HttpGet("admin")]
    [HasPermission(Permissions.ArticlesManage)]
    public async Task<IActionResult> GetAdminList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => Ok(await articleService.GetListAsync(page, pageSize, publishedOnly: false));

    [HttpGet("admin/{id:int}")]
    [HasPermission(Permissions.ArticlesManage)]
    public async Task<IActionResult> GetById(int id)
        => Ok(await articleService.GetByIdAsync(id));

    [HttpPost]
    [HasPermission(Permissions.ArticlesManage)]
    public async Task<IActionResult> Create(
        [FromForm] ArticleCreateDto dto,
        IFormFile? cover)
    {
        var article = await articleService.CreateAsync(dto, cover);
        return CreatedAtAction(nameof(GetBySlug), new { slug = article.Slug }, article);
    }

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.ArticlesManage)]
    public async Task<IActionResult> Update(
        int id,
        [FromForm] ArticleUpdateDto dto,
        IFormFile? cover)
        => Ok(await articleService.UpdateAsync(id, dto, cover));

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.ArticlesManage)]
    public async Task<IActionResult> Delete(int id)
    {
        await articleService.DeleteAsync(id);
        return NoContent();
    }
}
