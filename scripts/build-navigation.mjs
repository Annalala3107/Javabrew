import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';

const ROOT = String.raw`e:\JavAncode`;

const DOMAIN_META = [
  { id: 'java', en: 'Java Core', vi: 'Java Cốt lõi' },
  { id: 'cs-basics', en: 'CS Basics', vi: 'Khoa học Máy tính' },
  { id: 'database', en: 'Database', vi: 'Cơ sở dữ liệu' },
  { id: 'system-design', en: 'System Design & Frameworks', vi: 'Thiết kế Hệ thống & Framework' },
  { id: 'distributed-system', en: 'Distributed Systems', vi: 'Hệ thống Phân tán' },
  { id: 'high-performance', en: 'High Performance', vi: 'Hiệu năng Cao' },
  { id: 'high-availability', en: 'High Availability', vi: 'Độ sẵn sàng Cao' },
  { id: 'tools', en: 'Developer Tools', vi: 'Công cụ Phát triển' },
  { id: 'ai', en: 'AI Application Engineering', vi: 'Kỹ thuật Ứng dụng AI' },
  { id: 'ai-coding', en: 'AI Coding Workflows', vi: 'Thực chiến AI Coding' },
];

const SUBFOLDER_LABELS = {
  // java
  basis: { en: 'Java Basics', vi: 'Java Cơ bản' },
  collection: { en: 'Collections Framework', vi: 'Collections Framework' },
  concurrent: { en: 'Concurrency & Multithreading', vi: 'Lập trình Đa luồng (Concurrency)' },
  io: { en: 'Java IO & NIO', vi: 'Java IO & NIO' },
  jvm: { en: 'JVM & Garbage Collection', vi: 'JVM & Quản lý Bộ nhớ' },
  'new-features': { en: 'Java 8–26 New Features', vi: 'Tính năng mới Java 8–26' },
  // cs-basics
  network: { en: 'Computer Networking', vi: 'Mạng Máy tính' },
  'operating-system': { en: 'Operating Systems & Linux', vi: 'Hệ điều hành & Linux' },
  'data-structure': { en: 'Data Structures', vi: 'Cấu trúc Dữ liệu' },
  algorithms: { en: 'Algorithms', vi: 'Thuật toán' },
  // database
  sql: { en: 'SQL Foundations', vi: 'Nền tảng SQL' },
  mysql: { en: 'MySQL & InnoDB', vi: 'MySQL & InnoDB' },
  redis: { en: 'Redis & Caching', vi: 'Redis & Bộ nhớ đệm' },
  elasticsearch: { en: 'Elasticsearch', vi: 'Elasticsearch' },
  mongodb: { en: 'MongoDB', vi: 'MongoDB' },
  // system-design
  framework: { en: 'Frameworks (Spring / MyBatis)', vi: 'Framework (Spring / MyBatis)' },
  security: { en: 'Security & Auth', vi: 'Bảo mật & Xác thực' },
  // distributed-system
  protocol: { en: 'Protocols & Consensus', vi: 'Giao thức & Đồng thuận' },
  rpc: { en: 'RPC & Dubbo', vi: 'RPC & Dubbo' },
  'distributed-process-coordination': { en: 'ZooKeeper & Coordination', vi: 'ZooKeeper & Điều phối' },
  // high-performance
  'message-queue': { en: 'Message Queues', vi: 'Hàng đợi Thông điệp (MQ)' },
  // tools
  git: { en: 'Git & GitHub', vi: 'Git & GitHub' },
  maven: { en: 'Maven', vi: 'Maven' },
  gradle: { en: 'Gradle', vi: 'Gradle' },
  docker: { en: 'Docker', vi: 'Docker' },
  // ai
  'interview-questions': { en: 'AI Interview Questions', vi: 'Câu hỏi Phỏng vấn AI' },
  'llm-basis': { en: 'LLM Foundations', vi: 'Nền tảng LLM' },
  agent: { en: 'AI Agents & MCP', vi: 'AI Agents & MCP' },
  rag: { en: 'RAG & Vector Search', vi: 'RAG & Vector Search' },
  // ai-coding
  practices: { en: 'Best Practices & Tools', vi: 'Thực hành Tốt & Công cụ' },
  principles: { en: 'Agent Coding Architecture', vi: 'Nguyên lý AI Coding' },
  cases: { en: 'Case Studies', vi: 'Tình huống Thực chiến' },
  project: { en: 'Projects', vi: 'Dự án Thực hành' },
};

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(ROOT, 'metadata', 'manifest.json'), 'utf8'));

  const domains = [];

  for (const dm of DOMAIN_META) {
    const items = manifest.articles.filter((a) => a.folder === dm.id);
    const groupsMap = new Map();

    for (const art of items) {
      const subKey = art.subFolder || '_overview';
      if (!groupsMap.has(subKey)) groupsMap.set(subKey, []);
      const enExists = fssync.existsSync(path.join(ROOT, 'content', 'en', art.rel));
      const viExists = fssync.existsSync(path.join(ROOT, 'content', 'vi', art.rel));

      groupsMap.get(subKey).push({
        rel: art.rel,
        titleZh: art.titleZh,
        titleEn: art.titleEn || '',
        titleVi: art.titleVi || '',
        chars: art.chars,
        lines: art.lines,
        images: art.rewrittenImgs,
        status: {
          zhRef: 'ready',
          en: enExists ? 'done' : 'pending',
          vi: viExists ? 'done' : 'pending',
        },
      });
    }

    const groups = [];
    for (const [subKey, articles] of groupsMap.entries()) {
      articles.sort((a, b) => {
        if (a.rel.endsWith('/README.md') || a.rel === `${dm.id}/README.md`) return -1;
        if (b.rel.endsWith('/README.md') || b.rel === `${dm.id}/README.md`) return 1;
        return a.rel.localeCompare(b.rel);
      });
      const label =
        subKey === '_overview'
          ? { en: 'Overview & Core Articles', vi: 'Tổng quan & Bài viết chính' }
          : SUBFOLDER_LABELS[subKey] || { en: subKey, vi: subKey };
      groups.push({
        id: subKey,
        labelEn: label.en,
        labelVi: label.vi,
        count: articles.length,
        articles,
      });
    }

    groups.sort((a, b) => {
      if (a.id === '_overview') return -1;
      if (b.id === '_overview') return 1;
      return a.id.localeCompare(b.id);
    });

    domains.push({
      id: dm.id,
      labelEn: dm.en,
      labelVi: dm.vi,
      totalArticles: items.length,
      groups,
    });
  }

  const out = {
    generatedAt: new Date().toISOString(),
    totalDomains: domains.length,
    totalArticles: manifest.articles.length,
    domains,
  };

  await fs.writeFile(path.join(ROOT, 'metadata', 'navigation.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote metadata/navigation.json:', { totalDomains: out.totalDomains, totalArticles: out.totalArticles });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
