using Domain.DTOs.Auth;
using Domain.DTOs.Categories;
using Domain.DTOs.Content;
using Domain.DTOs.Favorites;
using Domain.DTOs.Products;
using Domain.DTOs.Users;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Interfaces;

// ─── Auth ─────────────────────────────────────────────────────────────────
public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> RefreshAsync(string refreshToken);
    Task                  LogoutAsync(string refreshToken);
    Task                  ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
}

// ─── User / Profile ───────────────────────────────────────────────────────
public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);

    // Admin
    Task<PagedResult<BuyerListItemDto>> GetBuyersAsync(int page, int pageSize, string? search = null);
    Task<PagedResult<StaffListItemDto>> GetStaffAsync(int page, int pageSize, string? search = null);
    Task CreateStaffAsync(CreateStaffDto dto);
    Task SetUserBlockedAsync(Guid targetId, Guid requesterId, bool block);
    // Keep old name as alias for compatibility
    Task SetStaffBlockedAsync(Guid staffId, Guid requesterId, bool block);
}

// ─── Products ─────────────────────────────────────────────────────────────
public interface IProductService
{
    Task<PagedResult<ProductListItemDto>> GetListAsync(ProductQueryParams q, bool adminView = false);
    Task<ProductDto>  GetByIdAsync(int id);
    Task<ProductDto>  CreateAsync(ProductCreateDto dto);
    Task<ProductDto>  UpdateAsync(int id, ProductUpdateDto dto);
    Task              DeleteAsync(int id);

    Task<string>      UploadImageAsync(int productId, IFormFile file, bool isMain, bool isCertificate);
    Task              SetMainImageAsync(int productId, int imageId);
    Task              DeleteImageAsync(int imageId);
    Task<ProductDto>  UpdateIngredientsAsync(int productId, IEnumerable<IngredientUpsertDto> items);

    Task<DashboardDto> GetDashboardAsync();
}

// ─── Categories ───────────────────────────────────────────────────────────
public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>>     GetTreeAsync();
    Task<IEnumerable<CategoryFlatDto>> GetFlatAsync();
    Task<CategoryDto>                  CreateAsync(CategoryCreateDto dto);
    Task<CategoryDto>                  UpdateAsync(int id, CategoryUpdateDto dto);
    Task                               DeleteAsync(int id);
    Task                               ReorderAsync(IEnumerable<(int Id, int SortOrder)> items);
}

// ─── Favorites ───────────────────────────────────────────────────────────
public interface IFavoriteService
{
    Task<IEnumerable<FavoriteItemDto>> GetAsync(Guid userId);
    Task AddAsync(Guid userId, int productId);
    Task RemoveAsync(Guid userId, int productId);
    Task ClearAsync(Guid userId);
}

// ─── Articles ─────────────────────────────────────────────────────────────
public interface IArticleService
{
    Task<PagedResult<ArticleListItemDto>> GetListAsync(int page, int pageSize, bool publishedOnly = true);
    Task<ArticleDto> GetBySlugAsync(string slug);
    Task<ArticleDto> GetByIdAsync(int id);
    Task<ArticleDto> CreateAsync(ArticleCreateDto dto, IFormFile? cover);
    Task<ArticleDto> UpdateAsync(int id, ArticleUpdateDto dto, IFormFile? cover);
    Task             DeleteAsync(int id);
}

// ─── Banners ─────────────────────────────────────────────────────────────
public interface IBannerService
{
    Task<IEnumerable<BannerDto>> GetAllAsync(bool activeOnly = true);
    Task<BannerDto> CreateAsync(BannerCreateDto dto, IFormFile image);
    Task<BannerDto> UpdateAsync(int id, BannerUpdateDto dto, IFormFile? image);
    Task            DeleteAsync(int id);
}

// ─── FAQ ─────────────────────────────────────────────────────────────────
public interface IFaqService
{
    Task<IEnumerable<FaqItemDto>> GetAllAsync();
    Task<FaqItemDto> CreateAsync(FaqItemCreateDto dto);
    Task<FaqItemDto> UpdateAsync(int id, FaqItemCreateDto dto);
    Task             DeleteAsync(int id);
    Task             ReorderAsync(IEnumerable<(int Id, int SortOrder)> items);
}

// ─── Page content ─────────────────────────────────────────────────────────
public interface IPageContentService
{
    Task<IEnumerable<PageContentDto>> GetAllAsync();
    Task<PageContentDto>              GetByKeyAsync(string key);
    Task<PageContentDto>              UpdateAsync(string key, PageContentUpdateDto dto, IFormFile? image);
    Task<PageContentDto>              CreateAsync(PageContentCreateDto dto, IFormFile? image);
    Task              DeleteAsync(string key);
}

// ─── Site settings ────────────────────────────────────────────────────────
public interface ISiteSettingService
{
    Task<IEnumerable<SiteSettingDto>> GetAllAsync();
    Task<SiteSettingDto>              GetAsync(string key);
    Task<SiteSettingDto>              UpdateAsync(string key, SiteSettingUpdateDto dto);
}

// ─── File storage ────────────────────────────────────────────────────────
public interface IFileStorageService
{
    Task<string> SaveAsync(IFormFile file, string folder);
    Task         DeleteAsync(string url);
}
