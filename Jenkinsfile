pipeline {
  agent any

  environment {
    NAMESPACE = "elk"
    HELM_REPO = "https://helm.elastic.co"
    // Remove elasticPassword from here
  }

  stages {
    /* stage('Checkout Code') {
      steps {
        git branch: 'main', credentialsId: 'github-ssh-key', url: 'git@github.com:sakina27/SmartTaskManagementSystem.git'
      }
    } */

    stage('Checkout Code') {
       steps {
         git branch: 'main', credentialsId: 'Github', url: 'https://github.com/sakina27/SmartTaskManagementSystem.git'
       }
    }

    /* stage('Build & Push Images with Ansible') {
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
    } */

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'kubectl apply -k task-manager-k8s/base/'
        }
      }
    }

    stage('Deploy ElasticSearch, kibana & logstash') {
      steps {
         withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
            sh 'kubectl apply -k elk-config'
         }
      }
    }

    stage('Deploy filebeats') {
      steps {
        dir('filebeats') {
          withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
             sh '''
                  kubectl apply -f filebeat-configmap.yaml
                  kubectl apply -f filebeat-daemonset.yaml
                  kubectl apply -f filebeat-rbac.yaml
                '''
          }
        }
      }
    }
  }
}
