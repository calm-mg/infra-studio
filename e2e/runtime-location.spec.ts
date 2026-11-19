import { expect, test } from '@playwright/test';

test('익명 예제의 실행 위치를 캔버스에서 읽고 속성 패널에서 수정하거나 지운다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '익명 예제', exact: true }).click();
  const service = page.getByRole('button', { name: '서비스 백엔드', exact: true });
  await expect(service.getByText('실행 위치: EC2', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '서비스 DB', exact: true })).not.toContainText('실행 위치');

  await service.click();
  const location = page.getByLabel('실행 위치', { exact: true });
  await expect(location).toHaveValue('EC2');
  await location.fill('공용 클러스터');
  await expect(service.getByText('실행 위치: 공용 클러스터', { exact: true })).toBeVisible();
  await page.reload();
  await expect(service.getByText('실행 위치: 공용 클러스터', { exact: true })).toBeVisible();

  await service.click();
  await location.clear();
  await expect(service).not.toContainText('실행 위치');
  await page.reload();
  await service.click();
  await expect(location).toHaveValue('');
  await expect(service).not.toContainText('실행 위치');
  await expect(page.locator('.react-flow__edge')).toHaveCount(6);
});
