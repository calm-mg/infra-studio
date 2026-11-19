export const roleGroups = [
  { title: '진입점', roles: ['클라이언트', '로드 밸런서', '게이트웨이'] },
  { title: '실행 환경 · 서비스', roles: ['앱 서버', '실행 환경'] },
  { title: '데이터 저장', roles: ['데이터베이스', '캐시'] },
  { title: '비동기 메시징', roles: ['메시지 큐'] },
  { title: '관측', roles: ['로컬 로그 파일', '로그 수집기', '로그 저장소', '메트릭'] },
] as const;

export type IconName = 'client' | 'balance' | 'gateway' | 'server' | 'host' | 'database' | 'cache' | 'queue' | 'file' | 'collector' | 'store' | 'metrics' | 'block';

type RoleStyle = { icon: IconName; tone: string; technologies: string[] };
const styles: Record<string, RoleStyle> = {
  '클라이언트': { icon: 'client', tone: 'blue', technologies: ['브라우저', '모바일 앱'] },
  '로드 밸런서': { icon: 'balance', tone: 'blue', technologies: ['ALB', 'HAProxy'] },
  '게이트웨이': { icon: 'gateway', tone: 'blue', technologies: ['NGINX', 'Kong'] },
  '앱 서버': { icon: 'server', tone: 'green', technologies: ['Spring Boot', 'Go', 'Node.js'] },
  '실행 환경': { icon: 'host', tone: 'green', technologies: ['EC2', 'Kubernetes'] },
  '데이터베이스': { icon: 'database', tone: 'purple', technologies: ['PostgreSQL', 'MySQL'] },
  '캐시': { icon: 'cache', tone: 'purple', technologies: ['Redis', 'Valkey'] },
  '메시지 큐': { icon: 'queue', tone: 'amber', technologies: ['RabbitMQ', 'SQS'] },
  '로컬 로그 파일': { icon: 'file', tone: 'rose', technologies: ['JSON Lines', '텍스트 파일'] },
  '로그 수집기': { icon: 'collector', tone: 'rose', technologies: ['Vector', 'Fluent Bit'] },
  '로그 저장소': { icon: 'store', tone: 'rose', technologies: ['Loki', 'CloudWatch Logs'] },
  '메트릭': { icon: 'metrics', tone: 'rose', technologies: ['Prometheus', 'CloudWatch'] },
};
const other: RoleStyle = { icon: 'block', tone: 'blue', technologies: [] };
export function roleStyle(role: string): RoleStyle {
  return Object.hasOwn(styles, role) ? styles[role]! : other;
}
