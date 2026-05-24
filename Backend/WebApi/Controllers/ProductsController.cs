using Domain.Constants;
using Domain.DTOs.Products;
using Infrastructure.Authorization;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(IProductService productService) : ControllerBase
{
    // ── Public endpoints ──────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] ProductQueryParams q)
        => Ok(await productService.GetListAsync(q, adminView: false));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
        => Ok(await productService.GetByIdAsync(id));

    // ── Admin endpoints ───────────────────────────────────────────────────

    [HttpGet("admin")]
    [HasPermission(Permissions.ProductsUpdate)]
    public async Task<IActionResult> GetAdminList([FromQuery] ProductQueryParams q)
        => Ok(await productService.GetListAsync(q, adminView: true));

    [HttpPost]
    [HasPermission(Permissions.ProductsCreate)]
    public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
    {
        var product = await productService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.ProductsUpdate)]
    public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
        => Ok(await productService.UpdateAsync(id, dto));

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.ProductsDelete)]
    public async Task<IActionResult> Delete(int id)
    {
        await productService.DeleteAsync(id);
        return NoContent();
    }

    // ── Images ────────────────────────────────────────────────────────────

    [HttpPost("{id:int}/images")]
    [HasPermission(Permissions.ProductsUpdate)]
    public async Task<IActionResult> UploadImage(
        int id,
        IFormFile file,
        [FromQuery] bool isMain = false,
        [FromQuery] bool isCertificate = false)
    {
        var url = await productService.UploadImageAsync(id, file, isMain, isCertificate);
        return Ok(new { url });
    }

    [HttpPatch("{id:int}/images/{imageId:int}/set-main")]
    [HasPermission(Permissions.ProductsUpdate)]
    public async Task<IActionResult> SetMainImage(int id, int imageId)
    {
        await productService.SetMainImageAsync(id, imageId);
        return NoContent();
    }

    [HttpDelete("images/{imageId:int}")]
    [HasPermission(Permissions.ProductsUpdate)]
    public async Task<IActionResult> DeleteImage(int imageId)
    {
        await productService.DeleteImageAsync(imageId);
        return NoContent();
    }

    // ── Ingredients ───────────────────────────────────────────────────────

    [HttpPut("{id:int}/ingredients")]
    [HasPermission(Permissions.ProductsUpdate)]
    public async Task<IActionResult> UpdateIngredients(
        int id,
        [FromBody] IEnumerable<IngredientUpsertDto> items)
        => Ok(await productService.UpdateIngredientsAsync(id, items));

    // ── Dashboard ─────────────────────────────────────────────────────────

    [HttpGet("dashboard")]
    [HasPermission(Permissions.ProductsUpdate)]
    public async Task<IActionResult> Dashboard()
        => Ok(await productService.GetDashboardAsync());
}
