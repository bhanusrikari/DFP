// Static caregiver directory for the demo. Swap for a real Caregiver table +
// scheduling system later — caregiver-matching.service.ts is the only file
// that would need to change.
export interface Caregiver {
  id: string;
  name: string;
  skills: string[];
  availableDurationDays: number;
  currentAssignment: string | null; // null = available now
}

export const CAREGIVERS: Caregiver[] = [
  {
    id: "cg-1",
    name: "Anita",
    skills: ["Medication assistance", "Mobility assistance", "Elderly care", "Home monitoring"],
    availableDurationDays: 10,
    currentAssignment: null,
  },
  {
    id: "cg-2",
    name: "Ramesh",
    skills: ["Medication assistance", "Home monitoring"],
    availableDurationDays: 7,
    currentAssignment: null,
  },
  {
    id: "cg-3",
    name: "Priya",
    skills: ["Post-surgery support", "Mobility assistance", "Medication assistance"],
    availableDurationDays: 14,
    currentAssignment: null,
  },
  {
    id: "cg-4",
    name: "Suresh",
    skills: ["Elderly care", "Medication assistance", "Mobility assistance", "Post-surgery support", "Home monitoring"],
    availableDurationDays: 5,
    currentAssignment: "Currently assigned to another patient",
  },
];
