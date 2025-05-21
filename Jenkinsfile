pipeline {
  agent any

  environment {
    NAMESPACE = "elk"
    HELM_REPO = "https://helm.elastic.co"
    elasticPassword = "elastic123!"
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
            // Install/Upgrade Elasticsearch
            sh """
              helm upgrade --install elasticsearch elastic/elasticsearch \
                -n ${NAMESPACE} --create-namespace \
                -f elk-config/elasticsearch-values.yaml \
                --set elasticPassword=${elasticPassword} \
                --kubeconfig \$KUBECONFIG \
                --wait --timeout 5m
            """

            // Wait for StatefulSet rollout to complete
            sh "kubectl rollout status statefulset/elasticsearch-master -n ${NAMESPACE} --kubeconfig \$KUBECONFIG"

            // Wait extra time for ES initialization
            sh 'echo "Waiting 30 seconds for Elasticsearch to finish initializing..." && sleep 30'

            // Retry curl to check if Elasticsearch is accepting connections
            sh """
              for i in {1..30}; do
                STATUS=\$(curl -s -o /dev/null -w '%{http_code}' -u elastic:${elasticPassword} http://${NAMESPACE}-master.${NAMESPACE}.svc.cluster.local:9200)
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
                curl -v -u elastic:${elasticPassword} http://${NAMESPACE}-master.${NAMESPACE}.svc.cluster.local:9200 || true
                exit 1
              fi
            """

            // Clean up potential pre-install kibana jobs
            sh "kubectl delete pods -n ${NAMESPACE} -l job-name=pre-install-kibana-kibana --kubeconfig \$KUBECONFIG || true"

            // Install/Upgrade Kibana
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
