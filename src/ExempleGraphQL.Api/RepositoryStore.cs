using HotChocolate;

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
                Guid.NewGuid().ToString("N"),
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
