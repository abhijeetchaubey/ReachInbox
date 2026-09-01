import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getEmailQueue } from '../queue/emailQueue';

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

let isBoardInitialized = false;

export function initBullBoard() {
  if (isBoardInitialized) return;
  try {
    const queue = getEmailQueue();
    createBullBoard({
      queues: [(new BullMQAdapter(queue as any) as any)],
      serverAdapter,
    });
    isBoardInitialized = true;
    console.log('[BullBoard] Live Queue Dashboard initialized at /admin/queues');
  } catch (err: any) {
    console.error('[BullBoard Error]:', err.message);
  }
}

export const adminQueueRouter = serverAdapter.getRouter();
