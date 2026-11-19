pipeline {
    agent { label 'linux-arm64' }

    environment {
        PATH = "/opt/yoom-ci/node-v24.22.3-linux-arm64/bin:${env.PATH}"
    }

    stages {
        stage('Dependencies') {
            steps { sh 'npm ci' }
        }
        stage('Type check') {
            steps { sh 'npm run typecheck' }
        }
        stage('Unit tests') {
            steps {
                sh 'mkdir -p artifacts && rm -f artifacts/unit-junit.xml'
                sh 'npm test -- --reporter=default --reporter=junit --outputFile.junit="$PWD/artifacts/unit-junit.xml"'
            }
            post {
                always { junit 'artifacts/unit-junit.xml' }
            }
        }
        stage('Production build') {
            steps { sh 'npm run build' }
        }
        stage('Chromium') {
            steps {
                sh 'sh scripts/prepare-chromium-runtime.sh'
                sh 'npx playwright install --only-shell chromium'
            }
        }
        stage('Browser tests') {
            steps {
                sh 'rm -rf artifacts/playwright artifacts/e2e-junit.xml'
                withEnv(["LD_LIBRARY_PATH=${env.WORKSPACE}/artifacts/chromium-runtime/usr/lib/aarch64-linux-gnu",
                         "XDG_DATA_HOME=${env.WORKSPACE}/artifacts/chromium-runtime/usr/share"]) {
                    sh 'npm run test:e2e'
                }
            }
            post {
                always { junit 'artifacts/e2e-junit.xml' }
                success {
                    archiveArtifacts artifacts: 'artifacts/playwright/**/roundtrip.png'
                }
                failure {
                    archiveArtifacts artifacts: 'artifacts/playwright/**/trace.zip', allowEmptyArchive: true
                }
            }
        }
    }
}
