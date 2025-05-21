pipeline {
  agent any

  environment {
    NAMESPACE = "elk"
    HELM_REPO = "https://helm.elastic.co"
    // Remove elasticPassword from here
  }

  stages {
    stage('Checkout Code') {
      steps {
        git branch: 'main', credentialsId: 'github-ssh-key', url: 'git@github.com:sakina27/SmartTaskManagementSystem.git'
      }
    }

    stage('Build & Push Images with Ansible') {
      steps {
        dir('task-manager-ansible') {
          withCredentials([string(credentialsId: 'ANSIBLE_VAULT_PASS', variable: 'VAULT_PASS')]) {
            sh '''
              echo "$VAULT_PASS" > vault_pass.txt
              ansible-playbook -i inventory playbook.yml --vault-password-file vault_pass.txt -e project_root=${WORKSPACE} --become
            '''
          }
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'kubectl apply -k task-manager-k8s/base/'
        }
      }
    }

    stage('Cleanup ELK') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh """
            helm uninstall elasticsearch -n ${NAMESPACE} --kubeconfig \$KUBECONFIG || true
            helm uninstall kibana -n ${NAMESPACE} --kubeconfig \$KUBECONFIG || true
            kubectl delete pvc -n ${NAMESPACE} --kubeconfig \$KUBECONFIG --ignore-not-found || true
            kubectl delete namespace ${NAMESPACE} --kubeconfig \$KUBECONFIG || true
          """
        }
      }
    }

    stage('Add Elastic Helm Repo') {
      steps {
        sh '''
          helm repo add elastic $HELM_REPO || true
          helm repo update
        '''
      }
    }

    stage('Create ELK Namespace') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh """
            kubectl create namespace ${NAMESPACE} --kubeconfig \$KUBECONFIG || echo 'Namespace ${NAMESPACE} already exists'
          """
        }
      }
    }

    stage('Clean Up Old Elasticsearch PVCs') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh """
            echo "Deleting old Elasticsearch PVCs in namespace ${NAMESPACE}..."
            kubectl delete pvc -n ${NAMESPACE} -l app=elasticsearch-master --ignore-not-found --wait --timeout=60s --kubeconfig \$KUBECONFIG || true
          """
        }
      }
    }

    stage('Deploy ELK Stack') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          script {
            // 1. Install/upgrade Elasticsearch WITHOUT --set elasticPassword (letting Helm generate it)
            sh """
              helm upgrade --install elasticsearch elastic/elasticsearch \
                -n ${NAMESPACE} --create-namespace \
                -f elk-config/elasticsearch-values.yaml \
                --kubeconfig \$KUBECONFIG \
                --wait --timeout 5m --force
            """

            // 2. Wait for Elasticsearch rollout
            sh "kubectl rollout status statefulset/elasticsearch-master -n ${NAMESPACE} --kubeconfig \$KUBECONFIG"

            // 3. Fetch generated elastic user password from Kubernetes secret
            def secretBase64 = sh (
              script: "kubectl get secret elasticsearch-master-credentials -n ${NAMESPACE} -o jsonpath='{.data.password}' --kubeconfig \$KUBECONFIG",
              returnStdout: true
            ).trim()

            def elasticPassword = sh (
              script: "echo ${secretBase64} | base64 --decode",
              returnStdout: true
            ).trim()

            env.elasticPassword = elasticPassword
            echo "Retrieved elastic user password from secret."

            // 4. Wait for Elasticsearch to be ready (using password from secret)
            sh """
              for i in {1..30}; do
                STATUS=\$(curl -s -o /dev/null -w '%{http_code}' -u elastic:${elasticPassword} https://elasticsearch-master.${NAMESPACE}.svc.cluster.local:9200)
                if [ "\$STATUS" == "200" ]; then
                  echo "Elasticsearch is ready!"
                  break
                else
                  echo "Elasticsearch not ready yet (status: \$STATUS). Waiting 10 seconds..."
                  sleep 10
                fi
              done

              if [ "\$STATUS" != "200" ]; then
                echo "Elasticsearch did not become ready in time."
                exit 1
              fi
            """

            // 5. Clean up old Kibana pre-install pods if any
            sh "kubectl delete pods -n ${NAMESPACE} -l job-name=pre-install-kibana-kibana --kubeconfig \$KUBECONFIG || true"

            // 6. Deploy Kibana with the fetched elastic password
            sh """
              helm upgrade --install kibana elastic/kibana \
                -n ${NAMESPACE} \
                -f elk-config/kibana-values.yaml \
                --set elasticsearch.password=${elasticPassword} \
                --kubeconfig \$KUBECONFIG \
                --wait --timeout 5m --force
            """
          }
        }
      }
    }


    stage('Verify ELK Deployment') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh "kubectl get pods -n ${NAMESPACE} --kubeconfig \$KUBECONFIG"
        }
      }
    }
  }
}
