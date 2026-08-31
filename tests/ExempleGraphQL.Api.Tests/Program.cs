using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.DependencyInjection;

var tests = new (string Name, Func<Task> Run)[]
{
    ("returns repositories through the GraphQL endpoint", ReturnsRepositories),
    ("creates and retrieves a GitHub repository", CreatesAndRetrievesRepository),
    ("returns GraphQL validation errors", ReturnsGraphQLValidationErrors),
    ("rejects duplicate repository creation", RejectsDuplicates)
};
var failures = new List<(string Name, Exception Error)>();

foreach (var test in tests)
{
    try
    {
        await test.Run();
        Console.WriteLine($"PASS {test.Name}");
    }
    catch (Exception error)
    {
        failures.Add((test.Name, error));
        Console.Error.WriteLine($"FAIL {test.Name}: {error.Message}");
    }
}

if (failures.Count > 0)
{
    Console.Error.WriteLine($"{failures.Count} test(s) failed.");
    Environment.ExitCode = 1;
}

static async Task<TestServer> StartServerAsync()
{
    var builder = WebApplication.CreateBuilder(new WebApplicationOptions
    {
        ApplicationName = typeof(GraphQLApplication).Assembly.FullName
    });
    builder.WebHost.UseUrls("http://127.0.0.1:0");

    var app = GraphQLApplication.Create(builder);
    await app.StartAsync();

    var address = app.Services
        .GetRequiredService<IServer>()
        .Features
        .Get<IServerAddressesFeature>()!
        .Addresses
        .Single();
    return new TestServer(app, new HttpClient { BaseAddress = new Uri(address) });
}

static async Task<GraphQLResponse> PostGraphQLAsync(HttpClient client, string query, object? variables = null)
{
    var response = await client.PostAsJsonAsync("/graphql", new { query, variables });
    var stream = await response.Content.ReadAsStreamAsync();
    return new GraphQLResponse((int)response.StatusCode, await JsonDocument.ParseAsync(stream));
}

static async Task ReturnsRepositories()
{
    await using var server = await StartServerAsync();
    using var response = await PostGraphQLAsync(server.Client, "{ repositories { owner name url } }");
    Assert(response.StatusCode == 200, $"Expected HTTP 200, got {response.StatusCode}.");
    var repository = response.Document.RootElement.GetProperty("data").GetProperty("repositories")[0];

    Assert(repository.GetProperty("owner").GetString() == "HamzaElMontassirPro", "Unexpected owner.");
    Assert(repository.GetProperty("name").GetString() == "Exemple-GraphQL", "Unexpected name.");
    Assert(repository.GetProperty("url").GetString() == "https://github.com/HamzaElMontassirPro/Exemple-GraphQL", "Unexpected URL.");
}

static async Task CreatesAndRetrievesRepository()
{
    await using var server = await StartServerAsync();
    const string mutation = """
        mutation AddRepository($input: RepositoryInput!) {
          createRepository(input: $input) { id owner name url description }
        }
        """;

    using var mutationResult = await PostGraphQLAsync(server.Client, mutation, new
    {
        input = new
        {
            owner = "octocat",
            name = "Hello-World",
            description = "Repository de démonstration"
        }
    });
    Assert(mutationResult.StatusCode == 200, $"Expected HTTP 200, got {mutationResult.StatusCode}.");
    var createdRepository = mutationResult.Document.RootElement.GetProperty("data").GetProperty("createRepository");

    Assert(!string.IsNullOrWhiteSpace(createdRepository.GetProperty("id").GetString()), "Expected a generated ID.");
    Assert(createdRepository.GetProperty("owner").GetString() == "octocat", "Unexpected created owner.");
    Assert(createdRepository.GetProperty("url").GetString() == "https://github.com/octocat/Hello-World", "Unexpected created URL.");

    using var queryResult = await PostGraphQLAsync(server.Client, "{ repository(owner: \"octocat\", name: \"Hello-World\") { owner name url } }");
    Assert(queryResult.StatusCode == 200, $"Expected HTTP 200, got {queryResult.StatusCode}.");
    var repository = queryResult.Document.RootElement.GetProperty("data").GetProperty("repository");

    Assert(repository.GetProperty("owner").GetString() == "octocat", "Unexpected queried owner.");
    Assert(repository.GetProperty("name").GetString() == "Hello-World", "Unexpected queried name.");
}

static async Task ReturnsGraphQLValidationErrors()
{
    await using var server = await StartServerAsync();
    using var response = await PostGraphQLAsync(server.Client, "{ unknownField }");

    Assert(response.StatusCode == 400, $"Expected HTTP 400, got {response.StatusCode}.");
    Assert(response.Document.RootElement.TryGetProperty("errors", out var errors), "Expected GraphQL errors.");
    Assert(errors.GetArrayLength() > 0, "Expected at least one GraphQL error.");
}

static async Task RejectsDuplicates()
{
    await using var server = await StartServerAsync();
    const string mutation = """
        mutation AddRepository($input: RepositoryInput!) {
          createRepository(input: $input) { id }
        }
        """;
    var variables = new { input = new { owner = "octocat", name = "Hello-World" } };

    using var firstResult = await PostGraphQLAsync(server.Client, mutation, variables);
    using var duplicateResult = await PostGraphQLAsync(server.Client, mutation, variables);

    Assert(firstResult.StatusCode == 200, $"Expected HTTP 200, got {firstResult.StatusCode}.");
    Assert(!firstResult.Document.RootElement.TryGetProperty("errors", out _), "Expected first creation to succeed without errors.");
    Assert(firstResult.Document.RootElement.GetProperty("data").GetProperty("createRepository").TryGetProperty("id", out _), "Expected first creation to succeed.");
    Assert(duplicateResult.StatusCode == 200, $"Expected HTTP 200, got {duplicateResult.StatusCode}.");
    Assert(duplicateResult.Document.RootElement.TryGetProperty("errors", out var errors), "Expected duplicate error.");
    Assert(errors[0].GetProperty("message").GetString()?.Contains("already exists", StringComparison.OrdinalIgnoreCase) == true, "Unexpected duplicate error.");
}

static void Assert(bool condition, string message)
{
    if (!condition)
    {
        throw new Exception(message);
    }
}

internal sealed class TestServer(WebApplication app, HttpClient client) : IAsyncDisposable
{
    public HttpClient Client { get; } = client;

    public async ValueTask DisposeAsync()
    {
        Client.Dispose();
        await app.DisposeAsync();
    }
}

internal sealed record GraphQLResponse(int StatusCode, JsonDocument Document) : IDisposable
{
    public void Dispose() => Document.Dispose();
}
