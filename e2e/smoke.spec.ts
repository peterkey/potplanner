import { test, expect } from '@playwright/test'

test('login page renders', async ({ page }) => {
  // proxy.ts does not exist yet (added in Phase 3 with auth)
  // Navigate directly to /login — redirect test will be added in Phase 3
  await page.goto('/login')

  // Login page renders with the heading
  // Note: Login form inputs will be added in Phase 3 (Auth)
  // For now, assert the placeholder heading is visible
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
})
