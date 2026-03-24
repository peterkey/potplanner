import { test, expect } from '@playwright/test'

test.describe('Authentication smoke tests', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/login')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders form elements', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'PotPlanner' })).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill('wrong@example.com')
    await page.locator('input[name="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('Invalid')
  })
})
