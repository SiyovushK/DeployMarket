namespace Domain.Entities;

/// <summary>
/// Global site settings stored as key/value pairs.
/// Key examples: "phone", "email", "vk_url", "instagram_url",
///               "privacy_policy", "terms_of_service".
/// </summary>
public class SiteSetting
{
    public int    Id    { get; set; }
    public string Key   { get; set; } = null!;
    public string Value { get; set; } = string.Empty;
}
