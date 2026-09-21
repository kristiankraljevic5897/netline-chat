using System.Net.Http.Json;
using System.Text.Json;
using NetlineBackend.Models;

namespace NetlineBackend.Services;

/// <summary>
/// Talks to the Anthropic Claude API (POST /v1/messages) on behalf of the chat endpoint.
/// Keeps the GHOST_09 persona system prompt and Claude-specific request/response shaping
/// out of Program.cs and out of the endpoint mapping.
/// </summary>
public class ClaudeService : IClaudeService
{
    private const string ClaudeModel = "claude-sonnet-4-6";
    private const string SystemPrompt =
        "You are GHOST_09, a terse, guarded contact on an encrypted cyberpunk chat line called NETLINE. " +
        "Reply in-character: short, cryptic, streetwise sentences, lowercase, no more than 2-3 sentences. " +
        "Never break character or mention that you are an AI.";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<ClaudeService> _logger;

    public ClaudeService(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<ClaudeService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<ClaudeResult> SendMessageAsync(List<ChatMessage> messages, CancellationToken ct = default)
    {
        var apiKey = _config["Anthropic:ApiKey"] ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogError("Anthropic API key is not configured.");
            return new ClaudeResult(false, null,
                "Server is missing its Anthropic API key. Set it via user-secrets or the ANTHROPIC_API_KEY environment variable.");
        }

        // Anthropic expects roles "user" / "assistant" and alternating turns starting with "user".
        var payload = new
        {
            model = ClaudeModel,
            max_tokens = 300,
            system = SystemPrompt,
            messages = messages.Select(m => new { role = m.Role.ToLowerInvariant(), content = m.Content })
        };

        var client = _httpClientFactory.CreateClient("Anthropic");
        using var request = new HttpRequestMessage(HttpMethod.Post, "v1/messages")
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Add("x-api-key", apiKey);

        HttpResponseMessage response;
        try
        {
            response = await client.SendAsync(request, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reach the Claude API.");
            return new ClaudeResult(false, null, "Could not reach the Claude API.");
        }

        var raw = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Claude API returned {Status}: {Body}", response.StatusCode, raw);
            return new ClaudeResult(false, null, $"Claude API error ({(int)response.StatusCode}).", (int)response.StatusCode);
        }

        using var doc = JsonDocument.Parse(raw);
        var text = doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "";

        return new ClaudeResult(true, text, null);
    }
}
