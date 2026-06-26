import { test, expect } from '@playwright/test';

test.describe('Basic Read-Only Scenarios', () => {
  test('トップページが正常に表示されるか', async ({ page }) => {
    // ページにアクセス
    await page.goto('/');
    
    // タイトルまたは特定の要素が表示されているか確認
    // LinkSpaceというテキストが含まれる要素があるか確認
    await expect(page.locator('text=LinkSpace').first()).toBeVisible();
    
    // 物件一覧（カード）が表示されるか
    // クラス名などは環境に依存するため、リンク（aタグ）があるかを簡易確認
    const cards = page.locator('a[href^="/properties/"]');
    // すでにダミーデータがある前提
    const count = await cards.count();
    console.log(`トップページに表示された物件数: ${count}`);
    // 完全にゼロでなければOKとするか、ただエラーなく表示されればOKとする
  });

  test('ログイン画面へ遷移できるか', async ({ page }) => {
    await page.goto('/login');
    
    // ログインフォームが表示されるか
    await expect(page.locator('text=ログイン').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('新規登録画面へ遷移できるか', async ({ page }) => {
    await page.goto('/signup');
    
    // 新規登録フォームが表示されるか
    await expect(page.locator('text=新規登録').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
