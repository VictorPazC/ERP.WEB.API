namespace ERP.Web.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var start = DateTime.UtcNow;
        var method = context.Request.Method;
        var path   = context.Request.Path;

        _logger.LogDebug("[DEBUG] Incoming {Method} {Path} from {RemoteIp}",
            method, path, context.Connection.RemoteIpAddress);

        try
        {
            await _next(context);

            var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;
            var statusCode = context.Response.StatusCode;

            if (statusCode >= 500)
                _logger.LogError("[ERROR] {Method} {Path} → {StatusCode} in {Elapsed:F1}ms",
                    method, path, statusCode, elapsed);
            else if (statusCode >= 400)
                _logger.LogWarning("[WARN]  {Method} {Path} → {StatusCode} in {Elapsed:F1}ms",
                    method, path, statusCode, elapsed);
            else
                _logger.LogInformation("[INFO]  {Method} {Path} → {StatusCode} in {Elapsed:F1}ms",
                    method, path, statusCode, elapsed);
        }
        catch (Exception ex)
        {
            var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;
            _logger.LogError(ex, "[ERROR] {Method} {Path} threw an unhandled exception in {Elapsed:F1}ms: {Message}",
                method, path, elapsed, ex.Message);
            throw;
        }
    }
}
