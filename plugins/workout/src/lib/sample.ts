/**
 * Placeholder content for the first release: a fixed sample week shown on the home screen while
 * the real workout logging is built (see docs/plugins/ideas/workout.md). Names are catalog keys
 * (`sample.workouts.<key>`, `sample.exercises.<key>`); nothing here is stored.
 */

export type SampleSet = { exercise: string; sets: number; reps: number; weightKg: number };
export type SampleWorkout = { key: string; day: number; exercises: SampleSet[] };

/** `day` is 1 = Monday ... 7 = Sunday; `weightKg` 0 means body weight. */
export const SAMPLE_WEEK: SampleWorkout[] = [
  {
    key: 'push',
    day: 1,
    exercises: [
      { exercise: 'bench', sets: 4, reps: 8, weightKg: 60 },
      { exercise: 'overhead', sets: 3, reps: 10, weightKg: 35 },
    ],
  },
  {
    key: 'pull',
    day: 3,
    exercises: [
      { exercise: 'pullUps', sets: 3, reps: 8, weightKg: 0 },
      { exercise: 'row', sets: 4, reps: 10, weightKg: 50 },
    ],
  },
  {
    key: 'legs',
    day: 5,
    exercises: [
      { exercise: 'squat', sets: 5, reps: 5, weightKg: 80 },
      { exercise: 'deadlift', sets: 3, reps: 5, weightKg: 100 },
    ],
  },
];

/** Total kilograms moved in a workout (sets × reps × weight; body-weight sets count as 0). */
export function workoutVolume(workout: SampleWorkout): number {
  return workout.exercises.reduce((sum, e) => sum + e.sets * e.reps * e.weightKg, 0);
}
