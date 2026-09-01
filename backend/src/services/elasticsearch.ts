import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import { prisma } from './prisma';

export const esClient = new Client({
  node: config.elasticsearchNode,
});

export const EMAIL_INDEX = 'emails';

let isElasticsearchConnected = false;

export async function initElasticsearch() {
  try {
    const health = await esClient.cluster.health({});
    console.log(`[Elasticsearch] Connected. Cluster status: ${health.status}`);
    isElasticsearchConnected = true;

    const indexExists = await esClient.indices.exists({ index: EMAIL_INDEX });
    if (!indexExists) {
      await esClient.indices.create({
        index: EMAIL_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            senderEmail: { type: 'keyword' },
            recipientEmail: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            etherealPreviewUrl: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      });
      console.log(`[Elasticsearch] Index '${EMAIL_INDEX}' created successfully.`);
    }
  } catch (err: any) {
    console.warn(`[Elasticsearch] Connection failed (${err.message}). Search will fallback to Prisma DB.`);
    isElasticsearchConnected = false;
  }
}

export async function indexEmailDoc(emailJob: {
  id: string;
  userId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: Date;
  sentAt?: Date | null;
  etherealPreviewUrl?: string | null;
  createdAt: Date;
}) {
  if (!isElasticsearchConnected) return;

  try {
    await esClient.index({
      index: EMAIL_INDEX,
      id: emailJob.id,
      document: {
        id: emailJob.id,
        userId: emailJob.userId,
        senderEmail: emailJob.senderEmail,
        recipientEmail: emailJob.recipientEmail,
        subject: emailJob.subject,
        body: emailJob.body,
        status: emailJob.status,
        scheduledAt: emailJob.scheduledAt.toISOString(),
        sentAt: emailJob.sentAt ? emailJob.sentAt.toISOString() : null,
        etherealPreviewUrl: emailJob.etherealPreviewUrl || null,
        createdAt: emailJob.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error(`[Elasticsearch] Failed to index email ${emailJob.id}:`, err.message);
  }
}

export async function searchEmails(userId: string, queryText: string, statusFilter?: string) {
  if (isElasticsearchConnected) {
    try {
      const mustClauses: any[] = [{ term: { userId } }];

      if (statusFilter) {
        mustClauses.push({ term: { status: statusFilter } });
      }

      if (queryText && queryText.trim() !== '') {
        mustClauses.push({
          multi_match: {
            query: queryText,
            fields: ['subject^2', 'body', 'recipientEmail', 'senderEmail'],
            fuzziness: 'AUTO',
          },
        });
      }

      const result = await esClient.search({
        index: EMAIL_INDEX,
        query: {
          bool: {
            must: mustClauses,
          },
        },
        sort: [{ scheduledAt: { order: 'desc' } }],
        size: 100,
      });

      return result.hits.hits.map((hit: any) => hit._source);
    } catch (err: any) {
      console.warn(`[Elasticsearch] Search query failed, falling back to DB:`, err.message);
    }
  }

  // Fallback to Prisma DB
  const where: any = { userId };
  if (statusFilter) {
    where.status = statusFilter;
  }
  if (queryText && queryText.trim() !== '') {
    where.OR = [
      { subject: { contains: queryText, mode: 'insensitive' } },
      { body: { contains: queryText, mode: 'insensitive' } },
      { recipientEmail: { contains: queryText, mode: 'insensitive' } },
    ];
  }

  const dbEmails = await prisma.emailJob.findMany({
    where,
    orderBy: { scheduledAt: 'desc' },
    take: 100,
  });

  return dbEmails;
}
