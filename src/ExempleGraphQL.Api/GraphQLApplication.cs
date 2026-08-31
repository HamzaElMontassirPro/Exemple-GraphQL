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
