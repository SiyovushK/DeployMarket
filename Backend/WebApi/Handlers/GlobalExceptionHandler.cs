using Domain.Constants;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace WebApi.Handlers;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is AppException appEx)
        {
            logger.LogWarning("Business error: {ErrorCode}", appEx.ErrorCode);

            httpContext.Response.StatusCode = appEx.StatusCode;
            await httpContext.Response.WriteAsJsonAsync(new
            {
                code    = appEx.ErrorCode,
                message = appEx.Message
            }, cancellationToken);

            return true;
        }

        logger.LogError(exception, "Unhandled server error");

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(new
        {
            code    = "Internal_Server_Error",
            message = "An unexpected error occurred."
        }, cancellationToken);

        return true;
    }
}
