import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import type { Design } from '../apps/web/src/design/document';

async function exportFile(page: Page, path: string) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '파일 내보내기', exact: true }).click();
  await (await download).saveAs(path);
}

test('다른 브라우저 세션에서 블록 이름과 연결 방향을 복원한다', async ({ page, browser }, testInfo) => {
  const sourceName = '주문 서비스';
  const targetName = '주문 저장소';
  const label = '주문 기록';

  await page.goto('/');
  await page.getByRole('button', { name: '앱 서버 추가', exact: true }).click();
  await page.getByLabel('블록 이름', { exact: true }).fill(sourceName);
  await page.getByRole('button', { name: '데이터베이스 추가', exact: true }).click();
  await page.getByLabel('블록 이름', { exact: true }).fill(targetName);
  await page.getByRole('button', { name: sourceName, exact: true }).click();
  await page.getByRole('button', { name: '연결 시작', exact: true }).click();
  await page.getByRole('button', { name: targetName, exact: true }).click();
  await page.getByLabel('관계 이름', { exact: true }).fill(label);

  const designFile = testInfo.outputPath('design.json');
  await exportFile(page, designFile);

  const fresh = await browser.newContext();
  try {
    const restored = await fresh.newPage();
    await restored.goto(page.url());
    await expect(restored.locator('.react-flow__node')).toHaveCount(0);
    await restored.getByLabel('설계 파일 열기', { exact: true }).setInputFiles(designFile);
    await expect(restored.getByRole('button', { name: sourceName, exact: true })).toBeVisible();
    await expect(restored.getByRole('button', { name: targetName, exact: true })).toBeVisible();
    await expect(restored.locator('.react-flow__edge')).toHaveCount(1);
    await expect(restored.getByText(label, { exact: true })).toBeVisible();
    // A reviewer can inspect the restored diagram without replaying a successful run.
    await restored.screenshot({ path: testInfo.outputPath('roundtrip.png') });

    // Resolve endpoints by name in the imported design, not by array order or fixture IDs.
    const restoredFile = testInfo.outputPath('restored.json');
    await exportFile(restored, restoredFile);
    const design: Design = JSON.parse(await readFile(restoredFile, 'utf8'));
    expect(design.blocks).toHaveLength(2);
    const source = design.blocks.find(block => block.name === sourceName);
    const target = design.blocks.find(block => block.name === targetName);
    expect(source?.id).toEqual(expect.any(String));
    expect(target?.id).toEqual(expect.any(String));
    expect(source?.id).not.toBe(target?.id);
    expect(design.relations).toEqual([expect.objectContaining({ from: source?.id, to: target?.id, label })]);
  } finally {
    await fresh.close();
  }
});
