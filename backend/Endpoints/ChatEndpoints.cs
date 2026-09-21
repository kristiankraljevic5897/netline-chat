using NetlineBackend.Models;
using NetlineBackend.Services;

namespace NetlineBackend.Endpoints;

public static class ChatEndpoints
{
    public static void MapChatEndpoints(this WebApplication app)
    {
        app.MapGet("/api/health", Get);
        app.MapPost("/api/chat", Post);
    }

    private static IResult Get()
    {
        return Results.Ok(new { status = "ok" });
    }

    private static async Task<IResult> Post(
        ChatRequest req,
        IClaudeService claudeService,
        CancellationToken ct)
    {
        if (req.Messages is null || req.Messages.Count == 0)
            return Results.BadRequest(new { error = "messages must contain at least one entry." });

        var result = await claudeService.SendMessageAsync(req.Messages, ct);

        if (!result.Success)
        {
            var status = result.UpstreamStatusCode is not null
                ? StatusCodes.Status502BadGateway
                : StatusCodes.Status500InternalServerError;
            return Results.Problem(result.ErrorMessage, statusCode: status);
        }

        return Results.Ok(new ChatResponse(result.Reply!));
    }
}
