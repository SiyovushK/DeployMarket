using Domain.Constants;
using Domain.DTOs.Categories;
using Infrastructure.Authorization;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
        => Ok(await categoryService.GetTreeAsync());

    [HttpGet("flat")]
    public async Task<IActionResult> GetFlat()
        => Ok(await categoryService.GetFlatAsync());

    [HttpPost]
    [HasPermission(Permissions.CategoriesManage)]
    public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto)
        => Ok(await categoryService.CreateAsync(dto));

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.CategoriesManage)]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryUpdateDto dto)
        => Ok(await categoryService.UpdateAsync(id, dto));

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.CategoriesManage)]
    public async Task<IActionResult> Delete(int id)
    {
        await categoryService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("reorder")]
    [HasPermission(Permissions.CategoriesManage)]
    public async Task<IActionResult> Reorder(
        [FromBody] IEnumerable<CategoryReorderItem> items)
    {
        await categoryService.ReorderAsync(items.Select(i => (i.Id, i.SortOrder)));
        return NoContent();
    }
}

public record CategoryReorderItem(int Id, int SortOrder);
