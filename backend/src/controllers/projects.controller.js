const odooClient = require('../services/odooClient');

/**
 * GET /api/projects
 */
async function getProjects(req, res) {
  try {
    const projects = await odooClient.execute(
      'project.project',
      'search_read',
      [[]],
      { fields: ['id', 'name', 'task_count', 'user_id', 'partner_id', 'date_start', 'date'], order: 'name asc' },
      req.odooSession
    );
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Erreur getProjects:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer les projets', error: error.message });
  }
}

/**
 * POST /api/projects
 * Body : { name, partnerId, userId, dateStart, dateEnd }
 * Seul le nom est obligatoire, exactement comme sur Odoo.
 */
async function createProject(req, res) {
  try {
    const { name, partnerId, userId, dateStart, dateEnd } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Le nom du projet est obligatoire' });
    }

    const projectData = { name };
    if (partnerId) projectData.partner_id = Number(partnerId);
    if (userId) projectData.user_id = Number(userId);
    if (dateStart) projectData.date_start = dateStart;
    if (dateEnd) projectData.date = dateEnd;

    const newId = await odooClient.execute('project.project', 'create', [projectData], {}, req.odooSession);
    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createProject:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de créer le projet', error: error.message });
  }
}

/**
 * PUT /api/projects/:id
 */
async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { name, partnerId, userId, dateStart, dateEnd } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Le nom du projet est obligatoire' });
    }

    const updateData = {
      name,
      partner_id: partnerId ? Number(partnerId) : false,
      user_id: userId ? Number(userId) : false,
      date_start: dateStart || false,
      date: dateEnd || false,
    };

    await odooClient.execute('project.project', 'write', [[Number(id)], updateData], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateProject:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de modifier le projet', error: error.message });
  }
}

/**
 * DELETE /api/projects/:id
 */
async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    await odooClient.execute('project.project', 'unlink', [[Number(id)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteProject:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de supprimer le projet', error: error.message });
  }
}

/**
 * GET /api/projects/:id/board
 * Renvoie les étapes (colonnes) du projet, chacune avec ses tâches.
 */
async function getProjectBoard(req, res) {
  try {
    const { id } = req.params;
    const session = req.odooSession;
    const projectId = Number(id);

    const projects = await odooClient.execute(
      'project.project',
      'read',
      [[projectId]],
      { fields: ['name'] },
      session
    );
    if (projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Projet introuvable' });
    }

    const stages = await odooClient.execute(
      'project.task.type',
      'search_read',
      [[['project_ids', 'in', [projectId]]]],
      { fields: ['id', 'name', 'sequence', 'fold'], order: 'sequence asc' },
      session
    );

    const tasks = await odooClient.execute(
      'project.task',
      'search_read',
      [[['project_id', '=', projectId]]],
      { fields: ['id', 'name', 'stage_id', 'user_id', 'priority', 'date_deadline'], order: 'sequence asc' },
      session
    );

    const stagesWithTasks = stages.map((stage) => ({
      ...stage,
      tasks: tasks.filter((t) => t.stage_id && t.stage_id[0] === stage.id),
    }));

    res.json({ success: true, data: { project: projects[0], stages: stagesWithTasks } });
  } catch (error) {
    console.error('Erreur getProjectBoard:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer le tableau du projet', error: error.message });
  }
}

/**
 * POST /api/projects/:id/stages
 * Body : { name }
 */
async function createStage(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Le nom de l'étape est obligatoire" });
    }

    const newId = await odooClient.execute(
      'project.task.type',
      'create',
      [{ name, project_ids: [[4, Number(id)]] }],
      {},
      req.odooSession
    );

    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createStage:', error.message);
    res.status(500).json({ success: false, message: "Impossible de créer l'étape", error: error.message });
  }
}

/**
 * PUT /api/projects/stages/:stageId
 * Body : { name }
 */
