import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetData, resolvers } from '../src/schema.js';

describe('resolvers GraphQL', () => {
  beforeEach(() => {
    resetData();
  });

  it('lists projects with their tasks', () => {
    const projects = resolvers.Query.projects();
    const projectTasks = resolvers.Project.tasks(projects[0]);

    assert.equal(projects.length, 2);
    assert.equal(projectTasks.length, 2);
  });

  it('gets a project and a task by id', () => {
    const project = resolvers.Query.project(null, { id: 'project-1' });
    const task = resolvers.Query.task(null, { id: 'task-1' });

    assert.equal(project.name, 'Application de gestion');
    assert.equal(task.title, 'Créer le schéma GraphQL');
  });

  it('partially updates a project without clearing absent fields', () => {
    const project = resolvers.Mutation.updateProject(null, {
      id: 'project-1',
      input: {
        description: 'Nouvelle description.',
      },
    });

    assert.equal(project.name, 'Application de gestion');
    assert.equal(project.description, 'Nouvelle description.');
  });

  it('returns null when updating an unknown project', () => {
    const project = resolvers.Mutation.updateProject(null, {
      id: 'project-404',
      input: {
        name: 'Projet inconnu',
      },
    });

    assert.equal(project, null);
  });

  it('creates a project', () => {
    const project = resolvers.Mutation.createProject(null, {
      input: {
        name: 'Nouveau projet',
        description: 'Projet créé pendant le test.',
      },
    });

    assert.equal(project.name, 'Nouveau projet');
    assert.equal(resolvers.Query.project(null, { id: project.id }).description, 'Projet créé pendant le test.');
  });

  it('creates a task in an existing project', () => {
    const task = resolvers.Mutation.createTask(null, {
      input: {
        title: 'Tester les mutations',
        description: 'Valider la création de tâche.',
        projectId: 'project-1',
      },
    });

    assert.equal(task.status, 'TODO');
    assert.equal(resolvers.Task.project(task).id, 'project-1');
  });

  it('rejects task creation for an unknown project', () => {
    assert.throws(
      () =>
        resolvers.Mutation.createTask(null, {
          input: {
            title: 'Tâche impossible',
            description: 'Projet inconnu.',
            projectId: 'project-404',
          },
        }),
      (error) => {
        assert.equal(error.message, 'Projet introuvable.');
        assert.equal(error.extensions.code, 'NOT_FOUND');

        return true;
      },
    );
  });

  it('updates a task status', () => {
    const task = resolvers.Mutation.updateTaskStatus(null, {
      id: 'task-2',
      status: 'DONE',
    });

    assert.equal(task.status, 'DONE');
  });

  it('returns null when updating an unknown task', () => {
    const task = resolvers.Mutation.updateTaskStatus(null, {
      id: 'task-404',
      status: 'DONE',
    });

    assert.equal(task, null);
  });

  it('deletes a task', () => {
    const deleted = resolvers.Mutation.deleteTask(null, { id: 'task-2' });
    const task = resolvers.Query.task(null, { id: 'task-2' });

    assert.equal(deleted, true);
    assert.equal(task, null);
  });

  it('also deletes tasks when deleting a project', () => {
    const deleted = resolvers.Mutation.deleteProject(null, { id: 'project-1' });
    const remainingTasks = resolvers.Query.tasks(null, { projectId: 'project-1' });

    assert.equal(deleted, true);
    assert.deepEqual(remainingTasks, []);
  });
});
