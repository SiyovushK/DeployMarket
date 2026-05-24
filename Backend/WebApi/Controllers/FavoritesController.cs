using System.Security.Claims;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize]
public class FavoritesController(IFavoriteService favoriteService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(await favoriteService.GetAsync(UserId));

    [HttpPost("{productId:int}")]
    public async Task<IActionResult> Add(int productId)
    {
        await favoriteService.AddAsync(UserId, productId);
        return NoContent();
    }

    [HttpDelete("{productId:int}")]
    public async Task<IActionResult> Remove(int productId)
    {
        await favoriteService.RemoveAsync(UserId, productId);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Clear()
    {
        await favoriteService.ClearAsync(UserId);
        return NoContent();
    }
}
