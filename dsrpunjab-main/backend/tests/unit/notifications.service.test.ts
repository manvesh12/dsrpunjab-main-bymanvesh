import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUser } from "../../src/authentication/auth-user.js";
import type { NotificationsRepository } from "../../src/notifications/notifications.repository.js";
import { NotificationsService } from "../../src/notifications/notifications.service.js";

const actor: AuthUser = {
  id: 7n,
  username: "reviewer",
  email: "reviewer@example.test",
  fullName: "Review Officer",
  role: "REVIEWER",
  districtId: 2n,
  blockName: null,
  sectionName: null,
  accessScope: null,
};

test("notification inbox is always scoped to the authenticated user", async () => {
  let listedUserId = 0n;
  let countedUserId = 0n;
  const repository = {
    listForUser: async (userId: bigint) => {
      listedUserId = userId;
      return [];
    },
    unreadCount: async (userId: bigint) => {
      countedUserId = userId;
      return 0;
    },
  } as unknown as NotificationsRepository;

  const result = await new NotificationsService(repository).inbox(42n);

  assert.equal(listedUserId, 42n);
  assert.equal(countedUserId, 42n);
  assert.deepEqual(result, { items: [], unreadCount: 0 });
});

test("workflow notifications exclude the actor and target the project district", async () => {
  let recipientWhere: Record<string, unknown> | undefined;
  let createdType = "";
  let createdUserIds: bigint[] = [];
  const repository = {
    findRecipientIds: async (where: Record<string, unknown>) => {
      recipientWhere = where;
      return [{ id: 8n }, { id: 9n }];
    },
    createForUsers: async (userIds: bigint[], type: string) => {
      createdUserIds = userIds;
      createdType = type;
      return { count: userIds.length };
    },
  } as unknown as NotificationsRepository;

  await new NotificationsService(repository).notifyWorkflow(
    "APPROVE",
    actor,
    { id: 15n, projectName: "Jalandhar DSR", districtId: 2n, createdBy: 8n },
    "Ready for publication",
  );

  assert.deepEqual((recipientWhere?.id as { not: bigint }).not, actor.id);
  assert.deepEqual(createdUserIds, [8n, 9n]);
  assert.equal(createdType, "WORKFLOW_APPROVE:PROJECT_15");
});

test("a user cannot mark another user's notification as read", async () => {
  const repository = {
    markRead: async () => ({ count: 0 }),
  } as unknown as NotificationsRepository;
  const service = new NotificationsService(repository);

  await assert.rejects(() => service.markRead(42n, 99n), /Notification not found/);
});
