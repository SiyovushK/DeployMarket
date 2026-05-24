using System.ComponentModel.DataAnnotations;

namespace Domain.DTOs.Users;

public record UserProfileDto(
    Guid   Id,
    string Email,
    string FirstName,
    string LastName,
    string? Phone,
    string Role,
    DateTime CreatedAt
);

public record UpdateProfileDto(
    string? FirstName = null,
    string? LastName  = null,
    string? Phone     = null
);

// Admin: list of buyers
public record BuyerListItemDto(
    Guid     Id,
    string   Email,
    string   FullName,
    string   Status,
    DateTime CreatedAt
);

// Admin: list of staff/admins
public record StaffListItemDto(
    Guid     Id,
    string   Email,
    string   FullName,
    string   Role,
    string   Status,
    DateTime CreatedAt
);

// Admin: create staff account
public record CreateStaffDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string FirstName,
    [Required] string RoleName,  // "ContentManager" | "SuperAdmin"
    string LastName = ""
);

public record UpdateStaffStatusDto(bool Block);
