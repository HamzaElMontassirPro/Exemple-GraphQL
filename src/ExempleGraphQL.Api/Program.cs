using HotChocolate;
using HotChocolate.Types;

var builder = WebApplication.CreateBuilder(args);
var app = GraphQLApplication.Create(builder);
app.Run();

public static class GraphQLApplication
{
    public static WebApplication Create(WebApplicationBuilder builder)
    {
        builder.Services
            .AddSingleton<RepositoryStore>()
            .AddGraphQLServer()
            .AddQueryType<Query>()
            .AddMutationType<Mutation>();

        var app = builder.Build();

        app.MapGet("/", () => Results.Ok(new { message = "GraphQL API available at /graphql" }));
        app.MapGraphQL("/graphql");

        return app;
    }
}

public sealed class Query
{
    public IReadOnlyList<GitHubRepository> GetRepositories([Service] RepositoryStore store) => store.GetAll();

    public GitHubRepository? GetRepository(string owner, string name, [Service] RepositoryStore store) =>
        store.Find(owner, name);
}

public sealed class Mutation
{
    public GitHubRepository CreateRepository(RepositoryInput input, [Service] RepositoryStore store) =>
        store.Create(input);
}

public sealed class RepositoryStore
{
    private readonly object syncRoot = new();
    private readonly List<GitHubRepository> repositories =
    [
        new(
            "1",
            "HamzaElMontassirPro",
            "Exemple-GraphQL",
            "Exemple d'API GraphQL pour exposer des repositories GitHub.",
            "https://github.com/HamzaElMontassirPro/Exemple-GraphQL")
    ];
    private int nextId = 2;

    public IReadOnlyList<GitHubRepository> GetAll()
    {
        lock (syncRoot)
        {
            return repositories.ToArray();
        }
    }

    public GitHubRepository? Find(string owner, string name)
    {
        lock (syncRoot)
        {
            return repositories.FirstOrDefault(repository => Matches(repository, owner, name));
        }
    }

    public GitHubRepository Create(RepositoryInput input)
    {
        lock (syncRoot)
        {
            if (repositories.Any(repository => Matches(repository, input.Owner, input.Name)))
            {
                throw new GraphQLException("Repository already exists.");
            }

            var repository = new GitHubRepository(
                (nextId++).ToString(),
                input.Owner,
                input.Name,
                input.Description,
                $"https://github.com/{input.Owner}/{input.Name}");

            repositories.Add(repository);
            return repository;
        }
    }

    private static bool Matches(GitHubRepository repository, string owner, string name) =>
        string.Equals(repository.Owner, owner, StringComparison.OrdinalIgnoreCase)
        && string.Equals(repository.Name, name, StringComparison.OrdinalIgnoreCase);
}

[GraphQLName("Repository")]
public sealed record GitHubRepository(
    string Id,
    string Owner,
    string Name,
    string? Description,
    string Url);

public sealed record RepositoryInput(string Owner, string Name, string? Description);
