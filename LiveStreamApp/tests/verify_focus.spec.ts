import { test, expect } from '@playwright/test';

test('verify close buttons have focus styles', async ({ page }) => {
  // Navigate to schedule page
  await page.goto('/');
  // await page.waitForLoadState('networkidle');

  // 1. Verify FilterSheet close button
  // Navigate to schedule page first since filter button is only visible there
  await page.goto('/schedule');
  const filterButton = page.getByRole('button', { name: 'Filtres' });
  await filterButton.waitFor({ state: 'visible' });
  await filterButton.click();
  const filterCloseBtn = page.getByRole('dialog', { name: 'Filtres' }).getByLabel('Fermer');
  await expect(filterCloseBtn).toBeVisible();
  await filterCloseBtn.focus();
  await page.screenshot({ path: 'verification_images/filter_sheet_focus.png' });
  await filterCloseBtn.click();

  // 2. Verify SearchOverlay close button
  const searchButton = page.getByRole('button', { name: 'Recherche' });
  await searchButton.waitFor({ state: 'visible' });
  await searchButton.click();
  const searchCloseBtn = page.getByRole('dialog', { name: 'Recherche' }).getByLabel('Fermer la recherche');
  await expect(searchCloseBtn).toBeVisible();
  await searchCloseBtn.focus();
  await page.screenshot({ path: 'verification_images/search_overlay_focus.png' });

  // 3. Verify SearchOverlay clear button (type something first)
  const searchInput = page.getByPlaceholder('Rechercher...');
  await searchInput.fill('test');
  const clearSearchBtn = page.getByLabel('Effacer la recherche');
  await expect(clearSearchBtn).toBeVisible();
  await clearSearchBtn.focus();
  await page.screenshot({ path: 'verification_images/search_clear_focus.png' });
  await searchCloseBtn.click();

  // 4. Verify NotificationDrawer close button
  const notifButton = page.getByRole('button', { name: 'Notifications' });
  await notifButton.waitFor({ state: 'visible' });
  await notifButton.click();
  const notifCloseBtn = page.getByLabel('Fermer les notifications');
  await expect(notifCloseBtn).toBeVisible();
  await notifCloseBtn.focus();
  await page.screenshot({ path: 'verification_images/notification_drawer_focus.png' });
});
