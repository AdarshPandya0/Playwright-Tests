pipeline {
    agent any
    
    environment {
        // If your project uses an .env file, we can inject credentials securely here later
        URL = 'https://webims.meditab.local/' 
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

        stage('Run Sanity Test') {
            steps {
                // Let's run just a single spec first to test the waters
                sh 'npx playwright test tests/apiPatientCreation.spec.js --project=chromium'
            }
        }
    }

    post {
        always {
            // Archive the standard HTML report so it's viewable directly inside Jenkins
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
            
            // Send our crisp Google Chat notification using the exact same webhook URL!
            // Note: Jenkins requires the "Google Chat Notification" plugin or a curl snippet.
            // If your Jenkins has the curl command line utility available, we can use:
            withCredentials([string(credentialsId: 'GOOGLE_CHAT_WEBHOOK', variable: 'WEBHOOK_URL')]) {
                sh """
                curl -X POST -H "Content-Type: application/json" \
                -d '{"text": "*Jenkins Playwright Test Completed*\\n*Status:* ${currentBuild.currentResult}\\n👉 <${env.BUILD_URL}|Click here to view Jenkins Build>"}' \
                "\$WEBHOOK_URL"
                """
            }
        }
    }
}