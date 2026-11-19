import { expect, test } from '@playwright/test';

test('읽을 수 없는 파일을 선택해도 마지막 설계를 잃지 않는다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '앱 서버 추가', exact: true }).click();
  await page.getByLabel('블록 이름', { exact: true }).fill('남아야 할 서비스');
  // Even if replacement is confirmed, an unreadable document must not be applied.
  page.on('dialog', dialog => dialog.accept());
  await page.getByLabel('설계 파일 열기', { exact: true }).setInputFiles({
    name: 'future.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 999, blocks: [], relations: [] })),
  });
  await expect(page.getByRole('alert')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: '남아야 할 서비스', exact: true })).toBeVisible();
});
