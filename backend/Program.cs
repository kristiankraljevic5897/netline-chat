using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ---- Config ----
const string AnthropicVersion = "2023-06-01";
const string ClaudeModel = "claude-sonnet-4-6";
const string SystemPrompt =
    "You are GHOST_09, a terse, guarded contact on an encrypted cyberpunk chat line called NETLINE. " +
    "Reply in-character: short, cryptic, streetwise sentences, lowercase, no more than 2-3 sentences. " +
    "Never break character or mention that you are an AI.";

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:5173" };

// ---- Services ----
builder.Services.AddCors(options =>
{
    options.AddPolicy("NetlineFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddHttpClient("Anthropic", client =>
{
    client.BaseAddress = new Uri("https://api.anthropic.com/");
    client.DefaultRequestHeaders.Add("anthropic-version", AnthropicVersion);
    client.Timeout = TimeSpan.FromSeconds(30);
});

var app = builder.Build();

app.UseCors("NetlineFrontend");

// ---- Health check ----
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

// ---- Chat endpoint ----
app.MapPost("/api/chat", async (
    ChatRequest req,
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    ILogger<Program> logger) =>
{
    if (req.Messages is null || req.Messages.Count == 0)
        return Results.BadRequest(new { error = "messages must contain at least one entry." });

    var apiKey = config["Anthropic:ApiKey"] ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
    if (string.IsNullOrWhiteSpace(apiKey))
    {
        logger.LogError("Anthropic API key is not configured.");
        return Results.Problem(
            "Server is missing its Anthropic API key. Set it via user-secrets or the ANTHROPIC_API_KEY environment variable.",
            statusCode: StatusCodes.Status500InternalServerError);
    }

    // Anthropic expects roles "user" / "assistant" and alternating turns starting with "user".
    var messages = req.Messages
        .Select(m => new { role = m.Role.ToLowerInvariant(), content = m.Content })
        .ToList();

    var payload = new
    {
        model = ClaudeModel,
        max_tokens = 300,
        system = SystemPrompt,
        messages
    };

    var client = httpClientFactory.CreateClient("Anthropic");
    using var request = new HttpRequestMessage(HttpMethod.Post, "v1/messages")
    {
        Content = JsonContent.Create(payload)
    };
    request.Headers.Add("x-api-key", apiKey);

    HttpResponseMessage response;
    try
    {
        response = await client.SendAsync(request);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to reach the Claude API.");
        return Results.Problem("Could not reach the Claude API.", statusCode: StatusCodes.Status502BadGateway);
    }

    var raw = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        logger.LogWarning("Claude API returned {Status}: {Body}", response.StatusCode, raw);
        return Results.Problem($"Claude API error ({(int)response.StatusCode}).", statusCode: StatusCodes.Status502BadGateway);
    }

    using var doc = JsonDocument.Parse(raw);
    var text = doc.RootElement
        .GetProperty("content")[0]
        .GetProperty("text")
        .GetString() ?? "";

    return Results.Ok(new ChatResponse(text));
});

app.Run();

// ---- DTOs ----
record ChatMessage(string Role, string Content);
record ChatRequest(List<ChatMessage> Messages);
record ChatResponse(string Reply);
