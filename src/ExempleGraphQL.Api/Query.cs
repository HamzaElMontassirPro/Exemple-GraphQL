public sealed class Query
{
    public IReadOnlyList<Repository> GetRepositories([Service] RepositoryStore store) => store.GetAll();

    public Repository? GetRepository(string owner, string name, [Service] RepositoryStore store) =>
        store.Find(owner, name);
}
