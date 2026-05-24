using Domain.Constants;
using Domain.DTOs.Favorites;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class FavoriteService(AppDbContext db) : IFavoriteService
{
    public async Task<IEnumerable<FavoriteItemDto>> GetAsync(Guid userId)
    {
        return await db.Favorites
            .Where(f => f.UserId == userId)
            .Include(f => f.Product).ThenInclude(p => p.Images)
            .OrderByDescending(f => f.AddedAt)
            .Select(f => new FavoriteItemDto(
                f.ProductId,
                f.Product.Name,
                f.Product.Price,
                f.Product.Images.Where(i => i.IsMain).Select(i => i.Url).FirstOrDefault(),
                f.Product.OzonUrl,
                f.Product.WildberriesUrl,
                f.AddedAt))
            .ToListAsync();
    }

    public async Task AddAsync(Guid userId, int productId)
    {
        if (!await db.Products.AnyAsync(p => p.Id == productId))
            throw new AppException(ErrorMessages.Product_Not_Found);

        if (await db.Favorites.AnyAsync(f => f.UserId == userId && f.ProductId == productId))
            throw new AppException(ErrorMessages.Already_In_Favorites);

        db.Favorites.Add(new Favorite { UserId = userId, ProductId = productId });
        await db.SaveChangesAsync();
    }

    public async Task RemoveAsync(Guid userId, int productId)
    {
        var fav = await db.Favorites.FindAsync(userId, productId)
            ?? throw new AppException(ErrorMessages.Not_In_Favorites);

        db.Favorites.Remove(fav);
        await db.SaveChangesAsync();
    }

    public async Task ClearAsync(Guid userId)
    {
        var favs = await db.Favorites.Where(f => f.UserId == userId).ToListAsync();
        db.Favorites.RemoveRange(favs);
        await db.SaveChangesAsync();
    }
}
