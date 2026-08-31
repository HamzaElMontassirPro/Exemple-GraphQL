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

  it('récupère un projet et une tâche par identifiant', () => {
    const project = resolvers.Query.project(null, { id: 'project-1' });
    const task = resolvers.Query.task(null, { id: 'task-1' });

    assert.equal(project.name, 'Application de gestion');
    assert.equal(task.title, 'Créer le schéma GraphQL');
  });

  it('met à jour partiellement un projet sans effacer les champs absents', () => {
    const project = resolvers.Mutation.updateProject(null, {
      id: 'project-1',
      input: {
        description: 'Nouvelle description.',
      },
    });

    assert.equal(project.name, 'Application de gestion');
    assert.equal(project.description, 'Nouvelle description.');
  });

  it('renvoie null quand un projet à mettre à jour est introuvable', () => {
    const project = resolvers.Mutation.updateProject(null, {
      id: 'project-404',
      input: {
        name: 'Projet inconnu',
      },
    });

    assert.equal(project, null);
  });

  it('crée un projet', () => {
    const project = resolvers.Mutation.createProject(null, {
      input: {
        name: 'Nouveau projet',
        description: 'Projet créé pendant le test.',
      },
    });

    assert.equal(project.name, 'Nouveau projet');
    assert.equal(resolvers.Query.project(null, { id: project.id }).description, 'Projet créé pendant le test.');
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

  it('met à jour le statut d’une tâche', () => {
    const task = resolvers.Mutation.updateTaskStatus(null, {
      id: 'task-2',
      status: 'DONE',
    });

    assert.equal(task.status, 'DONE');
  });

  it('renvoie null quand une tâche à mettre à jour est introuvable', () => {
    const task = resolvers.Mutation.updateTaskStatus(null, {
      id: 'task-404',
      status: 'DONE',
    });

    assert.equal(task, null);
  });

  it('supprime une tâche', () => {
    const deleted = resolvers.Mutation.deleteTask(null, { id: 'task-2' });
    const task = resolvers.Query.task(null, { id: 'task-2' });

    assert.equal(deleted, true);
    assert.equal(task, null);
  });

  it('supprime aussi les tâches quand un projet est supprimé', () => {
    const deleted = resolvers.Mutation.deleteProject(null, { id: 'project-1' });
    const remainingTasks = resolvers.Query.tasks(null, { projectId: 'project-1' });

    assert.equal(deleted, true);
    assert.deepEqual(remainingTasks, []);
  });
});
