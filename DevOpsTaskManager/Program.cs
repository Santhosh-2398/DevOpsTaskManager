using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Demo-only, in-memory data. Tasks reset when the application restarts.
var tasks = new ConcurrentDictionary<int, TaskItem>();
var nextId = 0;

app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", application = "DevOps Task Manager" }));

app.MapGet("/api/tasks", () => Results.Ok(tasks.Values.OrderByDescending(t => t.Id)));

app.MapPost("/api/tasks", (CreateTaskRequest request) =>
{
    var title = request.Title?.Trim();
    if (string.IsNullOrEmpty(title) || title.Length > 120)
        return Results.BadRequest(new { message = "Task title must be between 1 and 120 characters." });

    var id = Interlocked.Increment(ref nextId);
    var task = new TaskItem(id, title, false);
    tasks[id] = task;
    return Results.Created($"/api/tasks/{id}", task);
});

app.MapPut("/api/tasks/{id:int}/toggle", (int id) =>
{
    if (!tasks.TryGetValue(id, out var existing)) return Results.NotFound();
    var updated = existing with { IsCompleted = !existing.IsCompleted };
    tasks[id] = updated;
    return Results.Ok(updated);
});

app.MapDelete("/api/tasks/{id:int}", (int id) =>
    tasks.TryRemove(id, out _) ? Results.NoContent() : Results.NotFound());

app.Run();

record TaskItem(int Id, string Title, bool IsCompleted);
record CreateTaskRequest(string? Title);
