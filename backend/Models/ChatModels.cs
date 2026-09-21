namespace NetlineBackend.Models;

public record ChatMessage(string Role, string Content);

public record ChatRequest(List<ChatMessage> Messages);

public record ChatResponse(string Reply);
