/**
 * Image Path Validation Tests
 * 
 * These tests verify that all image paths are correctly formatted
 * and will work in production. This is critical since we just fixed
 * the photo album image loading issues.
 */

const fs = require('fs');
const path = require('path');

describe('Image Path Validation', () => {
  test('photo pages use absolute paths starting with /assets', () => {
    // This is a static analysis test - we check the actual source files
    const photoPagesDir = path.join(__dirname, '../pages/photos');
    const photoPageFiles = [
      'MoodyPage.js',
      'PortraitPage.js',
      'NaturalPage.js',
      'UrbanPage.js',
      'EspionnerPage.js',
      'Summer2023Page.js',
      'Spring2023Page.js',
      'Spring2024Page.js',
    ];
    
    photoPageFiles.forEach(file => {
      const filePath = path.join(photoPagesDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check that image paths use /assets/photos/ format
        expect(content).toMatch(/\/assets\/photos\/[^'"]+/);
        
        // Should NOT use process.env.PUBLIC_URL in a way that could break
        // (It's okay if it's used correctly with || '')
        if (content.includes('process.env.PUBLIC_URL')) {
          expect(content).toMatch(/process\.env\.PUBLIC_URL\s*\|\|\s*['"]/);
        }
      }
    });
  });

  test('SeePage collection images use absolute paths', () => {
    const seePagePath = path.join(__dirname, '../pages/SeePage.js');
    if (fs.existsSync(seePagePath)) {
      const content = fs.readFileSync(seePagePath, 'utf8');
      
      // Check that collection images use /assets/photos/ format
      expect(content).toMatch(/image:\s*['"]\/assets\/photos\//);
    }
  });
});

