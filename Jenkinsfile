pipeline {
  agent any

  environment {
    NAMESPACE = "elk"
    HELM_REPO = "https://helm.elastic.co"
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

    stage('Deploy ELK Stack') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          script {
            def elasticPassword = "elastic123!"

            sh """
              helm upgrade --install elasticsearch elastic/elasticsearch \
                -n ${NAMESPACE} --create-namespace \
                -f elk-config/elasticsearch-values.yaml \
                --kubeconfig \$KUBECONFIG \
                --wait --timeout 5m
            """

            sh "kubectl rollout status statefulset/elasticsearch-master -n ${NAMESPACE} --kubeconfig \$KUBECONFIG"

            // Cleanup stuck Kibana pre-install jobs
            sh """
              kubectl delete pods -n ${NAMESPACE} -l job-name=pre-install-kibana-kibana --kubeconfig \$KUBECONFIG || true
            """

            sh """
              helm upgrade --install kibana elastic/kibana \
                -n ${NAMESPACE} \
                -f elk-config/kibana-values.yaml \
                --set elasticsearch.password=${elasticPassword} \
                --kubeconfig \$KUBECONFIG \
                --wait --timeout 5m --force
            """

            sh """
              helm upgrade --install filebeat elastic/filebeat \
                -n ${NAMESPACE} \
                -f elk-config/filebeat-values.yaml \
                --kubeconfig \$KUBECONFIG \
                --wait --timeout 3m --force
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
