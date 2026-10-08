import { describe, expect, it } from 'vitest';
import { buildCandidateStatusPayload, updateCandidateStatusBatch } from '../candidate-bulk-status';

const candidate = { id: 'one', hiredAt: null, inProcessAt: null };
const now = '2026-10-08T09:00:00.000Z';

describe('buildCandidateStatusPayload', () => {
  it('sets a hire date and clears process fields when hired', () => {
    expect(buildCandidateStatusPayload(candidate, 'EMPLOYED', now)).toEqual({
      employmentStatus: 'EMPLOYED', hiredAt: now, inProcessPositionId: null, inProcessAt: null,
    });
    expect(buildCandidateStatusPayload({ ...candidate, hiredAt: now }, 'EMPLOYED')).not.toHaveProperty('hiredAt');
  });

  it('clears hire and process fields when rejected', () => {
    expect(buildCandidateStatusPayload(candidate, 'REJECTED', now)).toEqual({
      employmentStatus: 'REJECTED', hiredAt: null, hiredToEmployerId: null,
      inProcessPositionId: null, inProcessAt: null,
    });
  });

  it('sets the process date only if missing and preserves the position', () => {
    const payload = buildCandidateStatusPayload(candidate, 'IN_PROCESS', now);
    expect(payload.inProcessAt).toBe(now);
    expect(payload).not.toHaveProperty('inProcessPositionId');
    expect(buildCandidateStatusPayload({ ...candidate, inProcessAt: now }, 'IN_PROCESS')).not.toHaveProperty('inProcessAt');
  });
});

describe('updateCandidateStatusBatch', () => {
  it('deduplicates selection and isolates HTTP and network failures', async () => {
    const called: string[] = [];
    const progress: number[] = [];
    const result = await updateCandidateStatusBatch(['one', 'two', 'one', 'three'], async id => {
      called.push(id);
      if (id === 'three') throw new Error('network');
      return id !== 'two';
    }, count => progress.push(count));
    expect(called).toEqual(['one', 'two', 'three']);
    expect(result).toEqual({ succeeded: ['one'], failed: ['two', 'three'] });
    expect(progress).toEqual([3]);
  });

  it('limits concurrency to ten and reports completed batches', async () => {
    let active = 0;
    let maximum = 0;
    const progress: number[] = [];
    const ids = Array.from({ length: 23 }, (_, index) => String(index));
    const result = await updateCandidateStatusBatch(ids, async () => {
      active++;
      maximum = Math.max(maximum, active);
      await Promise.resolve();
      active--;
      return true;
    }, count => progress.push(count));
    expect(maximum).toBe(10);
    expect(progress).toEqual([10, 20, 23]);
    expect(result.succeeded).toEqual(ids);
    expect(result.failed).toEqual([]);
  });
});