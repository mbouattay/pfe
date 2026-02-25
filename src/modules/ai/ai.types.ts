export interface AiSprintTaskDto {
  titre: string;
  storyPoints: number;
  priorite: number;
}

export interface AiSprintDto {
  nom: string;
  goal: string;
  duration: number;
  tasks: AiSprintTaskDto[];
}

export interface AiGenerateSprintsResponse {
  sprints: AiSprintDto[];
}
