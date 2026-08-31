public sealed class Mutation
{
    public Repository CreateRepository(RepositoryInput input, [Service] RepositoryStore store) =>
        store.Create(input);
}
