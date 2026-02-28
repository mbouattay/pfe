import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });
const saltRounds = 10;

async function main() {
  console.log('Seeding start');

  const [pwdAdmin, pwdClient1, pwdClient2, pwdEmp1, pwdEmp2, pwdEmp3] = await Promise.all([
    bcrypt.hash('Admin@123', saltRounds),
    bcrypt.hash('Client1@123', saltRounds),
    bcrypt.hash('Client2@123', saltRounds),
    bcrypt.hash('Employer1@123', saltRounds),
    bcrypt.hash('Employer2@123', saltRounds),
    bcrypt.hash('Employer3@123', saltRounds),
  ]);

  const adminUser = await prisma.utilisateur.upsert({
    where: { email: 'admin@duality.local' },
    create: {
      email: 'admin@duality.local',
      password: pwdAdmin,
      role: 'ADMIN',
      avatar: null,
      telephone: '100-000-0000',
      administrateur: { create: {} },
    },
    update: {
      password: pwdAdmin,
      role: 'ADMIN',
      administrateur: { upsert: { create: {}, update: {} } },
    },
  });

  const clientUser1 = await prisma.utilisateur.upsert({
    where: { email: 'client1@acme.co' },
    create: {
      email: 'client1@acme.co',
      password: pwdClient1,
      role: 'CLIENT',
      avatar: null,
      telephone: '200-000-0001',
      client: {
        create: {
          nomSociete: 'Acme Corp',
          localisation: 'Paris',
        },
      },
    },
    update: {
      password: pwdClient1,
      role: 'CLIENT',
      client: {
        upsert: {
          create: { nomSociete: 'Acme Corp', localisation: 'Paris' },
          update: { nomSociete: 'Acme Corp', localisation: 'Paris' },
        },
      },
    },
    include: { client: true },
  });

  const clientUser2 = await prisma.utilisateur.upsert({
    where: { email: 'client2@globex.com' },
    create: {
      email: 'client2@globex.com',
      password: pwdClient2,
      role: 'CLIENT',
      avatar: null,
      telephone: '200-000-0002',
      client: {
        create: {
          nomSociete: 'Globex SA',
          localisation: 'Lyon',
        },
      },
    },
    update: {
      password: pwdClient2,
      role: 'CLIENT',
      client: {
        upsert: {
          create: { nomSociete: 'Globex SA', localisation: 'Lyon' },
          update: { nomSociete: 'Globex SA', localisation: 'Lyon' },
        },
      },
    },
    include: { client: true },
  });

  const [junior, mid, senior] = await Promise.all([
    prisma.grade.upsert({ where: { nom: 'Junior' }, create: { nom: 'Junior' }, update: {} }),
    prisma.grade.upsert({ where: { nom: 'Mid' }, create: { nom: 'Mid' }, update: {} }),
    prisma.grade.upsert({ where: { nom: 'Senior' }, create: { nom: 'Senior' }, update: {} }),
  ]);

  const employerUser1 = await prisma.utilisateur.upsert({
    where: { email: 'dev1@duality.local' },
    create: {
      email: 'dev1@duality.local',
      password: pwdEmp1,
      role: 'EMPLOYER',
      telephone: '300-000-0001',
      employer: {
        create: {
          nom: 'Martin',
          prenom: 'Alice',
          gradeId: mid.id,
        },
      },
    },
    update: {
      password: pwdEmp1,
      role: 'EMPLOYER',
      employer: {
        upsert: {
          create: { nom: 'Martin', prenom: 'Alice', gradeId: mid.id },
          update: { nom: 'Martin', prenom: 'Alice', gradeId: mid.id },
        },
      },
    },
  });

  const employerUser2 = await prisma.utilisateur.upsert({
    where: { email: 'dev2@duality.local' },
    create: {
      email: 'dev2@duality.local',
      password: pwdEmp2,
      role: 'EMPLOYER',
      telephone: '300-000-0002',
      employer: {
        create: {
          nom: 'Durand',
          prenom: 'Bob',
          gradeId: junior.id,
        },
      },
    },
    update: {
      password: pwdEmp2,
      role: 'EMPLOYER',
      employer: {
        upsert: {
          create: { nom: 'Durand', prenom: 'Bob', gradeId: junior.id },
          update: { nom: 'Durand', prenom: 'Bob', gradeId: junior.id },
        },
      },
    },
  });

  const employerUser3 = await prisma.utilisateur.upsert({
    where: { email: 'pm@duality.local' },
    create: {
      email: 'pm@duality.local',
      password: pwdEmp3,
      role: 'EMPLOYER',
      telephone: '300-000-0003',
      employer: {
        create: {
          nom: 'Leroy',
          prenom: 'Chloe',
          gradeId: senior.id,
        },
      },
    },
    update: {
      password: pwdEmp3,
      role: 'EMPLOYER',
      employer: {
        upsert: {
          create: { nom: 'Leroy', prenom: 'Chloe', gradeId: senior.id },
          update: { nom: 'Leroy', prenom: 'Chloe', gradeId: senior.id },
        },
      },
    },
  });

  const projWeb = await prisma.project.create({
    data: {
      titre: 'Acme Website Revamp',
      description: 'Redesign corporate website with modern stack',
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      status: 'EN_COURS',
      client: { connect: { id: clientUser1.client!.id } },
      webProject: { create: {} },
    },
    include: { webProject: true },
  });

  const projMkt = await prisma.project.create({
    data: {
      titre: 'Globex Social Campaign',
      description: 'Multi-channel social media campaign',
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 45 * 24 * 3600 * 1000),
      status: 'EN_ATTENTE',
      client: { connect: { id: clientUser2.client!.id } },
      marketingProject: { create: {} },
    },
    include: { marketingProject: true },
  });

  const sprint1 = await prisma.sprint.create({
    data: {
      nom: 'Sprint 1',
      status: 'PLANIFIE',
      goal: 'Landing page and auth',
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      totalStoryPoints: 20,
      webProject: { connect: { id: projWeb.webProject!.id } },
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      nom: 'Sprint 2',
      status: 'PLANIFIE',
      goal: 'Dashboard and API',
      dateDebut: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      dateFin: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      totalStoryPoints: 25,
      webProject: { connect: { id: projWeb.webProject!.id } },
    },
  });

  await prisma.sprintTask.createMany({
    data: [
      {
        titre: 'Design landing page',
        status: 'EN_COURS',
        priority: 1,
        dateDebut: new Date(),
        storyPoints: 8,
        sprintId: sprint1.id,
      },
      {
        titre: 'Implement auth API',
        status: 'A_FAIRE',
        priority: 1,
        dateDebut: new Date(),
        storyPoints: 5,
        sprintId: sprint1.id,
      },
      {
        titre: 'Dashboard widgets',
        status: 'A_FAIRE',
        priority: 2,
        dateDebut: new Date(Date.now() + 16 * 24 * 3600 * 1000),
        storyPoints: 13,
        sprintId: sprint2.id,
      },
    ],
  });

  const mkt = projMkt.marketingProject!;
  const task1 = await prisma.task.create({
    data: {
      titre: 'Define campaign goals',
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      status: 'EN_COURS',
      reporter: { connect: { id: employerUser3.id } },
      marketingProject: { connect: { id: mkt.id } },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      titre: 'Design visuals',
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      status: 'A_FAIRE',
      reporter: { connect: { id: employerUser3.id } },
      marketingProject: { connect: { id: mkt.id } },
    },
  });

  const directConv = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      createdBy: employerUser1.id,
      lastMessageAt: new Date(),
      participants: {
        create: [
          { userId: employerUser1.id, joinedAt: new Date(), lastReadAt: new Date() },
          { userId: employerUser2.id, joinedAt: new Date(), lastReadAt: null },
        ],
      },
    },
  });

  const taskConv = await prisma.conversation.create({
    data: {
      type: 'TASK',
      task: { connect: { id: task1.id } },
      createdBy: employerUser3.id,
      lastMessageAt: new Date(),
      participants: {
        create: [
          { userId: employerUser3.id, joinedAt: new Date(), lastReadAt: new Date() },
          { userId: clientUser2.id, joinedAt: new Date(), lastReadAt: null },
        ],
      },
    },
  });

  const msg1 = await prisma.message.create({
    data: {
      content: 'Hello, have you checked the wireframes?',
      conversation: { connect: { id: directConv.id } },
      sender: { connect: { id: employerUser1.id } },
      isEdited: false,
      readBy: {
        create: [{ userId: employerUser1.id }],
      },
    },
    include: { readBy: true },
  });

  const msg2 = await prisma.message.create({
    data: {
      content: 'Yes, looks good. I will start implementing today.',
      conversation: { connect: { id: directConv.id } },
      sender: { connect: { id: employerUser2.id } },
      replyTo: { connect: { id: msg1.id } },
      isEdited: false,
      readBy: {
        create: [{ userId: employerUser2.id }],
      },
    },
    include: { readBy: true },
  });

  const msg3 = await prisma.message.create({
    data: {
      content: 'Please review the proposed KPIs for the campaign.',
      conversation: { connect: { id: taskConv.id } },
      sender: { connect: { id: employerUser3.id } },
      isEdited: false,
      readBy: {
        create: [{ userId: employerUser3.id }],
      },
    },
    include: { readBy: true },
  });

  await prisma.messageReadStatus.createMany({
    data: [
      { messageId: msg1.id, userId: employerUser2.id },
      { messageId: msg2.id, userId: employerUser1.id },
      { messageId: msg3.id, userId: clientUser2.id },
    ],
    skipDuplicates: true,
  });

  await prisma.conversation.update({
    where: { id: directConv.id },
    data: { lastMessageAt: msg2.createdAt },
  });
  await prisma.conversation.update({
    where: { id: taskConv.id },
    data: { lastMessageAt: msg3.createdAt },
  });

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: directConv.id, userId: employerUser1.id } },
    data: { lastReadAt: new Date() },
  });
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: taskConv.id, userId: employerUser3.id } },
    data: { lastReadAt: new Date() },
  });

  const sprint1Conversation = await prisma.conversation.create({
    data: {
      type: 'SPRINT',
      createdBy: employerUser3.id,
      participants: {
        create: [
          { userId: employerUser1.id, joinedAt: new Date() },
          { userId: employerUser2.id, joinedAt: new Date() },
          { userId: employerUser3.id, joinedAt: new Date() },
          { userId: adminUser.id, joinedAt: new Date() },
        ],
      },
    },
  });
  await prisma.sprint.update({
    where: { id: sprint1.id },
    data: { conversationId: sprint1Conversation.id },
  });
  await prisma.sprintParticipant.createMany({
    data: [
      { sprintId: sprint1.id, userId: employerUser1.id, role: 'MEMBER' },
      { sprintId: sprint1.id, userId: employerUser2.id, role: 'MEMBER' },
      { sprintId: sprint1.id, userId: employerUser3.id, role: 'LEAD' },
      { sprintId: sprint1.id, userId: adminUser.id, role: 'ADMIN' },
    ],
    skipDuplicates: true,
  });

  const sprintTask1 = await prisma.sprintTask.findFirst({
    where: { sprintId: sprint1.id },
    orderBy: { id: 'asc' },
  });

  await prisma.taskAssignment.create({
    data: { taskId: task1.id, userId: employerUser1.id },
  });
  await prisma.taskWatcher.createMany({
    data: [
      { taskId: task1.id, userId: employerUser2.id },
      { taskId: task1.id, userId: employerUser3.id },
    ],
    skipDuplicates: true,
  });
  await prisma.taskDependency.create({
    data: { taskId: task2.id, dependsOnId: task1.id },
  });
  const comment1 = await prisma.taskComment.create({
    data: { taskId: task1.id, userId: employerUser2.id, content: 'Looks good to me' },
  });
  await prisma.taskActivity.createMany({
    data: [
      { taskId: task1.id, userId: employerUser3.id, action: 'CREATED', field: null, oldValue: null, newValue: null },
      { taskId: task1.id, userId: employerUser1.id, action: 'STATUS_CHANGED', field: 'status', oldValue: 'A_FAIRE', newValue: 'EN_COURS' },
      { taskId: task1.id, userId: employerUser2.id, action: 'COMMENT_ADDED', field: null, oldValue: null, newValue: comment1.id },
    ],
    skipDuplicates: true,
  });

  const now = new Date();
  const earlier = new Date(now.getTime() - 2 * 3600 * 1000);
  await prisma.timeEntry.createMany({
    data: [
      { userId: employerUser1.id, taskId: task1.id, description: 'Planning', startTime: earlier, endTime: now, duration: 7200, billable: true, billableRate: 80 },
      { userId: employerUser2.id, taskId: task2.id, description: 'Mockups', startTime: new Date(now.getTime() - 3600 * 1000), endTime: now, duration: 3600, billable: false, billableRate: null },
    ],
  });
  await prisma.activeTimer.upsert({
    where: { userId: employerUser3.id },
    create: { userId: employerUser3.id, taskId: task1.id, startTime: new Date(now.getTime() - 1800 * 1000) },
    update: { taskId: task1.id, startTime: new Date(now.getTime() - 1800 * 1000), lastPausedAt: null, totalPaused: 0 },
  });
  const today = new Date(now.toISOString().slice(0, 10));
  await prisma.timeSummary.createMany({
    data: [
      { userId: employerUser1.id, date: today, totalSeconds: 7200, taskBreakdown: { [task1.id]: 7200 } as any },
      { userId: employerUser2.id, date: today, totalSeconds: 3600, taskBreakdown: { [task2.id]: 3600 } as any },
    ],
    skipDuplicates: true,
  });

  await prisma.notificationPreference.upsert({
    where: { userId: employerUser1.id },
    create: { userId: employerUser1.id, inAppNewMessage: true, inAppTaskAssigned: true, inAppDeadlineReminder: true },
    update: {},
  });
  await prisma.notificationPreference.upsert({
    where: { userId: employerUser2.id },
    create: { userId: employerUser2.id, inAppNewMessage: true, inAppTaskAssigned: true, inAppDeadlineReminder: true },
    update: {},
  });
  await prisma.notificationPreference.upsert({
    where: { userId: employerUser3.id },
    create: { userId: employerUser3.id, inAppNewMessage: true, inAppTaskAssigned: true, inAppDeadlineReminder: true },
    update: {},
  });
  await prisma.notificationPreference.upsert({
    where: { userId: adminUser.id },
    create: { userId: adminUser.id, inAppNewMessage: true, inAppTaskAssigned: true, inAppDeadlineReminder: true },
    update: {},
  });

  await prisma.notification.createMany({
    data: [
      { type: 'TEAM_ANNOUNCEMENT', title: 'Bienvenue', content: null, data: { hello: true } as any, userId: employerUser1.id, senderId: adminUser.id },
      { type: 'TASK_ASSIGNED', title: 'Tâche assignée', content: null, data: { taskId: task1.id } as any, userId: employerUser1.id, senderId: employerUser3.id },
    ],
  });

  await prisma.file.createMany({
    data: [
      { filename: 'spec.pdf', storageKey: 'seed/task1/spec.pdf', mimeType: 'application/pdf', size: 12345, url: null, uploaderId: employerUser3.id, taskId: task1.id },
      ...(sprintTask1
        ? [{ filename: 'design.png', storageKey: 'seed/sprinttask/design.png', mimeType: 'image/png', size: 23456, url: null, uploaderId: employerUser1.id, sprintTaskId: sprintTask1.id }]
        : []),
      { filename: 'brief.pdf', storageKey: 'seed/message/brief.pdf', mimeType: 'application/pdf', size: 34567, url: null, uploaderId: employerUser2.id, messageId: msg2.id },
    ] as any,
    skipDuplicates: true,
  });

  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error('Seeding error', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
