using NetlineBackend.Models;

namespace NetlineBackend.Services;

public interface IClaudeService
{
    Task<ClaudeResult> SendMessageAsync(List<ChatMessage> messages, CancellationToken ct = default);
}

/// Result wrapper so the endpoint can tell a real reply apart from a failure
/// without relying on exceptions for control flow.
public record ClaudeResult(bool Success, string? Reply, string? ErrorMessage, int? UpstreamStatusCode = null);
