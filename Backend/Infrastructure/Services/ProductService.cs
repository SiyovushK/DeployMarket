using Domain.Constants;
using Domain.DTOs.Favorites;
using Domain.DTOs.Products;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class ProductService(AppDbContext db, IFileStorageService storage) : IProductService
{
    // ── List / catalog ────────────────────────────────────────────────────
    public async Task<PagedResult<ProductListItemDto>> GetListAsync(ProductQueryParams q, bool adminView = false)
    {
        var query = db.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .AsQueryable();

        if (!adminView)
            query = query.Where(p => p.Status == ProductStatus.Published);
        else if (q.Status.HasValue)
            query = query.Where(p => p.Status == q.Status);

        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(p =>
                EF.Functions.ILike(p.Name, $"%{q.Search}%") ||
                EF.Functions.ILike(p.SKU, $"%{q.Search}%"));

        if (q.CategoryId.HasValue)
        {
            // Include products of all descendant categories too
            var descendantIds = await GetDescendantCategoryIdsAsync(q.CategoryId.Value);
            query = query.Where(p => descendantIds.Contains(p.CategoryId));
        }
        if (q.PriceMin.HasValue)   query = query.Where(p => p.Price >= q.PriceMin);
        if (q.PriceMax.HasValue)   query = query.Where(p => p.Price <= q.PriceMax);
        if (q.IsHit.HasValue)      query = query.Where(p => p.IsHit == q.IsHit);
        if (q.IsNew.HasValue)      query = query.Where(p => p.IsNew == q.IsNew);

        query = q.SortBy switch
        {
            "price_asc"  => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            _            => query.OrderByDescending(p => p.CreatedAt),
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(p => new ProductListItemDto(
                p.Id, p.Name, p.SKU, p.Price,
                p.Images.Where(i => i.IsMain).Select(i => i.Url).FirstOrDefault(),
                p.Status.ToString(), p.IsHit, p.IsNew, p.Category.Name))
            .ToListAsync();

        return new PagedResult<ProductListItemDto>(items, total, q.Page, q.PageSize);
    }

    // ── Single product ────────────────────────────────────────────────────
    public async Task<ProductDto> GetByIdAsync(int id)
    {
        var p = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Ingredients.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new AppException(ErrorMessages.Product_Not_Found);

        return MapDto(p);
    }

    // ── Create ────────────────────────────────────────────────────────────
    public async Task<ProductDto> CreateAsync(ProductCreateDto dto)
    {
        if (await db.Products.AnyAsync(p => p.SKU == dto.SKU))
            throw new AppException(ErrorMessages.SKU_Already_Exists);

        if (!await db.Categories.AnyAsync(c => c.Id == dto.CategoryId))
            throw new AppException(ErrorMessages.Category_Not_Found);

        var product = new Product
        {
            Name              = dto.Name,
            SKU               = dto.SKU,
            Price             = dto.Price,
            CategoryId        = dto.CategoryId,
            ShortDescription  = dto.ShortDescription,
            FullDescription   = dto.FullDescription,
            Usage             = dto.Usage,
            Contraindications = dto.Contraindications,
            OzonUrl           = dto.OzonUrl,
            WildberriesUrl    = dto.WildberriesUrl,
            IsHit             = dto.IsHit,
            IsNew             = dto.IsNew,
            Status            = ProductStatus.Draft,
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();
        return await GetByIdAsync(product.Id);
    }

    // ── Update ────────────────────────────────────────────────────────────
    public async Task<ProductDto> UpdateAsync(int id, ProductUpdateDto dto)
    {
        var p = await db.Products.FindAsync(id)
            ?? throw new AppException(ErrorMessages.Product_Not_Found);

        if (!string.IsNullOrWhiteSpace(dto.Name)) p.Name = dto.Name;
        if (!string.IsNullOrWhiteSpace(dto.Price?.ToString())) p.Price = dto.Price.Value;
        // if (!string.IsNullOrWhiteSpace(dto.CategoryId?.ToString())) p.CategoryId = dto.CategoryId.Value;
        if (dto.CategoryId is not null) p.CategoryId = dto.CategoryId.Value;
        if (!string.IsNullOrWhiteSpace(dto.ShortDescription)) p.ShortDescription = dto.ShortDescription;
        if (!string.IsNullOrWhiteSpace(dto.FullDescription)) p.FullDescription = dto.FullDescription;
        if (!string.IsNullOrWhiteSpace(dto.Usage)) p.Usage = dto.Usage;
        if (!string.IsNullOrWhiteSpace(dto.Contraindications)) p.Contraindications = dto.Contraindications;
        if (!string.IsNullOrWhiteSpace(dto.OzonUrl)) p.OzonUrl = dto.OzonUrl;
        if (!string.IsNullOrWhiteSpace(dto.WildberriesUrl)) p.WildberriesUrl = dto.WildberriesUrl;
        if (dto.IsHit is not null) p.IsHit = dto.IsHit.Value;
        if (dto.IsNew is not null) p.IsNew = dto.IsNew.Value;
        if (dto.Status is not null) p.Status = dto.Status.Value;

        await db.SaveChangesAsync();
        return await GetByIdAsync(p.Id);
    }

    // ── Delete ────────────────────────────────────────────────────────────
    public async Task DeleteAsync(int id)
    {
        var product = await db.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new AppException(ErrorMessages.Product_Not_Found);

        // Remove files before DB delete
        foreach (var img in product.Images)
            await storage.DeleteAsync(img.Url);

        db.Products.Remove(product);
        await db.SaveChangesAsync();
    }

    // ── Images ────────────────────────────────────────────────────────────
    public async Task<string> UploadImageAsync(int productId, IFormFile file, bool isMain, bool isCertificate)
    {
        if (!await db.Products.AnyAsync(p => p.Id == productId))
            throw new AppException(ErrorMessages.Product_Not_Found);

        // Save file first
        var url = await storage.SaveAsync(file, "products");

        try
        {
            // Demote previous main if needed
            if (isMain)
            {
                await db.ProductImages
                    .Where(i => i.ProductId == productId && i.IsMain)
                    .ExecuteUpdateAsync(s => s.SetProperty(i => i.IsMain, false));
            }

            var maxOrder = await db.ProductImages
                .Where(i => i.ProductId == productId)
                .Select(i => (int?)i.SortOrder)
                .MaxAsync() ?? 0;

            db.ProductImages.Add(new ProductImage
            {
                ProductId     = productId,
                Url           = url,
                IsMain        = isMain,
                IsCertificate = isCertificate,
                SortOrder     = maxOrder + 1,
            });

            await db.SaveChangesAsync();
        }
        catch
        {
            // DB failed → delete the uploaded file to avoid orphans
            await storage.DeleteAsync(url);
            throw;
        }

        return url;
    }

    public async Task SetMainImageAsync(int productId, int imageId)
    {
        var img = await db.ProductImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId)
            ?? throw new AppException(ErrorMessages.Product_Not_Found);

        // Demote all others
        await db.ProductImages
            .Where(i => i.ProductId == productId && i.IsMain)
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.IsMain, false));

        img.IsMain = true;
        await db.SaveChangesAsync();
    }

    public async Task DeleteImageAsync(int imageId)
    {
        // Use AsNoTracking so we always read fresh values from DB,
        // not potentially stale data from the change tracker.
        var img = await db.ProductImages
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == imageId)
            ?? throw new AppException(ErrorMessages.Product_Not_Found);

        bool wasMain  = img.IsMain;
        int productId = img.ProductId;
        string imgUrl = img.Url;

        // Delete the row directly — bypasses tracker, no stale-state risk
        await db.ProductImages
            .Where(i => i.Id == imageId)
            .ExecuteDeleteAsync();

        await storage.DeleteAsync(imgUrl);

        // Auto-promote: find next non-certificate image (or any image) and set as main
        if (wasMain)
        {
            var nextId = await db.ProductImages
                .Where(i => i.ProductId == productId && !i.IsCertificate)
                .OrderBy(i => i.SortOrder)
                .Select(i => (int?)i.Id)
                .FirstOrDefaultAsync()
                ?? await db.ProductImages
                    .Where(i => i.ProductId == productId)
                    .OrderBy(i => i.SortOrder)
                    .Select(i => (int?)i.Id)
                    .FirstOrDefaultAsync();

            if (nextId.HasValue)
            {
                await db.ProductImages
                    .Where(i => i.Id == nextId.Value)
                    .ExecuteUpdateAsync(s => s.SetProperty(i => i.IsMain, true));
            }
        }
    }

    // ── Ingredients ───────────────────────────────────────────────────────
    public async Task<ProductDto> UpdateIngredientsAsync(int productId, IEnumerable<IngredientUpsertDto> items)
    {
        if (!await db.Products.AnyAsync(p => p.Id == productId))
            throw new AppException(ErrorMessages.Product_Not_Found);

        // Replace entire set
        await db.ProductIngredients
            .Where(i => i.ProductId == productId)
            .ExecuteDeleteAsync();

        var newItems = items.Select((dto, idx) => new ProductIngredient
        {
            ProductId         = productId,
            Name              = dto.Name,
            Dosage            = dto.Dosage,
            DailyValuePercent = dto.DailyValuePercent,
            SortOrder         = dto.SortOrder > 0 ? dto.SortOrder : idx,
        });

        db.ProductIngredients.AddRange(newItems);
        await db.SaveChangesAsync();
        return await GetByIdAsync(productId);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────
    public async Task<DashboardDto> GetDashboardAsync()
    {
        var buyerRoleId = await db.Roles
            .Where(r => r.Name == "Buyer")
            .Select(r => r.Id)
            .FirstAsync();

        var activeProducts = await db.Products.CountAsync(p => p.Status == ProductStatus.Published);
        var buyersCount    = await db.Users.CountAsync(u => u.RoleId == buyerRoleId);

        var latest = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .Select(p => new ProductListItemDto(
                p.Id, p.Name, p.SKU, p.Price,
                p.Images.Where(i => i.IsMain).Select(i => i.Url).FirstOrDefault(),
                p.Status.ToString(), p.IsHit, p.IsNew, p.Category.Name))
            .ToListAsync();

        return new DashboardDto(activeProducts, buyersCount, latest);
    }

    // ── Mapping ───────────────────────────────────────────────────────────
    private static ProductDto MapDto(Product p) => new(
        p.Id, p.Name, p.SKU, p.Price,
        p.ShortDescription, p.FullDescription, p.Usage, p.Contraindications,
        p.OzonUrl, p.WildberriesUrl, p.Status.ToString(), p.IsHit, p.IsNew,
        p.CreatedAt, p.CategoryId, p.Category.Name,
        p.Images.Select(i => new ProductImageDto(i.Id, i.Url, i.IsMain, i.IsCertificate, i.SortOrder)),
        p.Ingredients.Select(i => new ProductIngredientDto(i.Id, i.Name, i.Dosage, i.DailyValuePercent, i.SortOrder))
    );
    // Returns the given category id plus all descendant category ids
    private async Task<List<int>> GetDescendantCategoryIdsAsync(int rootId)
    {
        var all = await db.Categories.Select(c => new { c.Id, c.ParentId }).ToListAsync();
        var result = new List<int> { rootId };
        var queue = new Queue<int>(new[] { rootId });
        while (queue.Count > 0)
        {
            var pid = queue.Dequeue();
            foreach (var c in all.Where(c => c.ParentId == pid))
            {
                result.Add(c.Id);
                queue.Enqueue(c.Id);
            }
        }
        return result;
    }
}
