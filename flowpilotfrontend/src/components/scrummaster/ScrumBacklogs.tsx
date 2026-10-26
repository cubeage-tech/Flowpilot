import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Layers,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Search,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  fetchProjects,
  fetchSprints,
  fetchBacklog,
  fetchBoard,
  createTask,
  deleteTask,
  startSprint,
  createSprint,
  addToSprint,
  removeFromSprint,
  fetchRequirementDocs,
  createRequirementDoc,
  updateRequirementDoc,
  deleteRequirementDoc,
  type Card,
  type Project,
  type Sprint,
  type Member,
  type Priority,
  type RequirementDoc,
} from './scrumApi';

const DOC_TYPES = [
  'PRD (Product Requirements)',
  'BRD (Business Requirements)',
  'Technical Architecture',
  'API Specification',
  'User Stories & Personas',
];

const DOC_STATUSES = ['Draft', 'In Review', 'Approved'];

const PRIORITIES: Priority[] = ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'];

export const ScrumBacklogs: React.FC = () => {
  // Navigation View
  const [activeTab, setActiveTab] = useState<'stories' | 'docs'>('stories');

  // Core Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [backlogCards, setBacklogCards] = useState<Card[]>([]);
  const [sprintCards, setSprintCards] = useState<Record<number, Card[]>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [docs, setDocs] = useState<RequirementDoc[]>([]);

  // Loading & Alerts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [targetSprintId, setTargetSprintId] = useState<number | ''>('');
  const [storyForm, setStoryForm] = useState({
    title: '',
    description: '',
    acceptanceCriteria: '',
    storyPoints: '3',
    priority: 'MEDIUM' as Priority,
    assigneeId: '',
    dueDate: '',
  });
  const [memberAssigneeSearch, setMemberAssigneeSearch] = useState('');

  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintForm, setSprintForm] = useState({
    name: '',
    goal: '',
    durationDays: '14',
    capacityPoints: '30',
  });

  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    docType: 'PRD (Product Requirements)',
    version: 'v1.0',
    status: 'Draft',
    content: '',
    fileUrl: '',
  });

  // Load All Core Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [projList, sprintList, backlogList] = await Promise.all([
        fetchProjects().catch(() => []),
        fetchSprints(selectedProjectId === '' ? undefined : selectedProjectId).catch(() => []),
        fetchBacklog().catch(() => []),
      ]);

      setProjects(projList);
      setSprints(sprintList);
      setBacklogCards(backlogList);

      // Fetch cards for each sprint
      const sprintMap: Record<number, Card[]> = {};
      await Promise.all(
        sprintList.map(async (s) => {
          try {
            const board = await fetchBoard({ sprintId: s.id });
            const cardsInSprint: Card[] = [];
            board.columns.forEach((col) => cardsInSprint.push(...col.cards));
            sprintMap[s.id] = cardsInSprint;
            if (board.members && board.members.length > 0) {
              setMembers((prev) => {
                const combined = [...prev, ...board.members];
                return Array.from(new Map(combined.map((m) => [m.id, m])).values());
              });
            }
          } catch {
            sprintMap[s.id] = [];
          }
        })
      );
      setSprintCards(sprintMap);

      // Fetch Requirement Docs
      try {
        const docList = await fetchRequirementDocs(
          selectedProjectId === '' ? undefined : selectedProjectId
        );
        setDocs(docList);
      } catch {
        setDocs([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load backlog information');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Notice helper
  const notify = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  // Filtered Backlog Cards
  const filteredBacklog = useMemo(() => {
    return backlogCards.filter((card) => {
      const matchSearch =
        search === '' ||
        card.title.toLowerCase().includes(search.toLowerCase()) ||
        card.taskKey.toLowerCase().includes(search.toLowerCase()) ||
        (card.description && card.description.toLowerCase().includes(search.toLowerCase()));

      const matchPriority = priorityFilter === 'ALL' || card.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [backlogCards, search, priorityFilter]);

  // Create User Story / Task
  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyForm.title.trim()) {
      alert('Story title is required');
      return;
    }

    setBusyAction('create_story');
    setError('');

    try {
      const fullDesc = storyForm.acceptanceCriteria.trim()
        ? `${storyForm.description.trim()}\n\nAcceptance Criteria:\n${storyForm.acceptanceCriteria.trim()}`
        : storyForm.description.trim();

      const created = await createTask({
        title: storyForm.title.trim(),
        description: fullDesc || null,
        priority: storyForm.priority,
        status: 'TODO',
        storyPoints: storyForm.storyPoints ? Number(storyForm.storyPoints) : undefined,
        assigneeId: storyForm.assigneeId ? Number(storyForm.assigneeId) : null,
        dueDate: storyForm.dueDate ? storyForm.dueDate : null,
        sprintId: targetSprintId !== '' ? Number(targetSprintId) : null,
      });

      if (targetSprintId !== '') {
        notify(`User story ${created.taskKey} added to Sprint and ready for the board!`);
      } else {
        notify(`User story ${created.taskKey} added to Product Backlog.`);
      }

      setShowStoryModal(false);
      setStoryForm({
        title: '',
        description: '',
        acceptanceCriteria: '',
        storyPoints: '3',
        priority: 'MEDIUM',
        assigneeId: '',
        dueDate: '',
      });
      setTargetSprintId('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create user story');
    } finally {
      setBusyAction(null);
    }
  };

  // Assign Backlog Item to a Sprint
  const handleAssignToSprint = async (taskId: number, sprintId: number) => {
    setBusyAction(`assign_${taskId}`);
    try {
      await addToSprint(sprintId, [taskId]);
      notify(`Task moved into Sprint! It will appear on the Scrum Board.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign task to sprint');
    } finally {
      setBusyAction(null);
    }
  };

  // Move task back to Product Backlog
  const handleMoveToBacklog = async (taskId: number, sprintId: number) => {
    setBusyAction(`unassign_${taskId}`);
    try {
      await removeFromSprint(sprintId, [taskId]);
      notify(`Task moved back to Product Backlog.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to move task to backlog');
    } finally {
      setBusyAction(null);
    }
  };

  // Start Sprint (Transitions PLANNED -> ACTIVE so it goes directly to board!)
  const handleStartSprint = async (sprint: Sprint) => {
    setBusyAction(`start_${sprint.id}`);
    try {
      await startSprint(sprint.id);
      notify(`Sprint ${sprint.name} is now ACTIVE! All its tasks are live on the Scrum Board.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to start sprint');
    } finally {
      setBusyAction(null);
    }
  };

  // Create Sprint
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintForm.name.trim()) {
      alert('Sprint name is required');
      return;
    }

    setBusyAction('create_sprint');
    try {
      const today = new Date();
      const startIso = today.toISOString().slice(0, 10);
      const days = Number(sprintForm.durationDays) || 14;
      const end = new Date(today.getTime() + days * 86400000);
      const endIso = end.toISOString().slice(0, 10);

      const created = await createSprint({
        name: sprintForm.name.trim(),
        goal: sprintForm.goal.trim() || null,
        startDate: startIso,
        endDate: endIso,
        durationDays: days,
        capacityPoints: Number(sprintForm.capacityPoints) || 30,
        projectId: selectedProjectId === '' ? null : Number(selectedProjectId),
      });

      notify(`Sprint "${created.name}" created! Now add & assign tasks to it, then click Start Sprint.`);
      setShowSprintModal(false);
      setSprintForm({
        name: '',
        goal: '',
        durationDays: '14',
        capacityPoints: '30',
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create sprint');
    } finally {
      setBusyAction(null);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this backlog story?')) return;
    try {
      await deleteTask(taskId);
      notify('Story removed.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete task');
    }
  };

  // Requirement Docs Handlers
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title.trim()) {
      alert('Title is required');
      return;
    }

    setBusyAction('save_doc');
    try {
      if (editingDocId) {
        await updateRequirementDoc(editingDocId, {
          title: docForm.title.trim(),
          docType: docForm.docType,
          version: docForm.version,
          status: docForm.status,
          content: docForm.content,
          fileUrl: docForm.fileUrl,
          projectId: selectedProjectId === '' ? null : Number(selectedProjectId),
        });
        notify('Document updated successfully.');
      } else {
        await createRequirementDoc({
          title: docForm.title.trim(),
          docType: docForm.docType,
          version: docForm.version,
          status: docForm.status,
          content: docForm.content,
          fileUrl: docForm.fileUrl,
          projectId: selectedProjectId === '' ? null : Number(selectedProjectId),
          createdBy: 'Scrum Master',
        });
        notify('New Requirements Document created!');
      }

      setShowDocModal(false);
      setEditingDocId(null);
      setDocForm({
        title: '',
        docType: 'PRD (Product Requirements)',
        version: 'v1.0',
        status: 'Draft',
        content: '',
        fileUrl: '',
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to save document');
    } finally {
      setBusyAction(null);
    }
  };

  const handleEditDoc = (doc: RequirementDoc) => {
    setEditingDocId(doc.id);
    setDocForm({
      title: doc.title,
      docType: doc.docType || 'PRD (Product Requirements)',
      version: doc.version || 'v1.0',
      status: doc.status || 'Draft',
      content: doc.content || '',
      fileUrl: doc.fileUrl || '',
    });
    setShowDocModal(true);
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!window.confirm('Delete this requirements document?')) return;
    try {
      await deleteRequirementDoc(docId);
      notify('Document deleted.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="text-emerald-600" size={24} />
            Backlogs & Requirements
          </h2>
          <p className="text-xs text-slate-500">
            Define requirements, user stories, groom sprint backlogs, and start sprints onto the Scrum Board.
          </p>
        </div>

        {loading && (
          <span className="text-xs text-slate-400 animate-pulse">Syncing backlog data...</span>
        )}
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-rose-400 hover:text-rose-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* SPRINT WORKFLOW GUIDANCE BANNER */}
      <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-700">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                Scrum Master Sprint Flow
              </h3>
              <p className="text-[11px] text-emerald-800 font-medium">
                1. <strong>Add Sprint</strong> ➔ 2. <strong>Add & Assign Tasks</strong> ➔ 3. <strong>Start Sprint</strong> (Commitment frozen) ➔ <strong>Appears directly on Scrum Board!</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetSprintId('');
                setShowStoryModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition"
            >
              <Plus size={14} />
              + Add User Story
            </button>
            <button
              type="button"
              onClick={() => setShowSprintModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
            >
              <Plus size={14} />
              + New Sprint
            </button>
          </div>
        </div>
      </div>

      {/* TOP CONTROLS & PROJECT SELECTOR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value === '' ? '' : Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code || 'PRJ'} • {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Switcher: User Stories vs Requirements Docs */}
        <div className="flex items-center gap-2 border-slate-200 sm:border-l sm:pl-3">
          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'stories'
                ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers size={14} />
            <span>User Stories & Backlog</span>
            <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[10px] text-slate-700">
              {backlogCards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'docs'
                ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText size={14} />
            <span>Requirements Documents</span>
            <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[10px] text-slate-700">
              {docs.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================
          VIEW 1: USER STORIES & SPRINT BACKLOGS (CATEGORIZED)
      ======================================================== */}
      {activeTab === 'stories' && (
        <div className="space-y-5">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stories, acceptance criteria, keys..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SPRINT SECTIONS (CATEGORIZED BACKLOG AS PER SPRINT) */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>Sprints Backlog ({sprints.length})</span>
              <span className="text-[11px] font-normal text-slate-400">
                — Start a sprint to run its tasks directly on the Scrum Board
              </span>
            </h3>

            {sprints.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="text-xs text-slate-500">No sprints created yet for this scope.</p>
                <button
                  type="button"
                  onClick={() => setShowSprintModal(true)}
                  className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Plus size={13} /> Create First Sprint
                </button>
              </div>
            ) : (
              sprints.map((sprint) => {
                const tasksInSprint = sprintCards[sprint.id] || [];
                const totalPts = tasksInSprint.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
                const isRunning = sprint.status === 'ACTIVE';

                return (
                  <div
                    key={sprint.id}
                    className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
                  >
                    {/* SPRINT HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-3.5">
                      <div className="flex items-start sm:items-center gap-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${
                            isRunning
                              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30'
                              : 'bg-slate-200/70 text-slate-600 border border-slate-300/40'
                          }`}
                        >
                          {isRunning ? '● RUNNING ON BOARD' : 'PLANNED'}
                        </span>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            {sprint.name}
                            {sprint.goal && (
                              <span className="font-normal text-xs text-slate-500">
                                — {sprint.goal}
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {sprint.startDate || 'No start'} → {sprint.endDate || 'No end'}
                            </span>
                            <span>•</span>
                            <span>{tasksInSprint.length} tasks</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">{totalPts} story pts</span>
                          </div>
                        </div>
                      </div>

                      {/* SPRINT ACTIONS */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetSprintId(sprint.id);
                            setShowStoryModal(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Plus size={13} />
                          Add Task
                        </button>

                        {/* START SPRINT BUTTON (ENFORCES: Create Sprint -> Add/Assign Task -> Start Sprint!) */}
                        {sprint.status === 'PLANNED' && (
                          <button
                            type="button"
                            disabled={busyAction === `start_${sprint.id}`}
                            onClick={() => handleStartSprint(sprint)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                          >
                            <Play size={12} />
                            {busyAction === `start_${sprint.id}` ? 'Starting…' : 'Start Sprint'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SPRINT TASKS LIST */}
                    <div className="divide-y divide-slate-100">
                      {tasksInSprint.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Sprint is empty. Add tasks or pull stories from the Product Backlog below.
                        </div>
                      ) : (
                        tasksInSprint.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between gap-3 p-3 transition hover:bg-slate-50/50"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="shrink-0 text-xs font-bold text-slate-500">
                                {task.taskKey}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                  <span className="rounded bg-slate-100 px-1.5 py-0.2 font-semibold text-slate-700">
                                    {task.status}
                                  </span>
                                  <span>•</span>
                                  <span>{task.storyPoints ?? 0} pts</span>
                                  {task.dueDate && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-amber-700">
                                        <Clock size={11} /> Due {task.dueDate}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {task.assigneeName ? (
                                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 rounded px-2 py-0.5">
                                  👤 {task.assigneeName}
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-slate-400 italic">
                                  Unassigned
                                </span>
                              )}

                              <button
                                type="button"
                                title="Move back to Product Backlog"
                                onClick={() => handleMoveToBacklog(task.id, sprint.id)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-xs"
                              >
                                Move to Backlog
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ========================================================
              PRODUCT BACKLOG (UNASSIGNED USER STORIES)
          ======================================================== */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <span>Product Backlog ({filteredBacklog.length} items)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  User stories and requirements waiting to be planned into a sprint.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTargetSprintId('');
                  setShowStoryModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 shadow-sm"
              >
                <Plus size={14} />
                + Add User Story
              </button>
            </div>

            {filteredBacklog.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                No unassigned user stories in product backlog. All work is planned into sprints!
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                {filteredBacklog.map((story) => (
                  <div
                    key={story.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-slate-50/50 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-0.5 rounded bg-amber-50 px-2 py-0.5 text-xs font-extrabold text-amber-800 border border-amber-200">
                        {story.taskKey}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{story.title}</h5>
                        {story.description && (
                          <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                            {story.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span
                            className={`rounded px-1.5 py-0.2 font-bold ${
                              story.priority === 'HIGHEST'
                                ? 'bg-red-50 text-red-600'
                                : story.priority === 'HIGH'
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {story.priority}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">{story.storyPoints ?? 0} pts</span>
                          {story.dueDate && (
                            <>
                              <span>•</span>
                              <span>Due {story.dueDate}</span>
                            </>
                          )}
                          {story.assigneeName && (
                            <>
                              <span>•</span>
                              <span>Assigned to {story.assigneeName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ASSIGN TO SPRINT SELECTOR */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            void handleAssignToSprint(story.id, Number(e.target.value));
                          }
                        }}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 outline-none hover:bg-white focus:border-emerald-500"
                      >
                        <option value="" disabled>Move to Sprint…</option>
                        {sprints.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.status})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(story.id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600"
                        title="Delete story"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 2: REQUIREMENTS DOCUMENTS (PRDs, BRDs, SPECS)
      ======================================================== */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Project Requirements & Specifications
              </h3>
              <p className="text-[11px] text-slate-500">
                PRDs, architecture diagrams, user personas, and acceptance criteria documents.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingDocId(null);
                setDocForm({
                  title: '',
                  docType: 'PRD (Product Requirements)',
                  version: 'v1.0',
                  status: 'Draft',
                  content: '',
                  fileUrl: '',
                });
                setShowDocModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
            >
              <Plus size={14} />
              + Add Requirement Doc
            </button>
          </div>

          {docs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <FileText size={32} className="mx-auto text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Requirements Documents Added</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Store product requirement documents, architecture outlines, and specifications for your sprints.
              </p>
              <button
                type="button"
                onClick={() => setShowDocModal(true)}
                className="mt-4 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                + Create Requirement Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-teal-800 border border-teal-200">
                        {doc.docType || 'PRD'}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          doc.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : doc.status === 'In Review'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {doc.status || 'Draft'}
                      </span>
                    </div>

                    <h4 className="mt-2.5 text-sm font-bold text-slate-900">{doc.title}</h4>
                    <p className="mt-0.5 text-[10px] text-slate-400 font-medium">
                      Version: {doc.version || 'v1.0'} • Project: {doc.projectName || 'General'}
                    </p>

                    {doc.content && (
                      <p className="mt-2 text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2 rounded-md">
                        {doc.content}
                      </p>
                    )}

                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                      >
                        <ExternalLink size={12} /> View Attached Spec / URL
                      </a>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                    <span>By {doc.createdBy || 'Scrum Master'}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditDoc(doc)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit doc"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete doc"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL: ADD USER STORY / TASK (DUE DATE OPTIONAL!)
      ======================================================== */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {targetSprintId ? 'Add Task to Sprint' : 'Create User Story'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Stories added to a sprint will appear on the Scrum Board when started.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStoryModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="mt-4 space-y-3">
              {/* Target Sprint Selector */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">Assign To Sprint / Backlog</label>
                <select
                  value={targetSprintId}
                  onChange={(e) => setTargetSprintId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                >
                  <option value="">Product Backlog (Unassigned)</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status === 'ACTIVE' ? 'Live on Board' : 'Planned Sprint'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">Story Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. As a customer, I want to filter products by category..."
                  value={storyForm.title}
                  onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">Description / User Narrative</label>
                <textarea
                  rows={2}
                  placeholder="Details, user motivations, scope..."
                  value={storyForm.description}
                  onChange={(e) => setStoryForm({ ...storyForm, description: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Acceptance Criteria */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">Acceptance Criteria</label>
                <textarea
                  rows={2}
                  placeholder="Given... When... Then..."
                  value={storyForm.acceptanceCriteria}
                  onChange={(e) => setStoryForm({ ...storyForm, acceptanceCriteria: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Story Points */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Story Points</label>
                  <input
                    type="number"
                    min="1"
                    value={storyForm.storyPoints}
                    onChange={(e) => setStoryForm({ ...storyForm, storyPoints: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Priority</label>
                  <select
                    value={storyForm.priority}
                    onChange={(e) => setStoryForm({ ...storyForm, priority: e.target.value as Priority })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600">Assign To Team Member</label>
                    <input
                      type="text"
                      placeholder="Search member..."
                      value={memberAssigneeSearch}
                      onChange={(e) => setMemberAssigneeSearch(e.target.value)}
                      className="text-[11px] px-2 py-0.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 w-32"
                    />
                  </div>
                  <select
                    value={storyForm.assigneeId}
                    onChange={(e) => setStoryForm({ ...storyForm, assigneeId: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {members
                      .filter((m) => {
                        if (!memberAssigneeSearch.trim()) return true;
                        const q = memberAssigneeSearch.toLowerCase();
                        return (
                          (m.name && m.name.toLowerCase().includes(q)) ||
                          (m.email && m.email.toLowerCase().includes(q)) ||
                          (m.role && m.role.toLowerCase().includes(q))
                        );
                      })
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || m.email} ({m.role || 'Member'})
                        </option>
                      ))}
                  </select>
                </div>

                {/* DUE DATE - EXPLICITLY OPTIONAL! */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600 flex items-center justify-between">
                    <span>Due Date</span>
                    <span className="text-[10px] text-slate-400 font-normal italic">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={storyForm.dueDate}
                    onChange={(e) => setStoryForm({ ...storyForm, dueDate: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowStoryModal(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyAction === 'create_story'}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busyAction === 'create_story' ? 'Saving…' : 'Save Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD SPRINT (FIRST STEP OF FLOW)
      ======================================================== */}
      {showSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Add New Sprint</h3>
                <p className="text-[11px] text-slate-500">
                  Step 1: Create a sprint, then add & assign tasks before starting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSprintModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSprint} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">Sprint Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 14 - Checkout & Cart Flow"
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">Sprint Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Deliver payment integration and responsive checkout"
                  value={sprintForm.goal}
                  onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={sprintForm.durationDays}
                    onChange={(e) => setSprintForm({ ...sprintForm, durationDays: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Capacity Points</label>
                  <input
                    type="number"
                    min="1"
                    value={sprintForm.capacityPoints}
                    onChange={(e) => setSprintForm({ ...sprintForm, capacityPoints: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSprintModal(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyAction === 'create_sprint'}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busyAction === 'create_sprint' ? 'Creating…' : 'Create Sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT REQUIREMENTS DOCUMENT
      ======================================================== */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editingDocId ? 'Edit Requirements Document' : 'New Requirements Document'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Define PRDs, technical specs, and acceptance criteria for projects.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. User Authentication & JWT Flow Specification"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Doc Type</label>
                  <select
                    value={docForm.docType}
                    onChange={(e) => setDocForm({ ...docForm, docType: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Version</label>
                  <input
                    type="text"
                    placeholder="v1.0"
                    value={docForm.version}
                    onChange={(e) => setDocForm({ ...docForm, version: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">Status</label>
                  <select
                    value={docForm.status}
                    onChange={(e) => setDocForm({ ...docForm, status: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  >
                    {DOC_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Requirements Details & Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Outline feature specifications, business rules, acceptance criteria..."
                  value={docForm.content}
                  onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  External Specification Link / Attachment URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/document/d/... or Figma URL"
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyAction === 'save_doc'}
                  className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busyAction === 'save_doc' ? 'Saving…' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrumBacklogs;
