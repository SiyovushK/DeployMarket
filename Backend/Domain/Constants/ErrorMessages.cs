namespace Domain.Constants;

public static class ErrorMessages
{
    // Auth
    public static readonly ErrorDetails Invalid_Credentials      = new("Invalid_Credentials",      401);
    public static readonly ErrorDetails Email_Already_Exists     = new("Email_Already_Exists",     409);
    public static readonly ErrorDetails User_Not_Found           = new("User_Not_Found",           404);
    public static readonly ErrorDetails User_Blocked             = new("User_Blocked",             403);
    public static readonly ErrorDetails Unauthorized             = new("Unauthorized",             401);
    public static readonly ErrorDetails Forbidden                = new("Forbidden",                403);

    // Products
    public static readonly ErrorDetails Product_Not_Found        = new("Product_Not_Found",        404);
    public static readonly ErrorDetails SKU_Already_Exists       = new("SKU_Already_Exists",       409);

    // Categories
    public static readonly ErrorDetails Category_Not_Found       = new("Category_Not_Found",       404);
    public static readonly ErrorDetails Category_Has_Children    = new("Category_Has_Children",    409);
    public static readonly ErrorDetails Category_Has_Products    = new("Category_Has_Products",    409);

    // Favorites
    public static readonly ErrorDetails Already_In_Favorites     = new("Already_In_Favorites",    409);
    public static readonly ErrorDetails Not_In_Favorites         = new("Not_In_Favorites",         404);

    // Articles
    public static readonly ErrorDetails Article_Not_Found        = new("Article_Not_Found",        404);
    public static readonly ErrorDetails Slug_Already_Exists      = new("Slug_Already_Exists",      409);

    // Banners
    public static readonly ErrorDetails Banner_Not_Found         = new("Banner_Not_Found",         404);

    // FAQ
    public static readonly ErrorDetails Faq_Not_Found            = new("Faq_Not_Found",            404);

    // Page content
    public static readonly ErrorDetails PageContent_Not_Found    = new("PageContent_Not_Found",    404);
    public static readonly ErrorDetails PageContent_Key_Exists    = new("PageContent_Key_Exists",    409);
    // Site settings
    public static readonly ErrorDetails Setting_Not_Found        = new("Setting_Not_Found",        404);

    // Files
    public static readonly ErrorDetails File_Upload_Failed       = new("File_Upload_Failed",       500);
    public static readonly ErrorDetails Invalid_File_Type        = new("Invalid_File_Type",        400);

    // Roles & permissions
    public static readonly ErrorDetails Role_Not_Found           = new("Role_Not_Found",           404);
    public static readonly ErrorDetails Permission_Not_Found     = new("Permission_Not_Found",     404);
    public static readonly ErrorDetails Cannot_Block_Self        = new("Cannot_Block_Self",        400);
    public static readonly ErrorDetails Cannot_Block_Admin       = new("Cannot_Block_Admin",       400);
}
