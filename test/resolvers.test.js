import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { resetData, resolvers } from '../src/schema.js';

describe('resolvers GraphQL', () => {
  beforeEach(() => {
    resetData();
  });

  it('liste les projets avec leurs tâches', () => {
    const projects = resolvers.Query.projects();
    const projectTasks = resolvers.Project.tasks(projects[0]);

    assert.equal(projects.length, 2);
    assert.equal(projectTasks.length, 2);
  });

  it('crée une tâche dans un projet existant', () => {
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

  it('supprime aussi les tâches quand un projet est supprimé', () => {
    const deleted = resolvers.Mutation.deleteProject(null, { id: 'project-1' });
    const remainingTasks = resolvers.Query.tasks(null, { projectId: 'project-1' });

    assert.equal(deleted, true);
    assert.deepEqual(remainingTasks, []);
  });
});
