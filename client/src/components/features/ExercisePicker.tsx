import { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useExercises, useCreateExercise } from '../../api/exercises';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '@workout-app/shared';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';

interface ExercisePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ isOpen, onClose, onSelect }: ExercisePickerProps) {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [showCustom, setShowCustom] = useState(false);
  const { data: exercises, isLoading } = useExercises();

  const filtered = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter((e) => {
      const matchesSearch = search === '' || e.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = muscleGroup === 'all' || e.muscleGroup === muscleGroup;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, search, muscleGroup]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
    setSearch('');
    setMuscleGroup('all');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Exercise" size="lg">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
            autoFocus
          />
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="btn-ghost px-4 py-2.5"
          >
            + New
          </button>
        </div>

        {showCustom && <CreateExerciseForm onCreated={handleSelect} onCancel={() => setShowCustom(false)} />}

        <div className="flex gap-1 flex-wrap">
          <FilterButton active={muscleGroup === 'all'} onClick={() => setMuscleGroup('all')}>
            All
          </FilterButton>
          {MUSCLE_GROUPS.map((mg) => (
            <FilterButton key={mg} active={muscleGroup === mg} onClick={() => setMuscleGroup(mg)}>
              {mg}
            </FilterButton>
          ))}
        </div>

        <div className="max-h-[50vh] overflow-y-auto -mx-2">
          {isLoading ? (
            <div className="py-8">
              <LoadingSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No exercises found</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((exercise) => (
                <li key={exercise.id}>
                  <button
                    onClick={() => handleSelect(exercise)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-display text-base uppercase tracking-wide leading-tight text-gray-900 dark:text-white">{exercise.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {exercise.muscleGroup}
                          {exercise.equipment && ` · ${exercise.equipment}`}
                        </p>
                      </div>
                      {exercise.isCustom && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">
                          custom
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider transition-colors ${
        active
          ? 'bg-blue-500 text-on-accent'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

function CreateExerciseForm({
  onCreated,
  onCancel,
}: {
  onCreated: (ex: Exercise) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
  const createMutation = useCreateExercise();
  const { showToast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const exercise = await createMutation.mutateAsync({ name: name.trim(), muscleGroup });
      onCreated(exercise);
    } catch {
      showToast('Failed to create exercise', 'error');
    }
  };

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Exercise name"
        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      />
      <select
        value={muscleGroup}
        onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm capitalize focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      >
        {MUSCLE_GROUPS.map((mg) => (
          <option key={mg} value={mg}>
            {mg}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={createMutation.isPending || !name.trim()}
          className="btn-primary flex-1 px-3 py-2"
        >
          Create
        </button>
        <button
          onClick={onCancel}
          className="btn-ghost px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
