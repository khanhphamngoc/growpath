import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Role, MilestoneType } from '@prisma/client';
import { db } from '@/lib/db';
import { cleanDb, disconnectDb } from '../../helpers/db';

describe('S-02 — Prisma schema integration', () => {
  // Base users shared across describe blocks; set in beforeAll
  let parentId!: string;
  let childId!: string;

  beforeAll(async () => {
    await cleanDb();

    const parent = await db.user.create({
      data: {
        email: 'test-parent@test.growpath.vn',
        role: Role.PARENT,
        name: 'Nguyễn Thị Hương',
        city: 'Hồ Chí Minh',
      },
    });
    parentId = parent.id;

    const child = await db.user.create({
      data: {
        email: 'test-child@test.growpath.vn',
        role: Role.CHILD,
        name: 'Nguyễn Minh Anh',
        city: 'Hồ Chí Minh',
      },
    });
    childId = child.id;
  });

  afterAll(async () => {
    await cleanDb();
    await disconnectDb();
  });

  // ─── User ─────────────────────────────────────────────────────────────────

  describe('User', () => {
    it('creates users with the correct fields', async () => {
      const parent = await db.user.findUniqueOrThrow({ where: { id: parentId } });
      expect(parent.role).toBe(Role.PARENT);
      expect(parent.email).toBe('test-parent@test.growpath.vn');
      expect(parent.philosophyAcknowledgedAt).toBeNull();

      const child = await db.user.findUniqueOrThrow({ where: { id: childId } });
      expect(child.role).toBe(Role.CHILD);
    });

    it('enforces unique email constraint', async () => {
      await expect(
        db.user.create({
          data: {
            email: 'test-parent@test.growpath.vn',
            role: Role.PARENT,
            name: 'Duplicate',
          },
        }),
      ).rejects.toThrow();
    });

    it('updates user fields', async () => {
      const updated = await db.user.update({
        where: { id: parentId },
        data: { philosophyAcknowledgedAt: new Date() },
      });
      expect(updated.philosophyAcknowledgedAt).not.toBeNull();
      // Reset for other tests
      await db.user.update({
        where: { id: parentId },
        data: { philosophyAcknowledgedAt: null },
      });
    });
  });

  // ─── FamilyLink ────────────────────────────────────────────────────────────

  describe('FamilyLink', () => {
    it('creates a valid parent–child link', async () => {
      const link = await db.familyLink.create({
        data: { parentId, childId },
      });
      expect(link.parentId).toBe(parentId);
      expect(link.childId).toBe(childId);
    });

    it('enforces composite PK — rejects duplicate link', async () => {
      await expect(
        db.familyLink.create({ data: { parentId, childId } }),
      ).rejects.toThrow();
    });

    it('rejects FK violation: non-existent parentId', async () => {
      await expect(
        db.familyLink.create({ data: { parentId: 'does-not-exist', childId } }),
      ).rejects.toThrow();
    });

    it('rejects FK violation: non-existent childId', async () => {
      await expect(
        db.familyLink.create({ data: { parentId, childId: 'does-not-exist' } }),
      ).rejects.toThrow();
    });
  });

  // ─── ChildProfile ─────────────────────────────────────────────────────────

  describe('ChildProfile', () => {
    it('creates a child profile linked to the child user', async () => {
      const profile = await db.childProfile.create({
        data: {
          userId: childId,
          dob: new Date('2015-08-15'),
          grade: 5,
          school: 'Trường Tiểu học Nguyễn Bỉnh Khiêm',
          xp: 0,
        },
      });
      expect(profile.userId).toBe(childId);
      expect(profile.xp).toBe(0);
    });

    it('rejects FK violation: non-existent userId', async () => {
      await expect(
        db.childProfile.create({
          data: { userId: 'does-not-exist', dob: new Date(), grade: 5 },
        }),
      ).rejects.toThrow();
    });

    it('updates XP', async () => {
      const updated = await db.childProfile.update({
        where: { userId: childId },
        data: { xp: 100 },
      });
      expect(updated.xp).toBe(100);
    });
  });

  // ─── Persona + PersonaDelta ────────────────────────────────────────────────

  describe('Persona', () => {
    it('creates a persona with version 1', async () => {
      const persona = await db.persona.create({
        data: {
          childId,
          version: 1,
          dimensions: {
            dreams: 'Nhà khoa học vũ trụ',
            interests: ['Thiên văn học', 'Toán học'],
          },
          headline: 'Bạn là người khám phá những điều chưa ai biết',
        },
      });
      expect(persona.version).toBe(1);
      expect(persona.needsEditorialReview).toBe(false);
      expect(persona.childConfirmedAt).toBeNull();
    });

    it('enforces unique (childId, version) constraint', async () => {
      await expect(
        db.persona.create({
          data: {
            childId,
            version: 1,
            dimensions: {},
            headline: 'Duplicate version',
          },
        }),
      ).rejects.toThrow();
    });

    it('allows version 2 for the same child', async () => {
      const v2 = await db.persona.create({
        data: {
          childId,
          version: 2,
          dimensions: { dreams: 'Updated' },
          headline: 'Phiên bản mới',
        },
      });
      expect(v2.version).toBe(2);

      // Clean up v2 so other tests are unaffected
      await db.persona.delete({ where: { id: v2.id } });
    });
  });

  describe('PersonaDelta', () => {
    it('creates a delta linked to the persona and cascades on persona delete', async () => {
      const persona = await db.persona.findFirstOrThrow({ where: { childId, version: 1 } });

      const delta = await db.personaDelta.create({
        data: {
          personaId: persona.id,
          parentView: { strengths: 'Focused, disciplined' },
          childView: { strengths: 'Creative, curious' },
          deltaNotes: { note: 'Parent sees discipline; child sees creativity' },
          possiblyUnderstated: ['creativity'],
        },
      });
      expect(delta.personaId).toBe(persona.id);

      // Cascade: deleting persona should delete delta
      const orphanPersona = await db.persona.create({
        data: { childId, version: 99, dimensions: {}, headline: 'Temp' },
      });
      await db.personaDelta.create({
        data: {
          personaId: orphanPersona.id,
          parentView: {},
          childView: {},
          deltaNotes: {},
        },
      });
      await db.persona.delete({ where: { id: orphanPersona.id } });
      const orphanDelta = await db.personaDelta.findUnique({
        where: { personaId: orphanPersona.id },
      });
      expect(orphanDelta).toBeNull();
    });

    it('rejects FK violation: non-existent personaId', async () => {
      await expect(
        db.personaDelta.create({
          data: {
            personaId: 'does-not-exist',
            parentView: {},
            childView: {},
            deltaNotes: {},
          },
        }),
      ).rejects.toThrow();
    });
  });

  // ─── Dream + CareerCluster ─────────────────────────────────────────────────

  describe('Dream', () => {
    let dreamId!: string;

    it('creates a dream', async () => {
      const dream = await db.dream.create({
        data: { childId, text: 'Nhà thiên văn học', version: 1 },
      });
      dreamId = dream.id;
      expect(dream.text).toBe('Nhà thiên văn học');
    });

    it('creates career clusters linked to the dream', async () => {
      const cluster = await db.careerCluster.create({
        data: {
          dreamId,
          clusters: [
            { title: 'Nhà vật lý thiên văn', emoji: '🔭', skills: ['Toán học', 'Vật lý'] },
            { title: 'Kỹ sư vũ trụ', emoji: '🚀', skills: ['Cơ học', 'Lập trình'] },
          ],
        },
      });
      expect(cluster.dreamId).toBe(dreamId);
      expect(cluster.selectedCluster).toBeNull();
    });

    it('cascades CareerCluster when Dream is deleted', async () => {
      const tempDream = await db.dream.create({
        data: { childId, text: 'Temp dream', version: 1 },
      });
      const tempCluster = await db.careerCluster.create({
        data: { dreamId: tempDream.id, clusters: [] },
      });

      await db.dream.delete({ where: { id: tempDream.id } });

      const orphan = await db.careerCluster.findUnique({ where: { id: tempCluster.id } });
      expect(orphan).toBeNull();
    });

    it('rejects FK violation: non-existent dreamId in CareerCluster', async () => {
      await expect(
        db.careerCluster.create({ data: { dreamId: 'does-not-exist', clusters: [] } }),
      ).rejects.toThrow();
    });
  });

  // ─── SkillRoadmap ─────────────────────────────────────────────────────────

  describe('SkillRoadmap', () => {
    it('creates a skill roadmap', async () => {
      const roadmap = await db.skillRoadmap.create({
        data: {
          childId,
          careerId: 'nha-vat-ly-thien-van',
          roadmap: {
            quarters: [
              { skills: ['Đọc sách thiên văn'], monthlyGoals: ['Hiểu hệ mặt trời'] },
            ],
          },
          currentWeekFocus: 'Hệ Mặt Trời',
        },
      });
      expect(roadmap.childId).toBe(childId);
      expect(roadmap.currentWeekFocus).toBe('Hệ Mặt Trời');
    });
  });

  // ─── WeeklyCheckin ─────────────────────────────────────────────────────────

  describe('WeeklyCheckin', () => {
    it('creates a check-in for week 1', async () => {
      const checkin = await db.weeklyCheckin.create({
        data: {
          childId,
          weekNumber: 1,
          mood: '😊',
          activityLog: 'Đọc sách về vũ trụ và xem phim tài liệu',
          reflection: 'Học được nhiều điều thú vị về hệ mặt trời',
        },
      });
      expect(checkin.weekNumber).toBe(1);
      expect(checkin.scenarioResponse).toBeNull();
    });

    it('enforces unique (childId, weekNumber) — rejects duplicate week', async () => {
      await expect(
        db.weeklyCheckin.create({
          data: {
            childId,
            weekNumber: 1,
            mood: '😐',
            activityLog: 'Duplicate check-in',
            reflection: 'Should fail',
          },
        }),
      ).rejects.toThrow();
    });

    it('allows a different week number for the same child', async () => {
      const week2 = await db.weeklyCheckin.create({
        data: {
          childId,
          weekNumber: 2,
          mood: '🌟',
          activityLog: 'Thực hành quan sát sao',
          reflection: 'Thấy chòm sao Orion lần đầu tiên',
        },
      });
      expect(week2.weekNumber).toBe(2);
    });
  });

  // ─── Milestone ─────────────────────────────────────────────────────────────

  describe('Milestone', () => {
    it('creates a FIRST_CHECKIN milestone with XP', async () => {
      const milestone = await db.milestone.create({
        data: {
          childId,
          type: MilestoneType.FIRST_CHECKIN,
          title: 'Lần đầu tiên check-in!',
          xp: 50,
        },
      });
      expect(milestone.type).toBe(MilestoneType.FIRST_CHECKIN);
      expect(milestone.xp).toBe(50);
    });

    it('enforces idempotency — rejects duplicate milestone type for same child', async () => {
      await expect(
        db.milestone.create({
          data: {
            childId,
            type: MilestoneType.FIRST_CHECKIN,
            title: 'Duplicate',
            xp: 50,
          },
        }),
      ).rejects.toThrow();
    });

    it('allows different milestone types for the same child', async () => {
      const streak = await db.milestone.create({
        data: {
          childId,
          type: MilestoneType.WEEK_STREAK_7,
          title: '7 ngày liên tiếp!',
          xp: 150,
        },
      });
      expect(streak.type).toBe(MilestoneType.WEEK_STREAK_7);
    });
  });
});
