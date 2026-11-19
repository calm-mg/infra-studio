import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import type { Design } from '../apps/web/src/design/document';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const undo = (page: Page) => button(page, '블록 삭제 되돌리기');

async function deleteBlock(page: Page, name: string) {
  await button(page, name).click();
  await button(page, '블록 삭제').click();
  await expect(button(page, name)).toHaveCount(0);
  await expect(undo(page)).toBeVisible();
}

async function downloadDesign(page: Page, path: string): Promise<Design> {
  const download = page.waitForEvent('download');
  await button(page, '파일 내보내기').click();
  await (await download).saveAs(path);
  return JSON.parse(await readFile(path, 'utf8'));
}

test('선택과 취소된 파일 작업 뒤에도 삭제한 블록과 연결만 원래대로 되돌리고 저장한다', async ({ page }, testInfo) => {
  await page.goto('/');
  await button(page, '익명 예제').click();
  const before = await downloadDesign(page, testInfo.outputPath('before.json'));
  const service = before.blocks.find(b => b.name === '서비스 백엔드')!;
  const remaining = before.relations.filter(r => r.from !== service.id && r.to !== service.id);
  expect(before.relations.length - remaining.length).toBeGreaterThan(1);
  expect(remaining.length).toBeGreaterThan(0);

  // Undo must save even when it restores the very document loaded at startup.
  await page.reload();
  await deleteBlock(page, service.name);
  await expect(page.locator('.react-flow__edge')).toHaveCount(remaining.length);
  expect(await downloadDesign(page, testInfo.outputPath('deleted.json'))).toEqual({
    ...before, blocks: before.blocks.filter(b => b.id !== service.id), relations: remaining,
  });
  await button(page, '서비스 DB').click();
  page.once('dialog', dialog => dialog.dismiss());
  await button(page, '빈 캔버스').click();
  await page.getByLabel('설계 파일 열기', { exact: true }).setInputFiles({
    name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{'),
  });
  await expect(page.getByRole('alert')).toBeVisible();
  await undo(page).click();
  await expect(button(page, service.name)).toBeVisible();
  await expect(page.locator('.react-flow__edge')).toHaveCount(before.relations.length);
  await expect(undo(page)).toHaveCount(0);
  await page.reload();
  expect(await downloadDesign(page, testInfo.outputPath('restored.json'))).toEqual(before);
});

test('연속 삭제는 마지막 하나만 되돌리며 새 편집으로 이전 삭제를 되돌릴 수 없다', async ({ page }) => {
  await page.goto('/');
  await button(page, '익명 예제').click();
  await deleteBlock(page, '서비스 백엔드');
  await deleteBlock(page, '서비스 DB');
  await undo(page).click();
  await expect(button(page, '서비스 DB')).toBeVisible();
  await expect(button(page, '서비스 백엔드')).toHaveCount(0);
  await expect(undo(page)).toHaveCount(0);

  await deleteBlock(page, '서비스 DB');
  await button(page, '웹 클라이언트').click();
  await page.getByLabel('블록 이름', { exact: true }).fill('새 클라이언트');
  await expect(undo(page)).toHaveCount(0);
  await expect(button(page, '새 클라이언트')).toBeVisible();
});

test('내용이 같은 파일로 바꾸거나 새로 고치면 이전 삭제를 되돌릴 수 없다', async ({ page }, testInfo) => {
  await page.goto('/');
  await button(page, '앱 서버 추가').click();
  await button(page, '데이터베이스 추가').click();
  await deleteBlock(page, '앱 서버');
  const file = testInfo.outputPath('same.json');
  await downloadDesign(page, file);
  page.once('dialog', dialog => dialog.accept());
  await page.getByLabel('설계 파일 열기', { exact: true }).setInputFiles(file);
  await expect(undo(page)).toHaveCount(0);
  await expect(button(page, '앱 서버')).toHaveCount(0);
  await deleteBlock(page, '데이터베이스');
  await page.reload();
  await expect(page.getByRole('heading', { name: '첫 블록을 놓아보세요' })).toBeVisible();
  await expect(undo(page)).toHaveCount(0);
});
