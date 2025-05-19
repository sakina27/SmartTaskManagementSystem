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
            sh 'echo "$VAULT_PASS" > vault_pass.txt'
            sh "ansible-playbook -i inventory playbook.yml \
                 --vault-password-file vault_pass.txt \
                 -e project_root=${env.WORKSPACE} \
                 --become"
          }
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'kubectl apply -k task-manager-k8s/base/ --validate=false'
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
        sh 'kubectl create namespace $NAMESPACE || echo "Namespace $NAMESPACE already exists"'
      }
    }

    stage('Deploy Elasticsearch') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh '''
            export KUBECONFIG=$KUBECONFIG
            helm upgrade --install elasticsearch elastic/elasticsearch -n elk -f elk-config/elasticsearch-values.yaml
            helm upgrade --install kibana elastic/kibana -n elk -f elk-config/kibana-values.yaml
            helm upgrade --install filebeat elastic/filebeat -n elk -f elk-config/filebeat-values.yaml
          '''
        }
      }
    }

    stage('Deploy Kibana') {
      steps {
        sh 'helm upgrade --install kibana elastic/kibana -n $NAMESPACE -f elk-config/kibana-values.yaml'
      }
    }

    stage('Deploy Filebeat') {
      steps {
        sh 'helm upgrade --install filebeat elastic/filebeat -n $NAMESPACE -f elk-config/filebeat-values.yaml'
      }
    }

    stage('Verify ELK Deployment') {
      steps {
        sh 'kubectl get pods -n $NAMESPACE'
      }
    }
  }
}
