using Domain.Constants;
using Domain.DTOs.Favorites;  // PagedResult<T>
using Domain.DTOs.Users;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class UserService(AppDbContext db) : IUserService
{
    public async Task<UserProfileDto> GetProfileAsync(Guid userId)
    {
        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new AppException(ErrorMessages.User_Not_Found);

        return Map(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
    {
        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new AppException(ErrorMessages.User_Not_Found);

        if (!string.IsNullOrWhiteSpace(dto.FirstName)) user.FirstName = dto.FirstName;
        if (!string.IsNullOrWhiteSpace(dto.LastName)) user.LastName = dto.LastName;
        if (!string.IsNullOrWhiteSpace(dto.Phone)) user.Phone = dto.Phone;

        await db.SaveChangesAsync();
        return Map(user);
    }

    public async Task<PagedResult<BuyerListItemDto>> GetBuyersAsync(int page, int pageSize, string? search = null)
    {
        var buyerRole = await db.Roles.FirstAsync(r => r.Name == "Buyer");

        var query = db.Users.Where(u => u.RoleId == buyerRole.Id);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(s) ||
                (u.FirstName + " " + u.LastName).ToLower().Contains(s));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new BuyerListItemDto(
                u.Id,
                u.Email,
                u.FirstName + " " + u.LastName,
                u.Status.ToString(),
                u.CreatedAt))
            .ToListAsync();

        return new PagedResult<BuyerListItemDto>(items, total, page, pageSize);
    }

    public async Task<PagedResult<StaffListItemDto>> GetStaffAsync(int page, int pageSize, string? search = null)
    {
        var buyerRole = await db.Roles.FirstAsync(r => r.Name == "Buyer");

        var query = db.Users
            .Include(u => u.Role)
            .Where(u => u.RoleId != buyerRole.Id);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(s) ||
                (u.FirstName + " " + u.LastName).ToLower().Contains(s));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new StaffListItemDto(
                u.Id,
                u.Email,
                u.FirstName + " " + u.LastName,
                u.Role.Name,
                u.Status.ToString(),
                u.CreatedAt))
            .ToListAsync();

        return new PagedResult<StaffListItemDto>(items, total, page, pageSize);
    }

    public async Task CreateStaffAsync(CreateStaffDto dto)
    {
        if (await db.Users.AnyAsync(u => u.Email == dto.Email))
            throw new AppException(ErrorMessages.Email_Already_Exists);

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == dto.RoleName)
            ?? throw new AppException(ErrorMessages.Role_Not_Found);

        db.Users.Add(new User
        {
            Email        = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName    = dto.FirstName,
            LastName     = dto.LastName,
            RoleId       = role.Id
        });

        await db.SaveChangesAsync();
    }

    public async Task SetUserBlockedAsync(Guid targetId, Guid requesterId, bool block)
    {
        if (targetId == requesterId)
            throw new AppException(ErrorMessages.Cannot_Block_Self);

        var user = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == targetId)
            ?? throw new AppException(ErrorMessages.User_Not_Found);

        // Admins cannot block other admins
        if (user.Role.Name == "SuperAdmin" || user.Role.Name == "ContentManager")
        {
            var requester = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == requesterId)
                ?? throw new AppException(ErrorMessages.User_Not_Found);
            if (requester.Role.Name != "SuperAdmin" || user.Role.Name == "SuperAdmin")
                throw new AppException(ErrorMessages.Cannot_Block_Admin);
        }

        user.Status = block ? UserStatus.Blocked : UserStatus.Active;
        await db.SaveChangesAsync();
    }

    // Keep backward compat
    public Task SetStaffBlockedAsync(Guid staffId, Guid requesterId, bool block)
        => SetUserBlockedAsync(staffId, requesterId, block);

    // ── helpers ──────────────────────────────────────────────────────────
    private static UserProfileDto Map(User u) =>
        new(u.Id, u.Email, u.FirstName, u.LastName, u.Phone, u.Role.Name, u.CreatedAt);
}
