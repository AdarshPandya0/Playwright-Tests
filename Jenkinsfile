// Runs the same env-driven suite as .github/workflows/playwright.yml.
//
// Jenkins credentials this pipeline expects (Manage Jenkins -> Credentials):
//   playwright-env-local, playwright-env-prod  "Secret file": the matching .env/.env.<ENV> file
//                                              (URL, EHR_CLINIC, EHR_USERNAME_1..4, EHR_PASSWORD_1..4)
//   GOOGLE_CHAT_WEBHOOK                        "Secret text": the Google Chat incoming-webhook URL
pipeline {
    agent any

    parameters {
        choice(name: 'ENV', choices: ['local', 'prod'], description: 'Environment to test (picks .env/.env.<ENV> and data/env/<ENV>.json)')
    }

    environment {
        ENV = "${params.ENV}"
        CI = 'true' // retries, forbidOnly, CI-only test behaviour (see playwright.config.ts)
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // Ensure npm and Playwright browsers are installed on the Jenkins agent
                sh 'npm ci'
                sh 'npx playwright install --with-deps chromium'
            }
        }

        stage('Prepare Environment') {
            steps {
                // playwright.config.ts loads .env/.env.<ENV>; the file itself never lives in the repo
                withCredentials([file(credentialsId: "playwright-env-${params.ENV}", variable: 'ENV_FILE')]) {
                    sh 'mkdir -p .env && cp "$ENV_FILE" ".env/.env.$ENV"'
                }
            }
        }

        stage('Run Playwright Tests') {
            steps {
                // 4 shards in parallel, one account each (shard N uses EHR_USERNAME_N)
                sh 'npm run test:$ENV:sharded'
            }
        }
    }

    post {
        always {
            // Shards only write blob reports; combine them into playwright-report/ when any exist
            sh '''
                if [ -d blob-report ] && [ -n "$(find blob-report -name '*.zip' -print -quit)" ]; then
                    npm run report:merge
                else
                    echo "No shard blob reports found (the tests didn't run), skipping the HTML report"
                fi
            '''

            // Archive the standard HTML report so it's viewable directly inside Jenkins
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true

            // Google Chat notification. Single-quoted sh so Groovy never interpolates the secret.
            withEnv(["BUILD_RESULT=${currentBuild.currentResult}"]) {
                withCredentials([string(credentialsId: 'GOOGLE_CHAT_WEBHOOK', variable: 'GOOGLE_CHAT_WEBHOOK')]) {
                    sh '''
                        curl -sS -X POST -H "Content-Type: application/json" \
                          -d "{\\"text\\": \\"*Jenkins Playwright Run ($ENV)*\\n*Status:* $BUILD_RESULT\\n<$BUILD_URL|Click here to view the Jenkins build>\\"}" \
                          "$GOOGLE_CHAT_WEBHOOK" || echo "Google Chat notification failed"
                    '''
                }
            }

            // Don't leave credentials on the agent
            sh 'rm -rf .env'
        }
    }
}
