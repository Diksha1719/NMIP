import { test, expect } from '@playwright/test';

for (const reviewAction of ['APPROVE', 'REJECT', 'REQUEST_INFORMATION']) {
  test(`engineer can rerun and submit ${reviewAction} within review queue`, async ({ page }) => {
    let reruns = 0;
    let submitted: any;
    const material = { id: 'a', category: 'Valves', organization: 'Test', legacy_material_code: 'V-1', original_description: 'Gate valve', normalized_description: 'Gate valve', status: 'EXTRACTED' };
    const candidate = { id: 'candidate-1', material_a: material, material_b: { ...material, id: 'b' }, status: 'PENDING', final_score: 90, semantic_score: 90, attribute_score: 90, critical_conflicts: 1, missing_attributes: 0, evidence_count: 0, decision: { id: 'decision-1', decision_type: 'DO_NOT_MERGE', reason: 'Pressure classes conflict.' }, comparisons: [], evidence: [], reviews: [] as any[] };
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      let body: any = {};
      if (path === '/api/auth/me') body = { id: 'engineer-1', name: 'Engineer', role: 'ENGINEER' };
      if (path === '/api/candidates') body = [candidate];
      if (path.endsWith('/comparison')) body = candidate;
      if (path.endsWith('/decision')) { reruns++; candidate.decision.id = `decision-${reruns + 1}`; body = candidate.decision; }
      if (path === '/api/reviews') {
        submitted = route.request().postDataJSON();
        candidate.status = reviewAction === 'REQUEST_INFORMATION' ? 'INFORMATION_REQUESTED' : reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        candidate.reviews.push({ id: 'review-1', ...submitted, reviewer_id: 'engineer-1', created_at: new Date().toISOString() });
        body = { review_id: 'review-1', status: candidate.status };
      }
      await route.fulfill({ json: body });
    });
    await page.goto('/review');
    await page.getByRole('button', { name: 'Rerun engine', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Rule engine rerun');
    expect(reruns).toBe(1);
    await page.getByRole('button', { name: 'Human review', exact: true }).click();
    await expect(page).toHaveURL(/\/review$/);
    await expect(page.getByText('Pressure classes conflict.')).toBeVisible();
    await page.getByRole('button', { name: 'Rerun engine', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Decision recalculated');
    const button = page.getByRole('button', { name: reviewAction === 'APPROVE' ? 'Acknowledge recommendation' : reviewAction === 'REJECT' ? 'Reject' : 'Request information', exact: true });
    await expect(button).toBeDisabled();
    await page.getByLabel('Review comment / What information is missing?').fill('Checked the pressure class evidence.');
    await button.click();
    await expect(page.getByRole('cell', { name: 'Checked the pressure class evidence.', exact: true })).toBeVisible();
    expect(submitted).toEqual({ decision_id: 'decision-3', action: reviewAction, comment: 'Checked the pressure class evidence.' });
    await page.getByRole('button', { name: 'Back to review queue' }).click();
    if (reviewAction === 'REQUEST_INFORMATION') await expect(page.getByRole('button', { name: 'Human review', exact: true })).toBeVisible();
    else await expect(page.getByText('No candidates in this view')).toBeVisible();
  });
}
