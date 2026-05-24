using System.Text;
using Domain.Constants;
using Domain.DTOs.Categories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class CategoryService(AppDbContext db) : ICategoryService
{
    public async Task<IEnumerable<CategoryDto>> GetTreeAsync()
    {
        var all = await db.Categories.OrderBy(c => c.SortOrder).ToListAsync();
        return BuildTree(all, null);
    }

    public async Task<IEnumerable<CategoryFlatDto>> GetFlatAsync()
    {
        // Load all into memory, then flatten in tree order so parents
        // always appear before their children regardless of SortOrder ties.
        var all = await db.Categories
            .Include(c => c.Parent)
            .ToListAsync();
        return FlattenInTreeOrder(all, null);
    }

    private static IEnumerable<CategoryFlatDto> FlattenInTreeOrder(List<Category> all, int? parentId)
    {
        foreach (var c in all
            .Where(c => c.ParentId == parentId)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Id))
        {
            yield return new CategoryFlatDto(
                c.Id, c.Name, c.Slug, c.SortOrder, c.ParentId, c.Parent?.Name);
            foreach (var child in FlattenInTreeOrder(all, c.Id))
                yield return child;
        }
    }

    public async Task<CategoryDto> CreateAsync(CategoryCreateDto dto)
    {
        var slug = Slugify(dto.Name);
        if (await db.Categories.AnyAsync(c => c.Slug == slug))
            slug = $"{slug}-{Guid.NewGuid():N}"[..40];

        var cat = new Category
        {
            Name      = dto.Name,
            Slug      = slug,
            ParentId  = dto.ParentId,
            SortOrder = dto.SortOrder,
        };

        db.Categories.Add(cat);
        await db.SaveChangesAsync();

        // Build DTO without another round-trip
        return new CategoryDto(cat.Id, cat.Name, cat.Slug, cat.SortOrder, cat.ParentId, []);
    }

    public async Task<CategoryDto> UpdateAsync(int id, CategoryUpdateDto dto)
    {
        var cat = await db.Categories.FindAsync(id)
            ?? throw new AppException(ErrorMessages.Category_Not_Found);

        if (!string.IsNullOrWhiteSpace(dto.Name)) cat.Name = dto.Name;
        if (dto.ParentId  is not null) cat.ParentId  = dto.ParentId;
        if (dto.SortOrder is not null) cat.SortOrder = dto.SortOrder.Value;

        await db.SaveChangesAsync();

        // Return updated tree for this node
        var all = await db.Categories.OrderBy(c => c.SortOrder).ToListAsync();
        return BuildTree(all, null).Flatten().First(c => c.Id == id);
    }

    public async Task DeleteAsync(int id)
    {
        var cat = await db.Categories
            .Include(c => c.Children)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new AppException(ErrorMessages.Category_Not_Found);

        if (cat.Children.Any()) throw new AppException(ErrorMessages.Category_Has_Children);
        if (cat.Products.Any()) throw new AppException(ErrorMessages.Category_Has_Products);

        db.Categories.Remove(cat);
        await db.SaveChangesAsync();
    }

    public async Task ReorderAsync(IEnumerable<(int Id, int SortOrder)> items)
    {
        foreach (var (id, order) in items)
        {
            var cat = await db.Categories.FindAsync(id);
            if (cat != null) cat.SortOrder = order;
        }
        await db.SaveChangesAsync();
    }

    // ── helpers ──────────────────────────────────────────────────────────
    private static IEnumerable<CategoryDto> BuildTree(List<Category> all, int? parentId) =>
        all.Where(c => c.ParentId == parentId)
           .Select(c => new CategoryDto(
               c.Id, c.Name, c.Slug, c.SortOrder, c.ParentId,
               BuildTree(all, c.Id)));

    private static string Slugify(string name)
    {
        var map = new Dictionary<char, string>
        {
            ['а']="a",['б']="b",['в']="v",['г']="g",['д']="d",
            ['е']="e",['ё']="yo",['ж']="zh",['з']="z",['и']="i",
            ['й']="y",['к']="k",['л']="l",['м']="m",['н']="n",
            ['о']="o",['п']="p",['р']="r",['с']="s",['т']="t",
            ['у']="u",['ф']="f",['х']="kh",['ц']="ts",['ч']="ch",
            ['ш']="sh",['щ']="shch",['ъ']="",['ы']="y",['ь']="",
            ['э']="e",['ю']="yu",['я']="ya",
        };

        var sb = new StringBuilder();
        foreach (var ch in name.ToLower())
        {
            if (map.TryGetValue(ch, out var trans)) sb.Append(trans);
            else if (char.IsLetterOrDigit(ch))      sb.Append(ch);
            else if (ch == ' ' || ch == '-')        sb.Append('-');
        }
        return sb.ToString().Trim('-');
    }
}

internal static class CategoryDtoExtensions
{
    internal static IEnumerable<CategoryDto> Flatten(this IEnumerable<CategoryDto> nodes)
    {
        foreach (var node in nodes)
        {
            yield return node;
            foreach (var child in node.Children.Flatten())
                yield return child;
        }
    }
}
