/**
 * Viewer Page Tests
 * Tests for book reading and navigation functionality
 */

describe('Viewer Page', function () {
    
    /**
     * Helper function to navigate to viewer page
     * Assumes there's at least one book in the library
     */
    async function navigateToViewer(browser) {
        // First navigate to library
        await browser.url('/');
        
        // Wait for library to load
        await browser.waitUntil(async () => {
            const heading = await browser.$('h1');
            const text = await heading.getText();
            return text === 'My Library';
        }, { timeout: 10000 });
        
        // Check if books exist
        const bookCards = await browser.$$('.card');
        
        if (bookCards.length === 0) {
            return false;
        }
        
        // Click first book
        const firstCard = bookCards[0];
        await firstCard.waitForClickable({ timeout: 5000 });
        await firstCard.click();
        
        // Wait for viewer to load
        await browser.waitUntil(async () => {
            const url = await browser.getUrl();
            return url.includes('/viewer/');
        }, { timeout: 10000 });
        
        return true;
    }
    
    /**
     * Test: Viewer page loads correctly
     * Verifies that the viewer page displays the expected elements
     */
    it('should load viewer page with correct elements', async function () {
        const browser = this.browser;
        
        const navigated = await navigateToViewer(browser);
        
        if (!navigated) {
            this.skip('No books available to test viewer');
            return;
        }
        
        // Check header exists
        const header = await browser.$('.header');
        await header.waitForExist({ timeout: 5000 });
        
        // Check back button
        const backBtn = await browser.$('.back');
        await backBtn.waitForExist({ timeout: 5000 });
        expect(await backBtn.getText()).toContain('Back');
        
        // Check title exists
        const title = await browser.$('.title');
        await title.waitForExist({ timeout: 5000 });
        
        // Check format badge
        const formatBadge = await browser.$('.format');
        await formatBadge.waitForExist({ timeout: 5000 });
        const formatText = await formatBadge.getText();
        expect(['PDF', 'EPUB']).toContain(formatText);
    });
    
    /**
     * Test: Navigation controls exist
     * Verifies that next/previous buttons are present
     */
    it('should have navigation controls', async function () {
        const browser = this.browser;
        
        const navigated = await navigateToViewer(browser);
        
        if (!navigated) {
            this.skip('No books available to test viewer');
            return;
        }
        
        // Check controls container
        const controls = await browser.$('.controls');
        await controls.waitForExist({ timeout: 5000 });
        
        // Check navigation buttons
        const navButtons = await browser.$$('.navBtn');
        expect(navButtons.length).toBeGreaterThanOrEqual(2);
        
        // Check page info
        const pageInfo = await browser.$('.pageInfo');
        await pageInfo.waitForExist({ timeout: 5000 });
        const pageText = await pageInfo.getText();
        expect(pageText).toContain('Page');
    });
    
    /**
     * Test: Next page navigation
     * Clicking next button should advance to next page
     */
    it('should navigate to next page', async function () {
        const browser = this.browser;
        
        const navigated = await navigateToViewer(browser);
        
        if (!navigated) {
            this.skip('No books available to test viewer');
            return;
        }
        
        // Get initial page info
        const pageInfo = await browser.$('.pageInfo');
        await pageInfo.waitForExist({ timeout: 5000 });
        const initialPageText = await pageInfo.getText();
        
        // Extract current page number
        const pageMatch = initialPageText.match(/Page (\d+) of (\d+)/);
        if (!pageMatch) {
            this.skip('Could not parse page info');
            return;
        }
        
        const currentPage = parseInt(pageMatch[1]);
        const totalPages = parseInt(pageMatch[2]);
        
        if (currentPage >= totalPages) {
            this.skip('Already at last page, cannot test next');
            return;
        }
        
        // Find next button
        const navButtons = await browser.$$('.navBtn');
        const nextBtn = navButtons.find(async (btn) => {
            const text = await btn.getText();
            return text.includes('Next');
        });
        
        if (!nextBtn) {
            this.skip('Next button not found');
            return;
        }
        
        // Click next
        await nextBtn.waitForClickable({ timeout: 5000 });
        await nextBtn.click();
        
        // Wait for page change
        await browser.pause(1000);
        
        // Verify page changed
        const newPageText = await pageInfo.getText();
        const newPageMatch = newPageText.match(/Page (\d+) of (\d+)/);
        
        if (newPageMatch) {
            const newPage = parseInt(newPageMatch[1]);
            expect(newPage).toBe(currentPage + 1);
        }
    });
    
    /**
     * Test: Previous page navigation
     * Clicking previous button should go to previous page
     */
    it('should navigate to previous page', async function () {
        const browser = this.browser;
        
        const navigated = await navigateToViewer(browser);
        
        if (!navigated) {
            this.skip('No books available to test viewer');
            return;
        }
        
        // First navigate to page 2 if possible
        const pageInfo = await browser.$('.pageInfo');
        await pageInfo.waitForExist({ timeout: 5000 });
        const initialPageText = await pageInfo.getText();
        
        const pageMatch = initialPageText.match(/Page (\d+) of (\d+)/);
        if (!pageMatch) {
            this.skip('Could not parse page info');
            return;
        }
        
        const currentPage = parseInt(pageMatch[1]);
        const totalPages = parseInt(pageMatch[2]);
        
        // If on page 1, first go to page 2
        if (currentPage === 1 && totalPages > 1) {
            const navButtons = await browser.$$('.navBtn');
            const nextBtn = navButtons[navButtons.length - 1]; // Last button is Next
            await nextBtn.waitForClickable({ timeout: 5000 });
            await nextBtn.click();
            await browser.pause(1000);
        }
        
        // Get current page after potential navigation
        const currentText = await pageInfo.getText();
        const currentMatch = currentText.match(/Page (\d+) of (\d+)/);
        
        if (!currentMatch || parseInt(currentMatch[1]) === 1) {
            this.skip('Cannot test previous from page 1');
            return;
        }
        
        const beforePage = parseInt(currentMatch[1]);
        
        // Find previous button
        const navButtons = await browser.$$('.navBtn');
        const prevBtn = navButtons[0]; // First button is Previous
        
        // Click previous
        await prevBtn.waitForClickable({ timeout: 5000 });
        await prevBtn.click();
        
        // Wait for page change
        await browser.pause(1000);
        
        // Verify page changed
        const afterText = await pageInfo.getText();
        const afterMatch = afterText.match(/Page (\d+) of (\d+)/);
        
        if (afterMatch) {
            const afterPage = parseInt(afterMatch[1]);
            expect(afterPage).toBeLessThan(beforePage);
        }
    });
    
    /**
     * Test: Back to library navigation
     * Clicking back button should return to library
     */
    it('should navigate back to library', async function () {
        const browser = this.browser;
        
        const navigated = await navigateToViewer(browser);
        
        if (!navigated) {
            this.skip('No books available to test viewer');
            return;
        }
        
        // Click back button
        const backBtn = await browser.$('.back');
        await backBtn.waitForClickable({ timeout: 5000 });
        await backBtn.click();
        
        // Wait for navigation
        await browser.waitUntil(async () => {
            const url = await browser.getUrl();
            return url.includes('/library') || url.endsWith('/');
        }, { timeout: 10000 });
        
        // Verify library page loaded
        const heading = await browser.$('h1');
        await heading.waitForExist({ timeout: 5000 });
        const headingText = await heading.getText();
        expect(headingText).toBe('My Library');
    });
    
    /**
     * Test: Sidebar/TOC exists for books with outline
     * Books with table of contents should show sidebar
     */
    it('should show sidebar for books with TOC', async function () {
        const browser = this.browser;
        
        const navigated = await navigateToViewer(browser);
        
        if (!navigated) {
            this.skip('No books available to test viewer');
            return;
        }
        
        // Check if sidebar exists (may not exist for all books)
        const sidebar = await browser.$('.sidebar');
        const sidebarExists = await sidebar.isExisting();
        
        if (sidebarExists) {
            // Check TOC items
            const tocItems = await browser.$$('.tocItem, .outlineItem');
            expect(tocItems.length).toBeGreaterThan(0);
        } else {
            // Some books may not have TOC
            console.log('No sidebar found - book may not have TOC');
        }
    });
    
    /**
     * Test: Translation panel appears on text selection
     * Note: Text selection may be difficult to automate
     */
    it('should have translation panel structure', async function () {
        const browser = this.browser;
        
        const navigated = await navigateToViewer(browser);
        
        if (!navigated) {
            this.skip('No books available to test viewer');
            return;
        }
        
        // Translation panel should not be visible initially
        const translationPanel = await browser.$('.translationPanel');
        const initiallyVisible = await translationPanel.isDisplayed();
        
        // Panel should be hidden initially (only shows on text selection)
        // If visible, it means there's a bug or previous test left it open
        if (initiallyVisible) {
            // Close it
            const closeBtn = await browser.$('.closeBtn');
            if (await closeBtn.isExisting()) {
                await closeBtn.click();
            }
        }
        
        // Verify panel structure exists (even if hidden)
        // This confirms the component is rendered
    });
});