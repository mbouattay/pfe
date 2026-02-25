import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../../prisma/prisma.service';
import { SprintStatus, TaskStatus, Sprint, SprintTask } from '@prisma/client';
import { extractTextFromPdf } from '../../common/utils/pdf.util';
import { cleanJsonString } from '../../common/utils/json.util';
import type {
  AiGenerateSprintsResponse,
  AiSprintDto,
  AiSprintTaskDto,
} from './ai.types';

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const SPRINT_DURATION_DAYS = 14;
const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13];

const SYSTEM_PROMPT = `You are a senior Scrum Master. Based on the provided "cahier des charges" (requirements document), generate a structured Scrum plan.

Rules:
- Team: 4 developers
- Sprint length: 14 days
- Maximum 40 story points per sprint
- Use Fibonacci story points only: ${FIBONACCI_POINTS.join(', ')}
- Tasks must be atomic (one clear deliverable per task)
- Return STRICT JSON only, no markdown or explanation.

JSON format (use exactly these keys):
{
  "sprints": [
    {
      "nom": "Sprint 1 - ...",
      "goal": "...",
      "duration": 14,
      "tasks": [
        {
          "titre": "...",
          "storyPoints": 5,
          "priorite": 3
        }
      ]
    }
  ]
}

- "nom": sprint name (e.g. "Sprint 1 - Foundation")
- "goal": sprint goal (short sentence)
- "duration": always 14
- "tasks": array of tasks
- "titre": task title
- "storyPoints": one of ${FIBONACCI_POINTS.join(', ')}
- "priorite": priority number (1 = highest)`;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

@Injectable()
export class AiService {
  private readonly genAI: GoogleGenAI | null = null;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenAI({ apiKey });
    }
  }

  async generateSprintsFromPdf(
    fileBuffer: Buffer,
    projectId: number,
  ): Promise<{
    created: number;
    sprintIds: number[];
    sprints: (Sprint & { sprintTasks: SprintTask[] })[];
  }> {
    if (!this.genAI) {
      throw new BadRequestException(
        'Gemini API key is not configured. Set GEMINI_API_KEY or GOOGLE_API_KEY in your environment.',
      );
    }

    const webProject = await this.prisma.webProject.findUnique({
      where: { projectId },
      include: { project: true },
    });

    if (!webProject) {
      throw new NotFoundException(
        `WebProject for projectId ${projectId} not found`,
      );
    }

    const project = webProject.project;
    const dateDebutProject = project.dateDebut;

    let text: string;
    try {
      text = await extractTextFromPdf(fileBuffer);
    } catch (err) {
      throw new BadRequestException(
        'Failed to extract text from PDF. Ensure the file is a valid PDF.',
      );
    }

    if (!text || text.trim().length < 50) {
      throw new BadRequestException(
        'PDF contains too little text. Ensure the document has readable content.',
      );
    }

    const userPrompt = `Cahier des charges:\n\n${text.slice(0, 120000)}`;
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

    let response;
    try {
      response = await this.genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents: fullPrompt,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'AI request failed';
      throw new BadRequestException(`AI generation failed: ${message}`);
    }

    const rawText = response.text;

    if (!rawText?.trim()) {
      throw new BadRequestException(
        'AI returned no text. Please try again or use a different document.',
      );
    }

    const jsonStr = cleanJsonString(rawText);
    let parsed: AiGenerateSprintsResponse;
    try {
      parsed = JSON.parse(jsonStr) as AiGenerateSprintsResponse;
    } catch {
      throw new BadRequestException(
        'AI response was not valid JSON. Please try again.',
      );
    }

    if (!parsed.sprints || !Array.isArray(parsed.sprints)) {
      throw new BadRequestException(
        'AI response must contain a "sprints" array.',
      );
    }

    const sprintIds: number[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < parsed.sprints.length; i++) {
        const s: AiSprintDto = parsed.sprints[i];
        const dateDebut = addDays(dateDebutProject, i * SPRINT_DURATION_DAYS);
        const dateFin = addDays(
          dateDebutProject,
          (i + 1) * SPRINT_DURATION_DAYS,
        );

        const totalStoryPoints = (s.tasks ?? []).reduce(
          (sum, t) => sum + (Number(t.storyPoints) || 0),
          0,
        );

        const sprint = await tx.sprint.create({
          data: {
            nom: s.nom ?? `Sprint ${i + 1}`,
            goal: s.goal ?? null,
            status: SprintStatus.PLANIFIE,
            dateDebut,
            dateFin,
            totalStoryPoints,
            webProjectId: webProject.id,
          },
        });

        sprintIds.push(sprint.id);

        const tasks: AiSprintTaskDto[] = Array.isArray(s.tasks) ? s.tasks : [];
        for (const t of tasks) {
          await tx.sprintTask.create({
            data: {
              titre: t.titre ?? 'Sans titre',
              status: TaskStatus.A_FAIRE,
              priority: Math.max(1, Math.min(5, Number(t.priorite) || 1)),
              dateDebut,
              storyPoints: Math.max(0, Number(t.storyPoints) || 0),
              sprintId: sprint.id,
            },
          });
        }
      }
    });

    const sprintsWithTasks = await this.prisma.sprint.findMany({
      where: { id: { in: sprintIds } },
      include: { sprintTasks: true },
    });

    return { created: sprintIds.length, sprintIds, sprints: sprintsWithTasks };
  }
}
