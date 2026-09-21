using NetlineBackend.Endpoints;
using NetlineBackend.Services;

var builder = WebApplication.CreateBuilder(args);

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
    client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddScoped<IClaudeService, ClaudeService>();

// ---- App pipeline ----
var app = builder.Build();

app.UseCors("NetlineFrontend");

app.MapChatEndpoints();

app.Run();
