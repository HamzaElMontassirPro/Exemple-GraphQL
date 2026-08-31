var builder = WebApplication.CreateBuilder(args);
var app = GraphQLApplication.Create(builder);
app.Run();
