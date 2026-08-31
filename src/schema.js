import { randomUUID } from 'node:crypto';

const initialProjects = [
  {
    id: 'project-1',
    name: 'Application de gestion',
    description: 'Projet exemple inspiré d’une application personnelle de gestion.',
  },
  {
    id: 'project-2',
    name: 'Tableau de bord',
    description: 'Suivi des indicateurs et des tâches importantes.',
  },
];

const initialTasks = [
  {
    id: 'task-1',
    title: 'Créer le schéma GraphQL',
    description: 'Définir les types Project et Task.',
    status: 'DONE',
    projectId: 'project-1',
  },
  {
    id: 'task-2',
    title: 'Ajouter les mutations',
    description: 'Permettre la création et la mise à jour des tâches.',
    status: 'IN_PROGRESS',
    projectId: 'project-1',
  },
  {
    id: 'task-3',
    title: 'Préparer la documentation',
    description: 'Expliquer comment lancer et tester l’API.',
    status: 'TODO',
    projectId: 'project-2',
  },
];

let projects = structuredClone(initialProjects);
let tasks = structuredClone(initialTasks);

const findProject = (id) => projects.find((project) => project.id === id);
const findTask = (id) => tasks.find((task) => task.id === id);

export const resetData = () => {
  projects = structuredClone(initialProjects);
  tasks = structuredClone(initialTasks);
};

export const typeDefs = `#graphql
  enum TaskStatus {
    TODO
    IN_PROGRESS
    DONE
  }

  type Project {
    id: ID!
    name: String!
    description: String
    tasks: [Task!]!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    project: Project!
  }

  input CreateProjectInput {
    name: String!
    description: String
  }

  input UpdateProjectInput {
    name: String
    description: String
  }

  input CreateTaskInput {
    title: String!
    description: String
    projectId: ID!
  }

  type Query {
    projects: [Project!]!
    project(id: ID!): Project
    tasks(status: TaskStatus, projectId: ID): [Task!]!
    task(id: ID!): Task
  }

  type Mutation {
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    createTask(input: CreateTaskInput!): Task!
    updateTaskStatus(id: ID!, status: TaskStatus!): Task!
    deleteTask(id: ID!): Boolean!
  }
`;

export const resolvers = {
  Query: {
    projects: () => projects,
    project: (_parent, { id }) => findProject(id) ?? null,
    tasks: (_parent, { status, projectId }) =>
      tasks.filter((task) => {
        const matchesStatus = status ? task.status === status : true;
        const matchesProject = projectId ? task.projectId === projectId : true;

        return matchesStatus && matchesProject;
      }),
    task: (_parent, { id }) => findTask(id) ?? null,
  },
  Mutation: {
    createProject: (_parent, { input }) => {
      const project = {
        id: randomUUID(),
        name: input.name,
        description: input.description ?? null,
      };

      projects.push(project);

      return project;
    },
    updateProject: (_parent, { id, input }) => {
      const project = findProject(id);

      if (!project) {
        throw new Error('Projet introuvable.');
      }

      Object.assign(project, input);

      return project;
    },
    deleteProject: (_parent, { id }) => {
      const projectExists = projects.some((project) => project.id === id);

      if (!projectExists) {
        return false;
      }

      projects = projects.filter((project) => project.id !== id);
      tasks = tasks.filter((task) => task.projectId !== id);

      return true;
    },
    createTask: (_parent, { input }) => {
      if (!findProject(input.projectId)) {
        throw new Error('Projet introuvable.');
      }

      const task = {
        id: randomUUID(),
        title: input.title,
        description: input.description ?? null,
        status: 'TODO',
        projectId: input.projectId,
      };

      tasks.push(task);

      return task;
    },
    updateTaskStatus: (_parent, { id, status }) => {
      const task = findTask(id);

      if (!task) {
        throw new Error('Tâche introuvable.');
      }

      task.status = status;

      return task;
    },
    deleteTask: (_parent, { id }) => {
      const taskExists = tasks.some((task) => task.id === id);

      if (!taskExists) {
        return false;
      }

      tasks = tasks.filter((task) => task.id !== id);

      return true;
    },
  },
  Project: {
    tasks: (project) => tasks.filter((task) => task.projectId === project.id),
  },
  Task: {
    project: (task) => findProject(task.projectId),
  },
};
