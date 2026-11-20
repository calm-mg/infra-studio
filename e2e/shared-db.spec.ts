import { expect, test, type Locator } from '@playwright/test';

// Sample the visible stroke in viewport coordinates (the canvas can pan and zoom).
function stroke(edge: Locator) {
  return edge.locator('path.react-flow__edge-path').evaluate((element: SVGPathElement) => {
    const matrix = element.getScreenCTM()!;
    const length = element.getTotalLength();
    const steps = Math.ceil(length / 4);
    return Array.from({ length: steps + 1 }, (_, i) => {
      const { x, y } = element.getPointAtLength(length * i / steps).matrixTransform(matrix);
      return { x, y };
    });
  });
}

test('같은 DB로 향하는 통계 조회 선은 백엔드 카드를 지나지 않고 별도 화살표로 도착한다', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: '익명 예제', exact: true }).click();
  await page.getByRole('button', { name: '앱 서버 추가' }).click();
  await page.getByLabel('블록 이름').fill('통계 서비스');
  await page.getByRole('button', { name: '연결 시작' }).click();
  await page.getByRole('button', { name: '서비스 DB', exact: true }).click();
  await page.getByLabel('관계 이름').fill('통계 조회');
  await page.reload(); // Neither the inspector nor a selection highlight identifies the endpoints.

  const stats = page.getByLabel('통계 서비스 → 서비스 DB: 통계 조회', { exact: true });
  const service = page.getByLabel('서비스 백엔드 → 서비스 DB: 조회 · 저장', { exact: true });
  await expect(stats.getByText('통계 조회')).toBeVisible();
  await expect(service.getByText('조회 · 저장')).toBeVisible();
  const card = (await page.getByRole('button', { name: '서비스 백엔드', exact: true }).boundingBox())!;
  const points = await stroke(stats);
  expect(points.some(p => p.x > card.x && p.x < card.x + card.width && p.y > card.y && p.y < card.y + card.height)).toBe(false);
  const a = points[points.length - 1];
  const servicePoints = await stroke(service);
  const b = servicePoints[servicePoints.length - 1];
  expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(12); // visibly separate arrowheads
  await page.screenshot({ path: testInfo.outputPath('shared-db.png') });
});
