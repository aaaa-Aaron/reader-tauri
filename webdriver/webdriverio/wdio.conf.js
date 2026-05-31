const path = require('path');

exports.config = {
    //
    // ====================
    // Runner Configuration
    // ====================
    //
    // WebdriverIO supports running e2e tests using tauri-driver
    runner: 'local',
    
    // tauri-driver is a WebDriver server that connects to the Tauri application
    // It must be running before tests execute
    hostname: 'localhost',
    port: 4444,
    path: '/webdriver/session',
    
    // ==================
    // Specify Test Files
    // ==================
    specs: [
        './test/**/*.js'
    ],
    
    // ============
    // Capabilities
    // ============
    // Define capabilities here - tauri-driver uses a special capability
    maxInstances: 1,
    capabilities: [{
        // The tauri-driver capability
        'tauri:options': {
            // Path to the Tauri application binary
            application: path.resolve('../../src-tauri/target/release/e-reader-tauri.exe'),
            // Whether to start the application automatically
            start: true,
            // Window title to match (optional)
            windowTitle: 'E-Reader'
        }
    }],
    
    // ===================
    // Test Configurations
    // ===================
    logLevel: 'info',
    bail: 0,
    baseUrl: '',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    
    // ====================
    // Services
    // ====================
    // No services needed - we connect directly to tauri-driver
    
    // ====================
    // Framework
    // ====================
    framework: 'mocha',
    
    // ====================
    // Reporters
    // ====================
    reporters: ['spec'],
    
    // ====================
    // Mocha Options
    // ====================
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    
    // =====
    // Hooks
    // =====
    /**
     * Gets executed once before all workers get launched.
     */
    onPrepare: function (config, capabilities) {
        console.log('Starting E-Reader Tauri E2E Tests...');
    },
    
    /**
     * Gets executed before a worker process is spawned.
     */
    beforeSession: function (config, capabilities, specs) {
        // Ensure tauri-driver is running
        console.log('Make sure tauri-driver is running on port 4444');
    },
    
    /**
     * Gets executed before test execution begins.
     */
    before: function (capabilities, specs) {
        // Add custom commands here if needed
    },
    
    /**
     * Gets executed after all tests are done.
     */
    after: function (result, capabilities, specs) {
        console.log('Tests completed.');
    }
};