async function updateStage(req, res) {
  try {
    const { stageId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Le nom de l'étape est obligatoire" });
    }

    await odooClient.execute('project.task.type', 'write', [[Number(stageId)], { name }], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateStage:', error.message);
    res.status(500).json({ success: false, message: "Impossible de modifier l'étape", error: error.message });
  }
}

/**
 * DELETE /api/projects/stages/:stageId
 */
async function deleteStage(req, res) {
  try {
    const { stageId } = req.params;
    await odooClient.execute('project.task.type', 'unlink', [[Number(stageId)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteStage:', error.message);
    res.status(500).json({
      success: false,
      message: "Impossible de supprimer l'étape (déplace ou supprime d'abord ses tâches)",
      error: error.message,
    });
  }
}

/**
 * POST /api/projects/stages/:stageId/fold
 * Body : { fold: true|false }
 */
async function toggleFoldStage(req, res) {
  try {
    const { stageId } = req.params;
    const { fold } = req.body;
    await odooClient.execute('project.task.type', 'write', [[Number(stageId)], { fold: Boolean(fold) }], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur toggleFoldStage:', error.message);
    res.status(500).json({ success: false, message: "Impossible de plier/déplier l'étape", error: error.message });
  }
}

/**
 * POST /api/projects/stages/:stageId/archive-tasks
 * Body : { active: true|false }
 * "Tout Archiver" / "Tout Désarchiver" — archive toutes les tâches de cette étape.
 */
async function archiveStageTasks(req, res) {
  try {
    const { stageId } = req.params;
    const { active } = req.body;
    const session = req.odooSession;

    const tasks = await odooClient.execute(
      'project.task',
      'search',
      [[['stage_id', '=', Number(stageId)]]],
      {},
      session
    );

    if (tasks.length > 0) {
      await odooClient.execute('project.task', 'write', [tasks, { active: Boolean(active) }], {}, session);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur archiveStageTasks:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de mettre à jour les tâches', error: error.message });
  }
}

/**
 * POST /api/projects/tasks
 * Body : { name, projectId, stageId, userId }
 */
async function createTask(req, res) {
  try {
    const { name, projectId, stageId, userId } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Le titre de la tâche est obligatoire' });
    if (!projectId) return res.status(400).json({ success: false, message: 'Le projet est obligatoire' });

    const taskData = { name, project_id: Number(projectId) };
    if (stageId) taskData.stage_id = Number(stageId);
    if (userId) taskData.user_id = Number(userId);

    const newId = await odooClient.execute('project.task', 'create', [taskData], {}, req.odooSession);
    res.status(201).json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur createTask:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de créer la tâche', error: error.message });
  }
}

/**
 * GET /api/projects/tasks/:taskId
 */
async function getTaskDetail(req, res) {
  try {
    const { taskId } = req.params;
    const tasks = await odooClient.execute(
      'project.task',
      'read',
      [[Number(taskId)]],
      { fields: ['name', 'description', 'user_id', 'stage_id', 'priority', 'date_deadline', 'project_id'] },
      req.odooSession
    );
    if (tasks.length === 0) return res.status(404).json({ success: false, message: 'Tâche introuvable' });
    res.json({ success: true, data: tasks[0] });
  } catch (error) {
    console.error('Erreur getTaskDetail:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de récupérer la tâche', error: error.message });
  }
}

/**
 * PUT /api/projects/tasks/:taskId
 * Body : { name, description, userId, stageId, dateDeadline, priority }
 */
async function updateTask(req, res) {
  try {
    const { taskId } = req.params;
    const { name, description, userId, stageId, dateDeadline, priority } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Le titre de la tâche est obligatoire' });

    const updateData = {
      name,
      description: description || false,
      user_id: userId ? Number(userId) : false,
      date_deadline: dateDeadline || false,
    };
    if (stageId) updateData.stage_id = Number(stageId);
    if (priority !== undefined) updateData.priority = priority;

    await odooClient.execute('project.task', 'write', [[Number(taskId)], updateData], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur updateTask:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de modifier la tâche', error: error.message });
  }
}

/**
 * DELETE /api/projects/tasks/:taskId
 */
async function deleteTask(req, res) {
  try {
    const { taskId } = req.params;
    await odooClient.execute('project.task', 'unlink', [[Number(taskId)]], {}, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur deleteTask:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de supprimer la tâche', error: error.message });
  }
}

/**
 * POST /api/projects/tasks/:taskId/toggle-priority
 * Bascule l'étoile (priorité) — comme un clic sur l'étoile dans Odoo.
 */
async function toggleTaskPriority(req, res) {
  try {
    const { taskId } = req.params;
    const session = req.odooSession;

    const tasks = await odooClient.execute('project.task', 'read', [[Number(taskId)]], { fields: ['priority'] }, session);
    if (tasks.length === 0) return res.status(404).json({ success: false, message: 'Tâche introuvable' });

    const newPriority = tasks[0].priority === '1' ? '0' : '1';
    await odooClient.execute('project.task', 'write', [[Number(taskId)], { priority: newPriority }], {}, session);

    res.json({ success: true, priority: newPriority });
  } catch (error) {
    console.error('Erreur toggleTaskPriority:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de mettre à jour la priorité', error: error.message });
  }
}

/**
 * POST /api/projects/tasks/:taskId/duplicate
 */
async function duplicateTask(req, res) {
  try {
    const { taskId } = req.params;
    const newId = await odooClient.execute('project.task', 'copy', [[Number(taskId)], {}], {}, req.odooSession);
    res.json({ success: true, id: newId });
  } catch (error) {
    console.error('Erreur duplicateTask:', error.message);
    res.status(500).json({ success: false, message: 'Impossible de dupliquer la tâche', error: error.message });
  }
}

/**
 * GET /api/projects/tasks/:taskId/messages
 * Renvoie l'historique (chatter) d'une tâche : messages + changements
 * suivis (ex: "Étape: Souscription → Validation dossier"), comme sur Odoo.
 */
async function getTaskMessages(req, res) {
  try {
    const { taskId } = req.params;
    const session = req.odooSession;

    const messages = await odooClient.execute(
      'mail.message',
      'search_read',
      [[['res_id', '=', Number(taskId)], ['model', '=', 'project.task']]],
      { fields: ['id', 'author_id', 'body', 'date'], order: 'date desc' },
      session
    );

    const enriched = messages.map((m) => ({
      id: m.id,
      author: m.author_id ? m.author_id[1] : 'Système',
      date: m.date,
      body: (m.body || '').replace(/<[^>]*>/g, '').trim(),
      changes: [], // le détail des champs modifiés n'est pas accessible avec ton compte (droits Odoo)
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Erreur getTaskMessages:', error.message);
    res.status(500).json({ success: false, message: "Impossible de récupérer l'historique", error: error.message });
  }
}

/**
 * POST /api/projects/tasks/:taskId/messages
 * Body : { body }
 */
async function postTaskMessage(req, res) {
  try {
    const { taskId } = req.params;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Le message ne peut pas être vide' });
    }

    await odooClient.execute('project.task', 'message_post', [[Number(taskId)]], { body }, req.odooSession);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur postTaskMessage:', error.message);
    res.status(500).json({ success: false, message: "Impossible d'ajouter le message", error: error.message });
  }
}

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectBoard,
  createStage,
  updateStage,
  deleteStage,
  toggleFoldStage,
  archiveStageTasks,
  createTask,
  getTaskDetail,
  updateTask,
  deleteTask,
  toggleTaskPriority,
  duplicateTask,
  getTaskMessages,
  postTaskMessage,
};