namespace Domain.Constants;

public class AppException(ErrorDetails details) : Exception(details.Message)
{
    public int StatusCode { get; } = details.StatusCode;
    public string ErrorCode { get; } = details.Message;
}
