/**
 * Library Page Tests
 * Tests for book upload and library functionality
 */

describe('Library Page', function () {
    
    /**
     * Test: Library page loads correctly
     * Verifies that the library page displays the expected elements
     */
    it('should load library page with correct elements', async function () {
        const browser = this.browser;
        
        // Wait for the page to load
        await browser.waitUntil(async () => {
            const title = await browser.getTitle();
            return title.includes('E-Reader');
        }, { timeout: 10000 });
        
        // Check header exists
        const header = await browser.$('header');
        await header.waitForExist({ timeout: 5000 });
        
        // Check "My Library" heading
        const heading = await browser.$('h1');
        const headingText = await heading.getText();
        expect(headingText).toBe('My Library');
        
        // Check upload button exists
        const uploadBtn = await browser.$('.uploadBtn');
        await uploadBtn.waitForExist({ timeout: 5000 });
        const btnText = await uploadBtn.getText();
        expect(btnText).toContain('Upload');
        
        // Check Statistics link exists
        const statsLink = await browser.$('a[href="/statistics"]');
        await statsLink.waitForExist({ timeout: 5000 });
    });
    
    /**
     * Test: Empty library state
     * When no books are uploaded, should show empty state message
     */
    it('should show empty state when no books exist', async function () {
        const browser = this.browser;
        
        // Check for empty state or book grid
        const emptyState = await browser.$('.empty');
        const bookGrid = await browser.$('.grid');
        
        // Either empty state or book grid should exist
        const emptyExists = await emptyState.isExisting();
        const gridExists = await bookGrid.isExisting();
        
        if (emptyExists) {
            const emptyText = await emptyState.$('p').getText();
            expect(emptyText).toContain('No books');
        } else if (gridExists) {
            // Books exist, check book cards
            const bookCards = await browser.$$('.card');
            expect(bookCards.length).toBeGreaterThan(0);
        }
    });
    
    /**
     * Test: Upload button is clickable
     * Verifies that the upload button can be clicked
     * Note: Actual file upload requires native dialog which may not be automatable
     */
    it('should have clickable upload button', async function () {
        const browser = this.browser;
        
        const uploadBtn = await browser.$('.uploadBtn');
        await uploadBtn.waitForClickable({ timeout: 5000 });
        
        // Button should be enabled
        const isEnabled = await uploadBtn.isEnabled();
        expect(isEnabled).toBe(true);
    });
    
    /**
     * Test: Book card navigation
     * If books exist, clicking a book card should navigate to viewer
     */
    it('should navigate to viewer when clicking book card', async function () {
        const browser = this.browser;
        
        // Check if any books exist
        const bookCards = await browser.$$('.card');
        
        if (bookCards.length > 0) {
            // Click the first book card
            const firstCard = bookCards[0];
            await firstCard.waitForClickable({ timeout: 5000 });
            await firstCard.click();
            
            // Wait for navigation to viewer page
            await browser.waitUntil(async () => {
                const url = await browser.getUrl();
                return url.includes('/viewer/');
            }, { timeout: 10000 });
            
            // Verify viewer page loaded
            const viewerHeader = await browser.$('.header');
            await viewerHeader.waitForExist({ timeout: 5000 });
            
            // Navigate back to library
            const backBtn = await browser.$('.back');
            await backBtn.waitForClickable({ timeout: 5000 });
            await backBtn.click();
            
            // Verify back on library page
            await browser.waitUntil(async () => {
                const url = await browser.getUrl();
                return url.includes('/library') || url.endsWith('/');
            }, { timeout: 10000 });
        } else {
            // Skip this test if no books exist
            this.skip('No books available to test navigation');
        }
    });
    
    /**
     * Test: Statistics link navigation
     * Clicking Statistics link should navigate to statistics page
     */
    it('should navigate to statistics page', async function () {
        const browser = this.browser;
        
        const statsLink = await browser.$('a[href="/statistics"]');
        await statsLink.waitForClickable({ timeout: 5000 });
        await statsLink.click();
        
        // Wait for navigation
        await browser.waitUntil(async () => {
            const url = await browser.getUrl();
            return url.includes('/statistics');
        }, { timeout: 10000 });
        
        // Verify statistics page loaded
        const statsHeader = await browser.$('.header h1');
        await statsHeader.waitForExist({ timeout: 5000 });
        const headerText = await statsHeader.getText();
        expect(headerText).toBe('Statistics');
        
        // Navigate back to library
        const backBtn = await browser.$('.back');
        await backBtn.waitForClickable({ timeout: 5000 });
        await backBtn.click();
    });
});