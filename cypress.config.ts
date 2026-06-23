import { defineConfig } from 'cypress'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  e2e: {
    // Vite serves the app under base path "/pizzamath/" (see vite.config.ts),
    // so the e2e baseUrl must include it for cy.visit('/login') etc. to resolve.
    baseUrl: 'http://localhost:5175/pizzamath',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 8000,
    requestTimeout: 8000,
    responseTimeout: 8000,
    env: {
      TEST_EMAIL: process.env.CYPRESS_TEST_EMAIL ?? 'cypress@pizzamath.test',
      TEST_PASSWORD: process.env.CYPRESS_TEST_PASSWORD,
    },
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-features=PasswordLeakDetection')
          // Disable Chrome password manager to suppress breach/save-password prompts
          launchOptions.preferences.default['credentials_enable_service'] = false
          launchOptions.preferences.default['credentials_enable_autofill'] = false
          launchOptions.preferences.default['profile.password_manager_enabled'] = false
        }
        return launchOptions
      })
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
