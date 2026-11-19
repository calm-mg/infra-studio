import type { Design } from '../design/document';

export function exampleDesign(): Design {
  return {
    schemaVersion: 1,
    blocks: [
      { id: 'client', role: '클라이언트', name: '웹 클라이언트', technology: '브라우저', note: '', x: 0, y: 0 },
      { id: 'lb', role: '로드 밸런서', name: '진입 LB', technology: '', note: '', x: 270, y: 0 },
      { id: 'service', role: '앱 서버', name: '서비스 백엔드', technology: 'Spring Boot', note: 'EC2에서 실행한다. 실행 위치는 요청이나 로그의 목적지와 구분해 기록했다.', x: 540, y: 0 },
      { id: 'db', role: '데이터베이스', name: '서비스 DB', technology: 'PostgreSQL', note: '', x: 810, y: 0 },
      { id: 'file', role: '로컬 로그 파일', name: '서비스 로그 파일', technology: 'JSON Lines', note: '서비스 호스트의 로컬 디스크에 기록한다. 보존 기간은 아직 확인하지 않았다.', x: 0, y: 220 },
      { id: 'agent', role: '로그 수집기', name: '로그 수집기', technology: 'Vector', note: '', x: 270, y: 220 },
      { id: 'logs', role: '로그 저장소', name: '중앙 로그 저장소', technology: 'Loki', note: '', x: 540, y: 220 },
    ],
    relations: [
      { id: 'entry', from: 'client', to: 'lb', label: 'HTTPS 요청' },
      { id: 'route', from: 'lb', to: 'service', label: '요청 전달' },
      { id: 'query', from: 'service', to: 'db', label: '조회 · 저장' },
      { id: 'log', from: 'service', to: 'file', label: '로그 기록' },
      { id: 'collect', from: 'file', to: 'agent', label: '파일 읽기' },
      { id: 'ship', from: 'agent', to: 'logs', label: '로그 전송' },
    ],
  };
}
