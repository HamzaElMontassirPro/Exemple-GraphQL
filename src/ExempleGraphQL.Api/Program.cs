using HotChocolate;

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
    public IReadOnlyList<Repository> GetRepositories([Service] RepositoryStore store) => store.GetAll();

    public Repository? GetRepository(string owner, string name, [Service] RepositoryStore store) =>
        store.Find(owner, name);
}

public sealed class Mutation
{
    public Repository CreateRepository(RepositoryInput input, [Service] RepositoryStore store) =>
        store.Create(input);
}

public sealed class RepositoryStore
{
    private readonly object syncRoot = new();
    private readonly List<Repository> repositories =
    [
        new(
            "1",
            "HamzaElMontassirPro",
            "Exemple-GraphQL",
            "Exemple d'API GraphQL pour exposer des repositories GitHub.",
            "https://github.com/HamzaElMontassirPro/Exemple-GraphQL")
    ];
    private int nextId;

    public RepositoryStore()
    {
        nextId = repositories
            .Select(repository => int.TryParse(repository.Id, out var id) ? id : 0)
            .DefaultIfEmpty(0)
            .Max() + 1;
    }

    public IReadOnlyList<Repository> GetAll()
    {
        lock (syncRoot)
        {
            return repositories.ToArray();
        }
    }

    public Repository? Find(string owner, string name)
    {
        lock (syncRoot)
        {
            return repositories.FirstOrDefault(repository => Matches(repository, owner, name));
        }
    }

    public Repository Create(RepositoryInput input)
    {
        lock (syncRoot)
        {
            if (repositories.Any(repository => Matches(repository, input.Owner, input.Name)))
            {
                throw new GraphQLException("Repository already exists.");
            }

            var repository = new Repository(
                (nextId++).ToString(),
                input.Owner,
                input.Name,
                input.Description,
                $"https://github.com/{input.Owner}/{input.Name}");

            repositories.Add(repository);
            return repository;
        }
    }

    private static bool Matches(Repository repository, string owner, string name) =>
        string.Equals(repository.Owner, owner, StringComparison.OrdinalIgnoreCase)
        && string.Equals(repository.Name, name, StringComparison.OrdinalIgnoreCase);
}

public sealed record Repository(
    string Id,
    string Owner,
    string Name,
    string? Description,
    string Url);

public sealed record RepositoryInput(string Owner, string Name, string? Description);
